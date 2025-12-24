
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

We are requesting a commercial spot market rate for the following ${typeLabel} requirement.

IMPORTANT: Please submit your bid via our digital portal using the link below to be considered.

ROUTE: ${origin} to ${destination}
MODALITY: ${modality}
CARGO: ${equipmentCount}x ${equipmentType} | ${commodity || 'General Cargo'}
SPECS: ${weight} KG Total Weight | ${volume} CBM Total Volume
${modality === 'SEA' ? `HAZMAT: ${isHazmat ? 'YES' : 'NO'}\nSTACKABLE: ${isStackable ? 'YES' : 'NO'}` : ''}
READY DATE: ${readyDate || 'TBD'}
INCOTERMS: ${incoterms}

TARGET RATE: ${currency} ${targetRate > 0 ? targetRate : 'Best Market Level'}

BIDDING PORTAL LINK (Personalized):
https://uniqueccs-portal.web.app/bid/{{PORTAL_TOKEN}}

Best Regards,
Unique CCS Procurement Team
${settings.emailSignature}`;
        setCustomOutreachBody(template);
    }
  }, [origin, destination, readyDate, incoterms, commodity, isHazmat, isStackable, equipmentType, equipmentCount, weight, volume, targetRate, currency, modality, activeTab]);

  const handleCreateEnquiry = (toOutlook: boolean = false) => {
     if (!origin || !destination || selectedVendorIds.length === 0) {
         onNotify('warning', 'Please fill in route details and select at least one vendor.');
         return;
     }
     
     const portalToken = Math.random().toString(36).substr(2, 12);
     const newRef = `SPOT-${modality.charAt(0)}-${origin.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`;
     
     const newEnquiry: VendorEnquiry = {
         id: `E${String(enquiries.length + 1).padStart(3, '0')}`,
         portalToken,
         modality,
         reference: newRef,
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
         const subject = `Spot Enquiry: ${newRef} | ${origin} to ${destination}`;
         const vendorEmails = vendors.filter(v => selectedVendorIds.includes(v.id)).map(v => v.contacts[0]?.email).filter(Boolean).join(';');
         const bodyWithLink = customOutreachBody.replace('{{PORTAL_TOKEN}}', portalToken);
         const mailto = `mailto:${vendorEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyWithLink)}`;
         window.location.href = mailto;
         onNotify('success', "Enquiry recorded and Outlook broadcast gateway initialized.");
     } else {
         onNotify('success', `Campaign ${newRef} archived internally.`);
     }
  };

  const handleFollowUp = (enquiryId: string) => {
    setSendingFollowUp(enquiryId);
    setTimeout(() => {
        setSendingFollowUp(null);
        const enquiry = enquiries.find(e => e.id === enquiryId);
        if (enquiry) {
            onUpdateEnquiry({ ...enquiry, lastFollowUp: new Date().toISOString() });
            
            const vendorEmails = vendors.filter(v => enquiry.vendorsSentTo.includes(v.id)).map(v => v.contacts[0]?.email).filter(Boolean).join(';');
            const subject = `FOLLOW UP: ${enquiry.reference} | ${enquiry.origin} -> ${enquiry.destination}`;
            const body = `Dear Partner,\n\nFollowing up on our enquiry ${enquiry.reference}. We are finalizing selection today.\n\nPlease submit your rate via the portal if you haven't yet:\nhttps://uniqueccs-portal.web.app/bid/${enquiry.portalToken}\n\nBest Regards,\nUnique CCS Procurement`;
            
            window.location.href = `mailto:${vendorEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            onNotify('info', 'Follow-up request sent via Outlook.');
        }
    }, 1000);
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
        margin: Math.round(bid.amount * 0.15),
        currency: bid.currency,
        customerEmail: '',
        lineItems: [
            { description: `${enquiry.modality} Freight Buy Rate`, amount: bid.amount, quantity: 1 },
            { description: 'Agency & Admin Fee', amount: Math.round(bid.amount * 0.08), quantity: 1 }
        ],
        sourceRef: enquiry.reference,
        sourceVendor: bid.vendorName,
        sourceVendorId: bid.vendorId
    };
    onLoadToSimulator(quoteReq);
    onNotify('success', 'Bid intelligence exported to Quote Engine.');
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
        <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden border-b-[16px] border-blue-600">
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Globe size={280} /></div>
            <div className="z-10">
                <div className="flex items-center gap-3 mb-5">
                    <span className="bg-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 italic">Procurement Portal v5</span>
                    <span className="text-blue-400 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest animate-pulse border border-blue-500/30 px-3 py-1 rounded-full"><TrendingUp size={14}/> Market Depth: High</span>
                </div>
                <h3 className="text-5xl font-black tracking-tighter mb-4 italic">SMART ENQUIRY HUB</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.3em] max-w-lg leading-relaxed">Automated market recruitment. Send unique portal links to vendors and receive bids in real-time.</p>
            </div>
            <div className="flex bg-slate-800 p-2 rounded-3xl z-10 shadow-2xl border border-slate-700">
                <button onClick={() => setModality('SEA')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'SEA' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 italic' : 'text-slate-500 hover:text-white'}`}>
                    <Ship size={20} /> <span>SEA FREIGHT</span>
                </button>
                <button onClick={() => setModality('AIR')} className={`flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all ${modality === 'AIR' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 italic' : 'text-slate-500 hover:text-white'}`}>
                    <Plane size={20} /> <span>AIR FREIGHT</span>
                </button>
            </div>
        </div>

        <div className="flex space-x-4">
            <button onClick={() => setActiveTab('NEW')} className={`px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] scale-105' : 'bg-white text-slate-500 border border-slate-200'}`}>Create Market Enq.</button>
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-900 text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] scale-105' : 'bg-white text-slate-500 border border-slate-200'}`}>Live Campaigns ({intelligence.activeEnquiries})</button>
        </div>

        {activeTab === 'NEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic">
                                <Anchor size={20} className="mr-4 text-blue-600" /> [01] Shipment Logistics DNA
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Departure Port</label>
                                <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 shadow-inner uppercase tracking-tighter" placeholder="Origin e.g. SHA" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Arrival Port</label>
                                <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 shadow-inner uppercase tracking-tighter" placeholder="Destination e.g. RTM" />
                            </div>
                            <div className="col-span-2 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Cargo Intelligence Description</label>
                                <textarea value={commodity} onChange={e => setCommodity(e.target.value)} className="w-full p-6 border-2 border-slate-200 bg-white rounded-[2rem] focus:border-blue-500 outline-none text-sm font-bold min-h-[140px] shadow-sm italic" placeholder="Enter specific commodity details, packing types, and special handling requirements..." />
                            </div>
                        </div>

                        <div className="bg-indigo-50/60 p-10 rounded-[3rem] border-2 border-indigo-100/50 mb-10">
                            <p className="text-[11px] font-black text-indigo-700 uppercase tracking-[0.3em] mb-8 italic">Commercial Parameters</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <label className="flex items-center space-x-4 cursor-pointer group">
                                        <div className={`w-8 h-8 rounded-xl border-3 flex items-center justify-center transition-all ${isHazmat ? 'bg-indigo-600 border-indigo-600 text-white rotate-6 scale-110 shadow-lg shadow-indigo-200' : 'bg-white border-slate-200'}`}>
                                            {isHazmat && <Check size={18} />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isHazmat} onChange={e => setIsHazmat(e.target.checked)} />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest italic group-hover:text-indigo-600">Dangerous Goods (IMO)</span>
                                    </label>
                                    <label className="flex items-center space-x-4 cursor-pointer group">
                                        <div className={`w-8 h-8 rounded-xl border-3 flex items-center justify-center transition-all ${isStackable ? 'bg-indigo-600 border-indigo-600 text-white rotate-6 scale-110 shadow-lg shadow-indigo-200' : 'bg-white border-slate-200'}`}>
                                            {isStackable && <Check size={18} />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isStackable} onChange={e => setIsStackable(e.target.checked)} />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest italic group-hover:text-indigo-600">Cargo is Stackable</span>
                                    </label>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100/50 shadow-sm">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase mb-3 block tracking-widest italic">Preferred Equipment</label>
                                    <select value={equipmentType} onChange={e => setEquipmentType(e.target.value)} className="w-full p-4 border-2 border-indigo-100 bg-white rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500 shadow-inner">
                                        <option value="20GP">20' Dry Van</option>
                                        <option value="40GP">40' Dry Van</option>
                                        <option value="40HC">40' High Cube</option>
                                        <option value="20RF">20' Reefer</option>
                                        <option value="40RF">40' Reefer</option>
                                        <option value="LCL">LCL (Consolidated)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                         <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                            <Users size={20} className="mr-4 text-blue-600" /> [02] Strategic Network Targeting
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                            {vendors.map(v => (
                                <div key={v.id} onClick={() => setSelectedVendorIds(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col justify-between h-40 ${selectedVendorIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`font-black text-[12px] uppercase leading-tight italic ${selectedVendorIds.includes(v.id) ? 'text-white' : 'text-slate-900'}`}>{v.name}</span>
                                        {selectedVendorIds.includes(v.id) && <div className="bg-white text-indigo-600 p-1 rounded-lg"><Check size={14} /></div>}
                                    </div>
                                    <div className="mt-auto">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${selectedVendorIds.includes(v.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{v.tier} TIER</span>
                                        <p className={`text-[10px] font-bold mt-2 uppercase italic ${selectedVendorIds.includes(v.id) ? 'text-indigo-200' : 'text-slate-400'}`}>Reliability Score: 98.4%</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>

                    {origin && destination && selectedVendorIds.length > 0 && (
                        <div className="bg-white p-12 rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border-4 border-blue-600 animate-fade-in relative">
                            <div className="absolute -top-6 left-12 bg-blue-600 text-white px-8 py-2 rounded-full text-[12px] font-black uppercase tracking-widest italic shadow-xl">Smart Outreach Generator</div>
                            <div className="flex justify-between items-center mb-10 mt-4">
                                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center italic">
                                    <Mail className="mr-4 text-blue-600" size={24} /> Broadcast Message Stack
                                </h4>
                                <button onClick={() => setIsEditingOutreach(!isEditingOutreach)} className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all tracking-[0.2em] shadow-sm">
                                    {isEditingOutreach ? 'Apply Logic' : 'Manual Override'}
                                </button>
                            </div>
                            {isEditingOutreach ? (
                                <textarea value={customOutreachBody} onChange={e => setCustomOutreachBody(e.target.value)} className="w-full h-96 p-10 border-2 border-blue-100 rounded-[3rem] outline-none text-[13px] font-mono leading-relaxed text-slate-700 bg-slate-50 shadow-inner" />
                            ) : (
                                <div className="w-full h-96 p-12 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-y-auto text-[13px] font-sans leading-relaxed whitespace-pre-wrap text-blue-200 relative shadow-2xl italic">
                                    {customOutreachBody}
                                    <div className="absolute top-12 right-12 text-blue-500 opacity-20"><MessageSquareText size={180}/></div>
                                </div>
                            )}
                            <div className="mt-12 flex flex-col sm:flex-row justify-end gap-6">
                                <button onClick={() => handleCreateEnquiry(false)} className="px-12 py-5 border-2 border-slate-200 text-slate-500 font-black uppercase text-[12px] tracking-widest rounded-3xl hover:bg-slate-50 transition-all active:scale-95 italic">Archive Draft</button>
                                <button onClick={() => handleCreateEnquiry(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[12px] tracking-widest px-16 py-6 rounded-3xl shadow-2xl shadow-blue-500/40 transition-all active:scale-95 flex items-center gap-4 italic group">
                                    <Send size={22} className="group-hover:translate-x-1 transition-transform" /> Dispatch to Outlook Gateway
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl sticky top-8 border-t-8 border-blue-500 overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 opacity-5 transform rotate-45"><Zap size={240} /></div>
                        <div className="flex items-center space-x-5 mb-14">
                            <div className="p-5 bg-blue-600 rounded-[1.75rem] shadow-2xl shadow-blue-600/30">
                                <Zap size={32} />
                            </div>
                            <h4 className="text-3xl font-black tracking-tighter uppercase italic">LIVE INTEL</h4>
                        </div>
                        <div className="space-y-10 relative z-10">
                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                                <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-6 italic">Pipeline Analytics</p>
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Corridors</p><p className="text-4xl font-black italic">{intelligence.totalEnquiries}</p></div>
                                    <div className="flex items-center justify-between"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Resp. Rate</p><p className="text-4xl font-black text-blue-400 italic">{intelligence.avgResponse}</p></div>
                                </div>
                            </div>
                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8">
                                <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4 italic">Lane Dynamics (SEA)</p>
                                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400 uppercase italic">Freight Bench</span><span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[9px] font-black italic shadow-lg shadow-red-500/20">VOLATILE</span></div>
                                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400 uppercase italic">Capacity Index</span><span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[9px] font-black italic shadow-lg shadow-emerald-500/20">STABLE</span></div>
                                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400 uppercase italic">Gateway Status</span><span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[9px] font-black italic shadow-lg shadow-blue-500/20">OPTIMAL</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'DASHBOARD' && (
             <div className="bg-white rounded-[4rem] shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
                {enquiries.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-32 text-center">
                        <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-inner"><Inbox size={80} className="text-slate-200" /></div>
                        <p className="text-2xl font-black tracking-tighter text-slate-300 uppercase italic">No Active Spot Campaigns Registered</p>
                        <button onClick={() => setActiveTab('NEW')} className="mt-12 px-14 py-5 bg-blue-600 text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/40 active:scale-95 italic">Initialize Market Intake</button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 flex-1 font-sans">
                        {enquiries.map(enquiry => (
                            <div key={enquiry.id} className="p-12 hover:bg-blue-50/20 transition-all cursor-pointer group" onClick={() => toggleExpand(enquiry.id)}>
                                <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-6 mb-6">
                                            <div className={`p-4 rounded-[1.75rem] text-white ${enquiry.modality === 'SEA' ? 'bg-blue-600 shadow-xl shadow-blue-500/20' : 'bg-indigo-600 shadow-xl shadow-indigo-500/20'} shadow-lg`}>
                                                {enquiry.modality === 'SEA' ? <Ship size={24} /> : <Plane size={24} />}
                                            </div>
                                            {getStatusBadge(enquiry.status)}
                                            <span className="text-[13px] font-black text-slate-300 uppercase tracking-[0.3em] italic">{enquiry.reference}</span>
                                            <div className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                                                <Calendar size={14} className="text-slate-400"/>
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">{enquiry.sentDate}</span>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center italic mb-4">
                                            {enquiry.origin} <ArrowRight className="mx-8 text-blue-200" size={40} /> {enquiry.destination}
                                        </div>
                                        <div className="flex flex-wrap gap-8">
                                            <span className="text-[12px] font-black text-slate-500 uppercase flex items-center gap-3 border-r border-slate-200 pr-8 italic"><Package size={16} className="text-blue-500"/> {enquiry.commodity}</span>
                                            <span className="text-[12px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-1.5 rounded-2xl tracking-widest italic">{enquiry.equipmentCount}x {enquiry.equipmentType}</span>
                                            {enquiry.isHazmat && <span className="text-[12px] font-black text-red-600 uppercase bg-red-50 px-4 py-1.5 rounded-2xl tracking-widest italic">HAZMAT REQ</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10 mt-10 xl:mt-0 bg-slate-50/80 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Active Bids</p>
                                            <p className="text-6xl font-black text-blue-600 tracking-tighter italic">{enquiry.bids.length}</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleFollowUp(enquiry.id); }} 
                                                disabled={sendingFollowUp === enquiry.id}
                                                className="px-8 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center shadow-xl shadow-slate-900/10 active:scale-95 italic group"
                                            >
                                                {sendingFollowUp === enquiry.id ? <Loader2 size={16} className="animate-spin mr-3"/> : <BellRing size={16} className="mr-3 group-hover:animate-bounce"/>}
                                                {enquiry.lastFollowUp ? 'RE-ENGAGE' : 'ENGAGE VENDORS'}
                                            </button>
                                            <div className={`p-3.5 rounded-2xl mx-auto transition-all ${expandedEnquiryId === enquiry.id ? 'bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-500/20' : 'bg-white border-2 border-slate-100 text-slate-300 shadow-sm'}`}>
                                                <ChevronDown size={32} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {expandedEnquiryId === enquiry.id && (
                                    <div className="mt-16 pt-16 border-t border-slate-100 animate-fade-in space-y-12">
                                        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-8 rounded-[3rem] border border-slate-200 gap-6">
                                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Market Intelligence Matrix</p>
                                            <div className="flex items-center gap-6">
                                                <span className="text-[12px] font-black text-slate-600 italic">Target Benchmark: <span className="text-blue-600 ml-2">{enquiry.currency} {enquiry.targetRate || 'UNSET'}</span></span>
                                                <div className="h-6 w-1 rounded-full bg-slate-200"></div>
                                                <span className="text-[12px] font-black text-indigo-600 bg-white border-2 border-indigo-50 px-5 py-2 rounded-full uppercase italic tracking-widest shadow-sm">Portal: ACTIVE</span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)]">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em]">
                                                    <tr>
                                                        <th className="p-8 italic">Partner Node</th>
                                                        <th className="p-8 italic">Buy Rate (All-In)</th>
                                                        <th className="p-8 italic">Operational Profile</th>
                                                        <th className="p-8 text-right italic">Strategic Control</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {enquiry.bids.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="p-24 text-center text-slate-400 italic text-lg font-medium bg-slate-50/50 uppercase tracking-widest">Enquiry broadcasted. Awaiting carrier recruitment...</td>
                                                        </tr>
                                                    ) : enquiry.bids.map((bid, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/50 transition-all group/bid">
                                                            <td className="p-8">
                                                                <div className="font-black text-slate-900 uppercase text-sm tracking-tight italic group-hover/bid:text-blue-600 transition-colors">{bid.vendorName}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest italic flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Received: {bid.receivedAt}</div>
                                                            </td>
                                                            <td className="p-8">
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{bid.currency} {bid.amount.toLocaleString()}</span>
                                                                    {enquiry.targetRate && bid.amount <= enquiry.targetRate && (
                                                                        <span className="bg-emerald-600 text-white text-[10px] px-4 py-1 rounded-full font-black uppercase shadow-xl shadow-emerald-600/20 italic tracking-widest">BENCHMARK MATCH</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-8">
                                                                <p className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{bid.transitTime} {enquiry.modality === 'AIR' ? 'HOURS' : 'DAYS'} TRANSIT</p>
                                                                <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase italic">VALID UNTIL: {bid.validityDate}</p>
                                                            </td>
                                                            <td className="p-8 text-right">
                                                                <div className="flex justify-end gap-4">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); simulateToQuoteEngine(enquiry, bid); }} 
                                                                        className="px-10 py-4 bg-white border-3 border-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-3 shadow-sm hover:shadow-xl italic"
                                                                    >
                                                                        <Calculator size={18}/> SIMULATE
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); onAwardEnquiry(enquiry.id, bid, Math.round(bid.amount * 1.15)); }} 
                                                                        className="px-12 py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 italic group/btn"
                                                                    >
                                                                        <Trophy size={18} className="group-hover/btn:rotate-12 transition-transform" /> AWARD CONTRACT
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
