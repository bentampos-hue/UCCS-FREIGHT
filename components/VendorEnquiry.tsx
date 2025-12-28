import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Box, Info, AlertCircle, Save, Send, Globe, 
  Anchor, CheckCircle, ChevronRight, Plane, Ship, Trash2, 
  Plus, Users, Search, ClipboardList
} from 'lucide-react';
import { Job, CargoLine, SharedProps, Customer, Vendor, JobStatus, IntakeData, AppView } from '../types';
import { calculateCargoMetrics, calculateJobCompleteness } from '../utils/logistics';
import { intakeSchema } from '../validation/schemas';
import { repo } from '../services/repository';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

// Fixed: Added missing tempControl and handlingNotes properties to satisfy IntakeData interface requirements
const createEmptyIntake = (): IntakeData => ({
  modality: 'SEA',
  origin: '', destination: '', pickupAddress: '', deliveryAddress: '',
  incoterms: 'FOB', readyDate: '', commodity: '', cargoLines: [],
  cargoValue: 0, currency: 'USD', isDG: false, transitPriority: 'Standard',
  shipperId: '', consigneeId: '', insuranceRequested: false,
  customsClearance: false,
  lastMileDelivery: false,
  packingRequired: false,
  tempControl: false,
  handlingNotes: ''
});

