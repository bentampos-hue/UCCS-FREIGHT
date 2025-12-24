
import React, { useState } from 'react';
import { ShieldAlert, Send, FileCheck } from 'lucide-react';
import { Quotation, SharedProps } from '../types';
import { repo } from '../services/repository';
import { tokenService } from '../services/tokenService';
import { emailService } from '../services/emailService';

const QuoteSimulator: React.FC<any> = ({ settings, currentUser, onNotify, customers, onGenerateQuote }) => {
  const [loading, setLoading] = useState(false);
  // Re-introducing missing form states for the logic to work
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [totalAmount, setTotalAmount] = useState(1000);
  const [buyRate, setBuyRate] = useState(800);
  const [origin, setOrigin] = useState('Shanghai');
  const [destination, setDestination] = useState('Los Angeles');

  const marginPercent = totalAmount > 0 ? ((totalAmount - buyRate) / totalAmount) * 100 : 0;

  const handleGenerate = async () => {
    const needsApproval = marginPercent < settings.defaultMarginPercent;

    setLoading(true);
    const quoteId = `Q-${Date.now()}`;
    const token = tokenService.generate(quoteId, 'QUOTE', customerEmail);

    const newQuote: Quotation = {
      id: quoteId,
      portalToken: token,
      modality: 'SEA',
      customerId: customerId || 'C-SPOT',
      customerName: customerName || 'Spot Client',
      customerEmail: customerEmail,
      origin: origin,
      destination: destination,
      amount: totalAmount,
      buyRate: buyRate,
      margin: marginPercent,
      currency: settings.defaultCurrency,
      status: needsApproval ? 'PENDING_APPROVAL' : 'SENT',
      date: new Date().toISOString().split('T')[0]
    };

    await repo.saveQuote(newQuote, currentUser);

    if (needsApproval) {
        onNotify('warning', 'Quote submitted for Manager approval due to low margin.');
        // Log approval request
        const request = { 
          id: `APP-${Date.now()}`, 
          quoteId, 
          status: 'PENDING', 
          marginAtRequest: marginPercent,
          requestedBy: currentUser.id,
          requestedAt: new Date().toISOString(),
          reason: 'Low Margin Threshold'
        };
        await repo.saveItem('approvals', request as any, currentUser);
    } else {
        await emailService.send({
            to: customerEmail,
            subject: `New Quotation: ${quoteId}`,
            body: `View your quote here: https://uccs.app/portal/quote/${token}`,
            type: 'QUOTE',
            referenceId: quoteId
        });
        onNotify('success', 'Quote sent to customer.');
    }
    setLoading(false);
    onGenerateQuote(newQuote);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
       <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Email</label>
            <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buy Rate</label>
              <input type="number" value={buyRate} onChange={e => setBuyRate(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sell Price</label>
              <input type="number" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded" />
            </div>
          </div>
       </div>

       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Margin Compliance</span>
            <span className={`text-sm font-bold ${marginPercent < settings.defaultMarginPercent ? 'text-red-500' : 'text-emerald-500'}`}>
                {marginPercent.toFixed(1)}% (Threshold: {settings.defaultMarginPercent}%)
            </span>
          </div>
          {marginPercent < settings.defaultMarginPercent && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium">
                  <ShieldAlert size={14}/> Requires Managerial Override
              </div>
          )}
       </div>
       <button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50">
          {loading ? 'Processing...' : 'Generate & Dispatch Quote'}
       </button>
    </div>
  );
};

export default QuoteSimulator;
