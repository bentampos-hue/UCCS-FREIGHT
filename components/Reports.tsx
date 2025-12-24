import React, { useState, useMemo } from 'react';
import { Search, Eye, Download, ChevronLeft, ChevronRight, X, Activity, CheckCircle, ArrowRight, Plane, Ship, Mail, Send, Bell, Loader2, FileText, BarChart3, Database, Filter, ExternalLink, RefreshCw, Globe, User, Target, TrendingUp, Briefcase, PieChart as PieIcon, Trash2, Plus } from 'lucide-react';
import { Quotation, QuoteStatus, SharedProps, Milestone, ShipmentMilestoneStatus, VendorEnquiry } from '../types';
import { analyticsService } from '../services/analyticsService';
import { repo } from '../services/repository';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ReportsProps extends SharedProps {
  quotations: Quotation[];
  enquiries: VendorEnquiry[];
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onAddMilestone: (id: string, milestone: Milestone) => void;
  defaultFilter?: QuoteStatus | 'ALL';
}

const Reports: React.FC<ReportsProps> = ({ quotations, enquiries, onUpdateStatus, onAddMilestone, onNotify, userRole, currentUser, settings }) => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'ANALYTICS'>('LEDGER');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  
  // Detail view state for adding milestones
  const [milestoneStatus, setMilestoneStatus] = useState<ShipmentMilestoneStatus | string>('BOOKING_CONFIRMED');
  const [milestoneNotes, setMilestoneNotes] = useState('');

  const itemsPerPage = 10;

  const stats = useMemo(() => analyticsService.calculateKPIs(quotations, enquiries), [quotations, enquiries]);
  
  const pieData = useMemo(() => [
    { name: 'Booked', value: quotations.filter(q => q.status === 'CONFIRMED').length, color: '#10b981' },
    { name: 'Authorized', value: quotations.filter(q => q.status === 'SENT').length, color: '#3b82f6' },
    { name: 'Approval Required', value: quotations.filter(q => q.status === 'PENDING_APPROVAL').length, color: '#f59e0b' },
    { name: 'Lost/Cancelled', value: quotations.filter(q => q.status === 'LOST' || q.status === 'CANCELLED').length, color: '#ef4444' },
  ].filter(x => x.value > 0), [quotations]);

  const filteredQuotes = quotations.filter(q => {
    const searchStr = `${q.id} ${q.customerEmail} ${q.customerName || ''} ${q.origin} ${q.destination}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const paginatedQuotes = filteredQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  const handleExportCSV = () => {
    onNotify('info', 'Compiling Platform Ledger Analytics...');
    setTimeout(() => {
        const headers = ["ID", "Modality", "Customer", "Contact Email", "Origin", "Destination", "Amount", "Currency", "Status", "Issue Date"];
        const rows = quotations.map(q => [
            q.id, q.modality, q.customerName || 'N/A', q.customerEmail,
            q.origin, q.destination, q.amount, q.currency, q.status, q.date
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `UCCS_Ledger_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        onNotify('success', 'Master Ledger exported.');
    }, 1000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (userRole !== 'ADMIN') {
          onNotify('error', 'Only administrators can delete ledger records.');
          return;
      }
      if (window.confirm(`Permanently remove record ${id} from global ledger?`)) {
          await repo.deleteItem('quotations', id, currentUser);
          onNotify('success', `Record ${id} purged from system.`);
          window.location.reload(); // Simple refresh to update global list in this context
      }
  };

  const handleAddMilestoneLocal = () => {
      if (!selectedQuote) return;
      const newMilestone: Milestone = {
          status: milestoneStatus,
          date: new Date().toISOString(),
          notes: milestoneNotes,
          updatedBy: currentUser.name
      };
      onAddMilestone(selectedQuote.id, newMilestone);
      setMilestoneNotes('');
      onNotify('success', 'Event logged to shipment lifecycle.');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 italic">
        <div className="flex bg-slate-900/5 p-2 rounded-[2.5rem] w-fit italic">
            <button onClick={() => setActiveTab('LEDGER')} className={`px-12 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LEDGER' ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-900'}`}>Platform Ledger</button>
            <button onClick={() => setActiveTab('ANALYTICS')} className={`px-12 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ANALYTICS' ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-900'}`}>Business Intelligence</button>
        </div>

        {activeTab === 'ANALYTICS' ? (
            <div className="space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Capture Ratio', val: `${stats.winRatio.toFixed(1)}%`, icon: Target, col: 'blue' },
                        { label: 'Revenue Pool', val: `${settings.defaultCurrency} ${stats.revenue.toLocaleString()}`, icon: Briefcase, col: 'emerald' },
                        { label: 'Yield Variance', val: `${stats.avgMargin.toFixed(1)}%`, icon: TrendingUp, col: 'indigo' },
                        { label: 'Market Competitive Index', val: `${stats.avgBidsPerReq.toFixed(1)} Bids`, icon: Ship, col: 'purple' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                            <div className={`absolute top-0 right-0 p-8 opacity-5 text-${card.col}-600 group-hover:scale-125 transition-transform duration-700`}><card.icon size={100}/></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Strategic {card.label}</p>
                            <p className="text-3xl font-black text-slate-900">{card.val}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 bg-white p-12 rounded-[4rem] border-2 border-slate-50 shadow-sm flex flex-col italic">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 flex items-center"><PieIcon size={16} className="mr-3 text-blue-600"/> Conversion Distribution</h4>
                        <div className="flex-1 min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-10">
                            {pieData.map((x, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{backgroundColor: x.color}}></div> {x.name}</span>
                                    <span className="text-sm font-black text-slate-900">{x.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border-2 border-slate-50 shadow-sm">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 flex items-center"><BarChart3 size={16} className="mr-3 text-blue-600"/> corridor volume velocity</h4>
                        <div className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { name: 'Mon', v: 4000 }, { name: 'Tue', v: 3000 }, { name: 'Wed', v: 5000 },
                                    { name: 'Thu', v: 4500 }, { name: 'Fri', v: 6000 }, { name: 'Sat', v: 2000 }, { name: 'Sun', v: 1500 }
                                ]}>
                                    <defs>
                                        <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={4} fill="url(#colorV)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-[4rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
                <div className="p-12 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-10 bg-slate-50/30">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Platform Ledger</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Universal Operational Record Stack
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search Reference, Lane, or Entity..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="pl-14 pr-6 py-4 border-2 border-slate-100 rounded-3xl text-sm font-black outline-none focus:border-blue-400 w-full sm:w-[450px] shadow-inner bg-white uppercase transition-all" 
                            />
                        </div>
                        <button onClick={handleExportCSV} className="px-10 py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 italic">
                            <Database size={16}/> EXPORT MASTER LEDGER
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100">
                                <th className="px-12 py-8 italic">FILE REF</th>
                                <th className="px-12 py-8 italic">MODE</th>
                                <th className="px-12 py-8 italic">ENTITY NODE</th>
                                <th className="px-12 py-8 italic">CORRIDORS</th>
                                <th className="px-12 py-8 italic">STATUS</th>
                                <th className="px-12 py-8 text-right italic">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans italic">
                            {paginatedQuotes.map((quote) => (
                                <tr key={quote.id} onClick={() => setSelectedQuote(quote)} className="group hover:bg-blue-50/50 transition-all cursor-pointer">
                                    <td className="px-12 py-8 font-black text-slate-900 text-[13px] tracking-tighter uppercase">{quote.id}</td>
                                    <td className="px-12 py-8">
                                        <div className={`p-4 rounded-[1.5rem] text-white w-fit ${quote.modality === 'SEA' ? 'bg-blue-600 shadow-xl' : 'bg-indigo-600 shadow-xl'} shadow-lg`}>
                                            {quote.modality === 'SEA' ? <Ship size={18} /> : <Plane size={18} />}
                                        </div>
                                    </td>
                                    <td className="px-12 py-8">
                                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-tighter leading-tight">{quote.customerName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-2 truncate max-w-[200px] uppercase tracking-widest">{quote.customerEmail}</p>
                                    </td>
                                    <td className="px-12 py-8">
                                        <div className="flex items-center text-[13px] font-black text-slate-800 uppercase tracking-tighter italic">
                                            {quote.origin} <ArrowRight size={18} className="mx-6 text-blue-200" /> {quote.destination}
                                        </div>
                                    </td>
                                    <td className="px-12 py-8">
                                        <span className={`inline-flex items-center px-5 py-2 rounded-2xl text-[10px] font-black uppercase border-2 tracking-[0.2em] ${quote.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button className="p-4 text-slate-300 hover:text-blue-600 hover:bg-white rounded-[1.5rem] transition-all shadow-sm group-hover:shadow-2xl border-2 border-transparent hover:border-slate-100 active:scale-90">
                                                <Eye size={24} />
                                            </button>
                                            {userRole === 'ADMIN' && (
                                                <button onClick={(e) => handleDelete(e, quote.id)} className="p-4 text-slate-300 hover:text-red-600 hover:bg-white rounded-[1.5rem] transition-all border-2 border-transparent hover:border-red-100 active:scale-90">
                                                    <Trash2 size={24} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {selectedQuote && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/98 backdrop-blur-3xl p-4 animate-fade-in italic">
                <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl overflow-hidden max-h-[96vh] flex flex-col border-t-[20px] border-blue-600">
                    <div className="bg-slate-50 px-14 py-12 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Master Logistics File Registry</h3>
                            <div className="flex items-center gap-4 mt-3 font-bold text-slate-400 text-[11px] uppercase tracking-[0.4em]">
                                <span>FILE_NODE: {selectedQuote.id}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <span className="text-blue-500">REALTIME_GATEWAY_SYNC</span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedQuote(null)} className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 text-slate-300 hover:text-slate-900 shadow-2xl transition-all active:scale-90"><X size={36}/></button>
                    </div>
                    <div className="p-14 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                            <div className="absolute top-0 right-0 p-12 opacity-10"><Activity size={180} /></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-10">
                                <div>
                                    <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-10 border-b border-white/5 pb-4 italic">Operational Protocol</p>
                                    <div className="text-5xl font-black uppercase mb-8 tracking-tighter leading-tight">
                                        {selectedQuote.origin} <ArrowRight className="inline mx-6 text-blue-500" size={40}/> {selectedQuote.destination}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <span className="bg-white/10 px-6 py-2.5 rounded-2xl border border-white/5 text-[11px] font-black uppercase tracking-[0.2em]">{selectedQuote.cargoType}</span>
                                        <span className="text-indigo-400 text-[11px] font-black flex items-center uppercase tracking-[0.2em] italic border border-indigo-400/30 px-6 py-2.5 rounded-2xl bg-indigo-400/5">
                                            {selectedQuote.status} PROTOCOL ACTIVE
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-blue-600/20 p-10 rounded-[3rem] border border-blue-500/30 text-center">
                                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-4">Master Commercial Value</p>
                                    <p className="text-5xl font-black tracking-tighter">{selectedQuote.currency} {selectedQuote.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {selectedQuote.status !== 'CONFIRMED' && (
                            <div className="bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-100 flex flex-col items-center justify-center italic">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Authorize this file for booking</p>
                                <button onClick={() => onUpdateStatus(selectedQuote.id, 'CONFIRMED')} className="bg-blue-600 hover:bg-blue-700 text-white px-20 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xl shadow-2xl active:scale-95 transition-all">CONFIRM MASTER FILE</button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Milestone Tracker */}
                            <div className="space-y-8">
                                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center"><Activity size={20} className="mr-5 text-blue-600"/> GLOBAL EVENT LOG</h4>
                                <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {selectedQuote.milestones && selectedQuote.milestones.length > 0 ? (
                                        selectedQuote.milestones.map((m, i) => (
                                            <div key={i} className="flex gap-6 relative group animate-fade-in">
                                                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:border-blue-400">
                                                    <CheckCircle size={20} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{new Date(m.date).toLocaleString()}</p>
                                                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{m.status}</p>
                                                    {m.notes && <p className="text-xs text-slate-500 mt-2 font-bold italic leading-relaxed">"{m.notes}"</p>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                            <Activity size={40} className="mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No Events Synchronized</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operations Control */}
                            <div className="space-y-8">
                                <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center"><Target size={20} className="mr-5 text-indigo-600"/> LIFECYCLE MANAGEMENT</h4>
                                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-inner space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Event Classification</label>
                                        <select 
                                            value={milestoneStatus}
                                            onChange={e => setMilestoneStatus(e.target.value)}
                                            className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-400 text-sm font-black uppercase italic shadow-inner"
                                        >
                                            <option value="BOOKING_CONFIRMED">Booking Authorized</option>
                                            <option value="CARGO_PICKED_UP">Collection Synchronized</option>
                                            <option value="DEPARTED_POL">Origin Departure</option>
                                            <option value="AT_SEA">Vessel in Transit</option>
                                            <option value="ARRIVED_POD">Terminal Arrival</option>
                                            <option value="CUSTOMS_CLEARED">Fiscal Release</option>
                                            <option value="DELIVERED">Proof of Delivery</option>
                                            <option value="EXCEPTION">Operation Exception</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operational Notes</label>
                                        <textarea 
                                            value={milestoneNotes}
                                            onChange={e => setMilestoneNotes(e.target.value)}
                                            placeholder="Specify event details..."
                                            className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl outline-none focus:border-blue-400 text-sm font-bold h-32 resize-none shadow-inner"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAddMilestoneLocal}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all italic"
                                    >
                                        <Plus size={18} /> REGISTER GLOBAL EVENT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Reports;