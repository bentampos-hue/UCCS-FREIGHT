
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Ship, Plane, ChevronRight, Truck, Trash2, Send, FileText, 
  History, Zap, X, Network, BarChart3, FileDown, ShieldCheck, Mail, DollarSign,
  Package, Globe, ShieldAlert, Anchor, Activity, Clock, Box, Calendar, AlertCircle,
  TrendingUp, Scale, LayoutGrid, CheckCircle2, MoreVertical, Layers, Calculator,
  List, Columns, CheckSquare, Square, Download, Share2, ArrowRight, ArrowLeft,
  MailSearch, Terminal, User, ExternalLink, Info, Calculator as CalcIcon
} from 'lucide-react';
import { Job, SharedProps, Vendor, Customer, JobStatus, QuoteVersion, CargoLine, Modality, IntakeData, VendorBid, QuoteLine, CommunicationMessage } from '../types';
import { repo } from '../services/repository';
import { calculateCargoMetrics, calculateJobCompleteness, generateReference, validatePhaseAdvance } from '../utils/logistics';
import { pdfService } from '../services/pdfService';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface JobManagerProps extends SharedProps {
  vendors: Vendor[];
  customers: Customer[];
  users: any[];
  initialJobId?: string | null;
  onClearJobId?: () => void;
  onDeleteJob: (id: string) => void;
}

type SubTab = 'INTAKE' | 'MARKET' | 'QUOTES' | 'TRANSPORT' | 'LEDGER' | 'TIMELINE' | 'AUDIT';
type ViewMode = 'LIST' | 'GRID' | 'KANBAN';

