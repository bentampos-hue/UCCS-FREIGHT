import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, ChevronLeft, ChevronRight, X, Activity, CheckCircle, ArrowRight, Plane, Ship, Mail, Send, Bell, Loader2, FileText, BarChart3, Database, Filter, ExternalLink, RefreshCw, Globe, User } from 'lucide-react';
import { Quotation, QuoteStatus, SharedProps, Milestone, ShipmentMilestoneStatus } from '../types';

interface ReportsProps extends SharedProps {
  quotations: Quotation[];
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onAddMilestone: (id: string, milestone: Milestone) => void;
  defaultFilter?: QuoteStatus | 'ALL';
}

const Reports: React.FC<ReportsProps> = ({ quotations, onUpdateStatus, onAddMilestone, defaultFilter = 'ALL', onNotify, userRole, currentUser, settings }) => {
  const [filter, setFilter] = useState<QuoteStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [milestoneStatus, setMilestoneStatus] = useState<ShipmentMilestoneStatus>('CARGO_PICKED_UP');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    if (defaultFilter) setFilter(defaultFilter);
  }, [defaultFilter]);

  const filteredQuotes = quotations.filter(q => {
    const searchStr = `${q.id} ${q.customerEmail} ${q.customerName || ''} ${q.origin} ${q.destination}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || q.status === filter;
    return matchesSearch && matchesFilter;
  });

  const paginatedQuotes = filteredQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  const handleUpdateMilestone = (notifyCustomer = false) => {
      if (!selectedQuote) return;
      const milestone: Milestone = {
          status: milestoneStatus,
          date: new Date().toISOString(),
          notes: milestoneNotes,
          updatedBy: currentUser.name
      };
      onAddMilestone(selectedQuote.id, milestone);

      if (notifyCustomer) {
          setIsUpdatingCustomer(true);
          setTimeout(() => {
              setIsUpdatingCustomer(false);
              onNotify('success', `Manual update recorded. Opening Outlook Gateway for Client notification.`);
              
              const subject = `Logistics Update: ${selectedQuote.id} | ${milestoneStatus.replace(/_/g, ' ')}`;
              const body = `Dear Client,\n\nWe have updated the status of your shipment ${selectedQuote.id}.\n\nCURRENT STATUS: ${milestoneStatus.replace(/_/g, ' ')}\nREMARKS: ${milestoneNotes || 'Shipment is progressing according to schedule.'}\n\nYou can track the full lifecycle here: https://uniqueccs-portal.web.app/track/${selectedQuote.portalToken}\n\nBest Regards,\nUnique CCS Operations`;
              window.location.href = `mailto:${selectedQuote.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          }, 1000);
      } else {
          onNotify('success', 'Internal ops milestone recorded.');
      }
      setMilestoneNotes('');
  };

  const handleAutoTrack = () => {
      if (!selectedQuote) return;
      setIsTracking(true);
      onNotify('info', `Syncing with Global Carrier API (AIS/Vizion Mock)...`);
      
      // Module 3: Mock Automated Tracking Logic
      setTimeout(() => {
          setIsTracking(false);
          const autoMilestone: Milestone = {
              status: 'AT_SEA',
              date: new Date().toISOString(),
              location: 'North Atlantic Basin',
              notes: 'AIS Signal detected. Vessel moving at 14.5 knots. Est POD arrival T-4 days.',
              updatedBy: 'UCCS AI Bot',
              isAutomated: true
          };
          onAddMilestone(selectedQuote.id, autoMilestone);
          onNotify('success', 'Real-time AIS Data Synced. Milestones updated automatically.');
      }, 2500);
  };

  const handleExportCSV = () => {
    onNotify('info', 'Compiling Platform Ledger Analytics...');
    setTimeout(() => {
        const headers = ["ID", "Modality", "Customer", "Contact Email", "Origin", "Destination", "Amount", "Currency", "Status", "Issue Date"];
        const rows = quotations.map(q => [
            q.id, 
            q.modality, 
            q.customerName || 'N/A', 
            q.customerEmail,
            q.origin, 
            q.destination, 
            q.amount, 
            q.currency, 
            q.status, 
            q.date
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `UCCS_Ledger_Export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        onNotify('success', 'CSV Ledger downloaded successfully.');
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
         <div className="p-12 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-10 bg-slate-50/30">
           <div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Platform Ledger</h2>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Universal Logistics Record Stack
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
                <Database size={16}/> EXPORT CSV
             </button>
           </div>
         </div>

         <div className="p-6 border-b border-slate-50 flex items-center gap-8 bg-white overflow-x-auto custom-scrollbar">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-10 flex items-center gap-3 shrink-0 italic"><Filter size={14}/> Operational Segment:</span>
            {['ALL RECORDS', 'SEA FREIGHT', 'AIR FREIGHT', 'PENDING APPROVAL', 'BOOKED'].map(m => (
                <button 
                    key={m} 
                    onClick={() => onNotify('info', `Segmenting by ${m}...`)}
                    className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 border-slate-50 hover:border-blue-500 transition-all text-slate-400 hover:text-blue-600 shrink-0 italic"
                >
                    {m}
                </button>
            ))}
         </div>

         <div className="flex-1 overflow-x-auto">
           <table className="w-full text-left">
             <thead>
               <tr className="bg-white text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100">
                 <th className="px-12 py-8 italic">FILE REF</th>
                 <th className="px-12 py-8 italic">MODE</th>
                 <th className="px-12 py-8 italic">CORPORATE ENTITY</th>
                 <th className="px-12 py-8 italic">LANES</th>
                 <th className="px-12 py-8 italic">COMMERCIALS</th>
                 <th className="px-12 py-8 italic">LIFECYCLE</th>
                 <th className="px-12 py-8 text-right italic">CTRL</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 font-sans">
               {paginatedQuotes.map((quote) => (
                 <tr key={quote.id} className="group hover:bg-blue-50/50 transition-all">
                   <td className="px-12 py-8 font-black text-slate-900 text-[13px] tracking-tighter italic">{quote.id}</td>
                   <td className="px-12 py-8">
                      <div className={`p-4 rounded-[1.5rem] text-white w-fit ${quote.modality === 'SEA' ? 'bg-blue-600 shadow-xl shadow-blue-500/20' : 'bg-indigo-600 shadow-xl shadow-indigo-500/20'} shadow-lg`}>
                        {quote.modality === 'SEA' ? <Ship size={18} /> : <Plane size={18} />}
                      </div>
                   </td>
                   <td className="px-12 py-8">
                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-tighter italic leading-tight">{quote.customerName || 'SPOT ACCOUNT'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 truncate max-w-[200px] uppercase tracking-widest italic">{quote.customerEmail}</p>
                   </td>
                   <td className="px-12 py-8">
                     <div className="flex items-center text-[13px] font-black text-slate-800 uppercase tracking-tighter italic">
                       {quote.origin} <ArrowRight size={18} className="mx-6 text-blue-200" /> {quote.destination}
                     </div>
                   </td>
                   <td className="px-12 py-8 font-black text-slate-900 text-lg tracking-tighter italic">{quote.currency} {quote.amount.toLocaleString()}</td>
                   <td className="px-12 py-8">
                     <span className={`inline-flex items-center px-5 py-2 rounded-2xl text-[10px] font-black uppercase border-2 tracking-[0.2em] italic ${quote.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-xl shadow-emerald-500/10' : 'bg-blue-50 text-blue-700 border-blue-100 shadow-xl shadow-blue-500/10'}`}>
                       {quote.status}
                     </span>
                   </td>
                   <td className="px-12 py-8 text-right">
                     <button onClick={() => setSelectedQuote(quote)} className="p-4 text-slate-300 hover:text-blue-600 hover:bg-white rounded-[1.5rem] transition-all shadow-sm group-hover:shadow-2xl border-2 border-transparent hover:border-slate-100 active:scale-90">
                        <BarChart3 size={24} />
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         
         <div className="p-12 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Record {filteredQuotes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length} active files</span>
            <div className="flex space-x-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-5 rounded-[1.75rem] bg-white border-2 border-slate-200 disabled:opacity-30 shadow-2xl shadow-slate-200/50 hover:bg-slate-50 transition-all active:scale-95"><ChevronLeft size={24}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-5 rounded-[1.75rem] bg-white border-2 border-slate-200 disabled:opacity-30 shadow-2xl shadow-slate-200/50 hover:bg-slate-50 transition-all active:scale-95"><ChevronRight size={24}/></button>
            </div>
         </div>
       </div>

       {selectedQuote && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/98 backdrop-blur-3xl p-4 animate-fade-in">
            <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl overflow-hidden max-h-[96vh] flex flex-col border-t-[20px] border-blue-600">
                <div className="bg-slate-50 px-14 py-12 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Operational Master Logistics File</h3>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">FILE REF: {selectedQuote.id}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] italic">LIVE OPS HUB</span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedQuote(null)} className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 text-slate-300 hover:text-slate-900 shadow-2xl transition-all active:scale-90"><X size={36}/></button>
                </div>
                
                <div className="p-14 overflow-y-auto custom-scrollbar flex-1 space-y-14">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-[0_40px_100px_rgba(0,0,0,0.3)] relative overflow-hidden group border border-white/5">
                             <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-[2000ms]"><Activity size={180} /></div>
                             <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-5 relative z-10">
                                <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] italic">Operational Metadata</p>
                                <button onClick={handleAutoTrack} disabled={isTracking} className="flex items-center gap-2 bg-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full hover:bg-blue-500 transition-all animate-pulse">
                                    {isTracking ? <RefreshCw className="animate-spin" size={10}/> : <RefreshCw size={10}/>} SYNC AIS TRACKING
                                </button>
                             </div>
                             <div className="text-4xl font-black uppercase mb-10 tracking-tighter leading-tight italic relative z-10">
                                {selectedQuote.origin} <ArrowRight className="inline mx-6 text-blue-500" size={32}/> {selectedQuote.destination}
                             </div>
                             <div className="flex flex-wrap items-center gap-6 text-[11px] font-black text-slate-300 relative z-10">
                                <span className="bg-white/10 px-6 py-2.5 rounded-2xl border border-white/5 uppercase tracking-[0.2em] italic">{selectedQuote.cargoType}</span>
                                <span className="text-indigo-400 flex items-center uppercase tracking-[0.2em] italic border border-indigo-400/30 px-6 py-2.5 rounded-2xl bg-indigo-400/5"><CheckCircle size={18} className="mr-3"/> LOADED ON BOARD</span>
                             </div>
                        </div>
                        <div className="bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-100 flex flex-col justify-center shadow-inner">
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 border-b border-slate-200 pb-3 italic">Client Communication Gateway</p>
                             <div className="text-2xl font-black text-slate-900 tracking-tighter mb-2 uppercase italic">{selectedQuote.customerName || 'SPOT ACCOUNT'}</div>
                             <div className="text-sm font-bold text-slate-500 mb-8 truncate tracking-widest italic">{selectedQuote.customerEmail}</div>
                             <div className="text-5xl font-black text-blue-600 tracking-tighter mb-10 italic">{selectedQuote.currency} {selectedQuote.amount.toLocaleString()}</div>
                             <div className="flex gap-6">
                                <button className="flex-1 py-5 bg-white border-3 border-slate-200 rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-4 italic active:scale-95">
                                    <Mail size={20}/> CONTACT CLIENT
                                </button>
                                <button className="flex-1 py-5 bg-white border-3 border-slate-200 rounded-3xl text-[12px] font-black uppercase tracking-[0.2em] hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-4 italic active:scale-95">
                                    <FileText size={20}/> INVOICE STACK
                                </button>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] flex items-center italic">
                            <Activity size={24} className="mr-5 text-blue-600"/> UNIVERSAL SHIPMENT MILESTONE LOG
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
                            <div className="lg:col-span-1 bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-100 space-y-8 shadow-inner italic">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 border-b border-slate-200 pb-3 italic">New Event Intake</p>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block italic">Lifecycle Stage</label>
                                    <select value={milestoneStatus} onChange={e => setMilestoneStatus(e.target.value as any)} className="w-full p-5 border-3 border-slate-100 rounded-3xl text-[11px] font-black uppercase tracking-widest bg-white outline-none focus:border-blue-400 transition-all shadow-xl italic">
                                        <option value="FLIGHT_DEPARTED">Carrier Departed</option>
                                        <option value="AT_SEA">Vessel at Sea (AIS Sync)</option>
                                        <option value="FLIGHT_ARRIVED">Carrier Arrived (POD)</option>
                                        <option value="CUSTOMS_CLEARED">Customs Final Release</option>
                                        <option value="OUT_FOR_DELIVERY">Out for Final Delivery</option>
                                        <option value="DELIVERED">Fulfillment Complete</option>
                                        <option value="EXCEPTION">Logistics Exception</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block italic">Operational Commentary</label>
                                    <textarea placeholder="Enter technical remarks for the corporate gateway..." value={milestoneNotes} onChange={e => setMilestoneNotes(e.target.value)} className="w-full p-6 border-3 border-slate-100 rounded-[3rem] text-[13px] font-bold outline-none h-44 shadow-inner resize-none transition-all focus:border-blue-400 bg-white" />
                                </div>
                                
                                <div className="space-y-4 pt-6">
                                    <button onClick={() => handleUpdateMilestone(true)} disabled={isUpdatingCustomer} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black uppercase tracking-widest rounded-3xl transition-all shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-4 active:scale-95 italic">
                                        {isUpdatingCustomer ? <Loader2 className="animate-spin" size={20}/> : <ExternalLink size={20}/>}
                                        DISPATCH VIA OUTLOOK
                                    </button>
                                    <button onClick={() => handleUpdateMilestone(false)} className="w-full py-5 bg-white border-3 border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-3xl transition-all hover:bg-slate-50 active:scale-95 italic">
                                        INTERNAL OPS ONLY
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-10 max-h-[650px] overflow-y-auto pr-8 custom-scrollbar bg-slate-50/20 p-10 rounded-[4rem] border border-slate-50 shadow-inner italic">
                                {selectedQuote.milestones?.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-sm tracking-[0.5em] italic opacity-40">Initializing first record entry...</div>
                                ) : selectedQuote.milestones?.map((m, i) => (
                                    <div key={i} className="flex gap-10 relative group bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:border-blue-200 transition-all duration-500">
                                        <div className={`w-20 h-20 rounded-[2rem] border-[6px] border-slate-100 flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-6 transition-transform ${m.isAutomated ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                                            {m.isAutomated ? <RefreshCw size={32} /> : <CheckCircle size={32} className="text-blue-500" />}
                                        </div>
                                        <div className="pt-3 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">{m.status.replace(/_/g, ' ')}</p>
                                                    {m.location && <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 flex items-center gap-2"><Globe size={10}/> {m.location}</p>}
                                                </div>
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 italic">{new Date(m.date).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[15px] font-bold text-slate-500 leading-relaxed italic border-l-8 border-blue-50 pl-8 mb-6">"{m.notes || 'Status automatically recorded by UCCS gateway stack.'}"</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2">
                                                    <User size={12}/> {m.updatedBy}
                                                </span>
                                                {m.isAutomated && <span className="bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest">REAL-TIME DATA</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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