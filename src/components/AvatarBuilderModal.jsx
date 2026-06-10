import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dices, Palette, User, Check, Shield } from 'lucide-react';

const STYLES = ['avataaars', 'bottts', 'micah', 'notionists', 'adventurer', 'fun-emoji', 'thumbs', 'lorelei'];
const COLORS = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'f4d160', '82d9a0', 'ff9a9e'];

export function AvatarBuilderModal({ isOpen, onClose, onSave }) {
 const [name, setName] = useState('');
 const [isKid, setIsKid] = useState(false);
 const [styleIdx, setStyleIdx] = useState(0);
 const [seed, setSeed] = useState('');
 const [colorIdx, setColorIdx] = useState(0);

 // Initialize randoms on open
 useEffect(() => {
 if (isOpen) {
 setName('');
 setIsKid(false);
 setSeed(Math.random().toString(36).substring(7));
 setColorIdx(Math.floor(Math.random() * COLORS.length));
 setStyleIdx(0);
 }
 }, [isOpen]);

 if (!isOpen) return null;

 const handleShuffleStyle = () => {
 setStyleIdx((prev) => (prev + 1) % STYLES.length);
 setSeed(Math.random().toString(36).substring(7));
 };

 const handleShuffleLook = () => {
 setSeed(Math.random().toString(36).substring(7));
 };

 const handleShuffleColor = () => {
 setColorIdx((prev) => (prev + 1) % COLORS.length);
 };

 const handleSave = () => {
 if (!name.trim()) return;
 const avatarUrl = `https://api.dicebear.com/9.x/${STYLES[styleIdx]}/svg?seed=${seed}&backgroundColor=${COLORS[colorIdx]}`;
 onSave(name.trim(), isKid, avatarUrl);
 };

 const avatarUrl = `https://api.dicebear.com/9.x/${STYLES[styleIdx]}/svg?seed=${seed}&backgroundColor=${COLORS[colorIdx]}`;

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-black/80 backdrop-blur-sm"
 />

 {/* Modal */}
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden flex flex-col"
 >
 {/* Header */}
 <div className="flex items-center justify-between p-6 pb-2">
 <h2 className="text-2xl font-black uppercase italic tracking-wider text-white">Create Profile</h2>
 <button
 onClick={onClose}
 className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
 >
 <X size={20} />
 </button>
 </div>

 {/* Content */}
 <div className="p-6 space-y-8">
 {/* Avatar Preview */}
 <div className="flex flex-col items-center gap-6">
 <motion.div 
 key={avatarUrl}
 initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
 animate={{ scale: 1, opacity: 1, rotate: 0 }}
 transition={{ type: "spring", damping: 20, stiffness: 200 }}
 className="w-40 h-40 rounded-[32px] overflow-hidden shadow-2xl relative border border-white/20 group"
 >
 <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
 </motion.div>

 {/* Controls */}
 <div className="flex items-center justify-center gap-3">
 <button 
 onClick={handleShuffleStyle}
 className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white"
 >
 <User size={14} /> Style
 </button>
 <button 
 onClick={handleShuffleLook}
 className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white"
 >
 <Dices size={14} /> Look
 </button>
 <button 
 onClick={handleShuffleColor}
 className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white"
 >
 <Palette size={14} /> Color
 </button>
 </div>
 </div>

 {/* Inputs */}
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Profile Name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Enter name..."
 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-accent focus:bg-white/10 transition-all font-bold"
 maxLength={15}
 />
 </div>

 <div 
 onClick={() => setIsKid(!isKid)}
 className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all"
 >
 <div className="flex items-center gap-3">
 <div className={`p-2 rounded-full ${isKid ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/50'}`}>
 <Shield size={18} />
 </div>
 <div>
 <p className="font-bold text-white text-sm">Kids Profile</p>
 <p className="text-xs text-white/40">Only show family-friendly content</p>
 </div>
 </div>
 <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${isKid ? 'bg-accent' : 'bg-white/10'}`}>
 <motion.div 
 layout
 className="w-4 h-4 rounded-full bg-white shadow-md"
 animate={{ x: isKid ? 24 : 0 }}
 />
 </div>
 </div>
 </div>

 {/* Actions */}
 <button
 onClick={handleSave}
 disabled={!name.trim()}
 className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 disabled:bg-white/5 disabled:text-white/30 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
 >
 {name.trim() ? <><Check size={18} /> Create Profile</> : "Enter Name to Create"}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
