
import React, { useState, useEffect, useMemo } from 'react';
import { Send, Globe, Anchor, Plus, Check, CheckCircle, ExternalLink, X, Mail, Eye, ArrowRight, Trophy, BarChart3, ChevronDown, Calendar, Package, Copy, Link as LinkIcon, Inbox, Edit3, MessageSquareText, Users, Zap, Plane, Ship, AlertTriangle, TrendingUp, BellRing, Loader2, Calculator, Save, FlaskConical } from 'lucide-react';
import { Vendor, VendorEnquiry, VendorBid, EnquiryStatus, Currency, SharedProps, QuoteRequest, Modality, PackagingType, PackagingDetail } from '../types';
import { repo } from '../services/repository';

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
  currentUser,
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
  const [runSimulation, setRunSimulation] = useState(true);

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

ROUTE: ${origin} to ${destination}
MODALITY: ${modality}
CARGO: ${equipmentCount}x ${equipmentType} | ${commodity || 'General Cargo'}
READY DATE: ${readyDate || 'TBD'}

BIDDING PORTAL LINK:
https://uniqueccs-portal.web.app/bid/{{PORTAL_TOKEN}}

Best Regards,
Unique CCS Procurement Team`;
        setCustomOutreachBody(template);
    }
  }, [origin, destination, readyDate, incoterms, commodity, isHazmat, isStackable, equipmentType, equipmentCount, weight, volume, targetRate, currency, modality, activeTab]);

  const handleCreateEnquiry = (toOutlook: boolean = false) => {
     if (!origin || !destination || selectedVendorIds.length === 0) {
         onNotify('warning', 'Fill in route and select at least one vendor.');
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

     // Ghost Bidder Simulation
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
              onLogActivity('Procurement', 'Bid Received', `Ghost Bidder injected rate for ${newRef}`);
              onUpdateEnquiry(latestEnquiry);
           }
        }, 5000);
     }

     if (toOutlook) {
         onNotify('success', "Enquiry recorded and broadcast gateway initialized.");
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
            onNotify('info', 'Follow-up request sent via Outlook.');
        }
    }, 1000);
  };

  const simulateToQuoteEngine = (enquiry: VendorEnquiry, bid: VendorBid) => {
    onLoadToSimulator({
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
        lineItems: [],
        sourceRef: enquiry.reference,
        sourceVendor: bid.vendorName,
        sourceVendorId: bid.vendorId
    });
    onNotify('success', 'Bid exported to Quote Engine.');
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
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
                <h3 className="text-5xl font-black tracking-tighter mb-4 italic">PROCUREMENT HUB</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.3em] max-w-lg leading-relaxed">Broadcast unique portal links and receive structured vendor bids instantly.</p>
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
            <button onClick={() => setActiveTab('NEW')} className={`px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-500 border border-slate-200'}`}>Create Market Enq.</button>
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-500 border border-slate-200'}`}>Live Campaigns ({intelligence.activeEnquiries})</button>
        </div>

        {activeTab === 'NEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic">
                                <Anchor size={20} className="mr-4 text-blue-600" /> [01] Routing DNA
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Departure Port</label>
                                <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 shadow-inner uppercase tracking-tighter" placeholder="SHA" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Arrival Port</label>
                                <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-blue-500 outline-none text-sm font-black text-slate-900 shadow-inner uppercase tracking-tighter" placeholder="RTM" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Commodity & Handling</label>
                                <textarea value={commodity} onChange={e => setCommodity(e.target.value)} className="w-full p-6 border-2 border-slate-100 bg-slate-50/50 rounded-[2rem] focus:border-blue-500 outline-none text-sm font-bold min-h-[140px] shadow-inner italic" placeholder="e.g. 5x Pallets electronics, stackable, non-haz..." />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                         <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 border-b border-slate-50 pb-8 flex items-center italic">
                            <Users size={20} className="mr-4 text-blue-600" /> [02] Recipient Grid
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
                            {vendors.map(v => (
                                <div key={v.id} onClick={() => setSelectedVendorIds(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col justify-between h-40 ${selectedVendorIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`font-black text-[12px] uppercase leading-tight italic ${selectedVendorIds.includes(v.id) ? 'text-white' : 'text-slate-900'}`}>{v.name}</span>
                                        {selectedVendorIds.includes(v.id) && <CheckCircle size={14} />}
                                    </div>
                                    <div className="mt-auto">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${selectedVendorIds.includes(v.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{v.tier}</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>

                    {origin && destination && selectedVendorIds.length > 0 && (
                        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-blue-600 animate-fade-in">
                            <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center italic">
                                <Mail className="mr-4 text-blue-600" size={24} /> Broadcast Stack
                            </h4>
                            <div className="w-full h-80 p-12 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-y-auto text-[13px] font-mono leading-relaxed text-blue-200 shadow-inner italic">
                                {customOutreachBody}
                            </div>
                            <div className="mt-12 flex justify-end gap-6">
                                <button onClick={() => handleCreateEnquiry(false)} className="px-12 py-5 border-2 border-slate-200 text-slate-500 font-black uppercase text-[12px] tracking-widest rounded-3xl hover:bg-slate-50 transition-all italic">Internal Only</button>
                                <button onClick={() => handleCreateEnquiry(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[12px] tracking-widest px-16 py-6 rounded-3xl shadow-2xl shadow-blue-500/40 transition-all active:scale-95 flex items-center gap-4 italic group">
                                    <Send size={22} className="group-hover:translate-x-1 transition-transform" /> Dispatch Broadcast
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl sticky top-8 border-t-8 border-blue-500 overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 opacity-5 transform rotate-45"><Zap size={240} /></div>
                        <h4 className="text-3xl font-black tracking-tighter uppercase italic mb-10">MARKET INTEL</h4>
                        <div className="space-y-10 relative z-10">
                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                                <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-6 italic">Pipeline Pulse</p>
                                <div className="flex items-center justify-between border-b border-white/5 pb-4"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Corridors</p><p className="text-4xl font-black italic">{intelligence.totalEnquiries}</p></div>
                                <div className="flex items-center justify-between mt-4"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Avg Response</p><p className="text-4xl font-black text-blue-400 italic">{intelligence.avgResponse}</p></div>
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
                        <p className="text-2xl font-black tracking-tighter text-slate-300 uppercase italic">No Active Campaigns</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 flex-1 font-sans">
                        {enquiries.map(enquiry => (
                            <div key={enquiry.id} className="p-12 hover:bg-blue-50/20 transition-all cursor-pointer group" onClick={() => toggleExpand(enquiry.id)}>
                                <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-6 mb-6">
                                            <div className={`p-4 rounded-[1.75rem] text-white ${enquiry.modality === 'SEA' ? 'bg-blue-600 shadow-xl' : 'bg-indigo-600 shadow-xl'} shadow-lg`}>
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
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Bids</p>
                                            <p className="text-5xl font-black text-blue-600 tracking-tighter italic">{enquiry.bids.length}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleFollowUp(enquiry.id); }} className="px-8 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95 italic">RE-ENGAGE</button>
                                        <div className={`p-3.5 rounded-2xl transition-all ${expandedEnquiryId === enquiry.id ? 'bg-blue-600 text-white rotate-180' : 'bg-white border border-slate-200 text-slate-300'}`}>
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
                                                        <th className="p-8 italic">Rate</th>
                                                        <th className="p-8 italic">Transit</th>
                                                        <th className="p-8 text-right italic">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {enquiry.bids.length === 0 ? (
                                                        <tr><td colSpan={4} className="p-24 text-center text-slate-400 italic uppercase tracking-widest">Awaiting recruitment...</td></tr>
                                                    ) : enquiry.bids.map((bid, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/50 transition-all group/bid">
                                                            <td className="p-8">
                                                                <div className="font-black text-slate-900 uppercase text-sm italic">{bid.vendorName}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold mt-2 uppercase italic">Verified Bidder</div>
                                                            </td>
                                                            <td className="p-8">
                                                                <div className="text-3xl font-black text-slate-900 tracking-tighter italic">{bid.currency} {bid.amount.toLocaleString()}</div>
                                                            </td>
                                                            <td className="p-8 text-sm font-black text-slate-800 uppercase italic">{bid.transitTime} {enquiry.modality === 'AIR' ? 'HRS' : 'DAYS'}</td>
                                                            <td className="p-8 text-right">
                                                                <div className="flex justify-end gap-4">
                                                                    <button onClick={(e) => { e.stopPropagation(); simulateToQuoteEngine(enquiry, bid); }} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-blue-600 transition-all italic shadow-sm">SIMULATE</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); onAwardEnquiry(enquiry.id, bid, Math.round(bid.amount * 1.15)); }} className="px-10 py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-blue-700 transition-all italic">AWARD</button>
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
