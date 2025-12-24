import React, { useState, useEffect } from 'react';
import { repo } from '../services/repository';
import { AuditLog, SharedProps } from '../types';
import { ShieldCheck, History, User, Search, Database, FileText } from 'lucide-react';

const AuditViewer: React.FC<SharedProps> = ({ userRole, onNotify }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        repo.getAuditLogs().then(setLogs);
    }, []);

    const filtered = logs.filter(l => 
        l.userName.toLowerCase().includes(search.toLowerCase()) || 
        l.entityId.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-[16px] border-emerald-500">
                <div className="absolute top-0 right-0 p-12 opacity-10"><History size={160} /></div>
                <h3 className="text-4xl font-black tracking-tighter italic uppercase leading-none mb-4 text-emerald-100">Audit Registry</h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Immutable transaction log stack</p>
            </div>

            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6 italic">
                    <div className="relative group w-full max-w-xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20}/>
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Filter Log Node by User or Resource ID..." 
                            className="w-full pl-14 pr-8 py-5 border-3 border-slate-100 rounded-3xl outline-none focus:border-emerald-400 font-black uppercase text-xs italic shadow-inner bg-white" 
                        />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 shrink-0">
                        <Database size={16}/> {logs.length} REGISTERED TRANSACTIONS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                        <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100">
                            <tr>
                                <th className="p-8 italic">TIMESTAMP</th>
                                <th className="p-8 italic">OPERATOR</th>
                                <th className="p-8 italic">PROTOCOL</th>
                                <th className="p-8 italic">RESOURCE REF</th>
                                <th className="p-8 italic">DATA DELTA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black italic uppercase">No log entries synchronized.</td></tr>
                            ) : filtered.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-all font-sans italic">
                                    <td className="p-8 text-[11px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><User size={14}/></div>
                                            <span className="text-xs font-black uppercase italic text-slate-800">{log.userName}</span>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${
                                            log.action === 'SAVE' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-8 text-xs font-black text-slate-600 uppercase italic">
                                        {log.entityType}: {log.entityId}
                                    </td>
                                    <td className="p-8 max-w-xs">
                                        <div className="truncate text-[10px] font-mono text-slate-300 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            {log.changes}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditViewer;