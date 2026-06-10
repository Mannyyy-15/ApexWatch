import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Trash2, Copy, AlertCircle, Info as InfoIcon, AlertTriangle } from 'lucide-react';

// Global log storage to catch logs even before DevConsole mounts
window.__DEV_LOGS__ = window.__DEV_LOGS__ || [];

export function DevConsole({ onClose }) {
 const [logs, setLogs] = useState([...window.__DEV_LOGS__]);
 const [filter, setFilter] = useState('all'); // all, info, warn, error
 const bottomRef = useRef(null);

 useEffect(() => {
 const handleNewLog = () => {
 setLogs([...window.__DEV_LOGS__]);
 };

 window.addEventListener('dev_logs_updated', handleNewLog);
 return () => window.removeEventListener('dev_logs_updated', handleNewLog);
 }, []);

 useEffect(() => {
 if (bottomRef.current) {
 bottomRef.current.scrollIntoView({ behavior: 'smooth' });
 }
 }, [logs, filter]);

 const clearLogs = () => {
 window.__DEV_LOGS__ = [];
 setLogs([]);
 };

 const copyLogs = () => {
 const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
 navigator.clipboard.writeText(text);
 alert('Logs copied to clipboard!');
 };

 const filteredLogs = logs.filter(l => filter === 'all' || l.type === filter);

 const getLogIcon = (type) => {
 switch(type) {
 case 'error': return <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0"/>;
 case 'warn': return <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0"/>;
 default: return <InfoIcon size={14} className="text-blue-400 mt-0.5 shrink-0"/>;
 }
 };

 return (
 <motion.div 
 initial={{ opacity: 0, y: 100 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 100 }}
 className="fixed inset-4 md:inset-10 z-[100] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
 >
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
 <Terminal size={16} className="text-accent" />
 </div>
 <h2 className="text-lg font-black tracking-widest uppercase text-white">Developer Console</h2>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={copyLogs} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors" title="Copy Logs">
 <Copy size={18} />
 </button>
 <button onClick={clearLogs} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 transition-colors" title="Clear Logs">
 <Trash2 size={18} />
 </button>
 <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors ml-2">
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Filters */}
 <div className="flex p-2 gap-2 border-b border-white/5 bg-black/30">
 {['all', 'info', 'warn', 'error'].map(f => (
 <button 
 key={f}
 onClick={() => setFilter(f)}
 className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${filter === f ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}
 >
 {f}
 </button>
 ))}
 </div>

 {/* Log Output */}
 <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] md:text-sm">
 {filteredLogs.length === 0 ? (
 <div className="h-full flex items-center justify-center text-white/20 uppercase tracking-widest font-black">
 No logs captured yet
 </div>
 ) : (
 <div className="flex flex-col gap-2">
 {filteredLogs.map((log, idx) => (
 <div key={idx} className="flex gap-3 bg-white/5 p-2 rounded-lg break-words whitespace-pre-wrap text-white/80">
 {getLogIcon(log.type)}
 <div className="flex flex-col flex-1">
 <span className="text-white/30 text-[9px] mb-1">{log.timestamp}</span>
 <span className={log.type === 'error' ? 'text-red-300' : log.type === 'warn' ? 'text-yellow-300' : 'text-white/90'}>
 {log.message}
 </span>
 </div>
 </div>
 ))}
 <div ref={bottomRef} />
 </div>
 )}
 </div>
 </motion.div>
 );
}
