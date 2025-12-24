import React, { useState, useRef } from 'react';
import { Users, Search, Plus, Save, X, Phone, Mail, Building, Star, MoreHorizontal, Edit2, MapPin, Briefcase, Trash2, User, Download, Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Customer, Contact, Address, SharedProps } from '../types';
import { csvHelper } from '../services/csvHelper';
import { repo } from '../services/repository';

interface CRMProps extends SharedProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

const CRM: React.FC<CRMProps> = ({ customers, onAddCustomer, onUpdateCustomer, onNotify, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'CONTACTS' | 'ADDRESSES'>('DETAILS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced Form State
  const [formData, setFormData] = useState<Customer>({
    id: '',
    companyName: '',
    tier: 'Regular',
    contacts: [],
    addresses: [],
    notes: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacts.some(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (customer?: Customer) => {
    setActiveTab('DETAILS');
    if (customer) {
        setEditingId(customer.id);
        setFormData(JSON.parse(JSON.stringify(customer))); // Deep copy
    } else {
        setEditingId(null);
        setFormData({ 
            id: '', 
            companyName: '', 
            tier: 'Regular', 
            contacts: [], 
            addresses: [],
            notes: '' 
        });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.companyName) return;

    const newCustomer: Customer = {
      ...formData,
      id: editingId || `C${String(customers.length + 1).padStart(3, '0')}`,
    };

    if (editingId) {
        onUpdateCustomer(newCustomer);
    } else {
        onAddCustomer(newCustomer);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = csvHelper.parseCSV(text);
    
    if (data.length === 0) {
      onNotify('error', 'CSV is empty or malformed.');
      return;
    }

    const newCustomers: Customer[] = data.map((row, idx) => {
      const id = `C-IMP-${Date.now()}-${idx}`;
      return {
        id,
        companyName: row.companyName || 'Unknown Corp',
        tier: (row.tier === 'VIP' ? 'VIP' : 'Regular') as any,
        contacts: row.primaryContactEmail ? [{
          id: `CON-${id}`,
          name: row.primaryContactName || 'Primary Contact',
          email: row.primaryContactEmail,
          phone: row.primaryContactPhone || '',
          role: 'Contact',
          isPrimary: true
        }] : [],
        addresses: row.street ? [{
          id: `ADR-${id}`,
          label: 'HQ',
          street: row.street,
          city: row.city || '',
          country: row.country || '',
          zip: row.zip || '',
          type: 'Both'
        }] : [],
        notes: 'Imported via CSV'
      };
    });

    await repo.saveItemsBulk('customers', newCustomers, currentUser);
    onNotify('success', `Successfully imported ${newCustomers.length} corporate records.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.location.reload(); // Refresh to show bulk data
  };

  // --- Sub-form Handlers ---
  const addContact = () => {
      setFormData(prev => ({
          ...prev,
          contacts: [...prev.contacts, { id: Date.now().toString(), name: '', role: '', email: '', phone: '', isPrimary: prev.contacts.length === 0 }]
      }));
  };

  const updateContact = (index: number, field: keyof Contact, value: any) => {
      const newContacts = [...formData.contacts];
      if (field === 'isPrimary' && value === true) {
          // Unset others
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

  const getPrimaryContact = (c: Customer) => c.contacts.find(x => x.isPrimary) || c.contacts[0];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="bg-purple-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-[16px] border-purple-700">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Users size={280} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <h3 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">Corporate CRM</h3>
            <p className="text-purple-300 font-bold uppercase tracking-[0.3em] text-[10px]">Strategic Client Ecosystem</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => csvHelper.downloadTemplate('CUSTOMERS')} className="px-8 py-3 bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 italic">
               <Download size={14}/> Template
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-indigo-600 border border-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 italic shadow-xl">
               <FileUp size={14}/> Bulk Import
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCSVImport} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-200 flex flex-col min-h-[600px] overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div className="relative w-full md:w-[500px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search Entities, Contacts, or Domains..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-2 border-slate-100 rounded-3xl text-sm font-black outline-none focus:border-purple-400 shadow-inner bg-white uppercase transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-4 px-10 py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-2xl italic active:scale-95"
          >
            <Plus size={18} />
            <span>Add Customer Account</span>
          </button>
        </div>

        {/* Grid View */}
        <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30 italic font-black text-2xl uppercase tracking-tighter">No corporate matches found.</div>
          ) : filteredCustomers.map(customer => {
            const primary = getPrimaryContact(customer);
            return (
            <div key={customer.id} className="bg-white rounded-[2.5rem] border-2 border-slate-50 hover:border-purple-200 hover:shadow-2xl transition-all p-8 group relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black italic shadow-lg ${customer.tier === 'VIP' ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' : 'bg-slate-100 text-slate-600 border-2 border-slate-200'}`}>
                    {customer.companyName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg leading-tight">{customer.companyName}</h4>
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">{customer.id}</p>
                  </div>
                </div>
                <button 
                    onClick={() => handleOpenModal(customer)} 
                    className="p-3 bg-slate-50 text-slate-300 hover:text-purple-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
                >
                  <Edit2 size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-sm font-bold text-slate-600 italic">
                  <User className="mr-3 text-purple-600" size={16} />
                  {primary ? primary.name : <span className="text-slate-300 uppercase text-[10px] font-black tracking-widest">No primary contact</span>}
                </div>
                <div className="flex items-center text-sm font-bold text-slate-600 italic">
                  <Mail className="mr-3 text-purple-600" size={16} />
                  <span className="truncate">{primary ? primary.email : 'n/a'}</span>
                </div>
                <div className="flex items-center text-sm font-bold text-slate-600 italic">
                  <Building className="mr-3 text-purple-600" size={16} />
                  {customer.addresses.length > 0 ? `${customer.addresses.length} ACTIVE BRANCHES` : 'NO REGISTERED ADDRESSES'}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                 {customer.tier === 'VIP' ? (
                   <span className="inline-flex items-center px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 italic shadow-sm shadow-amber-100">
                      <Star size={12} className="mr-2 fill-current" /> Platinum Tier
                   </span>
                 ) : (
                   <span className="inline-flex items-center px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100 italic">
                      Regular Account
                   </span>
                 )}
                 <button onClick={() => handleOpenModal(customer)} className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:translate-x-1 transition-transform italic">Open Profile &rarr;</button>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 animate-fade-in">
            <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-t-[16px] border-purple-600">
                <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{editingId ? 'Edit Profile' : 'Register New Account'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white rounded-2xl border-2 border-slate-100 text-slate-300 hover:text-slate-900 transition-all"><X size={24} /></button>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-slate-50/50 p-2 border-b border-slate-100 shrink-0">
                    <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'DETAILS' ? 'bg-white text-purple-600 shadow-sm italic' : 'text-slate-400 hover:text-slate-900'}`}>General Info</button>
                    <button onClick={() => setActiveTab('CONTACTS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'CONTACTS' ? 'bg-white text-purple-600 shadow-sm italic' : 'text-slate-400 hover:text-slate-900'}`}>Personnel ({formData.contacts.length})</button>
                    <button onClick={() => setActiveTab('ADDRESSES')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'ADDRESSES' ? 'bg-white text-purple-600 shadow-sm italic' : 'text-slate-400 hover:text-slate-900'}`}>Branches ({formData.addresses.length})</button>
                </div>

                <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                    {/* DETAILS TAB */}
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Registered Entity Name</label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-purple-400 outline-none text-sm font-black italic uppercase shadow-inner"
                                        value={formData.companyName}
                                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                                        placeholder="GLOBAL LOGISTICS INC"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Strategic Tier</label>
                                <select 
                                   className="w-full p-4 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:border-purple-400 outline-none text-sm font-black italic uppercase shadow-inner"
                                   value={formData.tier}
                                   onChange={e => setFormData({...formData, tier: e.target.value as any})}
                                >
                                   <option value="Regular">Regular Account</option>
                                   <option value="VIP">Platinum / VIP</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest italic">Operational Notes</label>
                                <textarea 
                                    className="w-full p-5 border-2 border-slate-100 bg-slate-50/50 rounded-3xl focus:border-purple-400 outline-none h-32 text-sm font-bold italic shadow-inner resize-none"
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Add internal remarks about billing cycles or specific lane preferences..."
                                />
                            </div>
                        </div>
                    )}

                    {/* CONTACTS TAB */}
                    {activeTab === 'CONTACTS' && (
                        <div className="space-y-6">
                            {formData.contacts.map((contact, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 relative group animate-fade-in shadow-inner">
                                    <button onClick={() => removeContact(idx)} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-slate-300 hover:text-red-600 shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-5 mb-4">
                                        <input 
                                            placeholder="Full Name"
                                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase"
                                            value={contact.name}
                                            onChange={e => updateContact(idx, 'name', e.target.value)}
                                        />
                                        <input 
                                            placeholder="Job Title"
                                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase"
                                            value={contact.role}
                                            onChange={e => updateContact(idx, 'role', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5 mb-4">
                                        <input 
                                            placeholder="Email Address"
                                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase"
                                            value={contact.email}
                                            onChange={e => updateContact(idx, 'email', e.target.value)}
                                        />
                                        <input 
                                            placeholder="Contact Phone"
                                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase"
                                            value={contact.phone}
                                            onChange={e => updateContact(idx, 'phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="radio" 
                                            checked={contact.isPrimary}
                                            onChange={() => updateContact(idx, 'isPrimary', true)}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Primary Global Point</span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addContact} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-400 hover:border-purple-400 hover:text-purple-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 italic transition-all">
                                <Plus size={16}/> Add Personnel
                            </button>
                        </div>
                    )}

                    {/* ADDRESSES TAB */}
                    {activeTab === 'ADDRESSES' && (
                        <div className="space-y-6">
                            {formData.addresses.map((addr, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 relative shadow-inner">
                                    <button onClick={() => removeAddress(idx)} className="absolute top-4 right-4 p-2 bg-white rounded-xl text-slate-300 hover:text-red-600 shadow-sm border border-slate-100"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-5 mb-4">
                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-black tracking-widest italic mb-1 block">Label</label>
                                            <input 
                                                placeholder="e.g. LOGISTICS HUB"
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase"
                                                value={addr.label}
                                                onChange={e => updateAddress(idx, 'label', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] uppercase text-slate-400 font-black tracking-widest italic mb-1 block">Segment</label>
                                            <select
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase outline-none"
                                                value={addr.type}
                                                onChange={e => updateAddress(idx, 'type', e.target.value)}
                                            >
                                                <option value="Both">Billing & Physical</option>
                                                <option value="Billing">Billing Only</option>
                                                <option value="Shipping">Physical Only</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <input 
                                            placeholder="Primary Street"
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase"
                                            value={addr.street}
                                            onChange={e => updateAddress(idx, 'street', e.target.value)}
                                        />
                                        <div className="grid grid-cols-3 gap-4">
                                            <input placeholder="City" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.city} onChange={e => updateAddress(idx, 'city', e.target.value)} />
                                            <input placeholder="Country" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.country} onChange={e => updateAddress(idx, 'country', e.target.value)} />
                                            <input placeholder="Zip" className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-black italic uppercase" value={addr.zip} onChange={e => updateAddress(idx, 'zip', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addAddress} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-400 hover:border-purple-400 hover:text-purple-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 italic transition-all">
                                <Plus size={16}/> Add Location Node
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-10 py-8 border-t border-slate-100 flex justify-end gap-5 shrink-0">
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all italic">Dismiss</button>
                    <button onClick={handleSave} className="px-12 py-4 bg-purple-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/30 italic flex items-center gap-3 active:scale-95">
                        <Save size={18} /> {editingId ? 'Sync Updates' : 'Commit Record'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CRM;