import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Ship, Users, FilePieChart, Settings as SettingsIcon, LogOut, 
  Zap, Target, FlaskConical, ExternalLink, Workflow, CheckCircle2, Info, ShieldAlert, ListFilter, ClipboardList
} from 'lucide-react';

import { 
  AppView, User, AppSettings, Vendor, Customer, Quotation, VendorEnquiry, 
  ActivityLog, QuoteRequest, VendorBid, Milestone, WorkflowContext, Shipment
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
import CustomerTrackingPortal from './components/CustomerTrackingPortal';
import ApprovalsInbox from './components/ApprovalsInbox';
import AuditViewer from './components/AuditViewer';

const App: React.FC = () => {
  // --- Global State ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, type: string, message: string}[]>([]);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  
  // PRODUCTION: Persisted Workflow Context
  const [workflowContext, setWorkflowContext] = useState<WorkflowContext>(() => {
    const saved = sessionStorage.getItem('uccs_workflow_context');
    return saved ? JSON.parse(saved) : { sourceType: null, sourceId: null, payload: null };
  });

  useEffect(() => {
    sessionStorage.setItem('uccs_workflow_context', JSON.stringify(workflowContext));
  }, [workflowContext]);

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
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      const loadedSettings = repo.getSettings(settings);
      setSettings(loadedSettings);

      const [v, c, q, e, u, s] = await Promise.all([
        repo.getVendors(),
        repo.getCustomers(),
        repo.getQuotes(),
        repo.getEnquiries(),
        repo.getUsers(),
        repo.getShipments()
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
      setShipments(s);
    };
    init();

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const type = params.get('type');
    if (token && type) {
       setPortalToken(token);
       if (type === 'bid') setCurrentView(AppView.VENDOR_PORTAL);
       if (type === 'quote') setCurrentView(AppView.CUSTOMER_PORTAL);
       if (type === 'track') setCurrentView(AppView.TRACKING_PORTAL);
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
    // Note: Activity logs are handled via repo audit logs for persistence
    repo.addAuditLog({
        id: log.id,
        timestamp: log.timestamp,
        userId: currentUser?.id || 'SYSTEM',
        userName: currentUser?.name || 'System',
        action,
        entityType: module,
        entityId: 'GENERIC',
        changes: description
    });
  };

  const handleConfirmQuote = async (quoteId: string) => {
    const q = quotations.find(item => item.id === quoteId);
    if (!q) return;

    const confirmedQuote: Quotation = { ...q, status: 'CONFIRMED' as const };
    const trackingToken = Math.random().toString(36).substr(2, 12); // Token generation in trackService later
    
    const newShipment: Shipment = {
      id: `SHP-${quoteId.split('-')[1]}`,
      quoteId: q.id,
      trackingToken,
      status: 'BOOKING_CONFIRMED',
      modality: q.modality,
      customerName: q.customerName,
      origin: q.origin,
      destination: q.destination,
      cargoLines: q.cargoLines || [],
      documents: [],
      milestones: [{
        status: 'BOOKING_CONFIRMED',
        date: new Date().toISOString(),
        notes: 'Shipment created from authorized quotation.',
        updatedBy: currentUser?.name || 'System'
      }]
    };

    await repo.saveQuote(confirmedQuote, currentUser!);
    await repo.saveShipment(newShipment, currentUser!);
    
    setQuotations(prev => prev.map(item => item.id === quoteId ? confirmedQuote : item));
    setShipments(prev => [newShipment, ...prev]);
    addNotification('success', `Quote ${quoteId} confirmed. Shipment ${newShipment.id} initialized.`);
  };

  const sharedProps = {
    settings,
    userRole: currentUser?.role || 'SALES',
    currentUser: currentUser!,
    onNotify: addNotification,
    onLogActivity: logActivity,
    onNavigate: setCurrentView
  };

  if (currentView === AppView.TRACKING_PORTAL && portalToken) {
    return <div className="animate-fade-in"><CustomerTrackingPortal token={portalToken} /><SimulationBar onExit={() => setCurrentView(AppView.DASHBOARD)} /></div>;
  }
  if (currentView === AppView.VENDOR_PORTAL && portalToken) {
    return <div className="animate-fade-in"><VendorBidPortal token={portalToken} /><SimulationBar onExit={() => setCurrentView(AppView.DASHBOARD)} /></div>;
  }
  if (currentView === AppView.CUSTOMER_PORTAL && portalToken) {
    return <div className="animate-fade-in"><CustomerQuotePortal token={portalToken} /><SimulationBar onExit={() => setCurrentView(AppView.DASHBOARD)} /></div>;
  }

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} users={users} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="space-y-8 animate-fade-in">
            <Dashboard 
              {...sharedProps} 
              activityLog={[]} 
              quotations={quotations} 
              enquiries={enquiries}
              onNavigateToReports={() => setCurrentView(AppView.REPORTS)}
            />
            <WorkflowVisualizer {...sharedProps} />
          </div>
        );
      case AppView.SIMULATOR:
        return (
          <QuoteSimulator 
            {...sharedProps} 
            customers={customers} 
            onGenerateQuote={(q) => {
                setQuotations([q, ...quotations]);
                setCurrentView(AppView.REPORTS);
            }} 
            prefillData={workflowContext.payload} 
            onClearPrefill={() => setWorkflowContext({ sourceType: null, sourceId: null, payload: null })}
          />
        );
      case AppView.APPROVALS:
        return (
          <ApprovalsInbox 
            {...sharedProps} 
            quotations={quotations} 
            onApprove={async (id) => {
                const q = quotations.find(x => x.id === id);
                if (!q) return;
                const updated = { ...q, status: 'SENT' as const };
                await repo.saveQuote(updated, currentUser);
                setQuotations(prev => prev.map(x => x.id === id ? updated : x));
                addNotification('success', 'Quote authorized for dispatch.');
            }}
            onReject={async (id, msg) => {
                const q = quotations.find(x => x.id === id);
                if (!q) return;
                const updated = { ...q, status: 'RENEGOTIATE' as const, approvalComments: msg };
                await repo.saveQuote(updated, currentUser);
                setQuotations(prev => prev.map(x => x.id === id ? updated : x));
                addNotification('warning', 'Quote returned to sales for revision.');
            }}
          />
        );
      case AppView.VENDORS:
        return <VendorNetwork {...sharedProps} vendors={vendors} onAddVendor={(v) => setVendors([v, ...vendors])} onUpdateVendor={(v) => setVendors(prev => prev.map(x => x.id === v.id ? v : x))} />;
      case AppView.REPORTS:
        return (
          <Reports 
            {...sharedProps} 
            enquiries={enquiries}
            quotations={quotations} 
            onUpdateStatus={async (id, s) => {
              if (s === 'CONFIRMED') {
                handleConfirmQuote(id);
              } else {
                const q = quotations.find(item => item.id === id);
                if (q) {
                  const updated = { ...q, status: s };
                  await repo.saveQuote(updated, currentUser);
                  setQuotations(prev => prev.map(item => item.id === id ? updated : item));
                }
              }
            }}
            onAddMilestone={async (id, m) => {
                const q = quotations.find(x => x.id === id);
                if (q) {
                    const updated = { ...q, milestones: [m, ...(q.milestones || [])] };
                    await repo.saveQuote(updated, currentUser);
                    setQuotations(prev => prev.map(item => item.id === id ? updated : item));
                }
            }}
          />
        );
      case AppView.CRM:
        return <CRM {...sharedProps} customers={customers} onAddCustomer={(c) => setCustomers([c, ...customers])} onUpdateCustomer={(c) => setCustomers(prev => prev.map(x => x.id === c.id ? c : x))} />;
      case AppView.ENQUIRY:
        return (
          <VendorEnquiryComponent 
            {...sharedProps} 
            vendors={vendors} 
            enquiries={enquiries} 
            onAddEnquiry={(e) => setEnquiries([e, ...enquiries])}
            onUpdateEnquiry={(e) => setEnquiries(prev => prev.map(x => x.id === e.id ? e : x))}
            onAwardEnquiry={async () => {}}
            onLoadToSimulator={(req) => {
                setWorkflowContext({ sourceType: 'ENQUIRY', sourceId: req.sourceEnquiryId || null, payload: req });
                setCurrentView(AppView.SIMULATOR);
            }}
          />
        );
      case AppView.AUDIT:
        return <AuditViewer {...sharedProps} />;
      case AppView.SETTINGS:
        return (
          <Settings 
            {...sharedProps} 
            onUpdateSettings={setSettings}
            users={users}
            onAddUser={(u) => setUsers([...users, u])}
            onDeleteUser={(id) => setUsers(users.filter(x => x.id !== id))}
          />
        );
      default:
        return <div>View under construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-slate-900 transition-all duration-500 flex flex-col relative z-50 shadow-2xl overflow-hidden shrink-0`}>
        <div className="p-8 flex items-center gap-4 border-b border-slate-800 relative z-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
            <Ship className="text-white" size={24} />
          </div>
          {isSidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">FreightFlow</h1>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-center">Enterprise Hub</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-6 space-y-2 relative z-10 overflow-y-auto custom-scrollbar">
          {[
            { id: AppView.DASHBOARD, label: 'Pulse Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'SALES', 'OPS'] },
            { id: AppView.ENQUIRY, label: 'Market Intake', icon: Zap, roles: ['ADMIN', 'MANAGER', 'SALES'] },
            { id: AppView.SIMULATOR, label: 'Quote Engine', icon: Target, roles: ['ADMIN', 'MANAGER', 'SALES'] },
            { id: AppView.APPROVALS, label: 'Approvals', icon: ShieldAlert, roles: ['ADMIN', 'MANAGER'] },
            { id: AppView.REPORTS, label: 'Live Ledger', icon: FilePieChart, roles: ['ADMIN', 'MANAGER', 'SALES', 'OPS'] },
            { id: AppView.CRM, label: 'Corporate CRM', icon: Users, roles: ['ADMIN', 'MANAGER', 'SALES'] },
            { id: AppView.VENDORS, label: 'Vendor Grid', icon: Ship, roles: ['ADMIN', 'MANAGER', 'SALES', 'OPS'] },
            { id: AppView.AUDIT, label: 'Audit Vault', icon: ClipboardList, roles: ['ADMIN'] },
          ].filter(item => item.roles.includes(currentUser.role)).map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 italic font-black' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="text-[12px] uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 relative z-10 space-y-2">
          <button onClick={() => setCurrentView(AppView.SETTINGS)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${currentView === AppView.SETTINGS ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <SettingsIcon size={20} />
            {isSidebarOpen && <span className="text-[12px] font-black uppercase tracking-widest">Settings</span>}
          </button>
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500 hover:text-white transition-all group">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-[12px] font-black uppercase tracking-widest">Log Out</span>}
          </button>
        </div>
      </aside>

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

        <div className="h-12 bg-slate-900 border-t border-slate-800 flex items-center px-10 justify-between shrink-0 z-50">
           <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
             System Status: Production Online • All Channels Encrypted
           </div>
           <div className="text-[9px] font-bold text-slate-600 italic">Unique CCS Automation Gateway v3.5.0</div>
        </div>
      </main>

      <div className="fixed bottom-16 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto min-w-[320px] p-6 rounded-[2rem] shadow-2xl border flex items-start gap-4 animate-fade-in ${
            n.type === 'success' ? 'bg-emerald-900 border-emerald-800 text-emerald-50' :
            n.type === 'error' ? 'bg-red-900 border-red-800 text-red-50' :
            n.type === 'warning' ? 'bg-amber-900 border-amber-800 text-amber-50' :
            'bg-slate-900 border-slate-800 text-slate-50'
          }`}>
            <div className="pt-0.5"><Info size={20}/></div>
            <div className="flex-1">
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
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">External Stakeholder Viewing Experience</span>
    </div>
    <button onClick={onExit} className="bg-white text-blue-600 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
      Return to Master Control
    </button>
  </div>
);

export default App;