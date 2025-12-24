
import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, Zap, Plus, X, Save, ChevronDown, Star, User, Phone, Calendar, ArrowRight, Mail, Edit2, Trash2, MapPin, AlertCircle, Anchor } from 'lucide-react';
import { Vendor, Contact, Address, SharedProps } from '../types';

interface VendorNetworkProps extends SharedProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
}

const VendorNetwork: React.FC<VendorNetworkProps> = ({ vendors, onAddVendor, onUpdateVendor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'CONTACTS' | 'ADDRESSES'>('DETAILS');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  
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
       // Filter for Expired, Expiring Soon, or Review Upcoming
       const isExpiring = status.label !== 'Active';
       return matchesSearch && isExpiring;
    }
    
    return matchesSearch;
  });

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
    
    setIsModalOpen(false);
    setEditingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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

  const getPrimaryContact = (v: Vendor) => v.contacts.find(x => x.isPrimary) || v.contacts[0];

  return (
    <div className="space-y-8 animate-fade-in relative">
       <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-lg shadow-sm">
        <h3 className="font-bold text-amber-900 mb-1">Vendor Master Database</h3>
        <p className="text-amber-800 text-sm">
          The heart of the "Intake & Vendor Match" module. Click on any vendor row to expand details about specialized trade lanes, API connectivity, and contract status.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Vendor or Lane (e.g., Shanghai)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button 
                onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    showExpiringOnly 
                    ? 'bg-amber-100 border-amber-300 text-amber-800' 
                    : 'border-slate-300 text-slate-600 hover:bg-white'
                }`}
            >
                {showExpiringOnly ? <AlertCircle size={16} className="fill-current" /> : <Filter size={16} />}
                <span>{showExpiringOnly ? 'Filtering: Issues' : 'Filter Status'}</span>
            </button>
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
            >
                <Plus size={16} />
                <span>Add Vendor</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Vendor ID</th>
                <th className="px-6 py-4 font-semibold">Vendor Name</th>
                <th className="px-6 py-4 font-semibold">Tier Status</th>
                <th className="px-6 py-4 font-semibold">API Capability</th>
                <th className="px-6 py-4 font-semibold">Specialized Lanes</th>
                <th className="px-6 py-4 font-semibold">Contract Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((vendor) => {
                const status = getExpiryStatus(vendor.contractExpiry);
                const isExpanded = expandedId === vendor.id;
                const primary = getPrimaryContact(vendor);
                
                return (
                <React.Fragment key={vendor.id}>
                  <tr 
                    onClick={() => toggleExpand(vendor.id)}
                    className={`transition-colors duration-200 cursor-pointer ${isExpanded ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`mr-3 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}>
                           <ChevronDown size={16} />
                        </div>
                        <span className={`font-mono text-xs px-2 py-1 rounded ${isExpanded ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {vendor.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                           <span className={`font-bold ${isExpanded ? 'text-blue-900' : 'text-slate-700'}`}>{vendor.name}</span>
                           {primary && (
                             <span className="text-xs text-slate-500 flex items-center mt-0.5">
                                <User size={10} className="mr-1"/> {primary.name}
                             </span>
                           )}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.tier === 'Premium' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <ShieldCheck size={12} className="mr-1" /> Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vendor.apiReady ? (
                        <div className="flex items-center text-emerald-600 text-sm">
                          <Zap size={14} className="mr-1 fill-current" /> Instant Rate
                        </div>
                      ) : (
                        <div className="text-slate-400 text-sm">Manual Quote</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {vendor.lanes.slice(0, 2).map((lane, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                            {lane}
                          </span>
                        ))}
                        {vendor.lanes.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded border border-slate-200">
                            +{vendor.lanes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-sm font-medium text-slate-700">{vendor.contractExpiry}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`}></span>
                            {status.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80 border-b border-slate-200 shadow-inner">
                      <td colSpan={6} className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in relative">
                          
                          {/* Close Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleExpand(vendor.id); }} 
                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors z-10"
                            title="Close Details"
                          >
                            <X size={18} />
                          </button>

                          {/* Visual accent line */}
                          <div className="absolute top-6 left-0 w-1.5 h-16 bg-blue-500 rounded-r-md"></div>

                          {/* 1. Lane Details */}
                          <div className="relative">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center">
                              <MapPin size={14} className="mr-2 text-blue-500" />
                              Specialized Trade Lanes
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                               {vendor.lanes.length > 0 ? vendor.lanes.map((lane, i) => {
                                  // Robust split to handle potential missing '->'
                                  const parts = lane.split('->');
                                  const origin = parts[0];
                                  const dest = parts.length > 1 ? parts[1] : null;

                                  return (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full group-hover:bg-blue-500"></div>
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-800">{origin}</span>
                                        </div>
                                        {dest && <ArrowRight size={14} className="text-slate-400 mx-2 group-hover:text-blue-400" />}
                                        {dest && <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-800">{dest}</span>}
                                    </div>
                                  );
                                }) : (
                                    <div className="text-sm text-slate-400 italic p-2">No specific lanes assigned.</div>
                                )}
                            </div>
                          </div>

                          {/* 2. Contract & API Details */}
                          <div>
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center">
                                 <Anchor size={14} className="mr-2 text-blue-500" />
                                 Operational Status
                             </h4>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                
                                {/* Contract Status */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Contract Expiry</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.color} ${status.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`}></span>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center bg-white p-2 rounded border border-slate-200">
                                        <Calendar size={16} className="text-slate-400 mr-2"/>
                                        <span className="text-sm font-mono font-medium text-slate-800">{vendor.contractExpiry}</span>
                                    </div>
                                </div>

                                {/* API Status */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-slate-500 uppercase">Connectivity</span>
                                    </div>
                                    <div className={`flex items-center p-2 rounded border ${vendor.apiReady ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                        <Zap size={16} className={`mr-2 ${vendor.apiReady ? 'fill-current' : ''}`} />
                                        <span className="text-sm font-medium">
                                            {vendor.apiReady ? 'Live API Connected' : 'Manual Quote Mode'}
                                        </span>
                                    </div>
                                </div>
                             </div>
                          </div>

                          {/* 3. Contact / Performance */}
                          <div>
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center">
                                 <User size={14} className="mr-2 text-blue-500" />
                                 Primary Contact & Stats
                             </h4>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <div className="flex items-center text-sm text-slate-600">
                                    <Star size={16} className="text-amber-400 mr-2 fill-current" />
                                    <span className="font-medium">Reliability Score</span>
                                  </div>
                                  <span className="font-bold text-lg text-slate-800">{vendor.tier === 'Premium' ? '98%' : '92%'}</span>
                                </div>
                                
                                {/* Detailed Contact Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                    {primary ? (
                                        <>
                                            <div className="flex items-center text-sm text-slate-700 font-bold mb-1">
                                                <span>{primary.name}</span>
                                                <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-200 px-1.5 rounded">{primary.role}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Mail size={14} className="text-slate-400 mr-2" />
                                                <span>{primary.email}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Phone size={14} className="text-slate-400 mr-2" />
                                                <span>{primary.phone}</span>
                                            </div>
                                        </>
                                    ) : <span className="text-sm text-slate-400 italic">No primary contact assigned.</span>}
                                </div>

                                <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleOpenModal(vendor); }} className="flex-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center shadow-sm shadow-blue-200">
                                    <Edit2 size={12} className="mr-1.5"/> Edit Profile
                                  </button>
                                  <button className="flex-1 px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wide rounded-lg transition-colors">
                                    View History
                                  </button>
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
        
        {filteredVendors.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            {showExpiringOnly ? 'No vendors found with expired or upcoming contract renewals.' : 'No vendors found matching your criteria.'}
          </div>
        )}
      </div>

      {/* Add/Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800">{editingId ? 'Edit Vendor Details' : 'Add New Vendor'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 shrink-0">
                    <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'DETAILS' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-blue-600'}`}>General Info</button>
                    <button onClick={() => setActiveTab('CONTACTS')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'CONTACTS' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-blue-600'}`}>Contacts ({formData.contacts.length})</button>
                    <button onClick={() => setActiveTab('ADDRESSES')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ADDRESSES' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-blue-600'}`}>Branches ({formData.addresses.length})</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* DETAILS TAB */}
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Evergreen Marine"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tier</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.tier}
                                        onChange={e => setFormData({...formData, tier: e.target.value as any})}
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Premium">Premium</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry</label>
                                    <input 
                                        type="date"
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.contractExpiry}
                                        onChange={e => setFormData({...formData, contractExpiry: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Specialized Lanes (comma sep)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Shanghai->LA, Tokyo->Sydney"
                                    value={laneInput}
                                    onChange={e => setLaneInput(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="apiReady"
                                    checked={formData.apiReady}
                                    onChange={e => setFormData({...formData, apiReady: e.target.checked})}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="apiReady" className="text-sm text-slate-700">API Capability Enabled</label>
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
                            <button onClick={addContact} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-blue-500 hover:text-blue-600 text-sm font-bold flex items-center justify-center">
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
                            <button onClick={addAddress} className="w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-blue-500 hover:text-blue-600 text-sm font-bold flex items-center justify-center">
                                <Plus size={16} className="mr-1"/> Add Branch Address
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                        <Save size={16} className="mr-2" /> {editingId ? 'Update Vendor' : 'Save Vendor'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VendorNetwork;
