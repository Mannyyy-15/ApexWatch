import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe cleanup of legacy IndexedDB persistence caches to prevent ve:-1 schema assertions
if (typeof window !== 'undefined' && window.indexedDB) {
  try {
    window.indexedDB.deleteDatabase('firestore/[DEFAULT]/apexwatch/main');
    window.indexedDB.deleteDatabase('firestore/[DEFAULT]/apexwatch-default/main');
  } catch (_) {}
}

export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
export var OperationType;
(function (OperationType) {
 OperationType["CREATE"] = "create";
 OperationType["UPDATE"] = "update";
 OperationType["DELETE"] = "delete";
 OperationType["LIST"] = "list";
 OperationType["GET"] = "get";
 OperationType["WRITE"] = "write";
})(OperationType || (OperationType = {}));
export function handleFirestoreError(error, operationType, path) {
 const errInfo = {
 error: error instanceof Error ? error.message : String(error),
 authInfo: {
 userId: auth.currentUser?.uid,
 email: auth.currentUser?.email,
 emailVerified: auth.currentUser?.emailVerified,
 isAnonymous: auth.currentUser?.isAnonymous,
 tenantId: auth.currentUser?.tenantId,
 providerInfo: auth.currentUser?.providerData?.map((provider) => ({
 providerId: provider.providerId,
 email: provider.email,
 })) || []
 },
 operationType,
 path
 };
 console.warn('Firestore Error: ', JSON.stringify(errInfo));
}