const JobManager: React.FC<JobManagerProps> = ({ 
  currentUser, onNotify, vendors, customers, initialJobId, onClearJobId, onDeleteJob, settings 
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'EDITOR'>('REGISTRY');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('uccs_job_view_mode') as ViewMode) || 'LIST';
  });
  const [editorSubTab, setEditorSubTab] = useState<SubTab>('INTAKE');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualBid, setManualBid] = useState({ vendorId: '', amount: 0, transit: 14 });
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  // Fixed: Added missing handleToggleSelect function
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    repo.getJobs().then(setJobs);
    if (initialJobId) {
      repo.getJobById(initialJobId).then(found => {
        if (found) { setCurrentJob(found); setActiveTab('EDITOR'); }
        if (onClearJobId) onClearJobId();
      });
    }
  }, [initialJobId]);

  useEffect(() => {
    localStorage.setItem('uccs_job_view_mode', viewMode);
  }, [viewMode]);

  const syncJob = async (updated: Job, silent = false) => {
    try {
      updated.completenessScore = calculateJobCompleteness(updated.intakeData);
      updated.updatedAt = new Date().toISOString();
      await repo.saveJob(updated, currentUser);
      setCurrentJob({ ...updated });
      setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
      if (!silent) onNotify('success', 'Operational Node Synchronized');
    } catch (e) {
      onNotify('error', 'Sync Protocol Failure.');
    }
  };

  const handleAdvance = async () => {
    if (!currentJob) return;
    const validation = validatePhaseAdvance(currentJob.status, currentJob.intakeData);
    if (!validation.ok) return validation.errors.forEach(e => onNotify('warning', e));
    const phases: JobStatus[] = ['DRAFT', 'INTAKE', 'MARKET', 'QUOTES', 'AWARDED', 'SHIPMENT', 'COMPLETED'];
    const nextIdx = phases.indexOf(currentJob.status) + 1;
    if (nextIdx < phases.length) {
      const updated = {...currentJob, status: phases[nextIdx]};
      if (['MARKET', 'SHIPMENT'].includes(updated.status)) {
        updated.reference = generateReference(updated.intakeData.modality, updated.status, jobs.length);
      }
      syncJob(updated);
    }
  };

  const handleBroadcastRFQ = () => {
    if (selectedVendors.length === 0) return onNotify('warning', 'Select providers for RFQ broadcasting.');
    const providerEmails = vendors.filter(v => selectedVendors.includes(v.id)).map(v => v.contacts[0]?.email).filter(Boolean).join(',');
    const subject = `RFQ - UCCS Reference ${currentJob?.reference}`;
    const body = `Dear Partner,\n\nPlease quote for the following:\nRef: ${currentJob?.reference}\nCorridor: ${currentJob?.intakeData.origin} -> ${currentJob?.intakeData.destination}\nCargo: ${currentJob?.intakeData.commodity}\nPayload: ${metrics?.totalActualWeight}kg / ${metrics?.totalVolumeCbm.toFixed(2)}cbm\nReady: ${currentJob?.intakeData.readyDate}\n\nToken link for bid submission: [Generated Portal Link]\n\nRegards,\nUnique CCS Desk`;
    window.open(`mailto:${providerEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    onNotify('success', 'RFQ Client Dispatched');
  };

  const handleExportPDF = async (quote: QuoteVersion) => {
    if (!currentJob) return;
    setIsProcessing(true);
    try {
      const url = await pdfService.generateQuotePDF(currentJob, quote, settings);
      window.open(url, '_blank');
      onNotify('success', 'PDF Artifact Generated');
    } catch (e) {
      onNotify('error', 'PDF Engine Engine failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMailtoQuote = (quote: QuoteVersion) => {
    const customer = customers.find(c => c.id === currentJob?.intakeData.shipperId);
    const email = customer?.contacts[0]?.email;
    if (!email) return onNotify('error', 'Shipper contact email node missing.');
    const subject = `Unique CCS Quote - Ref: ${currentJob?.reference}`;
    const body = `Dear ${customer?.companyName},\n\nPlease find our logistics offer v${quote.version} attached.\n\nTotal Price: ${currentJob?.intakeData.currency} ${quote.sellPrice.toLocaleString()}\nValid Until: ${quote.validUntil}\n\nReview and Confirm: [Secure Link Placeholder]\n\nRegards,\nUnique CCS Team`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const filteredJobs = useMemo(() => 
    jobs.filter(j => j.reference.toLowerCase().includes(searchTerm.toLowerCase()) || j.id.toLowerCase().includes(searchTerm.toLowerCase())),
    [jobs, searchTerm]
  );

  const metrics = useMemo(() => 
    currentJob?.intakeData ? calculateCargoMetrics(currentJob.intakeData.cargoLines, currentJob.intakeData.modality) : null
  , [currentJob?.intakeData]);

  if (activeTab === 'REGISTRY') {
    return (
      <div className="max-w-screen-2xl mx-auto px-10 pb-24 animate-slide-up h-full flex flex-col italic font-bold">
        <header className="flex justify-between items-center py-12 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Control Center Registry</h1>
            <p className="text-slate-400 text-xs mt-2 font-bold italic tracking-widest uppercase opacity-60">Strategic Trade Hub Ecosystem</p>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 shadow-inner">
              {(['LIST', 'GRID', 'KANBAN'] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setViewMode(m)} className={`p-2.5 rounded-lg transition-all ${viewMode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  {m === 'LIST' ? <List size={18}/> : m === 'GRID' ? <LayoutGrid size={18}/> : <Columns size={18}/>}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter Node..." className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-48 focus:w-72 transition-all outline-none italic font-bold"/>
            </div>
            <Button onClick={() => { 
                const j: Job = {
                  id: `JN-${Date.now()}`, reference: generateReference('SEA', 'DRAFT', jobs.length + 1), status: 'DRAFT',
                  intakeData: { 
                    modality: 'SEA', origin: '', destination: '', pickupAddress: '', deliveryAddress: '', 
                    incoterms: 'FOB', readyDate: '', commodity: '', hsCode: '', cargoLines: [], cargoValue: 0, 
                    currency: 'AED', isDG: false, insuranceRequested: false, shipperId: '', consigneeId: '',
                    transitPriority: 'Standard', customsClearance: false, lastMileDelivery: false, packingRequired: false,
                    tempControl: false, handlingNotes: ''
                  },
                  invitedVendorIds: [], messages: [], completenessScore: 0, quoteVersions: [], vendorBids: [], 
                  ownerId: currentUser.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                };
                setCurrentJob(j); setActiveTab('EDITOR');
              }} className="rounded-xl px-8 shadow-xl shadow-blue-500/10 active:scale-95 transition-all"><Plus size={18}/> New Node</Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {viewMode === 'LIST' && (
            <Card className="p-0 border-white/20 h-full flex flex-col shadow-2xl">
              <div className="overflow-auto h-full custom-scrollbar">
                <table className="w-full text-left font-bold border-collapse">
                  <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-black/[0.03]">
                    <tr className="text-[10px] text-slate-400 uppercase tracking-widest italic">
                      <th className="px-8 py-6 w-12"><button onClick={() => setSelectedIds(selectedIds.length === filteredJobs.length ? [] : filteredJobs.map(j => j.id))}>{selectedIds.length === filteredJobs.length ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}</button></th>
                      <th className="px-8 py-6">Identity Node</th>
                      <th className="px-8 py-6">Phase Protocol</th>
                      <th className="px-8 py-6">Corridor</th>
                      <th className="px-8 py-6">Node Integrity</th>
                      <th className="px-8 py-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02]">
                    {filteredJobs.map(job => (
                      <tr key={job.id} className={`hover:bg-blue-50/20 transition-all cursor-pointer group ${selectedIds.includes(job.id) ? 'bg-blue-50/40' : ''}`} onClick={() => { setCurrentJob(job); setActiveTab('EDITOR'); }}>
                        <td className="px-8 py-6" onClick={e => { e.stopPropagation(); handleToggleSelect(job.id); }}>
                          {selectedIds.includes(job.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-200 group-hover:text-slate-300"/>}
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter leading-none">{job.reference}</p>
                           <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase italic tracking-widest">UID: {job.id.slice(-8)}</p>
                        </td>
                        <td className="px-8 py-6"><Badge color={job.status === 'SHIPMENT' ? 'indigo' : 'blue'}>{job.status}</Badge></td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3 text-xs text-slate-600 uppercase italic">
                            <span>{job.intakeData.origin || 'TBD'}</span>
                            <ChevronRight size={12} className="text-slate-300"/>
                            <span>{job.intakeData.destination || 'TBD'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6"><div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner"><div className="bg-blue-600 h-full transition-all duration-700" style={{width: `${job.completenessScore}%`}} /></div></td>
                        <td className="px-8 py-6 text-right"><button className="p-3 text-slate-300 group-hover:text-blue-600 transition-all hover:bg-white rounded-xl shadow-sm"><ChevronRight size={22}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end pointer-events-none italic font-bold">
      <div className="w-full max-w-[calc(100%-1200px)] h-full pointer-events-auto" onClick={() => setActiveTab('REGISTRY')}></div>
      <div className="w-full max-w-[1200px] bg-white h-full shadow-[-40px_0_80px_rgba(0,0,0,0.1)] animate-slide-right flex flex-col pointer-events-auto border-l border-slate-200 overflow-hidden relative">
        
        <header className="flex flex-col lg:flex-row justify-between items-center gap-10 py-10 px-12 border-b border-black/[0.03] shrink-0 bg-slate-900 text-white relative">
          <div className="flex items-center gap-8">
             <button onClick={() => setActiveTab('REGISTRY')} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all shadow-xl active:scale-90"><ArrowLeft size={24}/></button>
             <div>
                <div className="flex items-center gap-5">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{currentJob?.reference}</h2>
                   <Badge color="blue" className="px-4 py-1">{currentJob?.status}</Badge>
                </div>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] mt-2 opacity-60">Synchronized Node Environment</p>
             </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-[22px] gap-1 shadow-inner">
            {['INTAKE', 'MARKET', 'QUOTES', 'TRANSPORT', 'LEDGER', 'TIMELINE', 'AUDIT'].map(id => (
              <button key={id} onClick={() => setEditorSubTab(id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${editorSubTab === id ? 'bg-white text-blue-600 shadow-2xl' : 'text-slate-400 hover:text-white'}`}>
                {id}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={handleAdvance} className="rounded-2xl px-10 py-4 bg-blue-600 text-white shadow-2xl shadow-blue-500/30 active:scale-95 transition-all text-xs font-black uppercase tracking-[0.2em]">Next Phase <Zap size={16} className="ml-2"/></Button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-slate-50/30 pb-32">
           {editorSubTab === 'INTAKE' && (
             <div className="space-y-12 animate-slide-up">
                <Card title="01 Node Commercial Protocol">
                   <div className="grid grid-cols-2 gap-10 mb-10">
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Shipper Identity</label><select className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic uppercase shadow-sm focus:ring-8 focus:ring-blue-50 transition-all outline-none" value={currentJob?.intakeData.shipperId} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, shipperId: e.target.value}}, true)}><option value="">Select Account Node...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></div>
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Consignee Identity</label><select className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic uppercase shadow-sm focus:ring-8 focus:ring-blue-50 transition-all outline-none" value={currentJob?.intakeData.consigneeId} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, consigneeId: e.target.value}}, true)}><option value="">Select Account Node...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></div>
                   </div>
                   <div className="grid grid-cols-3 gap-8">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Incoterms</label><input className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black italic uppercase outline-none focus:border-blue-500 shadow-sm" value={currentJob?.intakeData.incoterms} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, incoterms: e.target.value}}, true)} /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Ready Date</label><input type="date" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black italic outline-none focus:border-blue-500 shadow-sm" value={currentJob?.intakeData.readyDate} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, readyDate: e.target.value}}, true)} /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Cargo Value</label><input type="number" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black italic outline-none focus:border-blue-500 shadow-sm" value={currentJob?.intakeData.cargoValue} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoValue: Number(e.target.value)}}, true)} /></div>
                   </div>
                </Card>

                <Card title="02 Multi-Modality Specifications">
                   <div className="flex gap-5 p-2 bg-slate-200/50 rounded-[28px] mb-12 shadow-inner">
                      {['SEA', 'AIR', 'COURIER', 'ROAD'].map(m => (
                        <button key={m} onClick={() => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, modality: m as Modality}}, true)} className={`flex-1 py-4 rounded-[22px] font-black text-[11px] uppercase transition-all flex items-center justify-center gap-3 ${currentJob?.intakeData.modality === m ? 'bg-white text-blue-600 shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{m}</button>
                      ))}
                   </div>
                   <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Origin Hub (POL/APOL)</label><input className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic uppercase shadow-sm focus:ring-8 focus:ring-blue-50 transition-all outline-none" value={currentJob?.intakeData.origin} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, origin: e.target.value}}, true)} /></div>
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Destination Hub (POD/APOD)</label><input className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic uppercase shadow-sm focus:ring-8 focus:ring-blue-50 transition-all outline-none" value={currentJob?.intakeData.destination} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, destination: e.target.value}}, true)} /></div>
                   </div>
                </Card>

                <Card title="03 Physical Dimensional Matrix">
                   <div className="space-y-6 mb-10">
                      {(currentJob?.intakeData.cargoLines || []).map((line, idx) => (
                        <div key={line.id} className="flex gap-6 p-8 bg-white border-2 border-slate-100 rounded-[32px] items-center italic shadow-sm hover:shadow-md transition-shadow">
                           <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base shadow-inner italic">{idx+1}</div>
                           <div className="flex-1 grid grid-cols-6 gap-6">
                              <div className="space-y-1"><label className="text-[9px] uppercase text-slate-400 font-black">Qty / Type</label><div className="flex gap-2"><input type="number" className="w-16 p-3 rounded-xl border-2 border-slate-50 bg-slate-50 font-black italic" value={line.qty || 0} onChange={e => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].qty = Number(e.target.value); syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} /><select className="flex-1 p-3 rounded-xl border-2 border-slate-50 bg-slate-50 text-[10px] font-black italic" value={line.type || 'PALLET'} onChange={e => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].type = e.target.value as any; syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }}><option value="PALLET">PALLET</option><option value="BOX">BOX</option><option value="CRATE">CRATE</option><option value="CONTAINER">CNTR</option></select></div></div>
                              <div className="space-y-1 col-span-2"><label className="text-[9px] uppercase text-slate-400 font-black">Dimensions (L × W × H cm)</label><div className="flex gap-2"><input type="number" placeholder="L" className="w-full p-3 rounded-xl border-2 border-slate-50 bg-slate-50 text-xs font-black italic" value={line.length || 0} onChange={e => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].length = Number(e.target.value); syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} /><input type="number" placeholder="W" className="w-full p-3 rounded-xl border-2 border-slate-50 bg-slate-50 text-xs font-black italic" value={line.width || 0} onChange={e => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].width = Number(e.target.value); syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} /><input type="number" placeholder="H" className="w-full p-3 rounded-xl border-2 border-slate-50 bg-slate-50 text-xs font-black italic" value={line.height || 0} onChange={e => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].height = Number(e.target.value); syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} /></div></div>
                              <div className="space-y-1"><label className="text-[9px] uppercase text-slate-400 font-black">Weight (kg)</label><input type="number" className="w-full p-3 rounded-xl border-2 border-slate-50 bg-slate-50 font-black italic" value={line.weight || 0} onChange={e => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].weight = Number(e.target.value); syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} /></div>
                              <div className="space-y-1"><label className="text-[9px] uppercase text-slate-400 font-black">Stackable</label><button onClick={() => { const ls = [...(currentJob!.intakeData.cargoLines || [])]; ls[idx].isStackable = !ls[idx].isStackable; syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} className={`w-full p-3 rounded-xl border-2 font-black transition-all ${line.isStackable ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-rose-50 border-rose-500 text-rose-600'}`}>{line.isStackable ? 'YES' : 'NO'}</button></div>
                              <div className="flex items-end pb-1"><button onClick={() => { const ls = (currentJob!.intakeData.cargoLines || []).filter(l => l.id !== line.id); syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: ls}}, true); }} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90 shadow-sm"><Trash2 size={20}/></button></div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <Button variant="outline" className="w-full py-8 border-dashed border-2 rounded-[32px] font-black italic text-xs uppercase tracking-[0.3em] active:scale-[0.99] transition-all hover:bg-slate-50 shadow-sm" onClick={() => { const nl: CargoLine = { id: `CL-${Date.now()}`, type: 'PALLET', qty: 1, length: 120, width: 80, height: 100, weight: 500, description: 'General Cargo', isStackable: true }; syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: [...(currentJob!.intakeData.cargoLines || []), nl]}}, true); }}>+ Append Payload Node</Button>
                </Card>

                <Card title="04 Commodity & Compliance Registry">
                   <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Commodity Class</label><input className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic uppercase shadow-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="e.g. ELECTRONICS" value={currentJob?.intakeData.commodity} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, commodity: e.target.value}}, true)} /></div>
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">HS Code (Harmonized Signal)</label><input className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic shadow-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Optional..." value={currentJob?.intakeData.hsCode} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, hsCode: e.target.value}}, true)} /></div>
                      <div className="space-y-3">
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Regulatory Hazards</label>
                         <div className="flex gap-4">
                            <button onClick={() => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, isDG: !currentJob!.intakeData.isDG}}, true)} className={`flex-1 py-5 rounded-[22px] font-black text-[10px] uppercase border-3 transition-all ${currentJob?.intakeData.isDG ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>DANGEROUS_GOODS</button>
                            <button onClick={() => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, tempControl: !currentJob!.intakeData.tempControl}}, true)} className={`flex-1 py-5 rounded-[22px] font-black text-[10px] uppercase border-3 transition-all ${currentJob?.intakeData.tempControl ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>TEMP_CONTROL</button>
                         </div>
                      </div>
                      <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Special Handling Protocol</label><input className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black italic uppercase shadow-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Instructions..." value={currentJob?.intakeData.handlingNotes} onChange={e => syncJob({...currentJob!, intakeData: {...currentJob!.intakeData, handlingNotes: e.target.value}}, true)} /></div>
                   </div>
                </Card>
             </div>
           )}

           {editorSubTab === 'MARKET' && (
             <div className="space-y-12 animate-slide-up">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-8 space-y-10">
                      <Card title="Provider Registry & Lane Matching">
                        <div className="space-y-4">
                          {vendors.map(v => (
                            <div key={v.id} className={`p-6 border-2 rounded-[2.5rem] flex items-center justify-between transition-all cursor-pointer ${selectedVendors.includes(v.id) ? 'border-blue-600 bg-blue-50 shadow-xl' : 'border-slate-100 bg-white hover:border-blue-200'}`} onClick={() => setSelectedVendors(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])}>
                               <div className="flex items-center gap-6">
                                  <div className={`p-4 rounded-2xl ${selectedVendors.includes(v.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Ship size={20}/></div>
                                  <div><p className="text-base font-black uppercase italic tracking-tighter leading-none">{v.name}</p><p className="text-[10px] text-slate-400 mt-2 uppercase italic">{v.tier} NODE • {v.capabilities.join('/')}</p></div>
                               </div>
                               {selectedVendors.includes(v.id) ? <CheckSquare size={24} className="text-blue-600"/> : <Square size={24} className="text-slate-100"/>}
                            </div>
                          ))}
                        </div>
                      </Card>
                      {selectedVendors.length > 0 && (
                        <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl flex items-center justify-between animate-fade-in relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12"><Terminal size={140}/></div>
                           <div><p className="text-3xl font-black italic tracking-tighter uppercase leading-none">{selectedVendors.length} Providers Selected</p><p className="text-[10px] text-blue-400 uppercase tracking-widest mt-2">Ready for automated RFQ broadcast protocol</p></div>
                           <Button onClick={handleBroadcastRFQ} className="px-12 py-5 bg-blue-600 text-white font-black italic uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"><Send size={20} className="mr-3"/> DISPATCH RFQ SIGNAL</Button>
                        </div>
                      )}
                   </div>
                   <div className="lg:col-span-4 space-y-8">
                      <Card title="Signal Injection (Manual Bid)">
                         <div className="space-y-6">
                            <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black italic text-sm shadow-inner" value={manualBid.vendorId} onChange={e => setManualBid({...manualBid, vendorId: e.target.value})}><option value="">Select Provider...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                            <div className="space-y-1"><label className="text-[9px] uppercase text-slate-400 ml-2 font-black italic">Commercial Net Rate</label><input type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-black italic focus:ring-8 focus:ring-blue-50 outline-none transition-all" value={manualBid.amount || ''} onChange={e => setManualBid({...manualBid, amount: Number(e.target.value)})} /></div>
                            <div className="space-y-1"><label className="text-[9px] uppercase text-slate-400 ml-2 font-black italic">Transit (Est. Days)</label><input type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-white font-black italic focus:ring-8 focus:ring-blue-50 outline-none transition-all" value={manualBid.transit || ''} onChange={e => setManualBid({...manualBid, transit: Number(e.target.value)})} /></div>
                            <Button className="w-full py-5 rounded-[2rem] font-black italic uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95" onClick={() => {
                               if (!manualBid.vendorId || !manualBid.amount) return onNotify('error', 'Bid params incomplete.');
                               const v = vendors.find(x => x.id === manualBid.vendorId);
                               const b: VendorBid = { id: `BID-${Date.now()}`, vendorId: manualBid.vendorId, vendorName: v?.name || 'Agent', amount: manualBid.amount, currency: currentJob?.intakeData.currency || 'AED', transitTime: manualBid.transit, validityDate: '', receivedVia: 'MANUAL', receivedAt: new Date().toISOString(), freeTime: 14, isAwarded: false };
                               syncJob({...currentJob!, vendorBids: [...(currentJob?.vendorBids || []), b]});
                               setManualBid({vendorId: '', amount: 0, transit: 14});
                               onNotify('success', 'Manual Signal Synchronized');
                            }}>+ Inject Market Signal</Button>
                         </div>
                      </Card>
                      <div className="space-y-4">
                        {(currentJob?.vendorBids || []).map(bid => (
                           <div key={bid.id} className={`p-8 rounded-[2.5rem] border-3 transition-all flex flex-col gap-4 ${bid.isAwarded ? 'border-emerald-500 bg-emerald-50 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
                              <div className="flex justify-between items-start">
                                 <div><p className="text-base font-black uppercase italic tracking-tighter leading-none">{bid.vendorName}</p><p className="text-[10px] text-slate-400 mt-2 italic">{bid.amount} {bid.currency} • {bid.transitTime} Days</p></div>
                                 {bid.isAwarded ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Button variant="outline" className="px-6 py-2 text-[10px] rounded-xl" onClick={() => syncJob({...currentJob!, status: 'AWARDED', vendorBids: currentJob!.vendorBids.map(x => ({...x, isAwarded: x.id === bid.id}))})}>Award Node</Button>}
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {editorSubTab === 'QUOTES' && (
             <div className="space-y-12 animate-slide-up">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Operational Yield Engine</h3>
                   <Button onClick={() => {
                     const award = currentJob?.vendorBids.find(b => b.isAwarded);
                     const baseBuy = award?.amount || 1000;
                     const q: QuoteVersion = { 
                       id: `QV-${Date.now()}`, version: (currentJob?.quoteVersions.length || 0) + 1, 
                       sellPrice: baseBuy * 1.15, buyPrice: baseBuy, margin: 15, status: 'DRAFT', 
                       validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], 
                       createdAt: new Date().toISOString(), currency: currentJob?.intakeData.currency,
                       inclusions: ['Local Handling', 'Documentation'], exclusions: ['Duties', 'Taxes'],
                       lines: [{ id: 'L1', description: 'Sea Freight Element', amount: baseBuy, currency: currentJob?.intakeData.currency || 'AED', type: 'FREIGHT' }]
                     };
                     syncJob({...currentJob!, quoteVersions: [...(currentJob?.quoteVersions || []), q]});
                   }}>+ Append Quote Protocol</Button>
                </div>
                <div className="space-y-12">
                   {(currentJob?.quoteVersions || []).map(q => (
                      <Card key={q.id} className="p-10 border-2 border-slate-100 hover:border-blue-100 transition-all relative overflow-hidden group shadow-xl">
                         {q.status === 'SENT' && <div className="absolute top-0 right-0 p-8 text-blue-100 opacity-20 transform -rotate-12 pointer-events-none"><Send size={140}/></div>}
                         <div className="flex justify-between items-start mb-10 border-b border-slate-50 pb-8">
                            <div><Badge color="blue" className="mb-3 px-6 py-1.5 shadow-sm">VERSION {q.version}</Badge><h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Operational Settlement Spec</h4></div>
                            <div className="flex gap-4">
                               <Button variant="outline" className="p-4 rounded-2xl shadow-sm" onClick={() => handleExportPDF(q)}><FileDown size={24}/></Button>
                               <Button className="px-10 py-4 font-black italic uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95" onClick={() => { syncJob({...currentJob!, quoteVersions: currentJob!.quoteVersions.map(x => x.id === q.id ? {...x, status: 'SENT'} : x)}); handleMailtoQuote(q); }}>Dispatch Yield Signal</Button>
                            </div>
                         </div>
                         <div className="grid grid-cols-4 gap-12 mb-12">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] shadow-inner"><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest italic mb-2">Buy Protocol</p><p className="text-3xl font-black text-slate-900 tracking-tighter">{currentJob?.intakeData.currency} {q.buyPrice.toLocaleString()}</p></div>
                            <div className="p-8 bg-blue-50 rounded-[2.5rem] shadow-xl shadow-blue-500/10 border border-blue-100"><p className="text-[10px] text-blue-500 uppercase font-black tracking-widest italic mb-2">Sell Signal</p><p className="text-3xl font-black text-blue-600 tracking-tighter">{currentJob?.intakeData.currency} {q.sellPrice.toLocaleString()}</p></div>
                            <div className="p-8 bg-emerald-50 rounded-[2.5rem] shadow-inner"><p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest italic mb-2">Yield (Margin)</p><p className="text-3xl font-black text-emerald-600 tracking-tighter">{(((q.sellPrice - q.buyPrice)/q.sellPrice)*100).toFixed(1)}%</p></div>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] shadow-inner"><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest italic mb-2">Node Status</p><Badge color={q.status === 'SENT' ? 'indigo' : 'slate'} className="px-8 py-2 text-sm">{q.status}</Badge></div>
                         </div>
                         <div className="space-y-6">
                            <h5 className="text-[11px] font-black uppercase italic tracking-widest text-slate-400 ml-2 flex items-center gap-3"><CalcIcon size={16}/> Line Item Topology</h5>
                            <div className="space-y-4">
                               {(q.lines || []).map((line, lIdx) => (
                                  <div key={line.id} className="flex gap-4 p-4 bg-white border-2 border-slate-50 rounded-2xl items-center shadow-sm">
                                     <input className="flex-1 p-2 bg-slate-50 rounded-xl text-sm italic font-bold outline-none" value={line.description} onChange={e => { const nQs = [...currentJob!.quoteVersions]; nQs.find(x => x.id === q.id)!.lines![lIdx].description = e.target.value; syncJob({...currentJob!, quoteVersions: nQs}, true); }} />
                                     <div className="flex items-center gap-3"><span className="text-xs font-black text-slate-300">{line.currency}</span><input type="number" className="w-32 p-2 bg-slate-50 rounded-xl text-sm italic font-bold outline-none" value={line.amount} onChange={e => { const nVal = Number(e.target.value); const nQs = [...currentJob!.quoteVersions]; const targetQ = nQs.find(x => x.id === q.id)!; targetQ.lines![lIdx].amount = nVal; targetQ.sellPrice = targetQ.lines!.reduce((s,l) => s + l.amount, 0); syncJob({...currentJob!, quoteVersions: nQs}, true); }} /></div>
                                     <button onClick={() => { const nQs = [...currentJob!.quoteVersions]; const targetQ = nQs.find(x => x.id === q.id)!; targetQ.lines = targetQ.lines?.filter(l => l.id !== line.id); targetQ.sellPrice = targetQ.lines?.reduce((s,l) => s + l.amount, 0) || 0; syncJob({...currentJob!, quoteVersions: nQs}, true); }} className="p-2 text-slate-300 hover:text-rose-500 transition-all active:scale-90"><Trash2 size={16}/></button>
                                  </div>
                               ))}
                               <Button variant="outline" className="w-full py-4 border-dashed rounded-2xl text-[10px] uppercase font-black italic tracking-widest shadow-sm" onClick={() => { const nQs = [...currentJob!.quoteVersions]; const targetQ = nQs.find(x => x.id === q.id)!; targetQ.lines = [...(targetQ.lines || []), { id: `L-${Date.now()}`, description: 'Surcharge Protocol Charge', amount: 0, currency: currentJob?.intakeData.currency || 'AED', type: 'SURCHARGE' }]; syncJob({...currentJob!, quoteVersions: nQs}, true); }}>+ Append Charge Node</Button>
                            </div>
                         </div>
                      </Card>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default JobManager;
