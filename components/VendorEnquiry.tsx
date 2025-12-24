import React, { useState, useEffect, useMemo } from 'react';
import { Send, Globe, Anchor, Plus, Check, CheckCircle, ExternalLink, X, Mail, Eye, ArrowRight, Trophy, BarChart3, ChevronDown, Calendar, Package, Copy, Link as LinkIcon, Inbox, Edit3, MessageSquareText, Users, Zap, Plane, Ship, AlertTriangle, TrendingUp, BellRing, Loader2, Calculator, Save, FlaskConical, Trash2, MapPin, PackagePlus, ChevronRight } from 'lucide-react';
import { Vendor, VendorEnquiry, VendorBid, EnquiryStatus, Currency, SharedProps, QuoteRequest, Modality, PackagingType, PackagingLine } from '../types';
import { repo } from '../services/repository';

interface VendorEnquiryProps extends SharedProps {
  vendors: Vendor[];
  enquiries: VendorEnquiry[];
  onAddEnquiry: (enquiry: VendorEnquiry) => void;
  onUpdateEnquiry: (enquiry: VendorEnquiry) => void;
  onAwardEnquiry: (enquiryId: string, bid: VendorBid, sellPrice: number) => void;
  onLoadToSimulator: (data: QuoteRequest) => void;
}

