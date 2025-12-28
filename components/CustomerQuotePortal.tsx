
import React, { useState, useEffect } from 'react';
import { Ship, CheckCircle2, FileText, ArrowRight, ShieldCheck, Download, Mail, Globe, Calendar, MapPin, User, MessageSquare } from 'lucide-react';
import { Quotation } from '../types';
import { tokenService } from '../services/tokenService';
import { repo } from '../services/repository';
// Fixed: Added missing Badge import
import { Badge } from './ui/Badge';

const CustomerQuotePortal: React.FC<{ token: string }> = ({ token }) => {
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'CONFIRMING' | 'CONFIRMED' | 'ERROR'>('LOADING');
  
  // Confirmation Data Capture
  const [confirmData, setConfirmData] = useState({
    pickupAddress: '',
    contactPerson: '',
    confirmedReadyDate: '',
    specialInstructions: ''
  });

  useEffect(() => {
    const t = tokenService.validate(token);
    if (t && t.entityType === 'quote') {
      repo.getQuotes().then(list => {
        const found = list.find(q => q.id === t.entityId);
        if (found) {
          setQuote(found);
          setStatus(found.status === 'CONFIRMED' ? 'CONFIRMED' : 'READY');
        } else { setStatus('ERROR'); }
      });
    } else { setStatus('ERROR'); }
  }, [token]);

  const handleAcceptance = async () => {
    if (!quote) return;
    if (!confirmData.pickupAddress || !confirmData.contactPerson) {
      alert("Essential logistics nodes (Pickup Address & Contact) are required for confirmation.");
      return;
    }
    
    const updatedQuote: Quotation = { 
      ...quote, 
      status: 'CONFIRMED',
      // Store metadata as string notes if field is not in type, otherwise repo saves are fine
    };
    await repo.saveQuote(updatedQuote, { id: 'PORTAL', name: 'Customer', role: 'SALES' } as any);
    setQuote(updatedQuote);
    setStatus('CONFIRMED');
  };

  if (status === 'LOADING') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center italic text-blue-400 font-black uppercase tracking-widest animate-pulse">Synchronizing Secure Link...</div>
  );

  if (status === 'ERROR' || !quote) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 italic">
      <div className="bg-white p-16 rounded-[4rem] text-center max-w-lg shadow-2xl">
        <ShieldCheck size={80} className="mx-auto text-rose-500 mb-8" />
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Access Link Expired</h2>
        <p className="mt-4 text-slate-500 font-medium">This secure token has been revoked or has timed out. Please request a protocol update from Unique CCS.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-12 flex flex-col items-center italic font-bold">
      <div className="w-full max-w-5xl bg-white/70 backdrop-blur-3xl rounded-[4rem] shadow-[0_20px_80px_rgba(0,0,0,0.05)] border border-white overflow-hidden animate-slide-up">
        <header className="px-16 py-14 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start gap-10 relative overflow-hidden border-b-[12px] border-blue-600">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12"><Globe size={340} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10"><Ship size={28} className="text-blue-400" /><h1 className="text-sm font-black uppercase tracking-[0.4em]">Unique CCS Global</h1></div>
            <h2 className="text-5xl font-black tracking-tighter leading-tight uppercase">Operational<br/>Settlement Spec</h2>
          </div>
          <div className="text-right relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Registry Ref</p>
            <p className="text-2xl font-black tracking-tighter uppercase">{quote.id}</p>
            <Badge color={quote.status === 'CONFIRMED' ? 'green' : 'blue'} className="mt-6 px-6 py-1.5 shadow-lg uppercase">{quote.status}</Badge>
          </div>
        </header>

        <div className="p-16 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center bg-white p-12 rounded-[3rem] border-2 border-slate-50 shadow-inner">
            <div className="text-center md:text-left space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Origin Node</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{quote.origin}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full h-px bg-slate-200 relative flex justify-center items-center">
                 <div className="bg-white p-3 rounded-full border-2 border-slate-100 text-blue-600 shadow-xl"><ArrowRight size={22} /></div>
              </div>
              <p className="text-[10px] font-black text-blue-500 mt-8 uppercase tracking-[0.3em]">{quote.modality} LOGISTICS PULSE</p>
            </div>
            <div className="text-center md:text-right space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Destination Node</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{quote.destination}</p>
            </div>
          </div>

          {status === 'READY' && (
             <div className="space-y-10 animate-fade-in">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-4 italic border-l-8 border-blue-600 pl-6">
                   <ShieldCheck size={24} className="text-blue-600" /> MANDATORY BOOKING PROTOCOLS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic flex items-center gap-2"><MapPin size={14}/> Accurate Pickup Address</label>
                      <textarea 
                         className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-bold shadow-inner h-32 outline-none focus:border-blue-500 transition-all resize-none"
                         value={confirmData.pickupAddress}
                         onChange={e => setConfirmData({...confirmData, pickupAddress: e.target.value})}
                         placeholder="Warehouse / Door details..."
                      />
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic flex items-center gap-2"><User size={14}/> Facility Contact Person</label>
                        <input 
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold shadow-inner outline-none focus:border-blue-500 transition-all"
                           value={confirmData.contactPerson}
                           onChange={e => setConfirmData({...confirmData, contactPerson: e.target.value})}
                           placeholder="Full Name & Phone Signal"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic flex items-center gap-2"><Calendar size={14}/> Confirmed Ready Date</label>
                        <input 
                           type="date"
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold shadow-inner outline-none focus:border-blue-500 transition-all"
                           value={confirmData.confirmedReadyDate}
                           onChange={e => setConfirmData({...confirmData, confirmedReadyDate: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic flex items-center gap-2"><MessageSquare size={14}/> Special Handling Instructions</label>
                      <input 
                         className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-inner outline-none focus:border-blue-500 transition-all"
                         value={confirmData.specialInstructions}
                         onChange={e => setConfirmData({...confirmData, specialInstructions: e.target.value})}
                         placeholder="Tail-lift required, DG class notes, etc."
                      />
                   </div>
                </div>
                <div className="bg-slate-900 p-16 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 p-8 opacity-5"><ShieldCheck size={120}/></div>
                   <div className="text-center md:text-left mb-8 md:mb-0 relative z-10">
                      <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3 italic">Final Contract Value</p>
                      <p className="text-6xl font-black tracking-tighter leading-none">{quote.currency} {quote.amount.toLocaleString()}</p>
                   </div>
                   <button 
                      onClick={handleAcceptance}
                      className="px-16 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-6 group relative z-10"
                   >
                      Authorize Booking <CheckCircle2 size={32} className="group-hover:scale-110 transition-transform" />
                   </button>
                </div>
             </div>
          )}

          {status === 'CONFIRMED' && (
            <div className="bg-emerald-50/40 border-2 border-emerald-100 p-24 rounded-[4rem] text-center space-y-8 animate-fade-in shadow-inner">
               <CheckCircle2 size={80} className="text-emerald-500 mx-auto animate-bounce" />
               <div>
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">Authorization Synced</h3>
                  <p className="text-slate-500 mt-6 text-lg font-bold">This booking request has been encrypted and synced with Global Operations for immediate transit allocation.</p>
               </div>
               <div className="pt-10 flex justify-center gap-6">
                  <button className="px-10 py-5 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-3 hover:border-blue-500 transition-all shadow-sm"><Download size={20} /> Secure PDF Copy</button>
               </div>
            </div>
          )}
        </div>

        <footer className="bg-slate-900 p-14 text-center border-t border-white/5 relative overflow-hidden">
           <div className="flex items-center justify-center gap-4 text-slate-500">
              <ShieldCheck size={18} className="text-blue-500/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60">Universal AIS End-to-End Cryptography Architecture</span>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default CustomerQuotePortal;
