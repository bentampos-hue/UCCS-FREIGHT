
import React, { useState, useRef } from 'react';
import { Search, Filter, ShieldCheck, Zap, Plus, X, Save, ChevronDown, Star, User, Phone, Calendar, ArrowRight, Mail, Edit2, Trash2, MapPin, AlertCircle, Anchor, Download, FileUp, MoreHorizontal } from 'lucide-react';
import { Vendor, Contact, Address, SharedProps } from '../types';
import { csvHelper } from '../services/csvHelper';
import { repo } from '../services/repository';

interface VendorNetworkProps extends SharedProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
}

const VendorNetwork: React.FC<VendorNetworkProps> = ({ vendors, onAddVendor, onUpdateVendor, onNotify, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'CONTACTS' | 'ADDRESSES'>('DETAILS');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState<Vendor>({
    id: '',
    name: '',
    tier: 'Standard',
    lanes: [],
    apiReady: false,
    contractExpiry: '',
    contacts: [],
    addresses: []
  });
  
  // Helper for text input of lanes
  const [laneInput, setLaneInput] = useState('');

  const getExpiryStatus = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400', border: 'border-slate-200' };
    if (diffDays < 30) return { label: 'Expiring Soon', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', border: 'border-red-200' };
    if (diffDays < 90) return { label: 'Review Upcoming', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', border: 'border-amber-200' };
    return { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', border: 'border-emerald-200' };
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.lanes.some(lane => lane.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (showExpiringOnly) {
       const status = getExpiryStatus(v.contractExpiry);
       const isExpiring = status.label !== 'Active';
       return matchesSearch && isExpiring;
    }
    return matchesSearch;
  });

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = csvHelper.parseCSV(text);
    
    if (data.length === 0) {
      onNotify('error', 'CSV is empty or malformed.');
      return;
    }

    const newVendors: Vendor[] = data.map((row, idx) => {
      const id = `V-IMP-${Date.now()}-${idx}`;
      return {
        id,
        name: row.name || 'Unknown Vendor',
        tier: (row.tier === 'Premium' ? 'Premium' : 'Standard') as any,
        contractExpiry: row.contractExpiry || '2026-12-31',
        lanes: row.lanes ? row.lanes.split(',').map((l: string) => l.trim()) : ['General'],
        apiReady: row.apiReady?.toLowerCase() === 'true',
        contacts: row.primaryContactEmail ? [{
          id: `CON-${id}`,
          name: row.primaryContactName || 'Primary Agent',
          email: row.primaryContactEmail,
          phone: row.primaryContactPhone || '',
          role: 'Agent',
          isPrimary: true
        }] : [],
        addresses: []
      };
    });

    await repo.saveItemsBulk('vendors', newVendors, currentUser);
    onNotify('success', `Successfully uploaded ${newVendors.length} logistics partners.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.location.reload();
  };

  const handleOpenModal = (vendor?: Vendor) => {
    setActiveTab('DETAILS');
    if (vendor) {
        setEditingId(vendor.id);
        setFormData(JSON.parse(JSON.stringify(vendor))); // Deep copy
        setLaneInput(vendor.lanes.join(', '));
    } else {
        setEditingId(null);
        setFormData({ 
            id: '', 
            name: '', 
            tier: 'Standard', 
            lanes: [],
            apiReady: false, 
            contractExpiry: '',
            contacts: [],
            addresses: []
        });
        setLaneInput('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    const newVendor: Vendor = {
        ...formData,
        id: editingId || `V${String(vendors.length + 1).padStart(3, '0')}`,
        lanes: laneInput ? laneInput.split(',').map(s => s.trim()) : ['General'],
        contractExpiry: formData.contractExpiry || '2025-12-31',
    };

    if (editingId) {
        onUpdateVendor(newVendor);
    } else {
        onAddVendor(newVendor);
    }
    
    setIsModalOpen(false)
    setEditingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const addContact = () => {
      setFormData(prev => ({
          ...prev,
          contacts: [...prev.contacts, { id: Date.now().toString(), name: '', role: '', email: '', phone: '', isPrimary: prev.contacts.length === 0 }]
      }));
  };

  const updateContact = (index: number, field: keyof Contact, value: any) => {
      const newContacts = [...formData.contacts];
      if (field === 'isPrimary' && value === true) {
          newContacts.forEach(c => c.isPrimary = false);
      }
      newContacts[index] = { ...newContacts[index], [field]: value };
      setFormData(prev => ({ ...prev, contacts: newContacts }));
  };

  const removeContact = (index: number) => {
      setFormData(prev => ({ ...prev, contacts: prev.contacts.filter((_, i) => i !== index) }));
  };

  const addAddress = () => {
      setFormData(prev => ({
          ...prev,
          addresses: [...prev.addresses, { id: Date.now().toString(), label: 'New Branch', type: 'Both', street: '', city: '', country: '', zip: '' }]
      }));
  };

  const updateAddress = (index: number, field: keyof Address, value: any) => {
      const newAddresses = [...formData.addresses];
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      setFormData(prev => ({ ...prev, addresses: newAddresses }));
  };

  const removeAddress = (index: number) => {
      setFormData(prev => ({ ...prev, addresses: prev.addresses.filter((_, i) => i !== index) }));
  };

  const getPrimaryContact = (v: Vendor) => v.contacts.find(x => x.isPrimary) || v.contacts[0];

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden border-b-[16px] border-blue-600">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Anchor size={280} /></div>
        <div className="z-10">
          <h3 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">Logistics Net</h3>
          <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-[10px]">Tiered Vendor Management</p>
        </div>
        <div className="flex gap-4">
             <button onClick={() => csvHelper.downloadTemplate('VENDORS')} className="px-8 py-3 bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 italic">
               <Download size={14}/> Template
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-blue-600 border border-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 italic shadow-xl">
               <FileUp size={14}/> Bulk Load
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCSVImport} />
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-[500px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Filter by Vendor or specialized lane..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-2 border-slate-100 rounded-3xl text-sm font-black outline-none focus:border-blue-400 shadow-inner bg-white uppercase transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                className={`flex items-center gap-3 px-8 py-4 border-2 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all italic ${
                    showExpiringOnly 
                    ? 'bg-amber-50 border-amber-300 text-amber-800' 
                    : 'bg-white border-slate-100 text-slate-400 hover:text-blue-600'
                }`}
            >
                {showExpiringOnly ? <AlertCircle size={16} /> : <Filter size={16} />}
                <span>{showExpiringOnly ? 'Issues Only' : 'Filter Status'}</span>
            </button>
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-4 px-10 py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl italic active:scale-95"
            >
                <Plus size={18} />
                <span>Onboard Partner</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100 italic">
                <th className="px-12 py-8">ID</th>
                <th className="px-12 py-8">PARTNER NAME</th>
                <th className="px-12 py-8">TIER</th>
                <th className="px-12 py-8">API GATEWAY</th>
                <th className="px-12 py-8">SPECIALIZED LANES</th>
                <th className="px-12 py-8">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {filteredVendors.length === 0 ? (
                <tr><td colSpan={6} className="p-24 text-center text-slate-300 uppercase font-black italic text-xl tracking-tighter">No logistics partners detected.</td></tr>
              ) : filteredVendors.map((vendor) => {
                const status = getExpiryStatus(vendor.contractExpiry);
                const isExpanded = expandedId === vendor.id;
                const primary = getPrimaryContact(vendor);
                
                return (
                <React.Fragment key={vendor.id}>
                  <tr 
                    onClick={() => toggleExpand(vendor.id)}
                    className={`transition-all cursor-pointer group ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-12 py-8">
                        <div className={`p-4 rounded-[1.5rem] w-fit font-mono text-[10px] font-black transition-all ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {vendor.id}
                        </div>
                    </td>
                    <td className="px-12 py-8">
                       <div className="flex flex-col">
                           <span className={`font-black text-[13px] uppercase italic tracking-tighter transition-all ${isExpanded ? 'text-blue-700' : 'text-slate-900'}`}>{vendor.name}</span>
                           {primary && (
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic flex items-center">
                                <User size={10} className="mr-2"/> {primary.name}
                             </span>
                           )}
                       </div>
                    </td>
                    <td className="px-12 py-8">
                      {vendor.tier === 'Premium' ? (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200 italic shadow-sm shadow-indigo-100">
                          <ShieldCheck size={12} className="mr-2 fill-current" /> Platinum
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 italic">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-12 py-8">
                      {vendor.apiReady ? (
                        <div className="flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                          <Zap size={14} className="mr-2 fill-current" /> SYNCED
                        </div>
                      ) : (
                        <div className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic">MANUAL</div>
                      )}
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex flex-wrap gap-2">
                        {vendor.lanes.slice(0, 2).map((lane, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl italic group-hover:border-blue-200 transition-all">
                            {lane}
                          </span>
                        ))}
                        {vendor.lanes.length > 2 && (
                          <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-xl italic">
                            +{vendor.lanes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest italic ${status.bg} ${status.color} ${status.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status.dot} animate-pulse`}></span>
                          {status.label}
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-slate-50/50 animate-fade-in shadow-inner">
                      <td colSpan={6} className="p-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 p-12 bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-2xl relative">
                          <button onClick={(e) => { e.stopPropagation(); toggleExpand(vendor.id); }} className="absolute top-8 right-8 p-4 bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 shadow-sm transition-all"><X size={24} /></button>
                          
                          <div className="space-y-8">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic border-b border-slate-50 pb-4">
                              <MapPin size={18} className="mr-4 text-blue-600" /> Corridors
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                               {vendor.lanes.length > 0 ? vendor.lanes.map((lane, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-400 transition-all group shadow-inner">
                                        <span className="text-xs font-black text-slate-900 italic uppercase tracking-tighter">{lane}</span>
                                        <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-500 transition-all" />
                                    </div>
                                )) : <div className="text-[10px] text-slate-300 italic font-black uppercase">No active lanes.</div>}
                            </div>
                          </div>

                          <div className="space-y-8">
                             <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic border-b border-slate-50 pb-4">
                                 <Anchor size={18} className="mr-4 text-blue-600" /> Compliance
                             </h4>
                             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute -bottom-10 -right-10 opacity-5"><ShieldCheck size={120} /></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 italic">Contract Cycle</p>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
                                        <span className="text-sm font-black italic">{vendor.contractExpiry}</span>
                                        <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.color} italic shadow-lg`}>{status.label}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 italic">Gateway Connectivity</p>
                                    <div className={`p-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest flex items-center gap-3 border ${vendor.apiReady ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                        <Zap size={14} className={vendor.apiReady ? 'animate-pulse fill-current' : ''} />
                                        {vendor.apiReady ? 'PROD: AIS_REALTIME_ACTIVE' : 'OFFLINE: MANUAL_OVERRIDE'}
                                    </div>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-8">
                             <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center italic border-b border-slate-50 pb-4">
                                 <User size={18} className="mr-4 text-blue-600" /> Personnel
                             </h4>
                             <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                                    {primary ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between"><span className="text-sm font-black text-slate-900 uppercase italic leading-none">{primary.name}</span> <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded italic">POC</span></div>
                                            <div className="flex items-center text-[11px] font-bold text-slate-500 italic"><Mail size={14} className="mr-3 text-slate-300"/> {primary.email}</div>
                                            <div className="flex items-center text-[11px] font-bold text-slate-500 italic"><Phone size={14} className="mr-3 text-slate-300"/> {primary.phone}</div>
                                        </div>
                                    ) : <span className="text-[10px] text-slate-300 font-black italic uppercase">Registry pending.</span>}
                                </div>
                                <div className="flex gap-4">
                                  <button onClick={(e) => { e.stopPropagation(); handleOpenModal(vendor); }} className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/30 italic active:scale-95 flex items-center justify-center gap-3"><Edit2 size={16}/> UPDATE</button>
                                  <button className="px-6 py-5 bg-white border-2 border-slate-100 hover:border-blue-600 hover:text-blue-600 text-slate-300 rounded-2xl transition-all shadow-sm active:scale-95"><MoreHorizontal size={24}/></button>
                                </div>
                             </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 animate-fade-in">
            <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-t-[16px] border-blue-600">
                <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{editingId ? 'Modify Partner' : 'Partner Onboarding'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white rounded-2xl border-2 border-slate-100 text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
                </div>

                <div className="flex bg-slate-50/50 p-2 border-b border-slate-100 shrink-0">
                    <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'DETAILS' ? 'bg-white text-blue-600 shadow-sm italic' : 'text-slate-400 hover:text-slate-900'}`}>Protocol</button>
                    <button onClick={() => setActiveTab('CONTACTS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'CONTACTS' ? 'bg-white text-blue-600 shadow-sm italic' : 'text-slate-400 hover:text-slate-900'}`}>Personnel ({formData.contacts.length})</button>
                    <button onClick={() => setActiveTab('ADDRESSES')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'ADDRESSES' ? 'bg-white text-blue-600 shadow-sm italic' : 'text-slate-400 hover:text-slate-900'}`}>Nodes ({formData.addresses.length})</button>
                </div>

                <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Partner Entity Name</label>
                                <input type="text" className="w-full p-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-400 outline-none text-sm font-black italic uppercase shadow-inner" placeholder="MAERSK LINE" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Service Tier</label>
                                    <select className="w-full p-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-400 outline-none text-sm font-black italic uppercase shadow-inner" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value as any})}>
                                        <option value="Standard">Standard</option>
                                        <option value="Premium">Platinum Partner</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Expiry Protocol</label>
                                    <input type="date" className="w-full p-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-400 outline-none text-sm font-black italic uppercase shadow-inner" value={formData.contractExpiry} onChange={e => setFormData({...formData, contractExpiry: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Operational Corridors (Comma Sep)</label>
                                <input type="text" className="w-full p-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-blue-400 outline-none text-sm font-black italic uppercase shadow-inner" placeholder="SHANGHAI->LA, HAMBURG->NY" value={laneInput} onChange={e => setLaneInput(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                <input type="checkbox" id="apiReady" checked={formData.apiReady} onChange={e => setFormData({...formData, apiReady: e.target.checked})} className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500" />
                                <label htmlFor="apiReady" className="text-[10px] font-black uppercase text-slate-900 tracking-widest italic">API Integration Active</label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CONTACTS' && (
                        <div className="space-y-6">
                            {formData.contacts.map((contact, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 relative group animate-fade-in shadow-inner">
                                    <button onClick={() => removeContact(idx)} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-slate-300 hover:text-red-600 shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-5 mb-4">
                                        <input placeholder="Agent Name" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} />
                                        <input placeholder="Technical Role" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={contact.role} onChange={e => updateContact(idx, 'role', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5 mb-4">
                                        <input placeholder="Email Node" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} />
                                        <input placeholder="Direct Dial" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" checked={contact.isPrimary} onChange={() => updateContact(idx, 'isPrimary', true)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Global Master Point</span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addContact} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 italic transition-all">
                                <Plus size={16}/> Register Agent
                            </button>
                        </div>
                    )}

                    {activeTab === 'ADDRESSES' && (
                        <div className="space-y-6">
                            {formData.addresses.map((addr, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 relative shadow-inner">
                                    <button onClick={() => removeAddress(idx)} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-slate-300 hover:text-red-600 shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-5 mb-4">
                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-black tracking-widest italic mb-1 block">Label</label>
                                            <input placeholder="PORT OF SHANGHAI HUB" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.label} onChange={e => updateAddress(idx, 'label', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-black tracking-widest italic mb-1 block">Type</label>
                                            <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase outline-none" value={addr.type} onChange={e => updateAddress(idx, 'type', e.target.value)}>
                                                <option value="Both">General Node</option>
                                                <option value="Billing">Accounts Only</option>
                                                <option value="Shipping">Operational Hub</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <input placeholder="Terminal / Street Address" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.street} onChange={e => updateAddress(idx, 'street', e.target.value)} />
                                        <div className="grid grid-cols-3 gap-4">
                                            <input placeholder="City" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.city} onChange={e => updateAddress(idx, 'city', e.target.value)} />
                                            <input placeholder="Country" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.country} onChange={e => updateAddress(idx, 'country', e.target.value)} />
                                            <input placeholder="Zip" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.zip} onChange={e => updateAddress(idx, 'zip', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addAddress} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 italic transition-all">
                                <Plus size={16}/> Add Partner Node
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-10 py-8 border-t border-slate-100 flex justify-end gap-5 shrink-0">
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all italic">Dismiss</button>
                    <button onClick={handleSave} className="px-12 py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 italic flex items-center gap-3 active:scale-95">
                        <Save size={18} /> {editingId ? 'Sync Registry' : 'Onboard Partner'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VendorNetwork;
