import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

class CastService {
  constructor() {
    this.activeCastSession = null;
    this.activeTvId = null;
    this.sessionUnsubscribe = null;
    this.receiverUnsubscribe = null;
    this.heartbeatInterval = null;
    this.isGoogleCastAvailable = false;
    this.presentationRequest = null;
    this.activePresentationConnection = null;

    this.initGoogleCast();
    this.initPresentationAPI();
  }

  // 1. Initialize Google Cast SDK
  initGoogleCast() {
    if (typeof window !== 'undefined') {
      window.__onGCastApiAvailable = (isAvailable) => {
        if (isAvailable) {
          this.isGoogleCastAvailable = true;
          try {
            const castContext = window.cast?.framework?.CastContext?.getInstance();
            if (castContext) {
              castContext.setOptions({
                receiverApplicationId: window.chrome?.cast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID || 'CC1AD845',
                autoJoinPolicy: window.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED || 'origin_scoped'
              });
            }
          } catch (e) {
            console.warn('Google Cast Context Init Warning:', e);
          }
        }
      };
    }
  }

  // 2. Initialize Web Presentation API (Chromecast / Miracast / Smart TV)
  initPresentationAPI() {
    if (typeof window !== 'undefined' && window.PresentationRequest) {
      try {
        const presentationUrls = [window.location.origin];
        this.presentationRequest = new window.PresentationRequest(presentationUrls);
      } catch (e) {
        console.warn('Presentation API Init Warning:', e);
      }
    }
  }

  // Native Browser Cast (Chromecast or Presentation Display)
  async startNativeCast(mediaUrl) {
    // A. Check Google Cast Context
    if (window.cast?.framework?.CastContext) {
      try {
        const castContext = window.cast.framework.CastContext.getInstance();
        await castContext.requestSession();
        return { success: true, type: 'google_cast' };
      } catch (e) {
        console.log('Google Cast requestSession cancelled or unavailable:', e);
      }
    }

    // B. Check Presentation API
    if (this.presentationRequest) {
      try {
        const connection = await this.presentationRequest.start();
        this.activePresentationConnection = connection;
        connection.addEventListener('terminate', () => {
          this.activePresentationConnection = null;
        });
        return { success: true, type: 'presentation_api' };
      } catch (e) {
        console.log('Presentation API cancelled or unavailable:', e);
      }
    }

    // C. Check Remote Playback API on video elements
    const videoEl = document.querySelector('video');
    if (videoEl && videoEl.remote) {
      try {
        await videoEl.remote.prompt();
        return { success: true, type: 'remote_playback' };
      } catch (e) {
        console.log('Remote Playback prompt failed:', e);
      }
    }

    // D. Check Safari WebKit AirPlay
    if (videoEl && videoEl.webkitShowPlaybackTargetPicker) {
      try {
        videoEl.webkitShowPlaybackTargetPicker();
        return { success: true, type: 'airplay' };
      } catch (e) {
        console.log('AirPlay target picker failed:', e);
      }
    }

    return { success: false };
  }

