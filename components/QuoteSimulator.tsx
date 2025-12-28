
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, Target, ArrowRight, ShieldCheck, 
  FileText, Clock, Trash2, Plus, Users, 
  ChevronRight, Calculator, CheckCircle2, History, AlertCircle
} from 'lucide-react';
import { Job, SharedProps, QuoteVersion, User, Customer, AppView } from '../types';
import { repo } from '../services/repository';
import { calculateCargoMetrics } from '../utils/logistics';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface QuoteSimulatorProps extends SharedProps {
  customers: Customer[];
  initialJobId?: string | null;
  onClearJobId?: () => void;
}

const QuoteSimulator: React.FC<QuoteSimulatorProps> = ({ 
  currentUser, onNotify, customers, settings, onNavigate, initialJobId, onClearJobId 
}) => {
  const [job, setJob] = useState<Job | null>(null);
  const [activeVersion, setActiveVersion] = useState<QuoteVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from props instead of URL search params
  useEffect(() => {
    if (initialJobId) {
      repo.getJobById(initialJobId).then(found => {
        if (found) {
          setJob(found);
          if (found.quoteVersions.length > 0) {
            setActiveVersion(found.quoteVersions[found.quoteVersions.length - 1]);
          } else {
            handleNewVersion(found);
          }
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [initialJobId]);

  const metrics = useMemo(() => {
    if (!job) return { totalActualWeight: 0, totalVolumeCbm: 0, chargeableUnits: 0 };
    return calculateCargoMetrics(job.intakeData.cargoLines, job.intakeData.modality);
  }, [job?.intakeData.cargoLines, job?.intakeData.modality]);

  const handleNewVersion = (targetJob: Job) => {
    const newVersion: QuoteVersion = {
      id: `QV-${Date.now()}`,
      version: targetJob.quoteVersions.length + 1,
      buySource: 'MANUAL',
      buyPrice: 0,
      sellPrice: 0,
      margin: 0,
      currency: targetJob.intakeData.currency,
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      inclusions: ['Terminal Handling', 'Customs Doc'],
      exclusions: ['Duties & Taxes'],
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name
    };
    setActiveVersion(newVersion);
  };

  const handleSaveVersion = async () => {
    if (!job || !activeVersion) return;
    
    // Calculate Margin
    const margin = activeVersion.sellPrice - activeVersion.buyPrice;
    const marginPercent = activeVersion.sellPrice > 0 ? (margin / activeVersion.sellPrice) * 100 : 0;
    
    const updatedVersion = { ...activeVersion, margin: marginPercent };
    const updatedVersions = [...job.quoteVersions];
    const existingIdx = updatedVersions.findIndex(v => v.id === updatedVersion.id);
    
    if (existingIdx > -1) updatedVersions[existingIdx] = updatedVersion;
    else updatedVersions.push(updatedVersion);

    const updatedJob = { ...job, quoteVersions: updatedVersions, status: 'QUOTING' as any };
    await repo.saveJob(updatedJob, currentUser);
    setJob(updatedJob);
    onNotify('success', `Offer Version v${updatedVersion.version} synchronized.`);
  };

  if (!job) return (
    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
      <div className="p-4 bg-blue-50 rounded-full text-blue-500"><Target size={48} /></div>
      <h2 className="text-xl font-bold text-slate-700">No Job Target</h2>
      <p className="text-slate-400 text-sm max-w-xs">Please select an opportunity from the Job Registry to initiate the quoting protocol.</p>
      <Button onClick={() => onNavigate(AppView.PROJECT_CENTER)}>Back to Registry</Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge color="indigo">Quoting Protocol</Badge>
            <span className="text-slate-400 text-xs font-mono">{job.id}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Professional Offer Manager</h2>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate(AppView.PROJECT_CENTER)}>Registry</Button>
          <Button variant="secondary" onClick={() => handleNewVersion(job)}>+ New Version</Button>
          <Button onClick={handleSaveVersion}>Save Offer v{activeVersion?.version}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title={`Pricing Matrix (v${activeVersion?.version})`}>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Buy Rate (Net)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">{job.intakeData.currency}</span>
                    <input 
                      type="number"
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg text-lg font-black text-slate-700 focus:border-blue-500 outline-none"
                      value={activeVersion?.buyPrice}
                      onChange={e => setActiveVersion({...activeVersion!, buyPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Valid Until</label>
                  <input 
                    type="date"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold"
                    value={activeVersion?.validUntil}
                    onChange={e => setActiveVersion({...activeVersion!, validUntil: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center text-center">
                  <label className="text-[10px] font-bold text-blue-400 uppercase mb-2">Target Sell Price</label>
                  <div className="relative flex items-baseline justify-center gap-2">
                    <span className="text-lg font-bold text-blue-600">{job.intakeData.currency}</span>
                    <input 
                      type="number"
                      className="w-40 bg-transparent text-5xl font-black text-blue-600 border-b-4 border-blue-200 focus:border-blue-500 outline-none text-center"
                      value={activeVersion?.sellPrice}
                      onChange={e => setActiveVersion({...activeVersion!, sellPrice: Number(e.target.value)})}
                    />
                  </div>
                  <p className="text-[10px] text-blue-400 mt-4 font-bold italic">Adjusting sell price updates margin in real-time</p>
              </div>
            </div>
          </Card>

          <Card title="Terms, Inclusions & Exclusions">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                   <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Inclusions</h4>
                   <div className="space-y-2">
                      {activeVersion?.inclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <CheckCircle2 size={14} className="text-emerald-500" /> {item}
                        </div>
                      ))}
                      <Button variant="ghost" className="text-[10px] p-1">+ Add Inclusion</Button>
                   </div>
                </div>
                <div className="space-y-3">
                   <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Exclusions</h4>
                   <div className="space-y-2">
                      {activeVersion?.exclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <AlertCircle size={14} className="text-red-400" /> {item}
                        </div>
                      ))}
                      <Button variant="ghost" className="text-[10px] p-1">+ Add Exclusion</Button>
                   </div>
                </div>
             </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Job Blueprint" className="bg-slate-50 border-slate-200">
             <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase">Routing</span>
                   <span className="font-bold text-slate-700">{job.intakeData.origin} &rarr; {job.intakeData.destination}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase">Chargeable</span>
                   <span className="font-bold text-slate-700">{metrics.chargeableUnits} {job.intakeData.modality === 'AIR' ? 'KG' : 'WM'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <span className="text-slate-400 font-bold uppercase">Cargo Value</span>
                   <span className="font-bold text-slate-700">{job.intakeData.currency} {job.intakeData.cargoValue.toLocaleString()}</span>
                </div>
             </div>
          </Card>

          <Card className="bg-slate-900 border-0" title={<span className="text-white">Commercial Result</span>}>
             <div className="space-y-6 py-2">
                <div className="flex justify-between items-center text-white/50 text-xs">
                   <span>Projected Profit</span>
                   <span className="text-emerald-400 font-black">{job.intakeData.currency} {(activeVersion?.sellPrice || 0) - (activeVersion?.buyPrice || 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                   <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Applied Margin</span>
                   <Badge color={((activeVersion?.sellPrice || 1) - (activeVersion?.buyPrice || 0)) / (activeVersion?.sellPrice || 1) * 100 < 15 ? 'red' : 'green'}>
                      {(((activeVersion?.sellPrice || 1) - (activeVersion?.buyPrice || 0)) / (activeVersion?.sellPrice || 1) * 100).toFixed(1)}%
                   </Badge>
                </div>
             </div>
          </Card>

          <Card title="Version History">
             <div className="space-y-4">
                {job.quoteVersions.length === 0 ? (
                  <p className="text-xs text-slate-300 italic">No previous versions.</p>
                ) : job.quoteVersions.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setActiveVersion(v)}>
                    <div className="flex items-center gap-3">
                       <History size={14} className="text-slate-300" />
                       <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase">Version v{v.version}</p>
                          <p className="text-[9px] text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <span className="text-xs font-black text-slate-800">{v.currency} {v.sellPrice.toLocaleString()}</span>
                  </div>
                ))}
             </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default QuoteSimulator;
