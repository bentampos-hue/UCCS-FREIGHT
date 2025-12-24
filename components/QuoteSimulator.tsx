import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Send, FileCheck, Target, Zap, ArrowRight, Ship, Plane, Globe, Calculator, User } from 'lucide-react';
import { Quotation, SharedProps, QuoteRequest, Customer, Modality } from '../types';
import { repo } from '../services/repository';
import { tokenService } from '../services/tokenService';
import { emailService } from '../services/emailService';

const QuoteSimulator: React.FC<any> = ({ settings, currentUser, onNotify, customers, onGenerateQuote }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'MANUAL' | 'MARKET'>('MANUAL');
  const [modality, setModality] = useState<Modality>('SEA');

  // Core Inputs
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  // Dimensions for calculation
  const [weight, setWeight] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [equipment, setEquipment] = useState('');

  const [buyRate, setBuyRate] = useState<number>(0);
  const [sellPriceOverride, setSellPriceOverride] = useState<number>(0);
  const [marginInput, setMarginInput] = useState<number>(settings.defaultMarginPercent);
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const chargeable = useMemo(() => {
    if (modality === 'SEA') {
      const wm = weight / settings.commercialParameters.sea.wmRule;
      return Math.max(volume, wm, settings.commercialParameters.sea.lclMinCbm);
    } else {
      const volWeight = (volume * 1000000) / settings.commercialParameters.air.volumetricFactor; // Simple mock conversion
      return Math.max(weight, volWeight, settings.commercialParameters.air.minChargeableWeight);
    }
  }, [weight, volume, modality, settings]);

  const calculatedBuy = useMemo(() => {
    const locals = modality === 'SEA' ? settings.commercialParameters.sea.defaultLocalCharges : settings.commercialParameters.air.defaultSurcharges;
    const docFee = modality === 'SEA' ? settings.commercialParameters.sea.docFee : 0;
    return (chargeable * buyRate) + locals + docFee;
  }, [chargeable, buyRate, modality, settings]);

  const finalSell = useMemo(() => {
    if (mode === 'MANUAL' && sellPriceOverride > 0) return sellPriceOverride;
    return calculatedBuy / (1 - (marginInput / 100));
  }, [calculatedBuy, marginInput, mode, sellPriceOverride]);

  const actualMarginPercent = finalSell > 0 ? ((finalSell - calculatedBuy) / finalSell) * 100 : 0;

  const handleGenerate = async () => {
    if (!customerEmail || !origin || !destination) {
        onNotify('warning', 'Please fill in route and customer email.');
        return;
    }

    const needsApproval = actualMarginPercent < settings.defaultMarginPercent;
    setLoading(true);

    const quoteId = `Q-${Date.now().toString().slice(-6)}`;
    const token = tokenService.generate(quoteId, 'QUOTE', customerEmail);

    const newQuote: Quotation = {
      id: quoteId,
      portalToken: token,
      modality,
      customerId: customerId || 'C-SPOT',
      customerName: customerName || 'Spot Client',
      customerEmail: customerEmail,
      origin: origin,
      destination: destination,
      amount: Math.round(finalSell),
      buyRate: Math.round(calculatedBuy),
      margin: Math.round(finalSell - calculatedBuy),
      currency: settings.defaultCurrency,
      status: needsApproval ? 'PENDING_APPROVAL' : 'SENT',
      date: new Date().toISOString().split('T')[0],
      details: {
          weight,
          volume,
          chargeable,
          equipment
      }
    };

    await repo.saveQuote(newQuote, currentUser);

    const emailBody = `Subject: New Quotation: ${quoteId} from Unique CCS

Dear ${customerName || 'Customer'},

Please find below our commercial offer for your shipment from ${origin} to ${destination}.

TOTAL ALL-IN: ${settings.defaultCurrency} ${Math.round(finalSell).toLocaleString()}

You can view the detailed breakdown and accept the offer digitally via our portal:
https://uniqueccs.app/portal/quote/${token}

Best Regards,
Unique CCS Sales Team`;

    if (needsApproval) {
        onNotify('warning', 'Low margin detected. Queued for Manager approval.');
        const request = { 
          id: `APP-${Date.now()}`, 
          quoteId, 
          status: 'PENDING', 
          marginAtRequest: actualMarginPercent,
          requestedBy: currentUser.id,
          requestedAt: new Date().toISOString(),
          reason: 'Auto-triggered: Low Margin Threshold'
        };
        await repo.saveItem('approvals', request as any, currentUser);
    } else {
        await emailService.send({
            to: customerEmail,
            subject: `New Quotation: ${quoteId}`,
            body: emailBody,
            type: 'QUOTE',
            referenceId: quoteId
        });
        onNotify('success', `Offer ${quoteId} recorded and dispatched to Outbox.`);
    }

    setLoading(false);
    onGenerateQuote(newQuote);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-[16px] border-blue-600">
           <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Calculator size={280} /></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="max-w-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg italic">Simulation v3</span>
                        <div className="bg-white/10 px-4 py-1.5 rounded-full flex gap-2 border border-white/5">
                            <button onClick={() => setMode('MANUAL')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${mode === 'MANUAL' ? 'bg-white text-slate-900 italic' : 'text-slate-400 hover:text-white'}`}>Manual Engine</button>
                            <button onClick={() => setMode('MARKET')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${mode === 'MARKET' ? 'bg-blue-600 text-white italic' : 'text-slate-400 hover:text-white'}`}>Market Intake</button>
                        </div>
                    </div>
                    <h3 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-4">Quote Engine</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Smart Pricing Architecture</p>
                </div>

                <div className="flex bg-slate-800 p-2 rounded-3xl z-10 shadow-2xl border border-slate-700 shrink-0">
                    <button onClick={() => setModality('SEA')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'SEA' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 italic' : 'text-slate-500 hover:text-white'}`}>
                        <Ship size={20} /> <span>SEA</span>
                    </button>
                    <button onClick={() => setModality('AIR')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'AIR' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 italic' : 'text-slate-500 hover:text-white'}`}>
                        <Plane size={20} /> <span>AIR</span>
                    </button>
                </div>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             
             {/* Section 1: Entity */}
             <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                    <User size={20} className="mr-4 text-blue-600" /> [01] Entity Protocol
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Customer Database</label>
                        <select 
                            onChange={e => {
                                const c = customers.find((x: any) => x.id === e.target.value);
                                if (c) {
                                    setCustomerId(c.id);
                                    setCustomerName(c.companyName);
                                    setCustomerEmail(c.contacts.find((x: any) => x.isPrimary)?.email || '');
                                }
                            }}
                            className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 uppercase italic"
                        >
                            <option value="">Select Existing Account</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                        </select>
                   </div>
                   <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Direct Email Gateway</label>
                        <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 uppercase tracking-tighter shadow-inner" placeholder="client@corp.com" />
                   </div>
                </div>
             </div>

             {/* Section 2: Route & Cargo */}
             <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                    <Globe size={20} className="mr-4 text-blue-600" /> [02] Route DNA
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Departure</label>
                        <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="SHANGHAI" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Arrival</label>
                        <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="ROTTERDAM" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-10 mt-10 border-t border-slate-50 pt-10">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Weight (KG)</label>
                        <input type="number" value={weight || ''} onChange={e => setWeight(Number(e.target.value))} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-lg font-black italic shadow-inner" placeholder="0" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Volume (CBM)</label>
                        <input type="number" value={volume || ''} onChange={e => setVolume(Number(e.target.value))} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-lg font-black italic shadow-inner" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Equipment</label>
                        <input type="text" value={equipment} onChange={e => setEquipment(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="LCL / 40HC" />
                    </div>
                </div>
             </div>

             {/* Section 3: Commercials */}
             <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                    <Zap size={20} className="mr-4 text-blue-600" /> [03] Market Input
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Freight Rate ({settings.defaultCurrency} / Unit)</label>
                        <input type="number" value={buyRate || ''} onChange={e => setBuyRate(Number(e.target.value))} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-2xl font-black italic shadow-inner text-blue-600" placeholder="0.00" />
                    </div>
                    {mode === 'MANUAL' ? (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Total Sell Override ({settings.defaultCurrency})</label>
                            <input type="number" value={sellPriceOverride || ''} onChange={e => setSellPriceOverride(Number(e.target.value))} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-2xl font-black italic shadow-inner text-emerald-600" placeholder="Auto-calculated" />
                            <p className="text-[9px] text-slate-400 mt-2 italic font-bold">Leave blank for margin-based auto-pricing.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Target Margin (%)</label>
                            <input type="number" value={marginInput || ''} onChange={e => setMarginInput(Number(e.target.value))} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-2xl font-black italic shadow-inner text-emerald-600" />
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-4">
             <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl sticky top-8 border-t-[12px] border-blue-600 overflow-hidden">
                <div className="absolute -bottom-10 -right-10 opacity-5 transform rotate-45"><Calculator size={240} /></div>
                <h4 className="text-3xl font-black tracking-tighter uppercase italic mb-12">RESULT STACK</h4>
                
                <div className="space-y-10 relative z-10">
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4 italic">Operational Calculation</p>
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase italic">Chargeable {modality === 'SEA' ? 'CBM' : 'KGS'}</span>
                            <span className="text-2xl font-black italic">{chargeable.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase italic">Calculated Buy ({settings.defaultCurrency})</span>
                            <span className="text-2xl font-black italic">{calculatedBuy.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4 italic">Recommended Sell</p>
                        <div className="flex items-baseline justify-center gap-2">
                             <span className="text-2xl font-bold text-blue-500 italic">{settings.defaultCurrency}</span>
                             <span className="text-6xl font-black tracking-tighter italic">{Math.round(finalSell).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className={`p-6 rounded-3xl border text-center transition-all ${actualMarginPercent < settings.defaultMarginPercent ? 'bg-red-900/40 border-red-800' : 'bg-emerald-900/40 border-emerald-800'}`}>
                         <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Final Margin Yield</p>
                         <p className="text-3xl font-black italic">{actualMarginPercent.toFixed(1)}%</p>
                         {actualMarginPercent < settings.defaultMarginPercent && (
                             <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-black text-red-400 uppercase italic">
                                 <ShieldAlert size={14} /> Critical Threshold
                             </div>
                         )}
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg transition-all shadow-2xl shadow-blue-500/40 active:scale-95 flex items-center justify-center gap-6 italic disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : <><Send size={24} /> DISPATCH OFFER</>}
                    </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default QuoteSimulator;