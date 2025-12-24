
import React, { useState, useEffect } from 'react';
import { Ship, CheckCircle2, FileText, Calendar, MapPin, ArrowRight, ShieldCheck, Download, Mail } from 'lucide-react';
import { Quotation, Milestone } from '../types';
import { tokenService } from '../services/tokenService';
import { repo } from '../services/repository';

const CustomerQuotePortal: React.FC<{ token: string }> = ({ token }) => {
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [status, setStatus] = useState<'LOADING' | 'READY' | 'CONFIRMED' | 'ERROR'>('LOADING');

  useEffect(() => {
    const t = tokenService.validate(token);
    if (t && t.entityType === 'QUOTE') {
      repo.getQuotes().then(list => {
        const found = list.find(q => q.id === t.entityId);
        if (found) {
          setQuote(found);
          setStatus(found.status === 'CONFIRMED' ? 'CONFIRMED' : 'READY');
        } else {
          setStatus('ERROR');
        }
      });
    } else {
      setStatus('ERROR');
    }
  }, [token]);

  const handleAcceptance = async () => {
    if (!quote) return;
    
    const updatedQuote: Quotation = {
      ...quote,
      status: 'CONFIRMED',
      milestones: [
        {
          status: 'BOOKING_CONFIRMED',
          date: new Date().toISOString(),
          notes: 'Customer accepted quotation via Digital Portal.',
          updatedBy: 'Customer Portal'
        },
        ...(quote.milestones || [])
      ]
    };

    await repo.saveQuote(updatedQuote, { id: 'PORTAL', name: 'Customer', role: 'SALES' } as any);
    setQuote(updatedQuote);
    setStatus('CONFIRMED');
  };

  if (status === 'LOADING') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin text-blue-600"><Ship size={48} /></div>
    </div>
  );

  if (status === 'ERROR' || !quote) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-md border border-red-100">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic">Link Expired</h2>
        <p className="text-slate-500 mt-4">This quotation link is no longer valid or has been revoked. Please contact Unique CCS.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-12 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Ship size={240} /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-xl"><Ship size={24} /></div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Unique CCS</h1>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Logistics Offer</h2>
              <p className="text-blue-400 font-bold mt-4 uppercase tracking-[0.3em] text-[10px]">Secure Digital Gateway</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Offer Reference</p>
              <p className="text-2xl font-black italic">{quote.id}</p>
              <div className={`mt-4 inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${quote.status === 'CONFIRMED' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-blue-600 border-blue-500 text-white'}`}>
                {quote.status}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10 md:p-16 space-y-12">
          {/* Route Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Origin</p>
              <p className="text-xl font-black text-slate-900 uppercase italic">{quote.origin}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-full h-px bg-slate-200 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border border-slate-200 shadow-sm text-blue-600">
                   <ArrowRight size={20} />
                </div>
              </div>
              <p className="text-[10px] font-black text-blue-500 mt-6 uppercase tracking-widest">{quote.modality} FREIGHT</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Destination</p>
              <p className="text-xl font-black text-slate-900 uppercase italic">{quote.destination}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Details */}
            <div className="space-y-6">
              <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center">
                <FileText size={18} className="mr-3 text-blue-600" /> Shipment details
              </h4>
              <div className="space-y-4">
                 <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-500 uppercase italic">Modality</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{quote.modality}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-500 uppercase italic">Cargo Details</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{quote.cargoType || 'General Cargo'}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-500 uppercase italic">Offer Date</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{quote.date}</span>
                 </div>
              </div>
            </div>

            {/* Commercials */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-center items-center shadow-xl shadow-slate-200">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Total All-In Commercials</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-bold text-blue-400 italic">{quote.currency}</span>
                 <span className="text-6xl font-black tracking-tighter italic">{quote.amount.toLocaleString()}</span>
               </div>
               <p className="text-[10px] text-slate-500 mt-6 font-bold italic">Inclusive of all standard port charges</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row gap-6">
            {status === 'READY' ? (
              <button 
                onClick={handleAcceptance}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-lg transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-4 italic"
              >
                <CheckCircle2 size={24} /> Confirm Digital Acceptance
              </button>
            ) : status === 'CONFIRMED' ? (
              <div className="flex-1 bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[2rem] text-center space-y-4 animate-fade-in">
                 <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                 <h3 className="text-2xl font-black text-emerald-900 uppercase italic tracking-tighter">Shipment Confirmed</h3>
                 <p className="text-emerald-700 font-medium">Thank you. Your booking request has been dispatched to our operations team.</p>
              </div>
            ) : null}
            
            <div className="flex gap-4">
               <button className="p-6 bg-white border-2 border-slate-200 rounded-[2rem] text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm">
                  <Download size={24} />
               </button>
               <button className="p-6 bg-white border-2 border-slate-200 rounded-[2rem] text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm">
                  <Mail size={24} />
               </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
           <div className="flex items-center justify-center gap-3 text-slate-400">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Logistics Gateway by Unique CCS</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuotePortal;
