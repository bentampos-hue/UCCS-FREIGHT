import React, { useState } from 'react';
import { Quotation, SharedProps } from '../types';
import { ShieldCheck, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface ApprovalsProps extends SharedProps {
  quotations: Quotation[];
  onApprove: (id: string) => void;
  onReject: (id: string, comments: string) => void;
}

const ApprovalsInbox: React.FC<ApprovalsProps> = ({ quotations, onApprove, onReject }) => {
  const pending = quotations.filter(q => q.status === 'PENDING_APPROVAL');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comments, setComments] = useState('');

  return (
    <div className="space-y-8 animate-fade-in pb-20 italic">
        <div className="bg-indigo-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-[16px] border-indigo-700">
            <div className="absolute top-0 right-0 p-12 opacity-10"><ShieldAlert size={160} /></div>
            <h3 className="text-4xl font-black tracking-tighter italic uppercase leading-none mb-4 text-indigo-100">Approvals Gateway</h3>
            <p className="text-indigo-300 font-bold uppercase tracking-[0.3em] text-[10px]">Manager level margin authorization protocol</p>
        </div>

        {pending.length === 0 ? (
            <div className="bg-white rounded-[4rem] p-32 text-center border-2 border-slate-100 border-dashed">
                <ShieldCheck size={80} className="mx-auto text-slate-100 mb-8" />
                <p className="text-2xl font-black text-slate-300 uppercase tracking-tighter italic">Queue Clear. Registry fully authorized.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-8 italic">
                {pending.map(q => (
                    <div key={q.id} className="bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-sm p-10 flex flex-col lg:flex-row items-center gap-10 hover:border-indigo-300 transition-all group animate-fade-in">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">FILE {q.id}</span>
                                <span className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-1.5 rounded-full uppercase tracking-widest border border-red-100 flex items-center gap-2">
                                    <ShieldAlert size={12}/> YIELD THRESHOLD RISK
                                </span>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">{q.customerName}</h4>
                            <div className="flex items-center gap-6 text-[13px] font-black text-slate-500 uppercase tracking-widest mb-8">
                                <span>{q.origin}</span>
                                <ArrowRight size={18} className="text-slate-300" />
                                <span>{q.destination}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sell Signal</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{q.currency} {q.amount.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Cost</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{q.currency} {q.buyRate.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-500/10">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Strategic Yield</p>
                                    <p className="text-2xl font-black text-indigo-900 leading-none">{((q.margin/q.amount)*100).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-[400px] space-y-4">
                            {rejectId === q.id ? (
                                <div className="animate-fade-in space-y-4 italic">
                                    <textarea 
                                        value={comments} 
                                        onChange={e => setComments(e.target.value)} 
                                        placeholder="Revision reasoning template..." 
                                        className="w-full p-6 border-2 border-slate-100 rounded-3xl text-sm font-bold shadow-inner h-32 resize-none outline-none focus:border-red-400" 
                                    />
                                    <div className="flex gap-4">
                                        <button onClick={() => { onReject(q.id, comments); setRejectId(null); setComments(''); }} className="flex-1 py-5 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all">Submit Rejection</button>
                                        <button onClick={() => setRejectId(null)} className="px-8 py-5 bg-white border-2 border-slate-100 text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 flex flex-col h-full">
                                    <button onClick={() => onApprove(q.id)} className="w-full py-6 bg-blue-600 text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-3xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-4 italic"><ShieldCheck size={24}/> AUTHORIZE RELEASE</button>
                                    <button onClick={() => setRejectId(q.id)} className="w-full py-5 bg-white border-3 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-3xl hover:border-red-400 hover:text-red-600 transition-all flex items-center justify-center gap-4 active:scale-95 italic"><XCircle size={20}/> REJECT SIGNAL</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default ApprovalsInbox;