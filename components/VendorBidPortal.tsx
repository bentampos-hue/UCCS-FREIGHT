
import React, { useState, useEffect } from 'react';
import { Ship, Send, CheckCircle, ShieldCheck, Calendar, Info, MapPin, ArrowRight } from 'lucide-react';
import { VendorEnquiry, VendorBid } from '../types';
import { tokenService } from '../services/tokenService';
import { repo } from '../services/repository';

const VendorBidPortal: React.FC<{ token: string }> = ({ token }) => {
  const [enquiry, setEnquiry] = useState<VendorEnquiry | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [rate, setRate] = useState(0);
  const [transit, setTransit] = useState(30);

  useEffect(() => {
    const t = tokenService.validate(token);
    if (t && t.entityType === 'ENQUIRY') {
       repo.getEnquiries().then(list => {
           const found = list.find(e => e.id === t.entityId);
           setEnquiry(found || null);
       });
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!enquiry || rate <= 0) return;
    const bid: VendorBid = {
        vendorId: 'PORTAL-SUBMISSION',
        vendorName: 'Agent Portal',
        amount: rate,
        currency: enquiry.currency || 'USD',
        transitTime: transit,
        validityDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        receivedAt: new Date().toISOString(),
        freeTime: 14
    };
    
    enquiry.bids.push(bid);
    enquiry.status = 'BID_RECEIVED';
    await repo.saveItem('enquiries', enquiry, { id: 'VENDOR', name: 'Vendor Portal', role: 'OPS' } as any);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans italic">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl text-center max-w-lg animate-fade-in border-t-[12px] border-emerald-500">
            <CheckCircle size={80} className="text-emerald-500 mx-auto mb-8 animate-bounce" />
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Bid Lodged Successfully</h2>
            <p className="text-slate-500 mt-6 font-medium">Your commercial rate has been encrypted and synced with Unique CCS Control Center.</p>
            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-300">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Verified</span>
            </div>
        </div>
    </div>
  );

  if (!enquiry) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
       <div className="text-white font-black uppercase tracking-widest italic opacity-50">Link Unauthorized or Expired</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-12 flex flex-col items-center font-sans overflow-y-auto">
        <div className="w-full max-w-3xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-800 animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-12 md:p-16 relative overflow-hidden border-b-8 border-blue-600">
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Ship size={240} /></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none mb-4">Spot Market Intake</h1>
                    <p className="text-blue-400 font-bold uppercase tracking-[0.4em] text-[10px]">Reference: {enquiry.reference}</p>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-600/20">
                    <Ship size={32} />
                  </div>
                </div>
            </div>

            <div className="p-10 md:p-16 space-y-12">
                {/* Routing Card */}
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Origin</p>
                            <p className="text-2xl font-black text-slate-900 uppercase italic">{enquiry.origin}</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full h-px bg-slate-200 flex items-center justify-center">
                                <div className="bg-white p-2 rounded-full border border-slate-200 text-blue-600"><ArrowRight size={20}/></div>
                            </div>
                            <p className="mt-4 text-[10px] font-black text-blue-500 uppercase tracking-widest italic">{enquiry.modality} FREIGHT</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Destination</p>
                            <p className="text-2xl font-black text-slate-900 uppercase italic">{enquiry.destination}</p>
                        </div>
                    </div>
                </div>

                {/* Cargo Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center italic">
                        <Info size={18} className="mr-3 text-blue-600" /> Requirements
                      </h4>
                      <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-50 shadow-sm space-y-4">
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase italic">Commodity</span><span className="text-sm font-black text-slate-900 uppercase italic">{enquiry.commodity}</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase italic">Equipment</span><span className="text-sm font-black text-blue-600 uppercase italic">{enquiry.equipmentCount}x {enquiry.equipmentType}</span></div>
                         <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase italic">Terms</span><span className="text-sm font-black text-slate-900 uppercase italic">{enquiry.incoterms}</span></div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center italic">
                        <Send size={18} className="mr-3 text-blue-600" /> Commercial Offer
                      </h4>
                      <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 space-y-6">
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">All-In Rate ({enquiry.currency || 'USD'})</label>
                            <div className="relative">
                               <input type="number" value={rate || ''} onChange={e => setRate(Number(e.target.value))} className="w-full p-5 border-3 border-white bg-white rounded-2xl text-2xl font-black italic shadow-xl focus:border-blue-500 outline-none text-slate-900" placeholder="0.00" />
                               <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 font-black text-xl italic">{enquiry.currency || 'USD'}</span>
                            </div>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Estimated Transit ({enquiry.modality === 'AIR' ? 'Hours' : 'Days'})</label>
                            <input type="number" value={transit} onChange={e => setTransit(Number(e.target.value))} className="w-full p-4 border-3 border-white bg-white rounded-2xl text-lg font-black italic shadow-xl focus:border-blue-500 outline-none" />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Submit Action */}
                <button 
                    onClick={handleSubmit} 
                    disabled={rate <= 0}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-6 italic disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                    <Send size={24} className="group-hover:translate-x-2 transition-transform" /> Dispatch Bid to Control Center
                </button>

                <div className="flex items-center justify-center gap-4 pt-10 border-t border-slate-50 text-slate-300">
                   <ShieldCheck size={16} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Encrypted Submission • Valid 14 Days</span>
                </div>
            </div>
        </div>
        <p className="mt-12 text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] italic">Powered by Unique CCS • Smart Logistics Architecture</p>
    </div>
  );
};

export default VendorBidPortal;
