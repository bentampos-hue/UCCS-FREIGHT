
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
  Target,
  FlaskConical,
  ExternalLink,
  User as UserIcon
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
import VendorBidPortal from './components/VendorBidPortal';
import CustomerQuotePortal from './components/CustomerQuotePortal';

const App: React.FC = () => {
  // --- Global State ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, type: string, message: string}[]>([]);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  
  // Fixed: Initializing AppSettings with mandatory commercialParameters to satisfy TypeScript.
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'FreightFlow Global',
    defaultCurrency: 'USD',
    defaultMarginPercent: 15,
    emailSignature: 'Best Regards,\nFreightFlow Logistics Team',
    commercialParameters: {
      sea: { lclMinCbm: 1, wmRule: 1000, docFee: 50, defaultLocalCharges: 150 },
      air: { volumetricFactor: 6000, minChargeableWeight: 45, defaultSurcharges: 85 }
    }
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

    // Check URL for portal access simulation
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const type = params.get('type');
    if (token && type) {
       setPortalToken(token);
       if (type === 'bid') setCurrentView(AppView.VENDOR_PORTAL);
       if (type === 'quote') setCurrentView(AppView.CUSTOMER_PORTAL);
    }
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
      portalToken: Math.random().toString(36).substr(2, 12),
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
      status: 'SENT',
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

    addNotification('success', `Awarding ${bid.vendorName}. Quote dispatched to Spot Client.`);
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

  const sharedProps = {
    settings,
    userRole: currentUser?.role || 'SALES',
    currentUser: currentUser!,
    onNotify: addNotification,
    onLogActivity: logActivity,
    onNavigate: setCurrentView
  };

  // Simulation Logic
  const openPortalSim = (type: 'bid' | 'quote') => {
    let token = '';
    if (type === 'bid') {
      token = enquiries[0]?.portalToken || '';
      if (!token) { addNotification('warning', 'Create an Enquiry first to test Bid Portal.'); return; }
    } else {
      token = quotations[0]?.portalToken || '';
      if (!token) { addNotification('warning', 'Generate a Quote first to test Customer Portal.'); return; }
    }
    setPortalToken(token);
    setCurrentView(type === 'bid' ? AppView.VENDOR_PORTAL : AppView.CUSTOMER_PORTAL);
  };

  if (currentView === AppView.VENDOR_PORTAL && portalToken) {
    return <div className="animate-fade-in"><VendorBidPortal token={portalToken} /><SimulationBar onExit={() => setCurrentView(AppView.DASHBOARD)} /></div>;
  }
  if (currentView === AppView.CUSTOMER_PORTAL && portalToken) {
    return <div className="animate-fade-in"><CustomerQuotePortal token={portalToken} /><SimulationBar onExit={() => setCurrentView(AppView.DASHBOARD)} /></div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="space-y-8 animate-fade-in">
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
              setUsers(prev => prev.filter(u => u.id !== id));
            }}
          />
        );
      default:
        return <div>View under construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col relative z-50 shadow-2xl overflow-hidden shrink-0`}>
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

        <div className="p-6 border-t border-slate-800 relative z-10 space-y-2">
          <button onClick={() => openPortalSim('bid')} className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all italic">
            <FlaskConical size={14} /> {isSidebarOpen && "Simulate Vendor"}
          </button>
          <button onClick={() => openPortalSim('quote')} className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all italic">
            <ExternalLink size={14} /> {isSidebarOpen && "Simulate Client"}
          </button>
          <div className="h-px bg-slate-800 my-4"></div>
          <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${currentView === AppView.SETTINGS ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <SettingsIcon size={20} />
            {isSidebarOpen && <span className="text-[12px] font-black uppercase tracking-widest">Settings</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500 hover:text-white transition-all group">
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-[12px] font-black uppercase tracking-widest">Exit Portal</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex justify-between items-center z-40 shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Workflow size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
              {currentView.replace('_', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{currentUser.name}</p>
               <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{currentUser.role}</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white font-black italic">
               {currentUser.name.charAt(0)}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50 pb-20">
          {renderView()}
        </div>

        {/* Debug Simulation Bar */}
        <div className="h-12 bg-slate-900 border-t border-slate-800 flex items-center px-10 justify-between shrink-0 z-50">
           <div className="flex items-center gap-6">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                <FlaskConical size={12} className="text-blue-500"/> Simulation Environment
              </span>
              <div className="flex gap-2">
                 <button onClick={() => openPortalSim('bid')} className="text-[8px] font-black text-blue-400 border border-blue-900 px-3 py-1 rounded hover:bg-blue-900 transition-colors italic uppercase tracking-widest">Portal: Vendor Bid</button>
                 <button onClick={() => openPortalSim('quote')} className="text-[8px] font-black text-emerald-400 border border-emerald-900 px-3 py-1 rounded hover:bg-emerald-900 transition-colors italic uppercase tracking-widest">Portal: Client Accept</button>
              </div>
           </div>
           <div className="text-[9px] font-bold text-slate-600 italic">Connected to Global Node • Latency: 4ms</div>
        </div>
      </main>

      {/* Notifications */}
      <div className="fixed bottom-16 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
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
              {n.type === 'success' ? <CheckCircle2 size={20}/> : <Info size={20}/>}
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

const SimulationBar: React.FC<{ onExit: () => void }> = ({ onExit }) => (
  <div className="fixed bottom-0 left-0 w-full bg-blue-600 text-white px-10 py-3 flex justify-between items-center z-[200] animate-fade-in italic">
    <div className="flex items-center gap-4">
      <FlaskConical size={18} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Viewing External Stakeholder Portal Experience</span>
    </div>
    <button onClick={onExit} className="bg-white text-blue-600 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
      Return to Master Control
    </button>
  </div>
);

export default App;
