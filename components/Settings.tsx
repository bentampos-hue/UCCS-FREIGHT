import React, { useState } from 'react';
import { 
  Save, Ship, Mail, DollarSign, Users, ShieldAlert, FileText, Database, ShieldCheck, 
  Trash2, Plus, ArrowRight, UserPlus, Info, Terminal, Settings as SettingsIcon, Globe
} from 'lucide-react';
import { AppSettings, Currency, SharedProps, User, UserRole } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface SettingsProps extends SharedProps {
  onUpdateSettings: (newSettings: AppSettings) => void;
  users: User[];
  onUpdateUsers: (newUsers: User[]) => void;
}

type SettingsSection = 'USERS' | 'PRICING' | 'LEGAL' | 'GOVERNANCE' | 'SYSTEM';

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, users, onUpdateUsers, onNotify, userRole, hasPermission }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('USERS');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSave = () => {
    if (!hasPermission('EDIT_SETTINGS')) {
      onNotify('error', 'Elevation required for settings persistence.');
      return;
    }
    onUpdateSettings(formData);
    onNotify('success', 'Global governance synchronized.');
  };

  const handleUserSave = (user: User) => {
    const exists = users.find(u => u.id === user.id);
    if (exists) {
      onUpdateUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      onUpdateUsers([...users, user]);
    }
    setEditingUser(null);
    onNotify('success', 'User node updated.');
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-10 pb-24 animate-slide-up h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 py-16">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Platform Control Center</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">System-wide operational parameters and global governance frameworks.</p>
        </div>
        <Button onClick={handleSave} className="rounded-2xl px-10 py-3.5 shadow-2xl shadow-blue-500/10"><Save size={18} className="mr-1"/> Commit Changes</Button>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-12">
        <aside className="col-span-3 space-y-2">
          {[
            { id: 'USERS', label: 'Stakeholders', icon: Users },
            { id: 'PRICING', label: 'Financial Guard', icon: DollarSign },
            { id: 'LEGAL', label: 'Legal Engine', icon: FileText },
            { id: 'GOVERNANCE', label: 'Node Prefixes', icon: Database },
            { id: 'SYSTEM', label: 'Kernel Config', icon: SettingsIcon },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-semibold text-[11px] uppercase tracking-[0.15em] ${
                activeSection === section.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 ring-1 ring-blue-500' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
              }`}
            >
              <section.icon size={16} /> {section.label}
            </button>
          ))}
        </aside>

        <div className="col-span-9 space-y-12 h-[calc(100vh-320px)] overflow-y-auto pr-6 custom-scrollbar scroll-smooth">
          {activeSection === 'USERS' && (
            <div className="space-y-10 animate-slide-up">
               <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <ShieldAlert size={20} className="text-blue-500"/> User Registry & RBAC
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium italic">Manage active stakeholders and system-level permissions.</p>
                  </div>
                  <Button variant="outline" className="text-xs rounded-xl" onClick={() => setEditingUser({ id: `USR-${Date.now()}`, name: '', email: '', role: 'SALES', status: 'ACTIVE' })}>
                    <UserPlus size={16}/> Add Node
                  </Button>
               </div>
               <Card className="p-0 border-white/20">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50 border-b border-black/[0.03]">
                        <tr>
                           <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Identity Node</th>
                           <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Role Signal</th>
                           <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Node Status</th>
                           <th className="px-8 py-5"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-black/[0.02]">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-blue-50/10 transition-all">
                             <td className="px-8 py-6">
                                <p className="text-sm font-semibold text-slate-800 leading-none mb-1.5">{u.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium font-mono">{u.email}</p>
                             </td>
                             <td className="px-8 py-6"><Badge color={u.role === 'ADMIN' ? 'indigo' : 'slate'} className="px-3">{u.role}</Badge></td>
                             <td className="px-8 py-6"><span className={`text-[11px] font-bold uppercase tracking-widest ${u.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-400'}`}>{u.status}</span></td>
                             <td className="px-8 py-6 text-right">
                                <button onClick={() => setEditingUser(u)} className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><SettingsIcon size={18}/></button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </Card>
            </div>
          )}

          {activeSection === 'PRICING' && (
            <div className="space-y-10 animate-slide-up">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3 italic">
                 <DollarSign size={20} className="text-emerald-500"/> Financial Architecture Guardrails
               </h3>
               <div className="grid grid-cols-2 gap-10">
                  <Card title="Yield Logic Control">
                     <div className="space-y-8 py-4">
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Global Min Yield Threshold (%)</label>
                           <input type="number" className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-xl font-bold outline-none focus:ring-4 focus:ring-emerald-100 transition-all shadow-inner" value={formData.minMarginThreshold} onChange={e => setFormData({...formData, minMarginThreshold: Number(e.target.value)})} />
                           <p className="text-[10px] text-slate-400 font-medium italic mt-2 ml-1">Quotes below this signal will trigger mandatory override nodes.</p>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Default Market Yield (%)</label>
                           <input type="number" className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner" value={formData.defaultMarginPercent} onChange={e => setFormData({...formData, defaultMarginPercent: Number(e.target.value)})} />
                        </div>
                     </div>
                  </Card>
                  <Card title="Base Conversion Matrix">
                     <div className="grid grid-cols-2 gap-6 py-4">
                        {(['USD', 'EUR', 'CNY', 'GBP'] as Currency[]).map(curr => (
                           <div key={curr} className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase italic ml-1">1 AED = X {curr}</label>
                              <input type="number" step="0.0001" className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" value={formData.exchangeRates[curr]} onChange={e => setFormData({...formData, exchangeRates: {...formData.exchangeRates, [curr]: Number(e.target.value)}})} />
                           </div>
                        ))}
                     </div>
                  </Card>
               </div>
            </div>
          )}

          {activeSection === 'LEGAL' && (
             <div className="space-y-10 animate-slide-up">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3 italic">
                  <FileText size={20} className="text-blue-500"/> Governance Framework Editor
                </h3>
                <div className="grid grid-cols-1 gap-10 pb-16">
                   {[
                     { k: 'general', l: 'Universal Terms & Conditions Node' },
                     { k: 'air', l: 'Air Freight Provision Specs' },
                     { k: 'sea', l: 'Sea Freight & BOL Architecture' },
                     { k: 'courier', l: 'Courier Liability Kernel' }
                   ].map(field => (
                     <div key={field.k} className="space-y-4">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{field.l}</label>
                        <textarea 
                           className="w-full p-8 bg-white/40 border border-slate-200 rounded-[32px] text-sm font-medium h-56 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all italic leading-relaxed shadow-inner" 
                           value={formData.legalTerms[field.k as keyof AppSettings['legalTerms']]} 
                           onChange={e => setFormData({...formData, legalTerms: {...formData.legalTerms, [field.k]: e.target.value}})} 
                        />
                     </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;