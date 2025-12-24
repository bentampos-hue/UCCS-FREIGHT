
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Ship, 
  Users, 
  FilePieChart, 
  Settings as SettingsIcon, 
  LogOut, 
  Bell, 
  Search,
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Workflow,
  Target
} from 'lucide-react';

import { 
  AppView, 
  User, 
  AppSettings, 
  Vendor, 
  Customer, 
  Quotation, 
  VendorEnquiry, 
  ActivityLog, 
  QuoteStatus,
  Milestone,
  QuoteRequest,
  VendorBid
} from './types';

import { repo } from './services/repository';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import QuoteSimulator from './components/QuoteSimulator';
import VendorNetwork from './components/VendorNetwork';
import Reports from './components/Reports';
import CRM from './components/CRM';
import VendorEnquiryComponent from './components/VendorEnquiry';
import Settings from './components/Settings';
import WorkflowVisualizer from './components/WorkflowVisualizer';

const App: React.FC = () => {
  // --- Global State ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, type: string, message: string}[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'FreightFlow Global',
    defaultCurrency: 'USD',
    defaultMarginPercent: 15,
    emailSignature: 'Best Regards,\nFreightFlow Logistics Team'
  });

  // --- Data State ---
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [enquiries, setEnquiries] = useState<VendorEnquiry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      const loadedSettings = repo.getSettings(settings);
      setSettings(loadedSettings);

      const [v, c, q, e, u] = await Promise.all([
        repo.getVendors(),
        repo.getCustomers(),
        repo.getQuotes(),
        repo.getEnquiries(),
        repo.getUsers()
      ]);

      // Seed default admin if none exists
      if (u.length === 0) {
        const admin: User = { id: 'U001', name: 'Admin User', email: 'admin@uniqueccs.com', role: 'ADMIN', password: 'admin123' };
        await repo.saveItem('users', admin, admin);
        setUsers([admin]);
      } else {
        setUsers(u);
      }

      setVendors(v);
      setCustomers(c);
      setQuotations(q);
      setEnquiries(e);
    };
    init();
  }, []);

  // --- Handlers ---
  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const logActivity = (module: string, action: string, description: string) => {
    const log: ActivityLog = {
      id: `AL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      module,
      action,
      description
    };
    setActivityLog(prev => [log, ...prev].slice(0, 50));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    addNotification('success', `Welcome back, ${user.name}`);
    logActivity('Auth', 'Login', `${user.name} authenticated into ${user.role} role.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const updateVendors = async (v: Vendor) => {
    await repo.saveItem('vendors', v, currentUser!);
    setVendors(prev => {
      const idx = prev.findIndex(item => item.id === v.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = v;
        return next;
      }
      return [...prev, v];
    });
    addNotification('success', `Vendor ${v.name} saved.`);
  };

  const updateCustomers = async (c: Customer) => {
    await repo.saveItem('customers', c, currentUser!);
    setCustomers(prev => {
      const idx = prev.findIndex(item => item.id === c.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = c;
        return next;
      }
      return [...prev, c];
    });
    addNotification('success', `Customer ${c.companyName} saved.`);
  };

  const handleGenerateQuote = async (q: Quotation) => {
    setQuotations(prev => [q, ...prev]);
    logActivity('Quoting', 'Generated', `New quote ${q.id} generated for ${q.customerName}`);
  };

  const handleAddEnquiry = async (e: VendorEnquiry) => {
    await repo.saveItem('enquiries', e, currentUser!);
    setEnquiries(prev => [e, ...prev]);
    logActivity('Procurement', 'Enquiry', `Market intake started for ${e.origin} to ${e.destination}`);
  };

  const handleAwardEnquiry = async (enquiryId: string, bid: VendorBid, sellPrice: number) => {
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry) return;

    const newQuote: Quotation = {
      id: `Q-AWARD-${Date.now().toString().slice(-4)}`,
      portalToken: 'manual-award',
      modality: enquiry.modality,
      customerId: 'C-SPOT',
      customerName: 'Spot Market Client',
      customerEmail: 'pending@client.com',
      origin: enquiry.origin,
      destination: enquiry.destination,
      amount: sellPrice,
      buyRate: bid.amount,
      margin: sellPrice - bid.amount,
      currency: bid.currency,
      status: 'CONFIRMED',
      date: new Date().toISOString().split('T')[0],
      milestones: [{
        status: 'BOOKING_CONFIRMED',
        date: new Date().toISOString(),
        notes: `Awarded to ${bid.vendorName} on spot market intake.`,
        updatedBy: currentUser?.name || 'System'
      }]
    };

    await repo.saveQuote(newQuote, currentUser!);
    setQuotations(prev => [newQuote, ...prev]);
    
    const updatedEnquiry = { ...enquiry, status: 'AWARDED' as const };
    await repo.saveItem('enquiries', updatedEnquiry, currentUser!);
    setEnquiries(prev => prev.map(e => e.id === enquiryId ? updatedEnquiry : e));

    addNotification('success', `Awarding ${bid.vendorName} and initializing shipment.`);
    setCurrentView(AppView.REPORTS);
  };

  const handleAddMilestone = async (id: string, milestone: Milestone) => {
    const quote = quotations.find(q => q.id === id);
    if (!quote) return;
    const updatedQuote = { 
      ...quote, 
      milestones: [milestone, ...(quote.milestones || [])] 
    };
    await repo.saveQuote(updatedQuote, currentUser!);
    setQuotations(prev => prev.map(q => q.id === id ? updatedQuote : q));
  };

  // --- Views ---
  const sharedProps = {
    settings,
    userRole: currentUser?.role || 'SALES',
    currentUser: currentUser!,
    onNotify: addNotification,
    onLogActivity: logActivity,
    onNavigate: setCurrentView
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="space-y-8">
            <Dashboard 
              {...sharedProps} 
              activityLog={activityLog} 
              quotations={quotations} 
              enquiries={enquiries}
              onNavigateToReports={(f) => { setCurrentView(AppView.REPORTS); }}
            />
            <WorkflowVisualizer {...sharedProps} />
          </div>
        );
      case AppView.SIMULATOR:
        return <QuoteSimulator {...sharedProps} customers={customers} onGenerateQuote={handleGenerateQuote} />;
      case AppView.VENDORS:
        return <VendorNetwork {...sharedProps} vendors={vendors} onAddVendor={updateVendors} onUpdateVendor={updateVendors} />;
      case AppView.REPORTS:
        return (
          <Reports 
            {...sharedProps} 
            quotations={quotations} 
            onUpdateStatus={async (id, s) => {
              const q = quotations.find(item => item.id === id);
              if (q) {
                const updated = { ...q, status: s };
                await repo.saveQuote(updated, currentUser);
                setQuotations(prev => prev.map(item => item.id === id ? updated : item));
              }
            }}
            onAddMilestone={handleAddMilestone}
          />
        );
      case AppView.CRM:
        return <CRM {...sharedProps} customers={customers} onAddCustomer={updateCustomers} onUpdateCustomer={updateCustomers} />;
      case AppView.ENQUIRY:
        return (
          <VendorEnquiryComponent 
            {...sharedProps} 
            vendors={vendors} 
            enquiries={enquiries} 
            onAddEnquiry={handleAddEnquiry}
            onUpdateEnquiry={async (e) => {
              await repo.saveItem('enquiries', e, currentUser);
              setEnquiries(prev => prev.map(item => item.id === e.id ? e : item));
            }}
            onAwardEnquiry={handleAwardEnquiry}
            onLoadToSimulator={(req) => {
              setCurrentView(AppView.SIMULATOR);
              // Implementation would pre-fill simulator state
            }}
          />
        );
      case AppView.SETTINGS:
        return (
          <Settings 
            {...sharedProps} 
            onUpdateSettings={(s) => {
              repo.saveSettings(s);
              setSettings(s);
            }}
            users={users}
            onAddUser={async (u) => {
              await repo.saveItem('users', u, currentUser);
              setUsers(prev => [...prev, u]);
            }}
            onDeleteUser={async (id) => {
              // Implementation would call repo.deleteItem if available
              setUsers(prev => prev.filter(u => u.id !== id));
            }}
          />
        );
      default:
        return <div>View under construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* --- Sidebar --- */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col relative z-50 shadow-2xl overflow-hidden`}>
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none transform rotate-12"><Ship size={240} className="text-white" /></div>
        
        <div className="p-8 flex items-center gap-4 border-b border-slate-800 relative z-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
            <Ship className="text-white" size={24} />
          </div>
          {isSidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">FreightFlow</h1>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Control Center</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-6 space-y-2 relative z-10">
          {[
            { id: AppView.DASHBOARD, label: 'Control Pulse', icon: LayoutDashboard },
            { id: AppView.ENQUIRY, label: 'Market Intake', icon: Zap },
            { id: AppView.SIMULATOR, label: 'Quote Engine', icon: Target },
            { id: AppView.REPORTS, label: 'Live Ledger', icon: FilePieChart },
            { id: AppView.CRM, label: 'Corporate CRM', icon: Users },
            { id: AppView.VENDORS, label: 'Vendor Grid', icon: Ship },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 italic font-black' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={currentView === item.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
              {isSidebarOpen && <span className="text-[12px] uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 relative z-10">
          <button
            onClick={() => setCurrentView(AppView.SETTINGS)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all mb-2 ${
              currentView === AppView.SETTINGS ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <SettingsIcon size={20} />
            {isSidebarOpen && <span className="text-[12px] font-black uppercase tracking-widest">Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500 hover:text-white transition-all group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-[12px] font-black uppercase tracking-widest">Exit Portal</span>}
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex justify-between items-center z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Workflow size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
              {currentView.replace('_', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Global File Search..." 
                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:border-blue-400 w-80 shadow-inner transition-all"
              />
            </div>
            
            <div className="flex items-center gap-4">
               <button className="relative p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all border border-slate-100">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
               </button>
               <div className="h-10 w-px bg-slate-100"></div>
               <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{currentUser.name}</p>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{currentUser.role}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-white shadow-lg flex items-center justify-center text-indigo-600 font-black italic transition-transform group-hover:scale-105">
                    {currentUser.name.charAt(0)}
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
          {renderView()}
        </div>
      </main>

      {/* --- Notifications Toasts --- */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto min-w-[320px] p-6 rounded-[2rem] shadow-2xl border flex items-start gap-4 animate-fade-in ${
            n.type === 'success' ? 'bg-emerald-900 border-emerald-800 text-emerald-50' :
            n.type === 'error' ? 'bg-red-900 border-red-800 text-red-50' :
            n.type === 'warning' ? 'bg-amber-900 border-amber-800 text-amber-50' :
            'bg-slate-900 border-slate-800 text-slate-50'
          }`}>
            <div className={`p-2 rounded-xl ${
               n.type === 'success' ? 'bg-emerald-800 text-emerald-400' :
               n.type === 'error' ? 'bg-red-800 text-red-400' :
               n.type === 'warning' ? 'bg-amber-800 text-amber-400' :
               'bg-slate-800 text-blue-400'
            }`}>
              {n.type === 'success' ? <CheckCircle2 size={20}/> : 
               n.type === 'error' ? <AlertCircle size={20}/> : 
               n.type === 'warning' ? <AlertCircle size={20}/> : 
               <Info size={20}/>}
            </div>
            <div className="flex-1 pt-0.5">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50 italic">{n.type}</p>
               <p className="text-sm font-bold tracking-tight">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
