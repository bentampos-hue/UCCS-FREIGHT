
import React, { useState, useEffect } from 'react';
import { Ship, Send, CheckCircle } from 'lucide-react';
import { VendorEnquiry, VendorBid } from '../types';
import { tokenService } from '../services/tokenService';
import { repo } from '../services/repository';

const VendorBidPortal: React.FC<{ token: string }> = ({ token }) => {
  const [enquiry, setEnquiry] = useState<VendorEnquiry | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [rate, setRate] = useState(0);

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
    if (!enquiry) return;
    const bid: VendorBid = {
        vendorId: 'PORTAL-SUBMISSION', // Linked via token
        vendorName: 'Agent Portal',
        amount: rate,
        currency: enquiry.currency,
        transitTime: 30,
        validityDate: '2024-12-31',
        receivedAt: new Date().toISOString(),
        freeTime: 14
    };
    
    enquiry.bids.push(bid);
    enquiry.status = 'BID_RECEIVED';
    await repo.saveItem('enquiries', enquiry, { id: 'VENDOR', name: 'Vendor Portal' } as any);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md">
            <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-800">Bid Submitted</h2>
            <p className="text-slate-500 mt-2">Thank you for your quotation. Unique CCS will review and revert shortly.</p>
        </div>
    </div>
  );

  if (!enquiry) return <div>Invalid or Expired Link.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-8">
                <Ship className="text-blue-500 mb-4" />
                <h1 className="text-xl font-black uppercase">Rate Request: {enquiry.reference}</h1>
                <p className="text-slate-400 text-sm">{enquiry.origin} -> {enquiry.destination}</p>
            </div>
            <div className="p-8 space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Shipment Requirements</p>
                    <p className="text-sm text-blue-900">{enquiry.commodity}</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your All-In Rate ({enquiry.currency})</label>
                    <input type="number" onChange={e => setRate(Number(e.target.value))} className="w-full p-4 border border-slate-200 rounded-xl text-xl font-black focus:ring-4 focus:ring-blue-100 outline-none" />
                </div>
                <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase flex items-center justify-center gap-2">
                    <Send size={18}/> Submit Quotation
                </button>
            </div>
        </div>
    </div>
  );
};

export default VendorBidPortal;
