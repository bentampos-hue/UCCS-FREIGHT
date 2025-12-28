import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, X, Building, User, MapPin, Trash2, History, ChevronRight, 
  Mail, Phone, CheckSquare, Square, Download, MoreHorizontal, Globe, ArrowRight, ArrowLeft, Briefcase, FileText, Save
} from 'lucide-react';
import { Customer, SharedProps, Address, Contact, Job } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { repo } from '../services/repository';

interface CRMProps extends SharedProps {
  customers: Customer[];
  jobs: Job[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

const CRM: React.FC<CRMProps> = ({ 
  customers, jobs, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onNotify, currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'DETAILS' | 'CONTACTS' | 'ADDRESSES' | 'HISTORY'>('DETAILS');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<Customer>({ 
    id: '', companyName: '', tier: 'Regular', contacts: [], addresses: [], notes: '' 
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDrawer = (c?: Customer) => {
    setDrawerTab('DETAILS');
    if (c) setFormData({ ...c }); 
    else setFormData({ id: `ACC-${Date.now()}`, companyName: '', tier: 'Regular', contacts: [], addresses: [], notes: '' });
    setIsDrawerOpen(true);
  };

  const handleSaveEntity = async () => {
    if (!formData.companyName) return onNotify('error', 'Legal Entity Name Required.');
    try {
      await repo.saveItem('customers', formData, currentUser);
      const isNew = !customers.find(c => c.id === formData.id);
      if (isNew) onAddCustomer(formData);
      else onUpdateCustomer(formData);
      setIsDrawerOpen(false);
      onNotify('success', 'Account Node Protocol Synchronized.');
    } catch (e) {
      onNotify('error', 'Persistence Protocol Error.');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-10 pb-24 animate-slide-up h-full flex flex-col italic font-bold">
      <header className="flex justify-between items-center py-16 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Account Registry</h1>
          <p className="text-slate-400 text-sm mt-2 font-bold italic tracking-widest uppercase opacity-60">Canonical Entity Architecture</p>
        </div>
        <div className="flex gap-4 items-center">
           <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter Directory..." className="pl-12 pr-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:ring-8 focus:ring-blue-50 transition-all w-80 outline-none italic font-bold"/>
           </div>
           <Button onClick={() => handleOpenDrawer()} className="rounded-2xl px-10 py-4 shadow-2xl shadow-blue-500/10 active:scale-95 transition-all"><Plus size={20}/> New Account</Button>
        </div>
      </header>

      <Card className="p-0 border-white/20 flex-1 flex flex-col overflow-hidden shadow-2xl">
        <div className="overflow-auto h-full custom-scrollbar">
          <table className="w-full text-left font-bold border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-black/[0.03]">
              <tr className="text-[10px] text-slate-400 uppercase tracking-[0.4em] italic">
                <th className="px-10 py-8 w-12"><button onClick={() => setSelectedIds(selectedIds.length === filteredCustomers.length ? [] : filteredCustomers.map(c => c.id))}>{selectedIds.length === filteredCustomers.length ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}</button></th>
                <th className="px-10 py-8">Identity Profile</th>
                <th className="px-10 py-8">Registry UID</th>
                <th className="px-10 py-8">Tier Architecture</th>
                <th className="px-10 py-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.02]">
              {filteredCustomers.map(c => (
                <tr key={c.id} className={`hover:bg-blue-50/20 transition-all cursor-pointer group ${selectedIds.includes(c.id) ? 'bg-blue-50/40' : ''}`} onClick={() => handleOpenDrawer(c)}>
                  <td className="px-10 py-10" onClick={e => { e.stopPropagation(); handleToggleSelect(c.id); }}>
                    {selectedIds.includes(c.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-200 group-hover:text-slate-300"/>}
                  </td>
                  <td className="px-10 py-10"><p className="text-base font-black text-slate-800 tracking-tighter uppercase italic leading-none">{c.companyName}</p><p className="text-[10px] text-slate-400 mt-2 font-medium italic">Nodes: {c.contacts.length} Personnel • {c.addresses.length} Facilities</p></td>
                  <td className="px-10 py-10 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">{c.id}</td>
                  <td className="px-10 py-10"><Badge color={c.tier === 'VIP' ? 'amber' : 'slate'} className="px-8 py-1.5 shadow-sm">{c.tier}</Badge></td>
                  <td className="px-10 py-10 text-right"><button className="p-3 text-slate-300 group-hover:text-blue-600 transition-all hover:bg-white rounded-2xl shadow-sm"><ChevronRight size={26}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="w-full max-w-4xl bg-white h-auto max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col italic font-bold overflow-hidden border border-slate-100 animate-slide-up">
              <header className="px-12 py-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b-[12px] border-blue-600">
                 <div><h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Identity Specification</h3><p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Registry Node: {formData.id}</p></div>
                 <button onClick={() => setIsDrawerOpen(false)} className="p-4 hover:bg-white/10 rounded-full transition-all active:scale-90 shadow-lg"><X size={32}/></button>
              </header>
              <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] mx-12 mt-10 gap-1 shrink-0 shadow-inner">
                {['DETAILS', 'CONTACTS', 'ADDRESSES', 'HISTORY'].map(tab => (
                  <button key={tab} onClick={() => setDrawerTab(tab as any)} className={`flex-1 p-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${drawerTab === tab ? 'bg-white text-blue-600 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                ))}
              </div>
              <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                {drawerTab === 'DETAILS' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Registered Entity Name</label><input className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-black italic uppercase outline-none focus:ring-8 focus:ring-blue-50 transition-all shadow-inner" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="NODE_NAME_TBD" /></div>
                    <div className="grid grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier Logic</label><select className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black italic shadow-sm" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value as any})}><option value="Regular">STANDARD_CHANNEL</option><option value="VIP">VIP_PRIORITY_NODE</option></select></div><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Metadata Signals</label><input className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black italic shadow-sm" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Analytics Kernel..." /></div></div>
                  </div>
                )}
                {drawerTab === 'CONTACTS' && (
                  <div className="space-y-6 animate-fade-in">
                    <Button variant="outline" className="w-full py-8 border-dashed border-3 rounded-[2.5rem] font-black italic shadow-sm" onClick={() => setFormData({...formData, contacts: [...formData.contacts, {id: Date.now().toString(), name: '', email: '', phone: '', role: 'Admin'}]})}>+ Append Personnel Node</Button>
                    {formData.contacts.map((c, idx) => (
                      <div key={c.id} className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] space-y-4 relative shadow-sm group">
                        <button onClick={() => setFormData({...formData, contacts: formData.contacts.filter(x => x.id !== c.id)})} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={22}/></button>
                        <div className="grid grid-cols-2 gap-6">
                           <input placeholder="Full Name Node..." className="p-5 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={c.name} onChange={e => { const cs = [...formData.contacts]; cs[idx].name = e.target.value; setFormData({...formData, contacts: cs}); }} />
                           <input placeholder="Signal (Email)..." className="p-5 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={c.email} onChange={e => { const cs = [...formData.contacts]; cs[idx].email = e.target.value; setFormData({...formData, contacts: cs}); }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {drawerTab === 'ADDRESSES' && (
                  <div className="space-y-6 animate-fade-in">
                    <Button variant="outline" className="w-full py-8 border-dashed border-3 rounded-[2.5rem] font-black italic shadow-sm" onClick={() => setFormData({...formData, addresses: [...formData.addresses, {id: Date.now().toString(), label: 'HQ', street: '', city: '', country: '', building: '', poBox: ''}]})}>+ Append Logistics Node</Button>
                    {formData.addresses.map((a, idx) => (
                      <div key={a.id} className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] space-y-4 relative shadow-sm group">
                        <button onClick={() => setFormData({...formData, addresses: formData.addresses.filter(x => x.id !== a.id)})} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={22}/></button>
                        <div className="grid grid-cols-2 gap-6">
                           <input placeholder="Building / Suite..." className="p-5 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={a.building} onChange={e => { const as = [...formData.addresses]; as[idx].building = e.target.value; setFormData({...formData, addresses: as}); }} />
                           <input placeholder="Street Path..." className="p-5 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={a.street} onChange={e => { const as = [...formData.addresses]; as[idx].street = e.target.value; setFormData({...formData, addresses: as}); }} />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                           <input placeholder="City Hub..." className="p-4 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={a.city} onChange={e => { const as = [...formData.addresses]; as[idx].city = e.target.value; setFormData({...formData, addresses: as}); }} />
                           <input placeholder="Country..." className="p-4 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={a.country} onChange={e => { const as = [...formData.addresses]; as[idx].country = e.target.value; setFormData({...formData, addresses: as}); }} />
                           <input placeholder="P.O. Box..." className="p-4 rounded-2xl border-2 border-white italic font-bold shadow-sm" value={a.poBox} onChange={e => { const as = [...formData.addresses]; as[idx].poBox = e.target.value; setFormData({...formData, addresses: as}); }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </main>
              <footer className="px-12 py-10 border-t border-slate-100 flex justify-end gap-5 bg-white shrink-0 shadow-inner">
                 <Button variant="ghost" className="px-10 rounded-2xl font-black uppercase text-xs shadow-sm border border-slate-100" onClick={() => setIsDrawerOpen(false)}>Abort Modification</Button>
                 <Button className="px-20 py-5 rounded-2xl shadow-2xl font-black italic uppercase tracking-widest shadow-blue-500/30 active:scale-95 transition-all" onClick={handleSaveEntity}><Save size={22} className="mr-3"/> Commit Node Sync</Button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default CRM;