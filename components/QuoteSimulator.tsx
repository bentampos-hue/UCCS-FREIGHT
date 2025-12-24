import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, Send, Target, Zap, ArrowRight, Ship, Plane, Globe, Calculator, User, Plus, Trash2, Settings2, Scale, PackageSearch, ChevronRight, MapPin, PackagePlus, X, FileText, ExternalLink, Mail, CheckCircle, ShieldCheck, RefreshCw, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Quotation, SharedProps, Customer, Modality, Currency, PackagingLine, QuoteRequest } from '../types';
import { repo } from '../services/repository';
import { tokenService } from '../services/tokenService';
import { draftService } from '../services/draftService';

interface LineItem {
  id: string;
  description: string;
  buyRate: number;
  sellRate: number;
  quantity: number;
}

interface QuoteSimulatorProps extends SharedProps {
  customers: Customer[];
  onGenerateQuote: (quote: Quotation) => void;
  prefillData?: QuoteRequest | null;
  onClearPrefill: () => void;
}

const QuoteSimulator: React.FC<QuoteSimulatorProps> = ({ settings, currentUser, onNotify, customers, onGenerateQuote, prefillData, onClearPrefill }) => {
  const [loading, setLoading] = useState(false);
  const [modality, setModality] = useState<Modality>('SEA');
  const [isManualMode, setIsManualMode] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  // Master Builder State
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  // Advanced Routing
  const [originPort, setOriginPort] = useState('');
  const [destPort, setDestPort] = useState('');
  const [originAddr, setOriginAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');

  const [incoterms, setIncoterms] = useState('FOB');
  const [serviceLevel, setServiceLevel] = useState('Standard');
  
  // Dynamic Cargo
  const [cargoLines, setCargoLines] = useState<PackagingLine[]>([
    { id: '1', type: 'PALLET', quantity: 1, length: 120, width: 80, height: 100, weightPerUnit: 450, description: 'General Logistics Cargo' }
  ]);

  // Financials
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: 'Freight Net Cost', buyRate: 0, sellRate: 0, quantity: 1 }
  ]);

  // --- DRAFT & PERSISTENCE LOGIC ---
  
  useEffect(() => {
    if (prefillData) {
      applyData(prefillData);
    } else {
      const draft = draftService.getDraft('quote_builder');
      if (draft && window.confirm("Restore unsaved quote progress?")) {
        applyData(draft);
        onNotify('info', 'Unsaved progress restored.');
      }
    }
  }, []);

  const applyData = (data: any) => {
    if (data.modality) setModality(data.modality);
    if (data.origin) setOriginPort(data.origin);
    if (data.destination) setDestPort(data.destination);
    if (data.originAddress) setOriginAddr(data.originAddress);
    if (data.destinationAddress) setDestAddr(data.destinationAddress);
    if (data.cargoLines) setCargoLines(data.cargoLines);
    if (data.customerEmail) setCustomerEmail(data.customerEmail);
    if (data.lineItems) {
      setLineItems(data.lineItems.map((l: any) => ({ 
        ...l, 
        id: l.id || Math.random().toString(),
        sellRate: l.sellRate || Math.round(l.amount * 1.15)
      })));
    }
  };

  useEffect(() => {
    const currentState = {
      modality, origin: originPort, destination: destPort, originAddress: originAddr,
      destinationAddress: destAddr, cargoLines, lineItems, customerEmail
    };
    draftService.saveDraft('quote_builder', currentState);
  }, [modality, originPort, destPort, originAddr, destAddr, cargoLines, lineItems, customerEmail]);

  // --- SMART PASTE FEATURE ---
  const handleSmartPaste = useCallback((e: React.ClipboardEvent, target: 'ORIGIN' | 'DEST') => {
    const text = e.clipboardData.getData('Text');
    const portMatch = text.match(/\b[A-Z]{3}\b/); // Detect 3-letter codes
    if (portMatch) {
      onNotify('info', `Intelligence: Pattern detected. Auto-filling port code.`);
      if (target === 'ORIGIN') setOriginPort(portMatch[0]);
      else setDestPort(portMatch[0]);
    }
  }, [onNotify]);

  // Modality Math
  const metrics = useMemo(() => {
    const grossWeight = cargoLines.reduce((s, l) => s + (l.weightPerUnit * l.quantity), 0);
    const grossVolume = cargoLines.reduce((s, l) => s + ((l.length * l.width * l.height) / 1000000 * l.quantity), 0);
    
    let chargeable = 0;
    if (modality === 'AIR') {
      const volFactor = settings.commercialParameters.air.volumetricFactor;
      const volWeight = (grossVolume * 1000000) / (volFactor || 6000);
      chargeable = Math.max(grossWeight, volWeight);
    } else {
      const wmRule = settings.commercialParameters.sea.wmRule;
      const wmWeight = grossWeight / (wmRule || 1000);
      chargeable = Math.max(grossVolume, wmWeight, settings.commercialParameters.sea.lclMinCbm || 1);
    }
    return { grossWeight, grossVolume, chargeable };
  }, [cargoLines, modality, settings]);

  const totals = useMemo(() => {
    const buy = lineItems.reduce((s, i) => s + (i.buyRate * i.quantity), 0);
    const sell = lineItems.reduce((s, i) => s + (i.sellRate * i.quantity), 0);
    const margin = sell > 0 ? ((sell - buy) / sell) * 100 : 0;
    return { buy, sell, margin };
  }, [lineItems]);

  const validateForm = () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      onNotify('error', 'Valid Dispatch Email is required.');
      return false;
    }
    if (!originPort || !destPort) {
      onNotify('error', 'Routing DNA (POL/POD) is incomplete.');
      return false;
    }
    if (totals.sell <= 0) {
      onNotify('error', 'Commercial value must be greater than zero.');
      return false;
    }
    return true;
  };

  const handleOpenReview = () => {
    if (!validateForm()) return;
    const quoteId = `Q-${Date.now().toString().slice(-6)}`;
    
    if (!isManualMode) {
      const token = tokenService.generate(quoteId, 'QUOTE', customerEmail);
      setGeneratedToken(token);
    }
    
    setShowReviewModal(true);
  };

  const handleFinalDispatch = async () => {
    setLoading(true);
    const quoteId = `Q-${Date.now().toString().slice(-6)}`;
    const needsApproval = totals.margin < settings.defaultMarginPercent;
    
    const newQuote: Quotation = {
      id: quoteId,
      portalToken: isManualMode ? undefined : generatedToken,
      isManual: isManualMode,
      modality,
      customerId: customerId || 'C-SPOT',
      customerName: customerName || 'Spot Market Entity',
      customerEmail,
      origin: originPort,
      destination: destPort,
      originAddress: originAddr,
      destinationAddress: destAddr,
      amount: Math.round(totals.sell),
      buyRate: Math.round(totals.buy),
      margin: Math.round(totals.sell - totals.buy),
      currency: settings.defaultCurrency,
      status: needsApproval ? 'PENDING_APPROVAL' : 'SENT',
      date: new Date().toISOString().split('T')[0],
      cargoLines,
      sourceEnquiryId: prefillData?.sourceEnquiryId,
      details: { ...metrics, equipment: `${incoterms} Terms | Service: ${serviceLevel}` }
    };

    await repo.saveQuote(newQuote, currentUser);
    onGenerateQuote(newQuote);
    draftService.clearDraft('quote_builder');
    setShowReviewModal(false);
    setLoading(false);
    onClearPrefill();
    onNotify('success', needsApproval ? `Quote ${quoteId} queued for Manager Approval.` : `Offer ${quoteId} authorized and dispatched.`);
  };

  const updateCargoLine = (id: string, field: keyof PackagingLine, value: any) => setCargoLines(cargoLines.map(l => l.id === id ? { ...l, [field]: value } : l));
  const removeCargoLine = (id: string) => cargoLines.length > 1 && setCargoLines(cargoLines.filter(l => l.id !== id));
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => setLineItems(lineItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  const removeLineItem = (id: string) => setLineItems(lineItems.filter(i => i.id !== id));

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4 px-10 mb-[-1.5rem]">
        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">1</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Intake</span></div>
        <div className="w-10 h-px bg-slate-200"></div>
        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic underline decoration-blue-500 underline-offset-4">Quoting</span></div>
        <div className="w-10 h-px bg-slate-200"></div>
        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">3</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Execution</span></div>
      </div>

      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-[16px] border-blue-600">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Calculator size={280} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg italic">Production Mode v6</span>
              <button onClick={() => setIsManualMode(!isManualMode)} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all italic">
                {isManualMode ? <ToggleRight className="text-emerald-400" /> : <ToggleLeft className="text-slate-500" />}
                {isManualMode ? 'MANUAL SENDING' : 'PORTAL SYSTEM'}
              </button>
            </div>
            <h3 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-4">Precision Engine</h3>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Industrial Quoting Terminal</p>
          </div>
          <div className="flex bg-slate-800 p-2 rounded-3xl z-10 shadow-2xl border border-slate-700 shrink-0">
            <button onClick={() => setModality('SEA')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'SEA' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-500 hover:text-white'}`}>
              <Ship size={20} /> <span>SEA FREIGHT</span>
            </button>
            <button onClick={() => setModality('AIR')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'AIR' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500 hover:text-white'}`}>
              <Plane size={20} /> <span>AIR FREIGHT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
              <MapPin size={20} className="mr-4 text-blue-600" /> [01] Routing DNA & Identification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">Corporate Customer Registry</label>
                  <select 
                    value={customerId}
                    onChange={e => {
                      const c = customers.find((x: any) => x.id === e.target.value);
                      if (c) {
                        setCustomerId(c.id); setCustomerName(c.companyName);
                        setCustomerEmail(c.contacts.find((x: any) => x.isPrimary)?.email || '');
                      }
                    }}
                    className="w-full p-5 border-2 border-slate-100 bg-slate-50 rounded-3xl outline-none focus:border-blue-500 font-black uppercase text-sm italic shadow-inner"
                  >
                    <option value="">Select Account</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">Dispatch Email Node</label>
                  <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50 rounded-3xl outline-none focus:border-blue-500 font-black text-sm shadow-inner" placeholder="decision-maker@corp.com" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">POL Code</label>
                    <input type="text" onPaste={(e) => handleSmartPaste(e, 'ORIGIN')} value={originPort} onChange={e => setOriginPort(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 font-black uppercase text-xs shadow-inner italic" placeholder="SHANGHAI" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">POD Code</label>
                    <input type="text" onPaste={(e) => handleSmartPaste(e, 'DEST')} value={destPort} onChange={e => setDestPort(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 font-black uppercase text-xs shadow-inner italic" placeholder="ROTTERDAM" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">Pickup Full Location Details</label>
                  <textarea value={originAddr} onChange={e => setOriginAddr(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-bold h-24 resize-none shadow-inner italic" placeholder="Complete Door-to-Port pickup coordinates..." />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
              <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic">
                <PackageSearch size={20} className="mr-4 text-indigo-600" /> [02] Operational Cargo Profile
              </h4>
              <button onClick={() => setCargoLines([...cargoLines, { id: Date.now().toString(), type: 'PALLET', quantity: 1, length: 120, width: 80, height: 100, weightPerUnit: 0, description: '' }])} className="flex items-center gap-2 bg-slate-100 text-slate-600 text-[10px] font-black px-5 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest italic shadow-inner">
                <Plus size={14}/> Add Node
              </button>
            </div>
            <div className="space-y-4">
              {cargoLines.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner group transition-all hover:bg-white hover:shadow-xl hover:border-indigo-100">
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Qty</label>
                    <input type="number" value={line.quantity} onChange={e => updateCargoLine(line.id, 'quantity', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-indigo-500" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Pkg Type</label>
                    <select value={line.type} onChange={e => updateCargoLine(line.id, 'type', e.target.value as any)} className="w-full p-3 border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase italic outline-none focus:border-indigo-500">
                      <option value="PALLET">Standard Pallet</option>
                      <option value="BOX">Corrugated Box</option>
                      <option value="CONTAINER">Vessel Container</option>
                      <option value="CRATE">Industrial Crate</option>
                      <option value="LOOSE">Loose Carton</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">LxWxH (cm)</label>
                    <div className="grid grid-cols-3 gap-1">
                        <input type="number" value={line.length} onChange={e => updateCargoLine(line.id, 'length', Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg text-xs text-center font-bold" />
                        <input type="number" value={line.width} onChange={e => updateCargoLine(line.id, 'width', Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg text-xs text-center font-bold" />
                        <input type="number" value={line.height} onChange={e => updateCargoLine(line.id, 'height', Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg text-xs text-center font-bold" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Unit Wt (kg)</label>
                    <input type="number" value={line.weightPerUnit} onChange={e => updateCargoLine(line.id, 'weightPerUnit', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none" />
                  </div>
                  <div className="col-span-1 flex justify-end pb-1">
                    <button onClick={() => removeCargoLine(line.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                  <div className="col-span-12">
                    <input placeholder="Short operational summary of contents..." value={line.description} onChange={e => updateCargoLine(line.id, 'description', e.target.value)} className="w-full bg-white p-3 border border-slate-100 rounded-xl text-[11px] font-bold italic shadow-inner" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-10 border-t border-slate-50">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">Global Incoterms</label>
                <select value={incoterms} onChange={e => setIncoterms(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-black uppercase italic shadow-inner">
                  {['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest italic">Service Priority</label>
                <select value={serviceLevel} onChange={e => setServiceLevel(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-500 text-xs font-black uppercase italic shadow-inner">
                  {['Standard', 'Express', 'Deferred', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
              <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic">
                <Settings2 size={20} className="mr-4 text-emerald-600" /> [03] Financial Ledger Stack
              </h4>
              <button onClick={() => setLineItems([...lineItems, { id: Date.now().toString(), description: '', buyRate: 0, sellRate: 0, quantity: 1 }])} className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 italic">
                <Plus size={14} /> Add Commercial Node
              </button>
            </div>
            <div className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner group transition-all hover:bg-white hover:shadow-xl hover:border-emerald-100">
                  <div className="col-span-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Charge Node</label>
                    <input value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="e.g. Ocean Freight Net" className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-emerald-500 italic shadow-inner" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Buy Cost</label>
                    <input type="number" value={item.buyRate} onChange={e => updateLineItem(item.id, 'buyRate', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-emerald-500 shadow-inner" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Sell Value</label>
                    <input type="number" value={item.sellRate} onChange={e => updateLineItem(item.id, 'sellRate', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black text-blue-600 outline-none focus:border-emerald-500 shadow-inner" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block italic">Units</label>
                    <input type="number" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none italic shadow-inner" />
                  </div>
                  <div className="col-span-2 flex justify-end pb-1">
                    <button onClick={() => removeLineItem(item.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl sticky top-8 border-t-[12px] border-blue-600 overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-5 transform rotate-45"><Calculator size={240} /></div>
            <h4 className="text-3xl font-black tracking-tighter uppercase italic mb-12">RESULT STACK</h4>
            <div className="space-y-10 relative z-10">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                <p className={`text-[11px] font-black uppercase tracking-widest mb-6 italic ${modality === 'AIR' ? 'text-indigo-400' : 'text-blue-400'}`}>Operational Analysis</p>
                <div className="space-y-4 font-sans">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic">Phys. Weight</span>
                    <span className="text-xl font-black italic">{metrics.grossWeight.toLocaleString()} KG</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase italic">Phys. Volume</span>
                    <span className="text-xl font-black italic">{metrics.grossVolume.toFixed(3)} CBM</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-slate-100 font-black uppercase italic underline decoration-blue-500 underline-offset-4">Chargeable Units</span>
                    <span className="text-3xl font-black italic text-blue-400 animate-pulse">{Math.round(metrics.chargeable).toLocaleString()} {modality === 'AIR' ? 'KG' : 'CBM'}</span>
                  </div>
                </div>
              </div>

              <div className="text-center font-sans">
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4 italic">Corporate Offer</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-bold text-blue-500 italic">{settings.defaultCurrency}</span>
                  <span className="text-6xl font-black tracking-tighter italic">{Math.round(totals.sell).toLocaleString()}</span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border text-center transition-all ${totals.margin < settings.defaultMarginPercent ? 'bg-red-900/40 border-red-800' : 'bg-emerald-900/40 border-emerald-800'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Authorized Yield</p>
                <p className="text-3xl font-black italic">{totals.margin.toFixed(1)}%</p>
              </div>

              <button 
                onClick={handleOpenReview} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-lg transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-6 italic disabled:opacity-50"
              >
                {loading ? 'Compiling Registry...' : <><Send size={24} /> AUTHORIZE RELEASE</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/98 backdrop-blur-3xl p-4 animate-fade-in font-sans">
            <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl overflow-hidden max-h-[96vh] flex flex-col border-t-[20px] border-blue-600">
                <div className="bg-slate-50 px-14 py-12 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">High Fidelity Authorization Review</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 italic">Verify commercial signal before global dispatch</p>
                    </div>
                    <button onClick={() => setShowReviewModal(false)} className="p-4 bg-white rounded-2xl border-2 border-slate-100 text-slate-300 hover:text-slate-900 transition-all active:scale-90 shadow-sm"><X size={28}/></button>
                </div>
                
                <div className="p-14 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-14 custom-scrollbar">
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center italic">
                            <Mail size={16} className="mr-3 text-blue-500"/> Outreach Node Template
                        </h4>
                        <div className="bg-slate-900 p-10 rounded-[3rem] text-blue-100 italic text-[13px] font-mono leading-relaxed border border-white/5 shadow-inner h-[480px] overflow-y-auto custom-scrollbar">
                            <p className="text-blue-400 mb-8 border-b border-white/5 pb-4 font-bold uppercase">RE: Commercial Logistics Offer | ${originPort} -> ${destPort}</p>
                            <p>To: ${customerEmail}</p><br/>
                            <p>Dear ${customerName || 'Strategic Partner'},</p><br/>
                            <p>Authorization has been granted for the following logistics proposal node.</p><br/>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
                                <p>OFFER REFERENCE: <span className="text-white font-bold tracking-widest">${isManualMode ? 'INTERNAL_LOG' : generatedToken.slice(0, 8).toUpperCase()}</span></p>
                                <p>TOTAL ALL-IN: <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">${settings.defaultCurrency} ${Math.round(totals.sell).toLocaleString()}</span></p>
                                <p>INCOTERMS: ${incoterms}</p>
                            </div>
                            <br/>
                            {!isManualMode ? (
                                <>
                                    <p>Acceptance Node Access Key:</p>
                                    <p className="text-blue-400 underline mt-4 break-all">https://uccs-portal.web.app/accept/${generatedToken}</p><br/>
                                </>
                            ) : (
                                <p className="text-amber-400 font-bold bg-amber-400/5 p-4 rounded-xl border border-amber-400/20 italic">Note: Dispatch handled via Manual Protocol. Portal Token withheld.</p>
                            )}
                            <p>OPERATIONS NODE:</p>
                            <p>${currentUser.name} | ${currentUser.role}</p>
                            <p className="text-slate-500 mt-10 text-[10px] uppercase font-bold tracking-widest italic">Production authorized message signal.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center italic">
                            <FileText size={16} className="mr-3 text-indigo-500"/> System Authorisation Registry
                        </h4>
                        <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 space-y-8 shadow-inner italic">
                            <div className="space-y-5">
                                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase italic">Entity Node</span><span className="text-sm font-black italic text-slate-900">{customerName}</span></div>
                                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase italic">Route Corridor</span><span className="text-sm font-black italic text-slate-900">{originPort} / {destPort}</span></div>
                                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase italic">Logic Source</span><span className="text-sm font-black italic text-slate-900">{prefillData?.sourceEnquiryId || 'Master Builder'}</span></div>
                                <div className="flex justify-between items-center pt-4"><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Signal Value</span><span className="text-4xl font-black italic text-slate-900">{settings.defaultCurrency} {Math.round(totals.sell).toLocaleString()}</span></div>
                            </div>
                            
                            <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 space-y-4 shadow-sm">
                                <div className="flex items-center gap-3 text-emerald-600 mb-2 font-black uppercase text-[10px] tracking-widest">
                                    <ShieldCheck size={20}/> CRYPTO-SIGNAL VALID
                                </div>
                                <div className="text-[11px] font-bold text-slate-500 italic leading-relaxed">Cryptographic node mapping verified. Volumetric math cached. Dispatching to corporate gateway upon final sign-off.</div>
                            </div>
                        </div>
                        
                        <div className="pt-6 space-y-4">
                            <button onClick={handleFinalDispatch} className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all italic flex items-center justify-center gap-5">
                                <Send size={22}/> EXECUTE DISPATCH SIGNAL
                            </button>
                            <button onClick={() => setShowReviewModal(false)} className="w-full py-5 bg-white border-3 border-slate-100 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all italic">ABORT & RETURN</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuoteSimulator;