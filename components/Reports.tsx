import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, ArrowRight, Download, DollarSign, TrendingUp, Ship, Plane, FileText, ChevronRight, X, Calculator, Clock,
  Filter, Package, Truck, LayoutGrid
} from 'lucide-react';
import { SharedProps, Job, AppView, Modality } from '../types';
import { repo } from '../services/repository';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const Reports: React.FC<SharedProps> = ({ onNavigate, settings, onNotify }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');

  useEffect(() => {
    repo.getJobs().then(setJobs);
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = `${j.reference} ${j.id}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
      const matchModality = modalityFilter === 'ALL' || j.intakeData.modality === modalityFilter;
      return matchSearch && matchStatus && matchModality;
    });
  }, [jobs, searchTerm, statusFilter, modalityFilter]);

  const stats = useMemo(() => {
    const revenue = filteredJobs.reduce((s, j) => {
      const accepted = j.quoteVersions.find(v => v.status === 'CONFIRMED' || v.status === 'SENT');
      return s + (accepted?.sellPrice || 0);
    }, 0);
    const activeTransit = jobs.filter(j => j.status === 'SHIPMENT').length;
    return { count: filteredJobs.length, revenue, activeTransit };
  }, [filteredJobs, jobs]);

  return (
    <div className="max-w-screen-2xl mx-auto px-10 pb-24 animate-slide-up italic flex flex-col h-full">
      <header className="flex justify-between items-center py-14">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase italic">Commercial Registry & Ledger</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">Financial settlement repository for ecosystem nodes under UAE Jurisdiction.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="rounded-2xl" onClick={() => onNotify('info', 'Dataset Exporting...')}>
            <Download size={18}/> Export CSV
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => onNotify('info', 'Report engine initialized.')}>
            <FileText size={18}/> Generate PDF Summary
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-8 mb-10">
         <Card 
            onClick={() => setStatusFilter('ALL')}
            className={`p-10 cursor-pointer transition-all border-none shadow-xl card-lift ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white'}`}
         >
            <FileText size={24} className={statusFilter === 'ALL' ? 'text-blue-400' : 'text-slate-400'} />
            <p className={`text-[10px] font-black mt-5 uppercase tracking-widest ${statusFilter === 'ALL' ? 'text-slate-400' : 'text-slate-500'}`}>Global Node Registry</p>
            <p className="text-4xl font-black mt-2 tracking-tighter">{jobs.length}</p>
         </Card>
         <Card 
            onClick={() => setStatusFilter('SHIPMENT')}
            className={`p-10 cursor-pointer transition-all border-none shadow-xl card-lift ${statusFilter === 'SHIPMENT' ? 'bg-blue-600 text-white' : 'bg-white'}`}
         >
            <TrendingUp size={24} className={statusFilter === 'SHIPMENT' ? 'text-white' : 'text-blue-500'} />
            <p className={`text-[10px] font-black mt-5 uppercase tracking-widest ${statusFilter === 'SHIPMENT' ? 'text-blue-200' : 'text-slate-500'}`}>Active Transit</p>
            <p className="text-4xl font-black mt-2 tracking-tighter">{stats.activeTransit}</p>
         </Card>
         <Card className="p-10 border-none bg-white shadow-xl">
            <DollarSign size={24} className="text-emerald-500" />
            <p className="text-[10px] font-black text-slate-500 mt-5 uppercase tracking-widest">Projected Settlement</p>
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{settings.baseCurrency} {stats.revenue.toLocaleString()}</p>
         </Card>
         <Card className="p-10 border-none bg-white shadow-xl">
            <Calculator size={24} className="text-indigo-500" />
            <p className="text-[10px] font-black text-slate-500 mt-5 uppercase tracking-widest">Registry Yield Avg</p>
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">15.2%</p>
         </Card>
      </div>

      <div className="flex gap-4 mb-6">
         <div className="relative flex-1 max-w-md">
           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Reference, Node ID..." className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm w-full outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"/>
         </div>
         <select className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
           <option value="ALL">All Phases</option>
           <option value="DRAFT">DRAFT</option>
           <option value="MARKET">MARKET</option>
           <option value="QUOTES">QUOTES</option>
           <option value="SHIPMENT">SHIPMENT</option>
           <option value="COMPLETED">COMPLETED</option>
         </select>
         <select className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}>
           <option value="ALL">All Modalities</option>
           <option value="SEA">SEA FREIGHT</option>
           <option value="AIR">AIR FREIGHT</option>
           <option value="ROAD">ROAD FREIGHT</option>
           <option value="COURIER">COURIER</option>
         </select>
      </div>

      <Card className="p-0 border-white/20 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left font-bold italic">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-black/[0.03] z-10">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Corridor</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.02]">
              {filteredJobs.map(job => {
                const activeQuote = job.quoteVersions.find(v => v.status === 'CONFIRMED' || v.status === 'SENT') || job.quoteVersions[0];
                return (
                  <tr key={job.id} className="hover:bg-blue-50/20 transition-all cursor-pointer group" onClick={() => setSelectedJob(job)}>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{job.reference}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase italic tracking-widest">Node: {job.id.slice(-8)}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3 text-xs text-slate-600 uppercase font-black">
                        {job.intakeData.modality === 'SEA' && <Ship size={14} className="text-blue-500" />}
                        {job.intakeData.modality === 'AIR' && <Plane size={14} className="text-indigo-500" />}
                        {job.intakeData.modality === 'ROAD' && <Truck size={14} className="text-emerald-500" />}
                        {job.intakeData.modality === 'COURIER' && <Package size={14} className="text-amber-500" />}
                        {job.intakeData.origin} <ArrowRight size={14} className="text-slate-300" /> {job.intakeData.destination}
                      </div>
                    </td>
                    <td className="px-10 py-6 font-black text-slate-900">
                       {settings.baseCurrency} {(activeQuote?.sellPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-10 py-6"><Badge color={job.status === 'SHIPMENT' ? 'indigo' : 'blue'}>{job.status}</Badge></td>
                    <td className="px-10 py-6 text-right">
                       <button className="p-3 text-slate-300 group-hover:text-blue-600 transition-all hover:bg-blue-100 rounded-xl"><Eye size={20}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredJobs.length === 0 && (
            <div className="p-20 text-center text-slate-300 font-black uppercase italic">No ledger entries synchronized for this filter node.</div>
          )}
        </div>
      </Card>

      {/* LEDGER DETAIL DRAWER */}
      {selectedJob && (
         <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedJob(null)}>
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto custom-scrollbar animate-slide-right flex flex-col italic" onClick={e => e.stopPropagation()}>
               <header className="p-12 bg-slate-900 text-white flex justify-between items-start border-b-[12px] border-blue-600">
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Settlement Node Detail</h2>
                    <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">Registry: {selectedJob.reference}</p>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={32}/></button>
               </header>

               <main className="p-12 space-y-16 flex-1">
                  <div className="space-y-8">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic"><Calculator size={20} className="mr-4 text-blue-600"/> VALUATION ARCHITECTURE</h4>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="p-10 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] shadow-inner">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Buy Protocol (Total)</p>
                           <p className="text-3xl font-black text-slate-900 tracking-tighter">{settings.baseCurrency} {(selectedJob.quoteVersions[0]?.buyPrice || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-10 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] shadow-xl shadow-blue-500/10">
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Settlement Signal (Sell)</p>
                           <p className="text-3xl font-black text-blue-900 tracking-tighter">{settings.baseCurrency} {(selectedJob.quoteVersions[0]?.sellPrice || 0).toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic"><Clock size={20} className="mr-4 text-emerald-600"/> LIFECYCLE CHRONOLOGY</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-xs font-black text-slate-500 uppercase">Registry Entry Initialized</span>
                           <span className="text-xs font-black text-slate-900 italic">{new Date(selectedJob.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-xs font-black text-slate-500 uppercase">Last Registry Mutation</span>
                           <span className="text-xs font-black text-slate-900 italic">{new Date(selectedJob.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-xs font-black text-slate-500 uppercase">Current Phase Protocol</span>
                           <span className="text-xs font-black text-blue-600 italic uppercase">{selectedJob.status}</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-8">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic"><FileText size={20} className="mr-4 text-amber-600"/> REGULATORY SIGNALS</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Commodity Class</p>
                           <p className="text-sm font-black text-slate-800 uppercase">{selectedJob.intakeData.commodity}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-2">HS Code Signal</p>
                           <p className="text-sm font-black text-slate-800 font-mono">{selectedJob.intakeData.hsCode || 'NOT DECLARED'}</p>
                        </div>
                     </div>
                  </div>
               </main>

               <footer className="p-12 border-t border-slate-100 flex gap-5">
                  <Button className="flex-1 py-5 rounded-2xl text-base font-black italic uppercase tracking-widest" onClick={() => { setSelectedJob(null); onNavigate(AppView.PROJECT_CENTER, { jobId: selectedJob.id }); }}>Access Node Controller <ArrowRight size={20}/></Button>
                  <Button variant="outline" className="flex-1 py-5 rounded-2xl font-bold uppercase italic" onClick={() => onNotify('info', 'PDF Statement engine synchronized.')}>PDF Ledger Extrusion</Button>
               </footer>
            </div>
         </div>
      )}
    </div>
  );
};

export default Reports;