const VendorEnquiry: React.FC<SharedProps & { vendors: Vendor[]; customers: Customer[] }> = ({ 
  currentUser, onNotify, vendors, customers, settings, onNavigate 
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'EDITOR'>('LIST');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    repo.getJobs().then(list => {
      setJobs(list);
      setIsLoading(false);
    });
  }, []);

  const metrics = useMemo(() => {
    if (!currentJob) return { totalActualWeight: 0, totalVolumeCbm: 0, chargeableUnits: 0 };
    return calculateCargoMetrics(currentJob.intakeData.cargoLines, currentJob.intakeData.modality);
  }, [currentJob?.intakeData.cargoLines, currentJob?.intakeData.modality]);

  const handleCreateNew = () => {
    // Fixed: Removed missing property 'vendorSLAs' and ensured compliance with Job interface
    const newJob: Job = {
      id: `JOB-${Date.now()}`,
      reference: `REF-${Date.now()}`,
      status: 'DRAFT',
      intakeData: createEmptyIntake(),
      completenessScore: 0,
      vendorBids: [],
      quoteVersions: [],
      invitedVendorIds: [],
      messages: [],
      ownerId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentJob(newJob);
    setActiveTab('EDITOR');
  };

  const handleSaveDraft = async () => {
    if (!currentJob) return;
    const score = calculateJobCompleteness(currentJob.intakeData);
    const updatedJob = { ...currentJob, completenessScore: score };
    await repo.saveJob(updatedJob, currentUser);
    setJobs(prev => {
        const idx = prev.findIndex(j => j.id === updatedJob.id);
        if (idx > -1) {
            const copy = [...prev];
            copy[idx] = updatedJob;
            return copy;
        }
        return [updatedJob, ...prev];
    });
    onNotify('success', 'Market Intake draft synchronized.');
  };

  const handleSubmitIntake = async () => {
    if (!currentJob) return;
    const result = intakeSchema.safeParse(currentJob.intakeData);
    if (!result.success) {
      onNotify('error', result.error.errors[0].message);
      return;
    }
    
    const updatedJob = { ...currentJob, status: 'INTAKE' as JobStatus, completenessScore: 100 };
    await repo.saveJob(updatedJob, currentUser);
    onNotify('success', 'Intake finalized. Moving to Quoting Engine.');
    // Fix: SIMULATOR doesn't exist, using PROJECT_CENTER
    onNavigate(AppView.PROJECT_CENTER, { jobId: updatedJob.id });
  };

  if (activeTab === 'LIST') {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Job Registry</h2>
            <p className="text-slate-500 text-sm">Manage end-to-end logistics lifecycle records.</p>
          </div>
          <Button onClick={handleCreateNew}><Plus size={18}/> New Opportunity</Button>
        </header>

        <Card className="p-0">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Job ID</th>
                <th className="px-6 py-4">Modality</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No active jobs found in the platform.</td></tr>
              ) : jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{job.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {job.intakeData.modality === 'SEA' ? <Ship size={14} className="text-blue-500"/> : <Plane size={14} className="text-indigo-500"/>}
                      <span className="text-xs font-bold text-slate-600">{job.intakeData.modality}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      {job.intakeData.origin || 'TBD'} <ChevronRight size={12}/> {job.intakeData.destination || 'TBD'}
                    </div>
                  </td>
                  <td className="px-6 py-4"><Badge color={job.status === 'DRAFT' ? 'slate' : 'blue'}>{job.status}</Badge></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{width: `${job.completenessScore}%`}} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{job.completenessScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" onClick={() => { setCurrentJob(job); setActiveTab('EDITOR'); }}>Manage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge color="blue">{currentJob?.status}</Badge>
            <span className="text-slate-400 text-xs font-mono">{currentJob?.id}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Market Intake & Intake Data</h2>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveTab('LIST')}>Back to Registry</Button>
          <Button variant="secondary" onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={handleSubmitIntake} disabled={currentJob!.completenessScore < 80}>Submit for Quoting</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Routing */}
          <Card title="01 Routing DNA">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Port of Loading (POL)</label>
                <input 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                  value={currentJob?.intakeData.origin}
                  onChange={e => setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, origin: e.target.value}})}
                  placeholder="e.g. SHANGHAI"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Port of Discharge (POD)</label>
                <input 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                  value={currentJob?.intakeData.destination}
                  onChange={e => setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, destination: e.target.value}})}
                  placeholder="e.g. ROTTERDAM"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pickup Facility Address</label>
                <textarea 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm h-20 resize-none" 
                  value={currentJob?.intakeData.pickupAddress}
                  onChange={e => setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, pickupAddress: e.target.value}})}
                  placeholder="Full door address..."
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Involved Entities */}
          <Card title="02 Involved Entities">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Shipper / Exporter</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  value={currentJob?.intakeData.shipperId}
                  onChange={e => setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, shipperId: e.target.value}})}
                >
                  <option value="">Select Account</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Consignee / Importer</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  value={currentJob?.intakeData.consigneeId}
                  onChange={e => setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, consigneeId: e.target.value}})}
                >
                  <option value="">Select Account</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Section 3: Cargo Details */}
          <Card title="03 Physical Payload">
            <div className="space-y-4">
              {currentJob?.intakeData.cargoLines.map((line, idx) => (
                <div key={line.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Qty / Type</p>
                      <p className="text-xs font-bold text-slate-700">{line.qty}x {line.type}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Dims (cm)</p>
                      <p className="text-xs font-bold text-slate-700">{line.length}x{line.width}x{line.height}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Weight ea.</p>
                      <p className="text-xs font-bold text-slate-700">{line.weight} KG</p>
                    </div>
                    <div className="text-right">
                       <Button variant="danger" className="opacity-0 group-hover:opacity-100 p-2" onClick={() => {
                         const copy = [...currentJob!.intakeData.cargoLines];
                         copy.splice(idx, 1);
                         setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: copy}});
                       }}><Trash2 size={14}/></Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed py-6" onClick={() => {
                // Fixed: Added missing property isStackable to satisfy CargoLine interface
                const newLine: CargoLine = { id: `C-${Date.now()}`, type: 'PALLET', qty: 1, length: 120, width: 80, height: 100, weight: 500, description: 'General Cargo', isStackable: true };
                setCurrentJob({...currentJob!, intakeData: {...currentJob!.intakeData, cargoLines: [...currentJob!.intakeData.cargoLines, newLine]}});
              }}>+ Add Payload Node</Button>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Analytics & Checklist */}
        <aside className="space-y-6">
          <Card className="bg-slate-900 text-white border-0 shadow-xl" title="Commercial Metrics">
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Actual Weight</span>
                <span className="font-bold">{metrics.totalActualWeight} KG</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Volume</span>
                <span className="font-bold">{metrics.totalVolumeCbm.toFixed(3)} CBM</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Chargeable units</span>
                <span className="text-2xl font-black text-blue-400 animate-pulse">
                  {metrics.chargeableUnits} {currentJob?.intakeData.modality === 'AIR' ? 'KG' : 'WM'}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Completeness Checklist">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Verification Score</span>
                <span className="text-sm font-black text-blue-600">{currentJob?.completenessScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-500" style={{width: `${currentJob?.completenessScore}%`}} />
              </div>
              
              <div className="pt-4 space-y-3">
                {[
                  { label: 'Routing DNA', ok: !!(currentJob?.intakeData.origin && currentJob?.intakeData.destination) },
                  { label: 'Stakeholder Nodes', ok: !!(currentJob?.intakeData.shipperId && currentJob?.intakeData.consigneeId) },
                  { label: 'Payload Nodes', ok: (currentJob?.intakeData.cargoLines.length || 0) > 0 },
                  { label: 'Ready Date', ok: !!currentJob?.intakeData.readyDate }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {item.ok ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-slate-200" />}
                    <span className={`text-xs font-semibold ${item.ok ? 'text-slate-700' : 'text-slate-300'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default VendorEnquiry;