import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Send, 
  Target, 
  Zap, 
  ArrowRight, 
  Ship, 
  Plane, 
  Globe, 
  Calculator, 
  User, 
  Plus, 
  Trash2, 
  Settings2,
  Scale,
  PackageSearch,
  ChevronRight
} from 'lucide-react';
import { Quotation, SharedProps, Customer, Modality, Currency } from '../types';
import { repo } from '../services/repository';
import { tokenService } from '../services/tokenService';
import { emailService } from '../services/emailService';

interface LineItem {
  id: string;
  description: string;
  buyRate: number;
  sellRate: number;
  quantity: number;
}

const QuoteSimulator: React.FC<any> = ({ settings, currentUser, onNotify, customers, onGenerateQuote }) => {
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'MASTER' | 'SMART'>('MASTER');
  const [modality, setModality] = useState<Modality>('SEA');

  // Master Builder State
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [incoterms, setIncoterms] = useState('FOB');
  const [serviceLevel, setServiceLevel] = useState('Standard');
  const [cargoType, setCargoType] = useState('');
  
  // Airfreight Specifics
  const [actualWeight, setActualWeight] = useState<number>(0);
  const [volumeCbm, setVolumeCbm] = useState<number>(0);
  const [volumetricRatio, setVolumetricRatio] = useState<number>(6000); // 1:6000 standard

  // Commercials (Line Items)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: 'Freight Charges', buyRate: 0, sellRate: 0, quantity: 1 }
  ]);

  // Smart Link State
  const [smartTotal, setSmartTotal] = useState<number>(0);
  const [smartBuy, setSmartBuy] = useState<number>(0);

  // Calculations
  const chargeableWeight = useMemo(() => {
    if (modality !== 'AIR') return 0;
    const volumetricWeight = (volumeCbm * 1000000) / volumetricRatio;
    return Math.max(actualWeight, volumetricWeight);
  }, [modality, actualWeight, volumeCbm, volumetricRatio]);

  const totals = useMemo(() => {
    if (activeMode === 'SMART') {
      const margin = smartTotal > 0 ? ((smartTotal - smartBuy) / smartTotal) * 100 : 0;
      return { buy: smartBuy, sell: smartTotal, margin };
    }
    
    const buyTotal = lineItems.reduce((sum, item) => sum + (item.buyRate * item.quantity), 0);
    const sellTotal = lineItems.reduce((sum, item) => sum + (item.sellRate * item.quantity), 0);
    const margin = sellTotal > 0 ? ((sellTotal - buyTotal) / sellTotal) * 100 : 0;
    
    return { buy: buyTotal, sell: sellTotal, margin };
  }, [activeMode, lineItems, smartTotal, smartBuy]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now().toString(), description: '', buyRate: 0, sellRate: 0, quantity: 1 }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleGenerate = async () => {
    if (!customerEmail || !origin || !destination) {
      onNotify('warning', 'Please fill in route and customer email.');
      return;
    }

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
      origin,
      destination,
      amount: Math.round(totals.sell),
      buyRate: Math.round(totals.buy),
      margin: Math.round(totals.sell - totals.buy),
      currency: settings.defaultCurrency,
      status: totals.margin < settings.defaultMarginPercent ? 'PENDING_APPROVAL' : 'SENT',
      date: new Date().toISOString().split('T')[0],
      cargoType: activeMode === 'MASTER' ? `${cargoType} (${serviceLevel})` : 'Spot Request',
      details: {
        weight: actualWeight,
        volume: volumeCbm,
        chargeable: modality === 'AIR' ? chargeableWeight : volumeCbm,
        equipment: activeMode === 'MASTER' ? `${incoterms} Terms` : ''
      }
    };

    await repo.saveQuote(newQuote, currentUser);

    const emailBody = `New Quote Issued: ${quoteId}\nRoute: ${origin} to ${destination}\nTotal: ${settings.defaultCurrency} ${newQuote.amount.toLocaleString()}\n\nView and confirm here: https://uccs.app/portal/quote/${token}`;
    
    await emailService.send({
      to: customerEmail,
      subject: `Quotation ${quoteId} | ${origin} to ${destination}`,
      body: emailBody,
      type: 'QUOTE',
      referenceId: quoteId
    });

    setLoading(false);
    onGenerateQuote(newQuote);
    onNotify('success', `Quote ${quoteId} generated and dispatched.`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header with Mode Toggle */}
      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-[16px] border-blue-600">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Calculator size={280} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg italic">Hybrid Engine v4</span>
              <div className="bg-white/10 p-1 rounded-full flex gap-1 border border-white/5 backdrop-blur-md">
                <button 
                  onClick={() => setActiveMode('MASTER')} 
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'MASTER' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                >
                  Master Builder
                </button>
                <button 
                  onClick={() => setActiveMode('SMART')} 
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'SMART' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
                >
                  Smart Link
                </button>
              </div>
            </div>
            <h3 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-4">Pricing Control</h3>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Precision Logic Architecture</p>
          </div>

          <div className="flex bg-slate-800 p-2 rounded-3xl z-10 shadow-2xl border border-slate-700 shrink-0">
            <button onClick={() => setModality('SEA')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'SEA' ? 'bg-blue-600 text-white shadow-xl italic' : 'text-slate-500 hover:text-white'}`}>
              <Ship size={20} /> <span>SEA</span>
            </button>
            <button onClick={() => setModality('AIR')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'AIR' ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-slate-500 hover:text-white'}`}>
              <Plane size={20} /> <span>AIR</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {activeMode === 'MASTER' ? (
            <>
              {/* MASTER: Entity & Route */}
              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                  <User size={20} className="mr-4 text-blue-600" /> [01] Routing & Entity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Account Registry</label>
                    <select 
                      onChange={e => {
                        const c = customers.find((x: any) => x.id === e.target.value);
                        if (c) {
                          setCustomerId(c.id);
                          setCustomerName(c.companyName);
                          setCustomerEmail(c.contacts.find((x: any) => x.isPrimary)?.email || '');
                        }
                      }}
                      className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 uppercase italic shadow-inner"
                    >
                      <option value="">Select Existing Account</option>
                      {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Notification Node</label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 uppercase tracking-tighter shadow-inner" placeholder="client@corp.com" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Origin Port/Hub</label>
                    <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="SHA" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Destination Port/Hub</label>
                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="LAX" />
                  </div>
                </div>
              </div>

              {/* MASTER: Logistics Specs */}
              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                  <PackageSearch size={20} className="mr-4 text-indigo-600" /> [02] Operational Specs
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Incoterms</label>
                    <select value={incoterms} onChange={e => setIncoterms(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-black uppercase">
                      {['EXW', 'FOB', 'CIF', 'DAP', 'DDP'].map(term => <option key={term} value={term}>{term}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Svc Level</label>
                    <select value={serviceLevel} onChange={e => setServiceLevel(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-black uppercase">
                      {['Standard', 'Express', 'Deferred'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                  {modality === 'AIR' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Weight (kg)</label>
                        <input type="number" value={actualWeight} onChange={e => setActualWeight(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-black" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Volume (cbm)</label>
                        <input type="number" value={volumeCbm} onChange={e => setVolumeCbm(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-black" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* MASTER: Detailed Line Items */}
              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic">
                    <Settings2 size={20} className="mr-4 text-emerald-600" /> [03] Detailed Line Ledger
                  </h4>
                  <button onClick={addLineItem} className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all">
                    <Plus size={14} /> Add Surcharge
                  </button>
                </div>
                
                <div className="space-y-4">
                  {lineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100">
                      <div className="col-span-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Charge Description</label>
                        <input value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="e.g. FSC / Cartage" className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Buy (Net)</label>
                        <input type="number" value={item.buyRate} onChange={e => updateLineItem(item.id, 'buyRate', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Sell (Offer)</label>
                        <input type="number" value={item.sellRate} onChange={e => updateLineItem(item.id, 'sellRate', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black text-blue-600 outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Quantity</label>
                        <input type="number" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2 flex justify-end pb-1">
                        <button onClick={() => removeLineItem(item.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* SMART LINK MODE */
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200 space-y-12">
               <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-50 pb-8 flex items-center italic">
                  <Zap size={20} className="mr-4 text-blue-600" /> Smart Link Injection
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Account Identifier</label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-6 border-3 border-slate-100 bg-slate-50 rounded-[2.5rem] outline-none focus:border-blue-500 text-lg font-black italic shadow-inner" placeholder="Enter recipient email..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Agreed Net (Buy)</label>
                    <input type="number" value={smartBuy} onChange={e => setSmartBuy(Number(e.target.value))} className="w-full p-6 border-3 border-slate-100 bg-slate-50 rounded-[2.5rem] outline-none focus:border-blue-500 text-xl font-black italic shadow-inner" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Global Total (Sell)</label>
                    <input type="number" value={smartTotal} onChange={e => setSmartTotal(Number(e.target.value))} className="w-full p-6 border-3 border-slate-100 bg-slate-50 rounded-[2.5rem] outline-none focus:border-blue-500 text-3xl font-black italic shadow-inner text-blue-600" placeholder="0.00" />
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Totals Panel */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl sticky top-8 border-t-[12px] border-blue-600 overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-5 transform rotate-45"><Calculator size={240} /></div>
            <h4 className="text-3xl font-black tracking-tighter uppercase italic mb-12">RESULT STACK</h4>
            
            <div className="space-y-10 relative z-10">
              {modality === 'AIR' && activeMode === 'MASTER' && (
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">Volumetric Analysis</p>
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic">Actual Kgs</span>
                    <span className="text-xl font-black italic">{actualWeight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic text-indigo-400">Chargeable Kgs</span>
                    <span className="text-3xl font-black italic text-indigo-400">{Math.round(chargeableWeight).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4 italic">Recommended Sell</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-blue-500 italic">{settings.defaultCurrency}</span>
                  <span className="text-6xl font-black tracking-tighter italic">{Math.round(totals.sell).toLocaleString()}</span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border text-center transition-all ${totals.margin < settings.defaultMarginPercent ? 'bg-red-900/40 border-red-800' : 'bg-emerald-900/40 border-emerald-800'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Projected Margin</p>
                <p className="text-3xl font-black italic">{totals.margin.toFixed(1)}%</p>
                {totals.margin < settings.defaultMarginPercent && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-black text-red-400 uppercase italic">
                    <ShieldAlert size={14} /> Threshold Trigger
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg transition-all shadow-2xl shadow-blue-500/40 active:scale-95 flex items-center justify-center gap-6 italic disabled:opacity-50"
              >
                {loading ? 'Processing...' : <><Send size={24} /> DISPATCH QUOTE</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSimulator;
