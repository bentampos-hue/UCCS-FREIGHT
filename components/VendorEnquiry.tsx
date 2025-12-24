
import React, { useState, useEffect, useMemo } from 'react';
import { Send, Globe, Anchor, Plus, Check, CheckCircle, ExternalLink, X, Mail, Eye, ArrowRight, Trophy, BarChart3, ChevronDown, Calendar, Package, Copy, Link as LinkIcon, Inbox, Edit3, MessageSquareText, Users, Zap, Plane, Ship, AlertTriangle, TrendingUp, BellRing, Loader2, Calculator, Save } from 'lucide-react';
import { Vendor, VendorEnquiry, VendorBid, EnquiryStatus, Currency, SharedProps, QuoteRequest, Modality, PackagingType, PackagingDetail } from '../types';

interface VendorEnquiryProps extends SharedProps {
  vendors: Vendor[];
  enquiries: VendorEnquiry[];
  onAddEnquiry: (enquiry: VendorEnquiry) => void;
  onUpdateEnquiry: (enquiry: VendorEnquiry) => void;
  onAwardEnquiry: (enquiryId: string, bid: VendorBid, sellPrice: number) => void;
  onLoadToSimulator: (data: QuoteRequest) => void;
}

// Helper function to render status badges
// Fixed: Added missing getStatusBadge function to resolve "Cannot find name" error.
const getStatusBadge = (status: EnquiryStatus) => {
  const styles: Record<EnquiryStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    SENT: 'bg-blue-100 text-blue-600 border-blue-200',
    VIEWED: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    BID_RECEIVED: 'bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100 animate-pulse',
    AWARDED: 'bg-purple-100 text-purple-600 border-purple-200',
    CLOSED: 'bg-slate-200 text-slate-500 border-slate-300',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const VendorEnquiryComponent: React.FC<VendorEnquiryProps> = ({ 
  vendors, 
  enquiries, 
  onAddEnquiry, 
  onUpdateEnquiry, 
  onAwardEnquiry, 
  onLoadToSimulator,
  settings, 
  onNotify, 
  onLogActivity 
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'DASHBOARD'>('DASHBOARD');
  const [expandedEnquiryId, setExpandedEnquiryId] = useState<string | null>(enquiries[0]?.id || null);
  const [modality, setModality] = useState<Modality>('SEA');

  // Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [readyDate, setReadyDate] = useState('');
  const [incoterms, setIncoterms] = useState('FOB');
  const [commodity, setCommodity] = useState('');
  const [isHazmat, setIsHazmat] = useState(false);
  const [isStackable, setIsStackable] = useState(true);
  const [equipmentType, setEquipmentType] = useState('40HC');
  const [equipmentCount, setEquipmentCount] = useState(1);
  const [weight, setWeight] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [targetRate, setTargetRate] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>(settings.defaultCurrency);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  
  const [isEditingOutreach, setIsEditingOutreach] = useState(false);
  const [customOutreachBody, setCustomOutreachBody] = useState('');
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEnquiryId(expandedEnquiryId === id ? null : id);
  };

  const intelligence = useMemo(() => {
    const totalEnquiries = enquiries.length;
    const activeEnquiries = enquiries.filter(e => e.status !== 'CLOSED' && e.status !== 'AWARDED').length;
    const totalBids = enquiries.reduce((sum, e) => sum + e.bids.length, 0);
    const avgResponse = totalEnquiries > 0 ? (totalBids / totalEnquiries).toFixed(1) : '0';
    return { totalEnquiries, activeEnquiries, avgResponse };
  }, [enquiries]);

  useEffect(() => {
    if (activeTab === 'NEW' && origin && destination) {
        const typeLabel = modality === 'AIR' ? 'AirFreight' : 'SeaFreight';
        const template = `Subject: SPOT ENQUIRY: ${origin} to ${destination} | UCCS REF: SPOT-${Date.now().toString().slice(-4)}

Dear Vendor Partner,

We are requesting a commercial spot market rate for the following ${typeLabel} requirement:

ROUTE: ${origin} to ${destination}
MODALITY: ${modality}
CARGO: ${equipmentCount}x ${equipmentType} | ${commodity || 'General Cargo'}
SPECS: ${weight} KG Total Weight | ${volume} CBM Total Volume
${modality === 'SEA' ? `DANGEROUS GOODS: ${isHazmat ? 'YES' : 'NO'}\nSTACKABLE: ${isStackable ? 'YES' : 'NO'}` : ''}
READY DATE: ${readyDate || 'TBD'}
INCOTERMS: ${incoterms}

TARGET BUY RATE: ${currency} ${targetRate > 0 ? targetRate : 'Best Market Level'}

Please submit your best all-in rate (including transit, validity, and free time) via our digital bidding portal:
https://portal.uniqueccs.com/vendor/bid/${Date.now()}

Best Regards,
Unique CCS Procurement Team
${settings.emailSignature}`;
        setCustomOutreachBody(template);
    }
  }, [origin, destination, readyDate, incoterms, commodity, isHazmat, isStackable, equipmentType, equipmentCount, weight, volume, targetRate, currency, modality, activeTab]);

  const handleCreateEnquiry = (toOutlook: boolean = false) => {
     if (!origin || !destination || selectedVendorIds.length === 0) return;
     const newEnquiry: VendorEnquiry = {
         id: `E${String(enquiries.length + 1).padStart(3, '0')}`,
         modality,
         reference: `SPOT-${modality.charAt(0)}-${origin.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`,
         origin,
         destination,
         incoterms,
         readyDate,
         commodity: commodity || 'General Cargo',
         isHazmat,
         isStackable,
         equipmentType,
         equipmentCount,
         weight,
         volume,
         currency,
         targetRate: targetRate > 0 ? targetRate : undefined,
         status: 'SENT',
         sentDate: new Date().toISOString().split('T')[0],
         vendorsSentTo: selectedVendorIds,
         bids: []
     };
     onAddEnquiry(newEnquiry);
     setActiveTab('DASHBOARD');

     if (toOutlook) {
         const subject = `Spot Enquiry: ${newEnquiry.reference} | ${origin} to ${destination}`;
         // In a real multi-vendor scenario, we'd loop. Here we BCC or send individual.
         const vendorEmails = vendors.filter(v => selectedVendorIds.includes(v.id)).map(v => v.contacts[0]?.email).filter(Boolean).join(';');
         const mailto = `mailto:${vendorEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(customOutreachBody)}`;
         window.location.href = mailto;
     }

     onNotify('success', `Spot Campaign ${newEnquiry.reference} recorded & broadcasted.`);
  };

  const handleFollowUp = (enquiryId: string) => {
    setSendingFollowUp(enquiryId);
    setTimeout(() => {
        setSendingFollowUp(null);
        const enquiry = enquiries.find(e => e.id === enquiryId);
        if (enquiry) {
            onUpdateEnquiry({ ...enquiry, lastFollowUp: new Date().toISOString() });
        }
        onNotify('info', 'Follow-up request dispatched to vendors via Outlook gateway.');
        
        // Outlook bridge for follow up
        const vendorEmails = vendors.filter(v => enquiry?.vendorsSentTo.includes(v.id)).map(v => v.contacts[0]?.email).filter(Boolean).join(';');
        const body = `Following up on our enquiry ${enquiry?.reference} from ${enquiry?.sentDate}. Please provide your rates as soon as possible.`;
        window.location.href = `mailto:${vendorEmails}?subject=FOLLOW UP: ${enquiry?.reference}&body=${encodeURIComponent(body)}`;
    }, 1200);
  };

  const simulateToQuoteEngine = (enquiry: VendorEnquiry, bid: VendorBid) => {
    const quoteReq: QuoteRequest = {
        modality: enquiry.modality,
        origin: enquiry.origin,
        destination: enquiry.destination,
        cargoType: `${enquiry.equipmentCount}x ${enquiry.equipmentType} | ${enquiry.commodity}`,
        weight: enquiry.weight,
        volume: enquiry.volume,
        etd: enquiry.readyDate,
        transitTime: bid.transitTime,
        buyRate: bid.amount,
        margin: Math.round(bid.amount * 0.15), // 15% default margin
        currency: bid.currency,
        customerEmail: '',
        lineItems: [
            { description: `${enquiry.modality} Freight Cost`, amount: bid.amount, quantity: 1 },
            { description: 'Agency & Handling Fees', amount: Math.round(bid.amount * 0.1), quantity: 1 }
        ],
        sourceRef: enquiry.reference,
        sourceVendor: bid.vendorName,
        sourceVendorId: bid.vendorId
    };
    onLoadToSimulator(quoteReq);
    onNotify('success', 'Bid data loaded into Quote Engine for commercial drafting.');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
        <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden border-b-[12px] border-blue-600">
            <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none"><Globe size={220} /></div>
            <div className="z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Global Portal V4.0</span>
                    <span className="text-blue-400 flex items-center gap-1 font-black text-[10px] uppercase tracking-widest animate-pulse"><TrendingUp size={12}/> Live Market Feed</span>
                </div>
                <h3 className="text-4xl font-black tracking-tighter mb-2 italic">SPOT PROCUREMENT GATEWAY</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Aggressive Market Procurement & Negotiation Hub</p>
            </div>
            <div className="flex bg-slate-800 p-1.5 rounded-2xl z-10 shadow-2xl border border-slate-700">
                <button onClick={() => setModality('SEA')} className={`flex items-center space-x-3 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${modality === 'SEA' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}>
                    <Ship size={18} /> <span>SEA FREIGHT</span>
                </button>
                <button onClick={() => setModality('AIR')} className={`flex items-center space-x-3 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${modality === 'AIR' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
                    <Plane size={18} /> <span>AIR FREIGHT</span>
                </button>
            </div>
        </div>

        <div className="flex space-x-3">
            <button onClick={() => setActiveTab('NEW')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-500 border border-slate-200'}`}>Initiate New Campaign</button>
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-500 border border-slate-200'}`}>Live Dashboard ({intelligence.activeEnquiries})</button>
        </div>

        {activeTab === 'NEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center">
                                <Anchor size={16} className="mr-3 text-blue-600" /> Step 1: Shipment Logistics Profile
                            </h4>
                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Priority Recruitment</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Port of Departure</label>
                                <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-4.5 border border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-black text-slate-800 shadow-inner" placeholder="Origin Port Code/Name" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Port of Arrival</label>
                                <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-4.5 border border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-black text-slate-800 shadow-inner" placeholder="Destination Port Code/Name" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Commodity Detail</label>
                                <textarea value={commodity} onChange={e => setCommodity(e.target.value)} className="w-full p-5 border border-slate-100 bg-slate-50 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold min-h-[100px]" placeholder="Detailed description of cargo, packaging, and handling requirements..." />
                            </div>
                        </div>

                        <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 mb-10">
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-6">Commercial & Operational Constraints</p>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isHazmat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                            {isHazmat && <Check size={14} />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isHazmat} onChange={e => setIsHazmat(e.target.checked)} />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Hazardous (IMO/Hazmat)</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isStackable ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                            {isStackable && <Check size={14} />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isStackable} onChange={e => setIsStackable(e.target.checked)} />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Cargo is Stackable</span>
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-indigo-400 uppercase mb-1 block">Preferred Equipment</label>
                                        <select value={equipmentType} onChange={e => setEquipmentType(e.target.value)} className="w-full p-3 border border-indigo-200 bg-white rounded-xl text-xs font-black uppercase outline-none">
                                            <option value="20GP">20' Dry Van</option>
                                            <option value="40GP">40' Dry Van</option>
                                            <option value="40HC">40' High Cube</option>
                                            <option value="20RF">20' Reefer</option>
                                            <option value="40RF">40' Reefer</option>
                                            <option value="LCL">LCL (Part Load)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 border-b border-slate-50 pb-6 flex items-center">
                            <Users size={16} className="mr-3 text-blue-600" /> Step 2: Strategic Network Recruitment
                         </h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                            {vendors.map(v => (
                                <div key={v.id} onClick={() => setSelectedVendorIds(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-32 ${selectedVendorIds.includes(v.id) ? 'bg-indigo-50 border-indigo-500 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-black text-slate-900 text-[11px] uppercase leading-tight">{v.name}</span>
                                        {selectedVendorIds.includes(v.id) && <CheckCircle size={18} className="text-indigo-600 shrink-0" />}
                                    </div>
                                    <div className="mt-auto">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${v.tier === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{v.tier}</span>
                                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Reliability: 98.4%</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>

                    {origin && destination && selectedVendorIds.length > 0 && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] border-2 border-blue-600 animate-fade-in">
                            <div className="flex justify-between items-center mb-8">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                                    <Mail className="mr-3 text-blue-600" size={20} /> Step 3: Global Broadcast Composition
                                </h4>
                                <button onClick={() => setIsEditingOutreach(!isEditingOutreach)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest">
                                    {isEditingOutreach ? 'Apply Changes' : 'Customize Email'}
                                </button>
                            </div>
                            {isEditingOutreach ? (
                                <textarea value={customOutreachBody} onChange={e => setCustomOutreachBody(e.target.value)} className="w-full h-96 p-8 border-2 border-blue-100 rounded-[2rem] outline-none text-xs font-mono leading-relaxed text-slate-700 bg-slate-50 shadow-inner" />
                            ) : (
                                <div className="w-full h-96 p-10 bg-slate-50 border border-slate-100 rounded-[2rem] overflow-y-auto text-xs font-sans leading-relaxed whitespace-pre-wrap text-slate-600 relative shadow-inner italic">
                                    {customOutreachBody}
                                    <div className="absolute top-10 right-10 text-blue-600 opacity-10"><MessageSquareText size={140}/></div>
                                </div>
                            )}
                            <div className="mt-10 flex flex-col md:flex-row justify-end gap-4">
                                <button onClick={() => handleCreateEnquiry(false)} className="px-10 py-5 border-2 border-slate-200 text-slate-600 font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95">Record Locally</button>
                                <button onClick={() => handleCreateEnquiry(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-14 py-5 rounded-2xl shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-3">
                                    <Send size={18} /> Dispatch via Outlook Gateway
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl sticky top-8 border border-slate-800">
                        <div className="flex items-center space-x-4 mb-12">
                            <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                                <Zap size={28} />
                            </div>
                            <h4 className="text-2xl font-black tracking-tighter uppercase italic">MARKET INTEL</h4>
                        </div>
                        <div className="space-y-8">
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Pipeline Metrics</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><p className="text-3xl font-black">{intelligence.totalEnquiries}</p><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Files Opened</p></div>
                                    <div><p className="text-3xl font-black text-blue-400">{intelligence.avgResponse}</p><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Avg Quotes/File</p></div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Live Lane Velocity</p>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Sea Capacity</span><span className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-black">CRITICAL</span></div>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Rate Trend</span><span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black">FALLING</span></div>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Portal Uptime</span><span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[8px] font-black">100%</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'DASHBOARD' && (
             <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                {enquiries.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-24 text-center">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Inbox size={64} className="text-slate-200" /></div>
                        <p className="text-xl font-black tracking-tight text-slate-300 uppercase italic">No Active Spot Campaigns</p>
                        <button onClick={() => setActiveTab('NEW')} className="mt-8 px-10 py-3 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all">Start First Campaign</button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 flex-1">
                        {enquiries.map(enquiry => (
                            <div key={enquiry.id} className="p-10 hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => toggleExpand(enquiry.id)}>
                                <div className="flex flex-col md:flex-row items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-6 mb-4">
                                            <div className={`p-2.5 rounded-2xl text-white ${enquiry.modality === 'SEA' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-indigo-600 shadow-indigo-500/20'} shadow-lg`}>
                                                {enquiry.modality === 'SEA' ? <Ship size={18} /> : <Plane size={18} />}
                                            </div>
                                            {getStatusBadge(enquiry.status)}
                                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">{enquiry.reference}</span>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{enquiry.sentDate}</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center italic">
                                            {enquiry.origin} <ArrowRight className="mx-6 text-blue-200" size={28} /> {enquiry.destination}
                                        </div>
                                        <div className="flex gap-6 mt-4">
                                            <span className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2 border-r border-slate-200 pr-6"><Package size={14} className="text-blue-500"/> {enquiry.commodity}</span>
                                            <span className="text-[11px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-xl tracking-widest">{enquiry.equipmentCount}x {enquiry.equipmentType}</span>
                                            {enquiry.isHazmat && <span className="text-[11px] font-black text-red-600 uppercase bg-red-50 px-3 py-1 rounded-xl tracking-widest">HAZMAT</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 mt-8 md:mt-0">
                                        <div className="flex flex-col items-end">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Bids</p>
                                            <p className="text-4xl font-black text-blue-600 tracking-tighter">{enquiry.bids.length}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleFollowUp(enquiry.id); }} 
                                                disabled={sendingFollowUp === enquiry.id}
                                                className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg active:scale-95"
                                            >
                                                {sendingFollowUp === enquiry.id ? <Loader2 size={12} className="animate-spin mr-2"/> : <BellRing size={12} className="mr-2"/>}
                                                {enquiry.lastFollowUp ? 'RE-FOLLOW UP' : 'FOLLOW UP'}
                                            </button>
                                            <div className={`p-2.5 rounded-2xl mx-auto transition-all ${expandedEnquiryId === enquiry.id ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                                <ChevronDown size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {expandedEnquiryId === enquiry.id && (
                                    <div className="mt-12 pt-12 border-t border-slate-100 animate-fade-in space-y-10">
                                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Response Analysis Pool</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-500">Target Rate: {enquiry.currency} {enquiry.targetRate || 'N/A'}</span>
                                                <span className="text-[10px] font-black text-blue-600 bg-white border border-blue-100 px-3 py-1 rounded-full uppercase">Lanes: {modality} GLOBAL</span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em]">
                                                    <tr>
                                                        <th className="p-6">Vendor Hub</th>
                                                        <th className="p-6">Quotation (Buy)</th>
                                                        <th className="p-6">Transit / Validity</th>
                                                        <th className="p-6 text-right">Execution Control</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {enquiry.bids.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="p-16 text-center text-slate-400 italic text-sm font-medium">Bidding phase active. Awaiting first carrier submission...</td>
                                                        </tr>
                                                    ) : enquiry.bids.map((bid, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                                            <td className="p-6">
                                                                <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{bid.vendorName}</div>
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Received: {bid.receivedAt}</div>
                                                            </td>
                                                            <td className="p-6">
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{bid.currency} {bid.amount.toLocaleString()}</span>
                                                                    {enquiry.targetRate && bid.amount <= enquiry.targetRate && (
                                                                        <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase shadow-lg shadow-emerald-500/20">TARGET MATCH</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-6">
                                                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{bid.transitTime} {enquiry.modality === 'AIR' ? 'HOURS' : 'DAYS'}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Valid To: {bid.validityDate}</p>
                                                            </td>
                                                            <td className="p-6 text-right">
                                                                <div className="flex justify-end gap-3">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); simulateToQuoteEngine(enquiry, bid); }} 
                                                                        className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-2"
                                                                    >
                                                                        <Calculator size={14}/> Simulate Quote
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); onAwardEnquiry(enquiry.id, bid, Math.round(bid.amount * 1.15)); }} 
                                                                        className="px-8 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                                                    >
                                                                        <Trophy size={14}/> Award Bid
                                                                    </button>
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