const WorkflowBreadcrumb: React.FC<{ activeStep: number }> = ({ activeStep }) => (
  <div className="flex items-center gap-4 px-10 mb-8 animate-fade-in">
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${activeStep === 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>1</span>
      <span className={`text-[10px] font-black uppercase tracking-widest italic ${activeStep === 1 ? 'text-blue-600 underline decoration-blue-500 underline-offset-4' : 'text-slate-400'}`}>Market Intake</span>
    </div>
    <ChevronRight size={14} className="text-slate-300" />
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${activeStep === 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>2</span>
      <span className={`text-[10px] font-black uppercase tracking-widest italic ${activeStep === 2 ? 'text-blue-600 underline decoration-blue-500 underline-offset-4' : 'text-slate-400'}`}>Quote Generation</span>
    </div>
    <ChevronRight size={14} className="text-slate-300" />
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${activeStep === 3 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>3</span>
      <span className={`text-[10px] font-black uppercase tracking-widest italic ${activeStep === 3 ? 'text-blue-600 underline decoration-blue-500 underline-offset-4' : 'text-slate-400'}`}>Job Execution</span>
    </div>
  </div>
);

const getStatusBadge = (status: EnquiryStatus) => {
  const styles: Record<EnquiryStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    SENT: 'bg-blue-100 text-blue-600 border-blue-200',
    VIEWED: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    BID_RECEIVED: 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100 animate-pulse',
    AWARDED: 'bg-purple-100 text-purple-600 border-purple-200',
    CLOSED: 'bg-slate-200 text-slate-500 border-slate-300',
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>{status.replace(/_/g, ' ')}</span>;
};

const VendorEnquiryComponent: React.FC<VendorEnquiryProps> = ({ 
  vendors, enquiries, onAddEnquiry, onUpdateEnquiry, onAwardEnquiry, onLoadToSimulator, settings, onNotify, currentUser, onLogActivity 
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'DASHBOARD'>('DASHBOARD');
  const [expandedEnquiryId, setExpandedEnquiryId] = useState<string | null>(enquiries[0]?.id || null);
  const [modality, setModality] = useState<Modality>('SEA');

  const intelligence = useMemo(() => ({
    activeEnquiries: enquiries.filter(e => e.status !== 'CLOSED' && e.status !== 'AWARDED').length
  }), [enquiries]);

  const toggleExpand = (id: string) => {
    setExpandedEnquiryId(expandedEnquiryId === id ? null : id);
  };

  // Enhanced Routing DNA
  const [originPort, setOriginPort] = useState('');
  const [destPort, setDestPort] = useState('');
  const [pickupZip, setPickupZip] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');
  
  const [readyDate, setReadyDate] = useState('');
  const [incoterms, setIncoterms] = useState('FOB');
  const [targetRate, setTargetRate] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>(settings.defaultCurrency);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [runSimulation, setRunSimulation] = useState(true);

  // Advanced Commodity & Handling
  const [cargoLines, setCargoLines] = useState<PackagingLine[]>([
    { id: '1', type: 'PALLET', quantity: 1, length: 120, width: 80, height: 100, weightPerUnit: 450, description: 'General Cargo' }
  ]);

  const addCargoLine = () => {
    setCargoLines([...cargoLines, { id: Date.now().toString(), type: 'PALLET', quantity: 1, length: 120, width: 80, height: 100, weightPerUnit: 0, description: '' }]);
  };

  const removeCargoLine = (id: string) => {
    if (cargoLines.length > 1) setCargoLines(cargoLines.filter(l => l.id !== id));
  };

  const updateCargoLine = (id: string, field: keyof PackagingLine, value: any) => {
    setCargoLines(cargoLines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const totalSpecs = useMemo(() => {
    const qty = cargoLines.reduce((s, l) => s + l.quantity, 0);
    const weight = cargoLines.reduce((s, l) => s + (l.weightPerUnit * l.quantity), 0);
    const volume = cargoLines.reduce((s, l) => s + ((l.length * l.width * l.height) / 1000000 * l.quantity), 0);
    return { qty, weight, volume };
  }, [cargoLines]);

  const formattedBroadcast = useMemo(() => {
    const cargoTable = cargoLines.map(l => `• ${l.quantity}x ${l.type} (${l.length}x${l.width}x${l.height}cm) | ${l.weightPerUnit}kg ea | ${l.description}`).join('\n');
    const typeLabel = modality === 'AIR' ? 'AirFreight' : 'SeaFreight';
    return `Subject: SPOT ENQUIRY: ${originPort} to ${destPort} | UCCS REF: SPOT-${Date.now().toString().slice(-4)}

Dear Vendor Partner,

We are requesting a commercial spot market rate for the following ${typeLabel} requirement.

[ ROUTING DATA ]
--------------------------------------------------
POL: ${originPort || 'TBD'}
POD: ${destPort || 'TBD'}
PICKUP ZIP: ${pickupZip || 'TBD'}
DELIVERY ZIP: ${deliveryZip || 'TBD'}
INCOTERMS: ${incoterms}
READY DATE: ${readyDate || 'ASAP'}

[ CARGO SPECIFICATIONS ]
--------------------------------------------------
${cargoTable}

TOTAL WEIGHT: ${totalSpecs.weight.toFixed(2)} KG
TOTAL VOLUME: ${totalSpecs.volume.toFixed(2)} CBM

BIDDING PORTAL LINK (SECURE):
https://uniqueccs-portal.web.app/bid/{{PORTAL_TOKEN}}

Best Regards,
Unique CCS Procurement Team
Global Logistics Node`;
  }, [originPort, destPort, pickupZip, deliveryZip, incoterms, readyDate, cargoLines, totalSpecs, modality]);

  const handleCreateEnquiry = (toOutlook: boolean = false) => {
     if (!originPort || !destPort || selectedVendorIds.length === 0) {
         onNotify('warning', 'Routing and at least one Vendor are required.');
         return;
     }
     const portalToken = Math.random().toString(36).substr(2, 12);
     const newRef = `SPOT-${modality.charAt(0)}-${originPort.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`;
     const newEnquiry: VendorEnquiry = {
         id: `E${String(enquiries.length + 1).padStart(3, '0')}`,
         portalToken,
         modality,
         reference: newRef,
         origin: originPort,
         destination: destPort,
         pickupZip,
         deliveryZip,
         incoterms,
         readyDate,
         commodity: cargoLines.map(l => l.description).join(', '),
         cargoLines,
         currency,
         targetRate: targetRate > 0 ? targetRate : undefined,
         status: 'SENT',
         sentDate: new Date().toISOString().split('T')[0],
         vendorsSentTo: selectedVendorIds,
         bids: []
     };
     onAddEnquiry(newEnquiry);
     setActiveTab('DASHBOARD');
     if (runSimulation) {
        onNotify('info', 'Simulation: Ghost Bidder engaged. Expecting rate in 5s.');
        setTimeout(async () => {
           const bidVendor = vendors.find(v => selectedVendorIds.includes(v.id)) || vendors[0];
           const ghostBid: VendorBid = {
              vendorId: bidVendor.id,
              vendorName: bidVendor.name,
              amount: targetRate ? Math.round(targetRate * 0.95) : 1200,
              currency: currency,
              transitTime: modality === 'SEA' ? 28 : 2,
              validityDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
              receivedAt: new Date().toISOString(),
           };
           const latestEnquiry = (await repo.getEnquiries()).find(e => e.portalToken === portalToken);
           if (latestEnquiry) {
              latestEnquiry.bids.push(ghostBid);
              latestEnquiry.status = 'BID_RECEIVED';
              await repo.saveItem('enquiries', latestEnquiry, currentUser);
              onNotify('success', `Live Update: Bid received from ${bidVendor.name}!`);
              onUpdateEnquiry(latestEnquiry);
           }
        }, 5000);
     }
     onNotify('success', "Enquiry recorded and broadcast gateway initialized.");
  };

  const simulateToQuoteEngine = (enquiry: VendorEnquiry, bid: VendorBid) => {
    onLoadToSimulator({
        modality: enquiry.modality,
        origin: enquiry.origin,
        destination: enquiry.destination,
        originAddress: enquiry.pickupZip ? `Pick up Zip: ${enquiry.pickupZip}` : '',
        destinationAddress: enquiry.deliveryZip ? `Delivery Zip: ${enquiry.deliveryZip}` : '',
        cargoType: enquiry.commodity,
        cargoLines: enquiry.cargoLines,
        weight: totalSpecs.weight,
        volume: totalSpecs.volume,
        etd: enquiry.readyDate,
        transitTime: bid.transitTime,
        buyRate: bid.amount,
        margin: Math.round(bid.amount * 0.15),
        currency: bid.currency,
        customerEmail: '',
        lineItems: [{ description: 'Base Freight', amount: bid.amount, quantity: 1 }],
        sourceRef: enquiry.reference,
        sourceVendor: bid.vendorName,
        sourceVendorId: bid.vendorId,
        sourceEnquiryId: enquiry.id
    });
    onNotify('success', 'Bid exported to Quote Engine.');
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
        <WorkflowBreadcrumb activeStep={1} />

        <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden border-b-[16px] border-blue-600">
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Globe size={280} /></div>
            <div className="z-10">
                <div className="flex items-center gap-3 mb-5">
                    <span className="bg-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg italic">Market intake v5</span>
                    <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full cursor-pointer hover:bg-slate-700 transition-colors">
                        <FlaskConical size={14} className={runSimulation ? 'text-blue-400' : 'text-slate-500'} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">{runSimulation ? 'Sim Mode: Active' : 'Sim Mode: Off'}</span>
                        <input type="checkbox" checked={runSimulation} onChange={e => setRunSimulation(e.target.checked)} className="hidden" />
                    </label>
                </div>
                <h3 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">PROCUREMENT HUB</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.3em] max-w-lg leading-relaxed italic">Broadcast unique portal links and receive structured vendor bids instantly.</p>
            </div>
            <div className="flex bg-slate-800 p-2 rounded-3xl z-10 shadow-2xl border border-slate-700">
                <button onClick={() => setModality('SEA')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'SEA' ? 'bg-blue-600 text-white shadow-xl italic' : 'text-slate-500 hover:text-white'}`}>
                    <Ship size={20} /> <span>SEA FREIGHT</span>
                </button>
                <button onClick={() => setModality('AIR')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'AIR' ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-slate-500 hover:text-white'}`}>
                    <Plane size={20} /> <span>AIR FREIGHT</span>
                </button>
            </div>
        </div>

        <div className="flex space-x-4">
            <button onClick={() => setActiveTab('NEW')} className={`px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-xl scale-105 italic' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}>Create Market Enq.</button>
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-900 text-white shadow-xl scale-105 italic' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}>Live Campaigns ({intelligence.activeEnquiries})</button>
        </div>

        {activeTab === 'NEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
                <div className="lg:col-span-8 space-y-8">
                    {/* Granular Routing DNA */}
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-10 border-b border-slate-50 pb-6 flex items-center italic">
                            <MapPin size={20} className="mr-4 text-blue-600" /> [01] Granular Routing DNA
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest italic">Port of Loading (POL)</label>
                                    <input type="text" value={originPort} onChange={e => setOriginPort(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="SHANGHAI" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest italic">Pickup ZIP / Location</label>
                                    <input type="text" value={pickupZip} onChange={e => setPickupZip(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="200001" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest italic">Port of Discharge (POD)</label>
                                    <input type="text" value={destPort} onChange={e => setDestPort(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="HAMBURG" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest italic">Delivery ZIP / Location</label>
                                    <input type="text" value={deliveryZip} onChange={e => setDeliveryZip(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-black uppercase italic shadow-inner" placeholder="22113" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Commodity Builder */}
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic">
                                <PackagePlus size={20} className="mr-4 text-blue-600" /> [02] Commodity Builder
                            </h4>
                            <button onClick={addCargoLine} className="flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest italic shadow-xl shadow-slate-200">
                                <Plus size={14}/> Add Package Line
                            </button>
                        </div>
                        <div className="space-y-4">
                            {cargoLines.map((line) => (
                                <div key={line.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner animate-fade-in group hover:bg-white hover:border-blue-200 transition-all">
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Qty</label>
                                        <input type="number" value={line.quantity} onChange={e => updateCargoLine(line.id, 'quantity', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Type</label>
                                        <select value={line.type} onChange={e => updateCargoLine(line.id, 'type', e.target.value as any)} className="w-full p-3 border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500 italic">
                                            <option value="PALLET">Pallet</option>
                                            <option value="BOX">Box</option>
                                            <option value="CRATE">Crate</option>
                                            <option value="LOOSE">Loose</option>
                                            <option value="CONTAINER">Container</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">LxWxH (cm)</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            <input type="number" value={line.length} onChange={e => updateCargoLine(line.id, 'length', Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg text-xs text-center font-bold" placeholder="L" />
                                            <input type="number" value={line.width} onChange={e => updateCargoLine(line.id, 'width', Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg text-xs text-center font-bold" placeholder="W" />
                                            <input type="number" value={line.height} onChange={e => updateCargoLine(line.id, 'height', Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg text-xs text-center font-bold" placeholder="H" />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Unit Wt (kg)</label>
                                        <input type="number" value={line.weightPerUnit} onChange={e => updateCargoLine(line.id, 'weightPerUnit', Number(e.target.value))} className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-black outline-none" />
                                    </div>
                                    <div className="col-span-1 flex justify-end pb-1">
                                        <button onClick={() => removeCargoLine(line.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="col-span-12">
                                        <input placeholder="Short description..." value={line.description} onChange={e => updateCargoLine(line.id, 'description', e.target.value)} className="w-full bg-white p-3 border border-slate-100 rounded-xl text-[11px] font-bold italic" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recipient Selection */}
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                         <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                            <Users size={20} className="mr-4 text-blue-600" /> [03] Carrier Broadcast Grid
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
                            {vendors.map(v => (
                                <div key={v.id} onClick={() => setSelectedVendorIds(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col justify-between h-40 ${selectedVendorIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-105 italic' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`font-black text-[12px] uppercase leading-tight italic ${selectedVendorIds.includes(v.id) ? 'text-white' : 'text-slate-900'}`}>{v.name}</span>
                                        {selectedVendorIds.includes(v.id) && <CheckCircle size={14} />}
                                    </div>
                                    <div className="mt-auto">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${selectedVendorIds.includes(v.id) ? 'bg-indigo-500 text-white border border-indigo-400' : 'bg-slate-100 text-slate-500'}`}>{v.tier}</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>

                    {originPort && destPort && selectedVendorIds.length > 0 && (
                        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-blue-600 animate-fade-in">
                            <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center italic">
                                <Mail className="mr-4 text-blue-600" size={24} /> Automated Outreach Stack
                            </h4>
                            <div className="w-full h-96 p-12 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-y-auto text-[13px] font-mono leading-relaxed text-blue-200 shadow-inner whitespace-pre-wrap italic">
                                {formattedBroadcast}
                            </div>
                            <div className="mt-12 flex justify-end gap-6">
                                <button onClick={() => handleCreateEnquiry(false)} className="px-12 py-5 border-2 border-slate-200 text-slate-500 font-black uppercase text-[12px] tracking-widest rounded-3xl hover:bg-slate-50 transition-all italic">Internal Log Only</button>
                                <button onClick={() => handleCreateEnquiry(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[12px] tracking-widest px-16 py-6 rounded-3xl shadow-2xl shadow-blue-500/40 transition-all active:scale-95 flex items-center gap-4 italic group">
                                    <Send size={22} className="group-hover:translate-x-1 transition-transform" /> Dispatch Broadcast Signal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl sticky top-8 border-t-8 border-blue-500 overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 opacity-5 transform rotate-45"><Zap size={240} /></div>
                        <h4 className="text-3xl font-black tracking-tighter uppercase italic mb-10">MARKET METRICS</h4>
                        <div className="space-y-10 relative z-10">
                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                                <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-6 italic">Campaign Analysis</p>
                                <div className="space-y-4 font-sans">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2"><p className="text-[10px] text-slate-400 uppercase font-black italic">Total Packages</p><p className="text-xl font-black italic">{totalSpecs.qty}</p></div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2"><p className="text-[10px] text-slate-400 uppercase font-black italic">Gross Weight</p><p className="text-xl font-black italic">{totalSpecs.weight.toLocaleString()} KG</p></div>
                                    <div className="flex items-center justify-between pb-2"><p className="text-[10px] text-slate-400 uppercase font-black italic">Gross Volume</p><p className="text-xl font-black italic">{totalSpecs.volume.toFixed(3)} CBM</p></div>
                                </div>
                            </div>
                            <div className="p-8 bg-blue-600/20 rounded-[2.5rem] border border-blue-500/30">
                                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 italic">Commercial Projection</p>
                                <div className="text-4xl font-black italic">{currency} {targetRate.toLocaleString()}</div>
                                <p className="text-[9px] text-blue-400 mt-2 font-bold uppercase tracking-widest italic">Base Target Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'DASHBOARD' && (
             <div className="bg-white rounded-[4rem] shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col animate-fade-in">
                {enquiries.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-32 text-center opacity-40">
                        <Inbox size={80} className="text-slate-200 mb-8" />
                        <p className="text-2xl font-black tracking-tighter text-slate-300 uppercase italic">No Campaigns Active</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 flex-1 font-sans">
                        {enquiries.map(enquiry => (
                            <div key={enquiry.id} className="p-12 hover:bg-blue-50/20 transition-all cursor-pointer group" onClick={() => toggleExpand(enquiry.id)}>
                                <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-6 mb-6">
                                            <div className={`p-4 rounded-[1.75rem] text-white ${enquiry.modality === 'SEA' ? 'bg-blue-600' : 'bg-indigo-600'} shadow-lg`}>
                                                {enquiry.modality === 'SEA' ? <Ship size={24} /> : <Plane size={24} />}
                                            </div>
                                            {getStatusBadge(enquiry.status)}
                                            <span className="text-[13px] font-black text-slate-300 uppercase tracking-[0.3em] italic">{enquiry.reference}</span>
                                        </div>
                                        <div className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center italic mb-4">
                                            {enquiry.origin} <ArrowRight className="mx-8 text-blue-200" size={40} /> {enquiry.destination}
                                        </div>
                                        <p className="text-[12px] font-black text-slate-500 uppercase flex items-center gap-3 italic"><Package size={16} className="text-blue-500"/> {enquiry.commodity}</p>
                                    </div>
                                    <div className="flex items-center gap-10 bg-slate-50/80 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Recruited Bids</p>
                                            <p className="text-5xl font-black text-blue-600 tracking-tighter italic">{enquiry.bids.length}</p>
                                        </div>
                                        <div className={`p-3.5 rounded-2xl transition-all ${expandedEnquiryId === enquiry.id ? 'bg-blue-600 text-white rotate-180 shadow-lg' : 'bg-white border border-slate-200 text-slate-300'}`}>
                                            <ChevronDown size={24} />
                                        </div>
                                    </div>
                                </div>
                                {expandedEnquiryId === enquiry.id && (
                                    <div className="mt-16 pt-16 border-t border-slate-100 animate-fade-in">
                                        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em]">
                                                    <tr>
                                                        <th className="p-8 italic">Partner Node</th>
                                                        <th className="p-8 italic">Commercial Rate</th>
                                                        <th className="p-8 italic">Lead Time</th>
                                                        <th className="p-8 text-right italic">Authorisation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {enquiry.bids.length === 0 ? (
                                                        <tr><td colSpan={4} className="p-24 text-center text-slate-400 italic uppercase tracking-widest">Recruiting structured market rates...</td></tr>
                                                    ) : enquiry.bids.map((bid, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/50 transition-all group/bid">
                                                            <td className="p-8">
                                                                <div className="font-black text-slate-900 uppercase text-sm italic">{bid.vendorName}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase italic tracking-widest">Verified Digital Bidder</div>
                                                            </td>
                                                            <td className="p-8">
                                                                <div className="text-3xl font-black text-slate-900 tracking-tighter italic">{bid.currency} {bid.amount.toLocaleString()}</div>
                                                            </td>
                                                            <td className="p-8 text-sm font-black text-slate-800 uppercase italic">{bid.transitTime} {enquiry.modality === 'AIR' ? 'HRS' : 'DAYS'}</td>
                                                            <td className="p-8 text-right">
                                                                <div className="flex justify-end gap-4">
                                                                    <button onClick={(e) => { e.stopPropagation(); simulateToQuoteEngine(enquiry, bid); }} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-blue-600 hover:text-blue-600 transition-all italic shadow-sm">SIMULATE (CONVERT TO QUOTE)</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); onAwardEnquiry(enquiry.id, bid, Math.round(bid.amount * 1.15)); }} className="px-10 py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all italic">AWARD CONTRACT</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
             </div>
        )}
    </div>
  );
};

export default VendorEnquiryComponent;