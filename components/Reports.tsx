
import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, ChevronLeft, ChevronRight, X, Activity, CheckCircle, ArrowRight, Plane, Ship, Mail, Send, Bell, Loader2, FileText, BarChart3, Database, Filter, ExternalLink } from 'lucide-react';
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
              onNotify('success', `Status update recorded and Outlook gateway initialized.`);
              
              const subject = `Shipment Update: ${selectedQuote.id} | Status: ${milestoneStatus.replace(/_/g, ' ')}`;
              const body = `Dear Client,\n\nYour shipment ${selectedQuote.id} has been updated.\n\nNEW STATUS: ${milestoneStatus.replace(/_/g, ' ')}\nOPERATIONAL NOTES: ${milestoneNotes || 'Cargo is progressing as scheduled.'}\n\nTracking link: https://portal.uniqueccs.com/track/${selectedQuote.id}\n\nBest Regards,\nUnique CCS Operations Team`;
              window.location.href = `mailto:${selectedQuote.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          }, 1000);
      } else {
          onNotify('success', 'Internal milestone recorded successfully.');
      }
      setMilestoneNotes('');
  };

  const handleExportCSV = () => {
    onNotify('info', 'Compiling platform ledger data...');
    setTimeout(() => {
        const headers = ["ID", "Modality", "Customer", "Origin", "Destination", "Amount", "Currency", "Status", "Date"];
        const rows = quotations.map(q => [q.id, q.modality, q.customerName || q.customerEmail, q.origin, q.destination, q.amount, q.currency, q.status, q.date]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `UCCS_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        onNotify('success', 'Ledger export downloaded.');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
         <div className="p-10 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-50/50">
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Platform Ledger & Operations</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Unified Logistics Master Control Record</p>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
             <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
               <input 
                type="text" 
                placeholder="Search by Ref, Lane, or Corporate Account..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-blue-50 w-full sm:w-[400px] shadow-inner bg-white uppercase transition-all" 
               />
             </div>
             <button onClick={handleExportCSV} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95">
                <Database size={14}/> EXPORT LEDGER (CSV)
             </button>
           </div>
         </div>

         <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-white">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center gap-2"><Filter size={12}/> Mode Filter:</span>
            {['ALL', 'SEA', 'AIR'].map(m => (
                <button 
                    key={m} 
                    onClick={() => onNotify('info', `Filtering by ${m}...`)}
                    className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:border-blue-500 transition-all text-slate-500 hover:text-blue-600"
                >
                    {m}
                </button>
            ))}
         </div>

         <div className="flex-1 overflow-x-auto">
           <table className="w-full text-left">
             <thead>
               <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100">
                 <th className="px-10 py-6">FILE REFERENCE</th>
                 <th className="px-10 py-6">LOGISTICS MODE</th>
                 <th className="px-10 py-6">CLIENT / ENTITY</th>
                 <th className="px-10 py-6">ACTIVE ROUTE</th>
                 <th className="px-10 py-6">COMMERCIAL VALUE</th>
                 <th className="px-10 py-6">STATUS</th>
                 <th className="px-10 py-6 text-right">OPS CONTROL</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 font-sans">
               {paginatedQuotes.map((quote) => (
                 <tr key={quote.id} className="group hover:bg-blue-50/30 transition-all">
                   <td className="px-10 py-7 font-black text-slate-900 text-xs tracking-tight italic">{quote.id}</td>
                   <td className="px-10 py-7">
                      <div className={`p-3 rounded-2xl text-white w-fit ${quote.modality === 'SEA' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-indigo-600 shadow-indigo-500/20'} shadow-lg`}>
                        {quote.modality === 'SEA' ? <Ship size={16} /> : <Plane size={16} />}
                      </div>
                   </td>
                   <td className="px-10 py-7">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tighter leading-tight">{quote.customerName || 'SPOT ACCOUNT'}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 truncate max-w-[150px]">{quote.customerEmail}</p>
                   </td>
                   <td className="px-10 py-7">
                     <div className="flex items-center text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                       {quote.origin} <ArrowRight size={14} className="mx-4 text-blue-200" /> {quote.destination}
                     </div>
                   </td>
                   <td className="px-10 py-7 font-black text-slate-900 text-sm tracking-tighter">{quote.currency} {quote.amount.toLocaleString()}</td>
                   <td className="px-10 py-7">
                     <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-[0.1em] ${quote.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-100'}`}>
                       {quote.status}
                     </span>
                   </td>
                   <td className="px-10 py-7 text-right">
                     <button onClick={() => setSelectedQuote(quote)} className="p-3 text-slate-300 hover:text-blue-600 hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-lg border border-transparent hover:border-slate-100">
                        <BarChart3 size={20} />
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         
         <div className="p-10 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">File {filteredQuotes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length} active records</span>
            <div className="flex space-x-3">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-4 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 shadow-xl shadow-slate-200/50 hover:bg-slate-50 transition-all"><ChevronLeft size={20}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-4 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 shadow-xl shadow-slate-200/50 hover:bg-slate-50 transition-all"><ChevronRight size={20}/></button>
            </div>
         </div>
       </div>

       {selectedQuote && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 animate-fade-in">
            <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl overflow-hidden max-h-[95vh] flex flex-col border-t-[14px] border-blue-600">
                <div className="bg-slate-50 px-12 py-10 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Operational Master Logistics File</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">TRACKING REF: {selectedQuote.id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">MODALITY: ${selectedQuote.modality} PREMIUM</span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedQuote(null)} className="p-4 bg-white rounded-3xl border border-slate-200 text-slate-400 hover:text-slate-800 shadow-xl transition-all active:scale-90"><X size={32}/></button>
                </div>
                
                <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden group border border-slate-800">
                             <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Activity size={120} /></div>
                             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-8 border-b border-white/10 pb-3 flex justify-between">
                                <span>Manifest / Equipment Data</span>
                                <span>CONFIRMED</span>
                             </p>
                             <div className="text-3xl font-black uppercase mb-8 tracking-tighter leading-tight italic">
                                {selectedQuote.origin} <ArrowRight className="inline mx-4 text-blue-500" size={24}/> {selectedQuote.destination}
                             </div>
                             <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-300">
                                <span className="bg-white/10 px-5 py-2 rounded-full border border-white/5 uppercase tracking-widest">{selectedQuote.cargoType}</span>
                                <span className="text-indigo-400 flex items-center uppercase tracking-widest"><CheckCircle size={16} className="mr-2"/> LOADED ON BOARD</span>
                             </div>
                        </div>
                        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 flex flex-col justify-center">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Client Correspondence Gateway</p>
                             <div className="text-xl font-black text-slate-900 tracking-tighter mb-1 uppercase italic">{selectedQuote.customerName || 'Spot Account'}</div>
                             <div className="text-xs font-bold text-slate-500 mb-6 truncate">{selectedQuote.customerEmail}</div>
                             <div className="text-4xl font-black text-blue-600 tracking-tighter mb-8">{selectedQuote.currency} {selectedQuote.amount.toLocaleString()}</div>
                             <div className="flex gap-4">
                                <button className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-3">
                                    <Mail size={16}/> CONTACT CLIENT
                                </button>
                                <button className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-3">
                                    <FileText size={16}/> PRO-FORMA INVOICE
                                </button>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center">
                            <Activity size={20} className="mr-4 text-blue-600"/> GLOBAL OPERATIONAL MILESTONE LOG
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-1 bg-slate-50 p-10 rounded-[3rem] border border-slate-200 space-y-6 shadow-inner">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">New Event Entry</p>
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Log Status</label>
                                    <select value={milestoneStatus} onChange={e => setMilestoneStatus(e.target.value as any)} className="w-full p-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm">
                                        <option value="FLIGHT_DEPARTED">Vessel/Flight Departed</option>
                                        <option value="FLIGHT_ARRIVED">Vessel/Flight Arrived</option>
                                        <option value="CUSTOMS_CLEARED">Customs Released</option>
                                        <option value="DELIVERED">Delivered to Consignee</option>
                                        <option value="EXCEPTION">Operational Exception</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Operational Comments</label>
                                    <textarea placeholder="Technical details for the client..." value={milestoneNotes} onChange={e => setMilestoneNotes(e.target.value)} className="w-full p-5 border-2 border-slate-100 rounded-[2rem] text-xs font-bold outline-none h-36 shadow-inner resize-none transition-all focus:border-blue-200" />
                                </div>
                                
                                <div className="space-y-3 pt-4">
                                    <button onClick={() => handleUpdateMilestone(true)} disabled={isUpdatingCustomer} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95">
                                        {isUpdatingCustomer ? <Loader2 className="animate-spin" size={16}/> : <ExternalLink size={16}/>}
                                        DISPATCH VIA OUTLOOK
                                    </button>
                                    <button onClick={() => handleUpdateMilestone(false)} className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-slate-50 active:scale-95">
                                        INTERNAL LOG ONLY
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-8 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar bg-slate-50/30 p-8 rounded-[3rem] border border-slate-50">
                                {selectedQuote.milestones?.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs tracking-[0.4em] italic opacity-30">Awaiting first milestone entry...</div>
                                ) : selectedQuote.milestones?.map((m, i) => (
                                    <div key={i} className="flex gap-8 relative group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-900 border-4 border-slate-100 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                            <CheckCircle size={28} className="text-blue-500" />
                                        </div>
                                        <div className="pt-2 flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{m.status.replace(/_/g, ' ')}</p>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{new Date(m.date).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 leading-relaxed italic border-l-4 border-blue-50 pl-5 mb-4">"{m.notes || 'Status automatically recorded by UCCS gateway.'}"</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Ops Lead: {m.updatedBy}</span>
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
