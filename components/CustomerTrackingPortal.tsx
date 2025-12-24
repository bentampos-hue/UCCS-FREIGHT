import React, { useState, useEffect } from 'react';
import { repo } from '../services/repository';
import { tokenService } from '../services/tokenService';
import { Shipment } from '../types';
import { Ship, CheckCircle, Globe, MapPin, Package, Clock, ShieldCheck, Download, Mail, Activity, ArrowRight } from 'lucide-react';

const CustomerTrackingPortal: React.FC<{ token: string }> = ({ token }) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = tokenService.validate(token);
    if (t && t.entityType === 'SHIPMENT') {
        repo.getShipments().then(list => {
            const found = list.find(s => s.id === t.entityId);
            setShipment(found || null);
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [token]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center italic text-blue-400 font-black uppercase tracking-widest animate-pulse">Initializing Secure AIS Sync...</div>;

  if (!shipment) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 italic"><div className="bg-white p-16 rounded-[4rem] text-center"><ShieldCheck size={80} className="mx-auto text-red-500 mb-8"/><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Unauthorized Node Access</h2><p className="mt-4 text-slate-500 font-medium">Please contact Unique CCS Operations Desk to verify secure token.</p></div></div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-12 flex flex-col items-center font-sans overflow-y-auto">
        <div className="w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-white/5 animate-fade-in italic">
            <div className="bg-slate-900 text-white p-12 md:p-20 relative overflow-hidden border-b-[12px] border-blue-600">
                <div className="absolute top-0 right-0 p-20 opacity-5 transform rotate-12"><Globe size={320} /></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-10">
                    <div>
                        <div className="flex items-center gap-4 mb-10"><div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/30"><Ship size={32}/></div><h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Unique CCS Global</h1></div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none mb-6">Transit Control Node</h2>
                        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-blue-400">
                            <span className="bg-white/5 border border-white/10 px-5 py-2 rounded-full italic">Registry: {shipment.id}</span>
                            <span className="bg-blue-600 text-white px-5 py-2 rounded-full italic shadow-xl shadow-blue-600/30">Phase: {shipment.status.replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-10 md:p-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-16">
                    <div className="bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-100 shadow-inner italic">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 flex items-center italic"><Clock size={18} className="mr-4 text-blue-600"/> UNIVERSAL LIFECYCLE RECORD</h4>
                         <div className="space-y-10 relative">
                             <div className="absolute left-[38px] top-10 bottom-10 w-0.5 bg-slate-200"></div>
                             {shipment.milestones.map((m, i) => (
                                 <div key={i} className="flex gap-8 relative z-10 group animate-fade-in">
                                     <div className={`w-20 h-20 rounded-[2rem] border-[6px] border-white flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:rotate-6 ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>{i === 0 ? <Globe size={28}/> : <CheckCircle size={28}/>}</div>
                                     <div className="pt-3">
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{new Date(m.date).toLocaleString()}</p>
                                         <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-3">{m.status.replace(/_/g, ' ')}</p>
                                         {m.notes && <p className="text-[15px] font-bold text-slate-500 leading-relaxed italic border-l-8 border-blue-50 pl-6">"{m.notes}"</p>}
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-10">
                    <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden italic">
                        <div className="absolute -bottom-10 -right-10 opacity-10"><Package size={140}/></div>
                        <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] mb-10 border-b border-white/5 pb-4 italic">Registry Metadata</h4>
                        <div className="space-y-6">
                            <div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Trade Corridor</p><p className="text-lg font-black italic uppercase tracking-tighter">{shipment.origin} &rarr; {shipment.destination}</p></div>
                            <div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Mode Architecture</p><p className="text-lg font-black italic uppercase tracking-tighter">{shipment.modality} FREIGHT</p></div>
                            <div className="pt-4 border-t border-white/5 flex gap-4">
                                <button className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex flex-col items-center gap-2 italic"><Download size={16}/><span className="text-[8px] font-black uppercase italic tracking-widest">HBL</span></button>
                                <button className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all flex flex-col items-center gap-2 italic"><Mail size={16}/><span className="text-[8px] font-black uppercase italic tracking-widest">Ops</span></button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 p-12 rounded-[4rem] text-white shadow-2xl shadow-blue-600/30 italic">
                        <h4 className="text-[11px] font-black text-blue-200 uppercase tracking-[0.4em] mb-8 italic">Encrypted Connection</h4>
                        <p className="text-sm font-bold leading-relaxed mb-10 italic">Secure AIS/Vizion data node verified for this trade lane corridor.</p>
                        <div className="flex items-center gap-3"><ShieldCheck size={24}/><span className="text-[10px] font-black uppercase tracking-widest italic">Signal Integrity 100%</span></div>
                    </div>
                </div>
            </div>
        </div>
        <p className="mt-12 text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] italic">Powered by Unique CCS Global Architecture • Build v3.5.0</p>
    </div>
  );
};

export default CustomerTrackingPortal;