
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Ship, Users, FilePieChart, Settings as SettingsIcon, LogOut, 
  Workflow, Briefcase, Zap, CheckCircle2, Info, ShieldAlert, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { AppView, User, AppSettings, Vendor, Customer, Job, SharedProps, Permission } from './types';
import { repo } from './services/repository';

import Dashboard from './components/Dashboard';
import JobManager from './components/JobManager';
import VendorNetwork from './components/VendorNetwork';
import Reports from './components/Reports';
import CRM from './components/CRM';
import Settings from './components/Settings';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PROJECT_CENTER);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, type: string, message: string}[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'FreightFlow Global',
    baseCurrency: 'AED',
    exchangeRates: { AED: 1, USD: 0.2723, EUR: 0.2541, CNY: 1.9654, GBP: 0.2185 },
    defaultMarginPercent: 15,
    minMarginThreshold: 10,
    emailSignature: 'Best Regards,\nUnique CCS Team',
    numbering: { jobPrefix: 'JOB-', accountPrefix: 'ACC-', vendorPrefix: 'VND-' },
    legalTerms: {
      version: 'v1.2 (Production)',
      general: 'Subject to UAE Federal Law No. (1) of 1992. Quotations valid for 14 days. Rates exclude local duties/taxes.',
      air: 'Chargeable weight based on 1:6000 volumetric ratio. Subject to IATA DG regulations.',
      sea: 'Rates based on W/M 1000. Subject to Port Authority demurrage schedules.',
      courier: 'Carrier liability limits apply per Montreal Convention.',
      lastUpdated: new Date().toISOString()
    },
    commercialParameters: {
      sea: { lclMinCbm: 1, wmRule: 1000, docFee: 50, defaultLocalCharges: 150 },
      air: { volumetricFactor: 6000, minChargeableWeight: 45, defaultSurcharges: 85 }
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const init = async () => {
      const s = repo.getSettings(settings); setSettings(s);
      const [v, c, u, j, a] = await Promise.all([
        repo.loadCollection<Vendor>('vendors'),
        repo.loadCollection<Customer>('customers'),
        repo.loadCollection<User>('users'),
        repo.getJobs(),
        repo.getAuditLogs()
      ]);
      setVendors(v); setCustomers(c); setJobs(j); setAuditLogs(a); setUsers(u);
    };
    init();
  }, []);

  const hasPermission = (key: Permission['key']): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'MANAGER') {
      return !['MANAGE_USERS', 'DELETE_ALL', 'EDIT_SETTINGS'].includes(key);
    }
    if (currentUser.role === 'OPS') {
      return ['EDIT_SHIPMENT', 'VIEW_LEDGER'].includes(key);
    }
    if (currentUser.role === 'SALES') {
      return ['VIEW_LEDGER'].includes(key);
    }
    return false;
  };

  const sharedProps: SharedProps = {
    settings, userRole: currentUser?.role || 'VIEWER', currentUser: currentUser!,
    onNotify: (type, message) => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, type, message }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
    },
    onLogActivity: (m, a, d) => repo.addAuditLog(currentUser!, a, m, d),
    onNavigate: (v, p) => { if (p?.jobId) setSelectedJobId(p.jobId); setCurrentView(v); },
    hasPermission
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} users={users} />;

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard {...sharedProps} activityLog={auditLogs} jobs={jobs} />;
      case AppView.PROJECT_CENTER: return <JobManager {...sharedProps} vendors={vendors} customers={customers} users={users} initialJobId={selectedJobId} onClearJobId={() => setSelectedJobId(null)} onDeleteJob={id => setJobs(prev => prev.filter(j => j.id !== id))} />;
      case AppView.VENDORS: return <VendorNetwork {...sharedProps} vendors={vendors} jobs={jobs} onAddVendor={v => setVendors([v, ...vendors])} onUpdateVendor={v => setVendors(prev => prev.map(x => x.id === v.id ? v : x))} onDeleteVendor={id => setVendors(prev => prev.filter(x => x.id !== id))} />;
      case AppView.CRM: return <CRM {...sharedProps} customers={customers} jobs={jobs} onAddCustomer={c => setCustomers([c, ...customers])} onUpdateCustomer={c => setCustomers(prev => prev.map(x => x.id === c.id ? c : x))} onDeleteCustomer={id => setCustomers(prev => prev.filter(x => x.id !== id))} />;
      case AppView.REPORTS: return <Reports {...sharedProps} />;
      case AppView.SETTINGS: return <Settings {...sharedProps} onUpdateSettings={setSettings} users={users} onUpdateUsers={setUsers} />;
      default: return <div className="p-20 text-center text-slate-400 font-medium italic animate-pulse">Governance Engine Restored</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} liquid-glass-secondary border-r border-slate-200/50 transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 mb-4 flex items-center gap-3">
          <div className="bg-blue-600 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center shrink-0">
            <Briefcase className="text-white" size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-slate-800 tracking-tight">UCCS v3.5</span>}
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: AppView.PROJECT_CENTER, label: 'Control Center', icon: Zap },
            { id: AppView.DASHBOARD, label: 'Performance', icon: LayoutDashboard },
            { id: AppView.CRM, label: 'Accounts', icon: Users },
            { id: AppView.VENDORS, label: 'Partners', icon: Ship },
            { id: AppView.REPORTS, label: 'Ledger', icon: FilePieChart },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:bg-white/40 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200/50 space-y-1">
          <button onClick={() => setCurrentView(AppView.SETTINGS)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-white/40">
            <SettingsIcon size={18} />
            {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-600">
            <LogOut size={18} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 flex justify-between items-center bg-white border-b border-slate-200/50 relative z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
              <Workflow size={18} />
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{currentView.replace('_', ' ')}</h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 leading-none mb-1">{currentUser.name}</p>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{currentUser.role}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-600">
                  <UserIcon size={18} />
                </div>
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderView()}
        </div>
      </main>

      {/* Persistence Notification Layer */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto min-w-[280px] p-4 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center gap-4 animate-slide-up">
             <div className={`p-2 rounded-lg ${n.type === 'success' ? 'bg-emerald-500 text-white' : n.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'}`}>
                {n.type === 'success' ? <CheckCircle2 size={14}/> : <Info size={14}/>}
             </div>
             <div className="text-xs font-medium text-slate-700">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
