
import React, { useState } from 'react';
import { Users, Search, Plus, Save, X, Phone, Mail, Building, Star, MoreHorizontal, Edit2, MapPin, Briefcase, Trash2, User } from 'lucide-react';
import { Customer, Contact, Address, SharedProps } from '../types';

interface CRMProps extends SharedProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

const CRM: React.FC<CRMProps> = ({ customers, onAddCustomer, onUpdateCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'CONTACTS' | 'ADDRESSES'>('DETAILS');
  
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
    <div className="space-y-8 animate-fade-in">
      <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg shadow-sm">
        <h3 className="font-bold text-purple-900 mb-1">Customer Relationship Management (CRM)</h3>
        <p className="text-purple-800 text-sm">
          Manage your client database. Registered customers will be available for quick selection in the Quote Simulator.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Grid View */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => {
            const primary = getPrimaryContact(customer);
            return (
            <div key={customer.id} className="bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all p-5 group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${customer.tier === 'VIP' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {customer.companyName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{customer.companyName}</h4>
                    <p className="text-xs text-slate-400 font-mono">{customer.id}</p>
                  </div>
                </div>
                <button 
                    onClick={() => handleOpenModal(customer)} 
                    className="text-slate-300 hover:text-purple-600 p-1 rounded hover:bg-purple-50 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center text-sm text-slate-600">
                  <User className="mr-2 text-slate-400" size={14} />
                  {primary ? primary.name : <span className="text-slate-400 italic">No Contact</span>}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="mr-2 text-slate-400" size={14} />
                  {primary ? primary.email : <span className="text-slate-400 italic">No Email</span>}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <MapPin className="mr-2 text-slate-400" size={14} />
                  {customer.addresses.length > 0 ? `${customer.addresses.length} Branches` : <span className="text-slate-400 italic">No Addresses</span>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                 {customer.tier === 'VIP' ? (
                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                      <Star size={10} className="mr-1 fill-current" /> VIP Client
                   </span>
                 ) : (
                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">
                      Regular
                   </span>
                 )}
                 <button onClick={() => handleOpenModal(customer)} className="text-xs text-purple-600 font-medium hover:underline">View Details</button>
              </div>
            </div>
          )}})}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
                <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-purple-900">{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 shrink-0">
                    <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'DETAILS' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-purple-600'}`}>General Info</button>
                    <button onClick={() => setActiveTab('CONTACTS')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'CONTACTS' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-purple-600'}`}>Contacts ({formData.contacts.length})</button>
                    <button onClick={() => setActiveTab('ADDRESSES')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ADDRESSES' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-purple-600'}`}>Branches ({formData.addresses.length})</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* DETAILS TAB */}
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-9 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={formData.companyName}
                                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                                        placeholder="Global Imports Ltd."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tier</label>
                                <select 
                                   className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                   value={formData.tier}
                                   onChange={e => setFormData({...formData, tier: e.target.value as any})}
                                >
                                   <option value="Regular">Regular</option>
                                   <option value="VIP">VIP</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Internal Notes</label>
                                <textarea 
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none h-24 text-sm"
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Add notes about payment terms, preferences..."
                                />
                            </div>
                        </div>
                    )}

                    {/* CONTACTS TAB */}
                    {activeTab === 'CONTACTS' && (
                        <div className="space-y-4">
                            {formData.contacts.map((contact, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                                    <button onClick={() => removeContact(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <input 
                                            placeholder="Full Name"
                                            className="p-1.5 border border-slate-300 rounded text-sm"
                                            value={contact.name}
                                            onChange={e => updateContact(idx, 'name', e.target.value)}
                                        />
                                        <input 
                                            placeholder="Job Title / Role"
                                            className="p-1.5 border border-slate-300 rounded text-sm"
                                            value={contact.role}
                                            onChange={e => updateContact(idx, 'role', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <input 
                                            placeholder="Email"
                                            className="p-1.5 border border-slate-300 rounded text-sm"
                                            value={contact.email}
                                            onChange={e => updateContact(idx, 'email', e.target.value)}
                                        />
                                        <input 
                                            placeholder="Phone"
                                            className="p-1.5 border border-slate-300 rounded text-sm"
                                            value={contact.phone}
                                            onChange={e => updateContact(idx, 'phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input 
                                            type="radio" 
                                            checked={contact.isPrimary}
                                            onChange={() => updateContact(idx, 'isPrimary', true)}
                                            className="mr-2"
                                        />
                                        <span className="text-xs text-slate-600">Primary Contact</span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addContact} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-purple-500 hover:text-purple-600 text-sm font-bold flex items-center justify-center">
                                <Plus size={16} className="mr-1"/> Add Contact
                            </button>
                        </div>
                    )}

                    {/* ADDRESSES TAB */}
                    {activeTab === 'ADDRESSES' && (
                        <div className="space-y-4">
                            {formData.addresses.map((addr, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
                                    <button onClick={() => removeAddress(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-400 font-bold">Branch / Label</label>
                                            <input 
                                                placeholder="e.g. HQ"
                                                className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                                value={addr.label}
                                                onChange={e => updateAddress(idx, 'label', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-slate-400 font-bold">Type</label>
                                            <select
                                                className="w-full p-1.5 border border-slate-300 rounded text-sm bg-white"
                                                value={addr.type}
                                                onChange={e => updateAddress(idx, 'type', e.target.value)}
                                            >
                                                <option value="Both">Billing & Shipping</option>
                                                <option value="Billing">Billing Only</option>
                                                <option value="Shipping">Shipping Only</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <input 
                                            placeholder="Street Address"
                                            className="w-full p-1.5 border border-slate-300 rounded text-sm"
                                            value={addr.street}
                                            onChange={e => updateAddress(idx, 'street', e.target.value)}
                                        />
                                        <div className="grid grid-cols-3 gap-2">
                                            <input 
                                                placeholder="City"
                                                className="p-1.5 border border-slate-300 rounded text-sm"
                                                value={addr.city}
                                                onChange={e => updateAddress(idx, 'city', e.target.value)}
                                            />
                                            <input 
                                                placeholder="Country"
                                                className="p-1.5 border border-slate-300 rounded text-sm"
                                                value={addr.country}
                                                onChange={e => updateAddress(idx, 'country', e.target.value)}
                                            />
                                            <input 
                                                placeholder="Zip"
                                                className="p-1.5 border border-slate-300 rounded text-sm"
                                                value={addr.zip}
                                                onChange={e => updateAddress(idx, 'zip', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addAddress} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-purple-500 hover:text-purple-600 text-sm font-bold flex items-center justify-center">
                                <Plus size={16} className="mr-1"/> Add Branch Address
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 shrink-0">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center">
                        <Save size={16} className="mr-2" /> {editingId ? 'Update Customer' : 'Save Customer'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