  // Screen Mirroring API
  async startScreenMirror() {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true
        });
        return { success: true, stream };
      } catch (err) {
        console.warn('Screen Mirroring error:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Screen mirroring not supported on this browser.' };
  }

  // Generate 6-Character human readable Pairing Code (e.g. "APEX-82")
  generatePairingCode() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `APEX-${num}`;
  }

  // Get or Create Persistent TV ID
  getTVDeviceId() {
    let tvId = localStorage.getItem('apex_tv_device_id');
    if (!tvId) {
      tvId = 'tv_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('apex_tv_device_id', tvId);
    }
    return tvId;
  }

  // Get or Create Persistent Pairing Code
  getTVPairingCode() {
    let code = localStorage.getItem('apex_tv_pairing_code');
    if (!code) {
      code = this.generatePairingCode();
      localStorage.setItem('apex_tv_pairing_code', code);
    }
    return code;
  }

  // ==========================================
  // APEXCAST: TV RECEIVER MODE
  // ==========================================
  registerTVReceiver(user, onIncomingCommand) {
    const tvId = this.getTVDeviceId();
    const code = this.getTVPairingCode();
    const tvName = `Smart TV (${code})`;

    const receiverRef = doc(db, 'tv_cast_receivers', tvId);
    const sessionRef = doc(db, 'tv_cast_sessions', tvId);

    // 1. Register Receiver in Firestore
    const updateReceiver = async () => {
      try {
        await setDoc(receiverRef, {
          tvId,
          code,
          name: tvName,
          userId: user?.uid || 'guest',
          status: 'online',
          lastPing: Date.now(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Cast Receiver register warning:', e.message);
      }
    };

    updateReceiver();

    // 2. Heartbeat Ping every 20s
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(updateReceiver, 20000);

    // 3. Listen for Incoming Cast Commands in real-time
    if (this.receiverUnsubscribe) this.receiverUnsubscribe();
    this.receiverUnsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.data();
        if (sessionData && onIncomingCommand) {
          onIncomingCommand(sessionData);
        }
      }
    }, (err) => {
      console.warn('Cast session snapshot error:', err);
    });

    return { tvId, code, tvName };
  }

  // Unregister TV receiver
  unregisterTVReceiver() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.receiverUnsubscribe) this.receiverUnsubscribe();
    const tvId = this.getTVDeviceId();
    try {
      const receiverRef = doc(db, 'tv_cast_receivers', tvId);
      deleteDoc(receiverRef).catch(() => {});
    } catch (e) {}
  }

  // ==========================================
  // APEXCAST: SENDER MODE (Mobile / Laptop)
  // ==========================================

  // Discover Online Smart TVs
  async discoverNearbyTVs(user) {
    try {
      const receiversRef = collection(db, 'tv_cast_receivers');
      let tvs = [];

      // Query online receivers
      const snapshot = await getDocs(receiversRef);
      const now = Date.now();

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // TV is online if pinged within last 60 seconds
        if (data && (now - (data.lastPing || 0)) < 60000) {
          tvs.push(data);
        }
      });

      return tvs;
    } catch (e) {
      console.warn('Error discovering TVs:', e);
      return [];
    }
  }

  // Connect to TV by Pairing Code
  async findTVByCode(pairingCode) {
    if (!pairingCode) return null;
    const cleanCode = pairingCode.trim().toUpperCase();
    try {
      const receiversRef = collection(db, 'tv_cast_receivers');
      const q = query(receiversRef, where('code', '==', cleanCode));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (e) {
      console.warn('Error finding TV by code:', e);
      return null;
    }
  }

  // Cast Movie/Episode to TV
  async castToTV(tvId, mediaData, onSessionUpdate) {
    if (!tvId) return false;
    this.activeTvId = tvId;

    const sessionRef = doc(db, 'tv_cast_sessions', tvId);
    const sessionPayload = {
      tvId,
      mediaId: mediaData.id || mediaData.tmdbId,
      mediaType: mediaData.type || 'movie',
      title: mediaData.title || mediaData.name,
      poster: mediaData.poster || '',
      backdrop: mediaData.backdrop || '',
      season: mediaData.season || 1,
      episode: mediaData.episode || 1,
      server: mediaData.server || 'vidlink',
      currentTime: mediaData.currentTime || 0,
      duration: mediaData.duration || 0,
      isPlaying: true,
      command: 'LOAD_MEDIA',
      commandTimestamp: Date.now(),
      senderName: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Web Device',
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(sessionRef, sessionPayload);
      this.activeCastSession = sessionPayload;

      // Listen for remote playback state updates from the TV
      if (this.sessionUnsubscribe) this.sessionUnsubscribe();
      this.sessionUnsubscribe = onSnapshot(sessionRef, (snap) => {
        if (snap.exists()) {
          const updated = snap.data();
          this.activeCastSession = updated;
          if (onSessionUpdate) onSessionUpdate(updated);
        }
      });

      return true;
    } catch (e) {
      console.error('Error casting to TV session:', e);
      return false;
    }
  }

  // Send Remote Control Command (Play, Pause, Seek, Next Ep, Server)
  async sendRemoteCommand(command, extraData = {}) {
    if (!this.activeTvId) return false;
    try {
      const sessionRef = doc(db, 'tv_cast_sessions', this.activeTvId);
      await updateDoc(sessionRef, {
        command,
        commandTimestamp: Date.now(),
        ...extraData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn('Error sending remote command to TV:', e);
      return false;
    }
  }

  // Stop Casting / Disconnect
  async stopCasting() {
    if (this.activeTvId) {
      try {
        const sessionRef = doc(db, 'tv_cast_sessions', this.activeTvId);
        await setDoc(sessionRef, {
          command: 'STOP',
          commandTimestamp: Date.now(),
          isPlaying: false,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {}
    }

    if (this.sessionUnsubscribe) {
      this.sessionUnsubscribe();
      this.sessionUnsubscribe = null;
    }

    if (this.activePresentationConnection) {
      try {
        this.activePresentationConnection.terminate();
      } catch (e) {}
      this.activePresentationConnection = null;
    }

    this.activeTvId = null;
    this.activeCastSession = null;
    return true;
  }
}

export const castService = new CastService();
