
import React, { useState, useEffect, useMemo } from 'react';
import { Send, FileText, Check, Loader2, Save, Box, Info, Mail, Plus, Trash2, ArrowRight, Printer, Download, Ship, Plane, Layers, Ruler, Weight, Scale, User, ExternalLink } from 'lucide-react';
import { QuoteRequest, Quotation, Currency, Customer, PackagingDetail, SharedProps, AppView, Modality, PackagingType, Vendor, Contact } from '../types';

interface QuoteSimulatorProps extends SharedProps {
  onGenerateQuote: (quote: Quotation) => void;
  customers: Customer[];
  vendors: Vendor[];
  initialData?: QuoteRequest | null;
  onClearInitialData?: () => void;
}

const QuoteSimulator: React.FC<QuoteSimulatorProps> = ({ onGenerateQuote, customers, vendors, settings, onNotify, onNavigate, initialData, onClearInitialData, currentUser }) => {
  const [formData, setFormData] = useState<QuoteRequest>({
    modality: 'SEA',
    origin: 'Shanghai',
    destination: 'Rotterdam',
    cargoType: 'General Cargo',
    packaging: [
      { id: '1', type: 'Pallet', length: 120, width: 80, height: 160, quantity: 2, unitWeight: 450 }
    ],
    etd: new Date().toISOString().split('T')[0],
    transitTime: 28,
    buyRate: 1200,
    margin: 300,
    currency: settings.defaultCurrency,
    customerId: '',
    contactId: '',
    customerEmail: '',
    customerName: '',
    lineItems: [
        { description: 'Sea Freight Charges', amount: 1400, quantity: 1 },
        { description: 'Fuel Surcharge (BAF)', amount: 150, quantity: 1 },
        { description: 'THC / Documentation', amount: 80, quantity: 1 }
    ]
  });

  const [activeTab, setActiveTab] = useState<'EMAIL' | 'PDF'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [quoteId, setQuoteId] = useState('');

  // Enhanced Logistics Math
  const cargoSummary = useMemo(() => {
    let totalWeight = 0;
    let totalVolume = 0;
    let totalUnits = 0;
    formData.packaging?.forEach(pkg => {
      totalUnits += pkg.quantity;
      totalWeight += pkg.unitWeight * pkg.quantity;
      totalVolume += (pkg.length * pkg.width * pkg.height * pkg.quantity) / 1000000;
    });
    return { totalWeight, totalVolume, totalUnits };
  }, [formData.packaging]);

  useEffect(() => {
    if (initialData) {
        setFormData(prev => ({
            ...prev,
            ...initialData,
            packaging: initialData.packaging || prev.packaging
        }));
        setGenerated(false);
        if (onClearInitialData) onClearInitialData();
    }
  }, [initialData]);

  const handleCustomerSelect = (custId: string) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
        const primary = cust.contacts.find(c => c.isPrimary) || cust.contacts[0];
        setFormData(prev => ({
            ...prev,
            customerId: custId,
            customerName: cust.companyName,
            contactId: primary?.id || '',
            customerEmail: primary?.email || ''
        }));
    }
  };

  const handleContactSelect = (contactId: string) => {
    const cust = customers.find(c => c.id === formData.customerId);
    const contact = cust?.contacts.find(c => c.id === contactId);
    if (contact) {
        setFormData(prev => ({
            ...prev,
            contactId,
            customerEmail: contact.email
        }));
    }
  };

  const handleAddPackaging = () => {
    const newPkg: PackagingDetail = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Pallet',
      length: 120, width: 80, height: 100, quantity: 1, unitWeight: 50
    };
    setFormData(prev => ({ ...prev, packaging: [...(prev.packaging || []), newPkg] }));
  };

  const updatePackaging = (id: string, field: keyof PackagingDetail, value: any) => {
    setFormData(prev => ({
      ...prev,
      packaging: prev.packaging?.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removePackaging = (id: string) => {
    setFormData(prev => ({ ...prev, packaging: prev.packaging?.filter(p => p.id !== id) }));
  };

  const totalRate = formData.lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
  const marginAmt = totalRate - formData.buyRate;
  const marginPercentage = totalRate > 0 ? Math.round((marginAmt / totalRate) * 100) : 0;

  const generateEmailBody = (id: string) => {
    return `Subject: QUOTE REF: ${id} | ${formData.origin} to ${formData.destination}

Dear ${formData.customerName || 'Customer'},

We are pleased to submit the following freight quotation for your consideration.

--- QUOTE SUMMARY ---
QUOTE ID: ${id}
MODALITY: ${formData.modality}
ROUTE: ${formData.origin} to ${formData.destination}
CARGO: ${formData.cargoType}
DIMENSIONS: ${cargoSummary.totalUnits} Units | ${cargoSummary.totalWeight.toLocaleString()} KG | ${cargoSummary.totalVolume.toFixed(2)} CBM

COMMERCIAL OFFER: ${formData.currency} ${totalRate.toLocaleString()}
EST. TRANSIT: ${formData.transitTime} Days
EST. DEPARTURE: ${formData.etd}

--- TERMS & CONDITIONS ---
1. Rate is valid for 14 calendar days from today.
2. Subject to final weight and dimension verification.
3. Excludes local duties, taxes, and inspections unless specified.
4. Booking is subject to space and equipment availability.

Please click below to confirm this booking:
https://portal.uniqueccs.com/accept/${id}

Best Regards,
${currentUser.name}
${settings.companyName}`;
  };

  const handleDispatch = (toOutlook: boolean = false) => {
    if (!formData.customerEmail) {
        onNotify('error', "Selection of Customer Contact is required.");
        return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newId = `UCCS-${formData.modality.charAt(0)}-${Math.floor(100000 + Math.random() * 900000)}`;
      setQuoteId(newId);
      
      const newQuote: Quotation = {
        id: newId,
        modality: formData.modality,
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        origin: formData.origin,
        destination: formData.destination,
        cargoType: formData.cargoType,
        amount: totalRate,
        currency: formData.currency,
        status: 'SENT',
        date: new Date().toISOString().split('T')[0],
        etd: formData.etd,
        transitTime: formData.transitTime,
        packaging: formData.packaging,
        lineItems: formData.lineItems,
        milestones: [{ status: 'BOOKING_CONFIRMED', date: new Date().toISOString(), updatedBy: currentUser.name, notes: 'Quote dispatched to client.' }]
      };
      
      onGenerateQuote(newQuote);
      setGenerated(true);
      const emailBody = generateEmailBody(newId);
      setCustomEmailBody(emailBody);

      if (toOutlook) {
          const subject = `Freight Quote: ${newId} | ${formData.origin} - ${formData.destination}`;
          const mailto = `mailto:${formData.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
          window.location.href = mailto;
          onNotify('success', "Redirecting to Outlook...");
      } else {
          onNotify('success', `Quote ${newId} generated and recorded.`);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center border border-slate-800">
        <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl ${formData.modality === 'SEA' ? 'bg-blue-600' : 'bg-indigo-600'} shadow-lg`}>
                {formData.modality === 'SEA' ? <Ship size={28} /> : <Plane size={28} />}
            </div>
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Multi-Modal Quote Engine</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enterprise Logistics Automation</p>
            </div>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            {['SEA', 'AIR'].map(m => (
                <button key={m} onClick={() => setFormData({...formData, modality: m as Modality})} className={`px-8 py-2.5 rounded-lg text-xs font-black transition-all ${formData.modality === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    {m} FREIGHT
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Box size={14} className="mr-2" /> Shipment Configuration
               </h4>
               <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Session Active</span>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Customer Profile</label>
                    <select 
                        value={formData.customerId}
                        onChange={e => handleCustomerSelect(e.target.value)} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none text-sm bg-slate-50 font-black text-slate-800 focus:ring-4 focus:ring-blue-100 transition-all"
                    >
                        <option value="">-- Select Corporate Account --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </div>
                  {formData.customerId && (
                    <div className="col-span-2 animate-fade-in">
                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Attention To (Contact)</label>
                        <select 
                            value={formData.contactId}
                            onChange={e => handleContactSelect(e.target.value)}
                            className="w-full p-3 border border-slate-100 rounded-xl outline-none text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Select Recipient --</option>
                            {customers.find(c => c.id === formData.customerId)?.contacts.map(con => (
                                <option key={con.id} value={con.id}>{con.name} ({con.email})</option>
                            ))}
                        </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Origin</label>
                    <input type="text" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none text-sm font-bold bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block">Destination</label>
                    <input type="text" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none text-sm font-bold bg-slate-50" />
                  </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Packing & Dim Specs</p>
                  <button onClick={handleAddPackaging} className="bg-white border border-slate-200 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center shadow-sm hover:bg-blue-50">
                    <Plus size={12} className="mr-1"/> Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.packaging?.map((pkg) => (
                    <div key={pkg.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group">
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <select value={pkg.type} onChange={e => updatePackaging(pkg.id, 'type', e.target.value as PackagingType)} className="col-span-2 text-xs font-black border-none outline-none p-0 bg-transparent text-slate-800">
                          <option value="Pallet">Standard Pallet</option>
                          <option value="Carton">Carton Box</option>
                          <option value="Crate">Wooden Crate</option>
                          <option value="Loose">Loose Cargo</option>
                        </select>
                        <div className="col-span-2 text-right flex items-center justify-end">
                          <input type="number" value={pkg.quantity} onChange={e => updatePackaging(pkg.id, 'quantity', Number(e.target.value))} className="w-12 text-right text-xs font-black outline-none bg-slate-50 rounded p-1" />
                          <span className="text-[10px] font-bold text-slate-400 ml-1">PCS</span>
                          <button onClick={() => removePackaging(pkg.id)} className="ml-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-black">L (cm)</span><input type="number" value={pkg.length} onChange={e => updatePackaging(pkg.id, 'length', Number(e.target.value))} className="text-xs font-mono font-bold outline-none" /></div>
                        <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-black">W (cm)</span><input type="number" value={pkg.width} onChange={e => updatePackaging(pkg.id, 'width', Number(e.target.value))} className="text-xs font-mono font-bold outline-none" /></div>
                        <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-black">H (cm)</span><input type="number" value={pkg.height} onChange={e => updatePackaging(pkg.id, 'height', Number(e.target.value))} className="text-xs font-mono font-bold outline-none" /></div>
                        <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-black">Unit (kg)</span><input type="number" value={pkg.unitWeight} onChange={e => updatePackaging(pkg.id, 'unitWeight', Number(e.target.value))} className="text-xs font-mono font-bold outline-none" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-slate-900 p-4 rounded-2xl text-center shadow-lg border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Weight</p>
                    <p className="text-sm font-black text-white">{cargoSummary.totalWeight.toLocaleString()} KG</p>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-2xl text-center shadow-lg border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Volume</p>
                    <p className="text-sm font-black text-white">{cargoSummary.totalVolume.toFixed(3)}</p>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-2xl text-center shadow-lg border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Quantity</p>
                    <p className="text-sm font-black text-white">{cargoSummary.totalUnits} Units</p>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button onClick={() => handleDispatch(false)} disabled={loading} className="flex-1 bg-white border-2 border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50">
                      Record Internal
                  </button>
                  <button onClick={() => handleDispatch(true)} disabled={loading} className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                      <Mail size={18}/> Send via Outlook
                  </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 h-full">
            {!generated ? (
                <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8"><Layers size={64} className="text-slate-200" /></div>
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest italic">Awaiting Logic Initialization</h3>
                    <p className="text-sm text-slate-400 mt-4 max-w-sm font-medium">Define parameters to generate a commercial proposal and professional document stack.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in">
                    <div className="bg-slate-900 px-10 py-6 flex justify-between items-center text-white">
                        <div className="flex space-x-8">
                            <button onClick={() => setActiveTab('EMAIL')} className={`text-[11px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'EMAIL' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-white'}`}>Email Draft</button>
                            <button onClick={() => setActiveTab('PDF')} className={`text-[11px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'PDF' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-white'}`}>PDF Offer</button>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex flex-col items-end">
                               <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Expected Margin</span>
                               <span className="text-sm font-black">{formData.currency} {marginAmt.toLocaleString()} ({marginPercentage}%)</span>
                           </div>
                           <span className="text-2xl font-black tracking-tighter text-white">{formData.currency} {totalRate.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
                        {activeTab === 'EMAIL' && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commercial Subject</p>
                                            <p className="text-sm font-black text-slate-800">QUOTE REF: {quoteId} | {formData.origin} to {formData.destination}</p>
                                        </div>
                                        <button onClick={() => handleDispatch(true)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center hover:bg-blue-100 transition-all"><ExternalLink size={14} className="mr-2"/> Dispatch to Outlook</button>
                                    </div>
                                    <textarea value={customEmailBody} onChange={e => setCustomEmailBody(e.target.value)} className="w-full h-[550px] text-sm font-sans leading-relaxed text-slate-600 bg-transparent outline-none resize-none border-none p-0" />
                                </div>
                            </div>
                        )}
                        {activeTab === 'PDF' && (
                            <div id="printable-pdf" className="bg-white p-14 rounded-2xl shadow-2xl border border-slate-200 max-w-3xl mx-auto h-full relative font-sans">
                                <div className="flex justify-between items-start border-b-8 border-slate-900 pb-8 mb-12">
                                    <div>
                                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1 uppercase italic">{settings.companyName}</h1>
                                        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Corporate Logistics Division</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-3xl font-black text-slate-200 uppercase tracking-[0.2em] mb-2">OFFER</h2>
                                        <p className="text-sm font-black text-slate-900 tracking-tight bg-slate-100 px-3 py-1 rounded inline-block">QUOTE REF: {quoteId}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">DATE: {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">Billed To</p>
                                            <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{formData.customerName}</p>
                                            <p className="text-xs font-bold text-slate-500 mt-1">{formData.customerEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">Route & Service</p>
                                            <div className="flex items-center text-sm font-black text-slate-800 tracking-tight">
                                                {formData.origin} <ArrowRight className="inline mx-2 text-blue-500" size={14}/> {formData.destination}
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase">{formData.modality} Door-to-Port Service</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Logistics Summary</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><p className="text-[9px] text-slate-500 uppercase font-bold">Total Weight</p><p className="text-sm font-black">{cargoSummary.totalWeight.toLocaleString()} KG</p></div>
                                            <div><p className="text-[9px] text-slate-500 uppercase font-bold">Total Volume</p><p className="text-sm font-black">{cargoSummary.totalVolume.toFixed(3)} CBM</p></div>
                                            <div><p className="text-[9px] text-slate-500 uppercase font-bold">ETD / Transit</p><p className="text-sm font-black">{formData.transitTime} Days</p></div>
                                            <div><p className="text-[9px] text-slate-500 uppercase font-bold">Total Pkgs</p><p className="text-sm font-black">{cargoSummary.totalUnits} Units</p></div>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full mb-12">
                                    <thead className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em]">
                                        <tr>
                                            <th className="p-5 text-left">Description of Services</th>
                                            <th className="p-5 text-center">Unit Price</th>
                                            <th className="p-5 text-right">Total ({formData.currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {formData.lineItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-5 text-xs font-bold text-slate-700 uppercase tracking-tight">{item.description}</td>
                                                <td className="p-5 text-xs font-black text-slate-900 text-center">{item.amount.toLocaleString()}</td>
                                                <td className="p-5 text-xs font-black text-slate-900 text-right">{(item.amount * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50 border-t-8 border-slate-900">
                                            <td colSpan={2} className="p-5 text-sm font-black text-slate-800 uppercase tracking-widest">Total Commercial Offer</td>
                                            <td className="p-5 text-right font-black text-2xl text-blue-700">{formData.currency} {totalRate.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-12">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Technical Packaging List</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                        {formData.packaging?.map((pkg, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-xs font-black text-slate-900 mb-2">{pkg.quantity}x {pkg.type.toUpperCase()}</p>
                                                <p className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-tighter">{pkg.length}L x {pkg.width}W x {pkg.height}H CM</p>
                                                <p className="text-[9px] text-slate-600 font-mono font-black mt-1">{pkg.unitWeight} KG Unit</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-12 border-t border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest text-center">Standard Trading Conditions Apply • Validity 14 Days • All rates subject to final confirmation from carriers at booking time</p>
                                    <div className="flex justify-center gap-6 mt-10 no-print">
                                        <button onClick={() => window.print()} className="px-10 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-xl transition-all active:scale-95 flex items-center gap-2"><Printer size={16}/> Print Professional Copy</button>
                                        <button className="px-10 py-3 bg-white border border-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"><Download size={16}/> Download PDF</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuoteSimulator;
