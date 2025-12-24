import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Network, Calculator, Users, Ship, Menu, X, FileBarChart, LogOut, Briefcase, Megaphone, Settings as SettingsIcon, Bell, XCircle, CheckCircle, Info, AlertTriangle, Shield, Cloud, Database } from 'lucide-react';
import { AppView, Quotation, QuoteStatus, Vendor, Customer, AppSettings, SystemNotification, ActivityLog, SharedProps, VendorEnquiry, VendorBid, User, UserRole, Milestone, ShipmentMilestoneStatus, QuoteRequest } from './types';
import Dashboard from './components/Dashboard';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import QuoteSimulator from './components/QuoteSimulator';
import VendorNetwork from './components/VendorNetwork';
import Reports from './components/Reports';
import Login from './components/Login';
import CRM from './components/CRM';
import VendorEnquiryComponent from './components/VendorEnquiry';
import Settings from './components/Settings';
import { repo } from './services/repository';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [storageType, setStorageType] = useState<'LOCAL' | 'CLOUD'>('LOCAL');
  
  // Navigation State
  const [reportsFilter, setReportsFilter] = useState<QuoteStatus | 'ALL'>('ALL');
  const [simulationPreload, setSimulationPreload] = useState<QuoteRequest | null>(null);

  // --- Data State ---
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [enquiries, setEnquiries] = useState<VendorEnquiry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'Unique CCS',
    defaultCurrency: 'USD',
    defaultMarginPercent: 20,
    emailSignature: 'Best Regards,\nUnique CCS Team',
    enableNotifications: true,
    themeColor: 'blue',
    emailProvider: 'OFFICE365'
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadData = async () => {
        try {
            setUsers(await repo.getUsers());
            setVendors(await repo.getVendors());
            setCustomers(await repo.getCustomers());
            setQuotations(await repo.getQuotes());
            setEnquiries(await repo.getEnquiries());
            setActivityLog(await repo.getLogs());
            setSettings(repo.getSettings(settings));
            setStorageType(repo.getStorageType());
        } catch (e) {
            console.error("Data Load Error:", e);
            addNotification('error', 'Failed to load data from repository.');
        } finally {
            setIsDataLoaded(true);
        }
    };
    loadData();
  }, []);

  const persistUsers = (data: User[]) => {
      setUsers(data);
      repo.saveUsers(data);
  };
  const persistVendors = (data: Vendor[]) => {
      setVendors(data);
      repo.saveVendors(data);
  };
  const persistCustomers = (data: Customer[]) => {
      setCustomers(data);
      repo.saveCustomers(data);
  };
  const persistQuotes = (data: Quotation[]) => {
      setQuotations(data);
      repo.saveQuotes(data);
  };
  const persistEnquiries = (data: VendorEnquiry[]) => {
      setEnquiries(data);
      repo.saveEnquiries(data);
  };
  const persistSettings = (data: AppSettings) => {
      setSettings(data);
      repo.saveSettings(data);
  };
  const persistLog = (data: ActivityLog[]) => {
      setActivityLog(data);
      repo.saveLogs(data);
  };

  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    if (!settings.enableNotifications && type === 'info') return;
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const logActivity = (module: string, action: string, description: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      module,
      action,
      description,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'System'
    };
    setActivityLog(prev => {
        const updated = [newLog, ...prev].slice(0, 50);
        repo.saveLogs(updated);
        return updated;
    });
  };

  const navigateTo = (view: AppView) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const sharedProps: SharedProps = {
    settings,
    userRole: currentUser?.role || 'ADMIN',
    currentUser: currentUser!,
    onNotify: addNotification,
    onLogActivity: logActivity,
    onNavigate: navigateTo
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    addNotification('success', `Authentication successful. Welcome, ${user.name}.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView(AppView.DASHBOARD);
    addNotification('info', 'Logged out successfully.');
  };

  if (!isDataLoaded) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center animate-pulse">
                  <Ship size={48} className="text-blue-500 mb-4" />
                  <h2 className="text-lg font-bold text-slate-700">Initializing Unique CCS Platform...</h2>
                  <p className="text-xs text-slate-400 mt-2">Connecting to Secure Gateway</p>
              </div>
          </div>
      )
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }
  
  const pendingApprovalsCount = quotations.filter(q => q.status === 'PENDING_APPROVAL').length;
  const activeEnquiriesCount = enquiries.filter(e => e.status !== 'CLOSED' && e.status !== 'AWARDED').length;

  const renderContent = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return <Dashboard 
                  activityLog={activityLog} 
                  quotations={quotations}
                  enquiries={enquiries}
                  onNavigateToReports={handleNavigateToReports}
                  {...sharedProps} 
               />;
      case AppView.WORKFLOW:
        return <WorkflowVisualizer {...sharedProps} />;
      case AppView.SIMULATOR:
        return (
          <QuoteSimulator 
            onGenerateQuote={handleAddQuote} 
            customers={customers} 
            vendors={vendors} 
            initialData={simulationPreload}
            onClearInitialData={() => setSimulationPreload(null)}
            {...sharedProps} 
          />
        );
      case AppView.VENDORS:
        return <VendorNetwork vendors={vendors} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} {...sharedProps} />;
      case AppView.CRM:
        return <CRM customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} {...sharedProps} />;
      case AppView.REPORTS:
        return (
          <Reports 
            quotations={quotations} 
            onUpdateStatus={handleUpdateStatus} 
            onAddMilestone={handleAddMilestone}
            defaultFilter={reportsFilter}
            {...sharedProps} 
          />
        );
      case AppView.ENQUIRY:
        return (
          <VendorEnquiryComponent 
            vendors={vendors} 
            enquiries={enquiries}
            onAddEnquiry={handleAddEnquiry}
            onUpdateEnquiry={handleUpdateEnquiry}
            onAwardEnquiry={handleAwardEnquiry}
            onLoadToSimulator={handleLoadToSimulator}
            {...sharedProps} 
          />
        );
      case AppView.SETTINGS:
        return <Settings 
                 onUpdateSettings={persistSettings} 
                 users={users}
                 onAddUser={handleAddUser}
                 onDeleteUser={handleDeleteUser}
                 onUpdatePassword={handleUpdatePassword}
                 onResetData={handleResetData}
                 {...sharedProps} 
               />;
      default:
        return <Dashboard 
                  activityLog={activityLog} 
                  quotations={quotations}
                  enquiries={enquiries}
                  onNavigateToReports={handleNavigateToReports}
                  {...sharedProps} 
               />;
    }
  };

  const handleAddVendor = (newVendor: Vendor) => {
    const updated = [...vendors, newVendor];
    persistVendors(updated);
    logActivity('Vendor', 'Created', `Added new vendor: ${newVendor.name}`);
    addNotification('success', `Vendor ${newVendor.name} added successfully.`);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const updated = vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v);
    persistVendors(updated);
    logActivity('Vendor', 'Updated', `Updated vendor details for: ${updatedVendor.name}`);
    addNotification('info', `Vendor ${updatedVendor.name} updated.`);
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    const updated = [...customers, newCustomer];
    persistCustomers(updated);
    logActivity('CRM', 'Created', `Added new customer: ${newCustomer.companyName}`);
    addNotification('success', `Customer ${newCustomer.companyName} added successfully.`);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    persistCustomers(updated);
    logActivity('CRM', 'Updated', `Updated customer: ${updatedCustomer.companyName}`);
    addNotification('info', `Customer ${updatedCustomer.companyName} updated.`);
  };

  const handleAddQuote = (newQuote: Quotation) => {
    let quoteToSave = { ...newQuote };
    if (quoteToSave.status === 'CONFIRMED' && (!quoteToSave.milestones || quoteToSave.milestones.length === 0)) {
        quoteToSave.milestones = [{
            status: 'BOOKING_CONFIRMED',
            date: new Date().toISOString(),
            updatedBy: currentUser?.name || 'System',
            notes: 'Immediate booking confirmed.'
        }];
    }
    const updatedQuotes = [quoteToSave, ...quotations];
    persistQuotes(updatedQuotes);
    logActivity('Quote', 'Generated', `Generated quote ${quoteToSave.id} for ${quoteToSave.customerEmail}`);
    addNotification('success', `Quote ${quoteToSave.id} generated successfully.`);
  };

  const handleUpdateStatus = (id: string, status: QuoteStatus) => {
    const updatedQuotes = quotations.map(q => q.id === id ? { ...q, status } : q);
    persistQuotes(updatedQuotes);
    logActivity('Quote', 'Status Change', `Quote ${id} status changed to ${status}`);
    addNotification('info', `Quote ${id} updated to ${status}`);
  };

  const handleAddMilestone = (quoteId: string, milestone: Milestone) => {
    const updatedQuotes = quotations.map(q => q.id === quoteId ? { ...q, milestones: [milestone, ...(q.milestones || [])] } : q);
    persistQuotes(updatedQuotes);
    logActivity('Ops', 'Milestone', `Shipment ${quoteId} updated: ${milestone.status}`);
    addNotification('success', `Milestone ${milestone.status} recorded.`);
  };

  const handleAddEnquiry = (newEnquiry: VendorEnquiry) => {
    const updated = [newEnquiry, ...enquiries];
    persistEnquiries(updated);
    logActivity('Enquiry', 'Created', `Floated new enquiry ${newEnquiry.reference}`);
  };

  const handleUpdateEnquiry = (updatedEnquiry: VendorEnquiry) => {
    const updated = enquiries.map(e => e.id === updatedEnquiry.id ? updatedEnquiry : e);
    persistEnquiries(updated);
  };

  const handleAwardEnquiry = (enquiryId: string, bid: VendorBid, sellPrice: number) => {
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry) return;
    const newQuote: Quotation = {
      id: `Q-SPOT-${Date.now().toString().slice(-4)}`,
      // Fix: modality is required in Quotation interface
      modality: enquiry.modality,
      customerEmail: 'spot.booking@uniqueccs.com',
      ccEmail: '',
      origin: enquiry.origin,
      destination: enquiry.destination,
      cargoType: `${enquiry.equipmentCount}x${enquiry.equipmentType}`,
      amount: sellPrice,
      currency: bid.currency,
      status: 'CONFIRMED', 
      date: new Date().toISOString().split('T')[0],
      source: 'SPOT_BID',
      sourceRef: enquiry.reference,
      sourceVendorId: bid.vendorId,
      sourceVendor: bid.vendorName,
      milestones: [{ status: 'BOOKING_CONFIRMED', date: new Date().toISOString(), updatedBy: currentUser?.name || 'System' }]
    };
    handleAddQuote(newQuote);
    addNotification('success', `Bid awarded and Booking ${newQuote.id} created.`);
  };

  const handleLoadToSimulator = (data: QuoteRequest) => {
    setSimulationPreload(data);
    setActiveView(AppView.SIMULATOR);
  };

  const handleNavigateToReports = (filter: QuoteStatus | 'ALL') => {
    setReportsFilter(filter);
    setActiveView(AppView.REPORTS);
  };

  const handleAddUser = (newUser: User) => {
      const updated = [...users, newUser];
      persistUsers(updated);
      logActivity('Admin', 'User Created', `Registered new user: ${newUser.email}`);
  };

  const handleDeleteUser = (userId: string) => {
      const updated = users.filter(u => u.id !== userId);
      persistUsers(updated);
  };

  const handleUpdatePassword = (newPassword: string) => {
    if (!currentUser) return;
    const updated = users.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u);
    persistUsers(updated);
    setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
  };

  const handleResetData = (type: 'TRANSACTIONS' | 'FULL') => {
      if (type === 'TRANSACTIONS') {
          persistQuotes([]);
          persistEnquiries([]);
          persistLog([]);
          addNotification('success', 'Transactions cleared.');
      } else {
          localStorage.clear();
          window.location.reload();
      }
  };

  const NavItem = ({ view, icon: Icon, label, badgeCount }: { view: AppView; icon: any; label: string, badgeCount?: number }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setReportsFilter('ALL'); 
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
        activeView === view
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeView === view ? 'bg-blue-50 text-white' : 'bg-red-100 text-red-600'}`}>
          {badgeCount}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto transform transition-all duration-300 translate-x-0 w-80 p-4 rounded-lg shadow-lg border-l-4 flex items-start space-x-3 bg-white ${n.type === 'success' ? 'border-emerald-500' : n.type === 'error' ? 'border-red-500' : n.type === 'warning' ? 'border-amber-500' : 'border-blue-500'}`}>
             <div className="shrink-0">
               {n.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
               {n.type === 'error' && <XCircle size={20} className="text-red-500" />}
               {n.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
               {n.type === 'info' && <Info size={20} className="text-blue-500" />}
             </div>
             <div className="flex-1 text-sm font-medium text-slate-800">{n.message}</div>
             <button onClick={() => removeNotification(n.id)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        ))}
      </div>

      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shadow-[2px_0_10px_-5px_rgba(0,0,0,0.1)] z-10">
        <div className="flex items-center space-x-2 px-6 py-6 border-b border-slate-100">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
            <Ship className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Unique CCS</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">SeaFreight Automation</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Strategic Dashboard" />
          <NavItem view={AppView.SIMULATOR} icon={Calculator} label="Quote Engine" />
          <NavItem view={AppView.ENQUIRY} icon={Megaphone} label="Spot Bidding" badgeCount={activeEnquiriesCount} />
          <div className="my-2 border-t border-slate-100"></div>
          <NavItem view={AppView.REPORTS} icon={FileBarChart} label="Ledger & Ops" badgeCount={pendingApprovalsCount} />
          <NavItem view={AppView.CRM} icon={Briefcase} label="CRM" />
          <NavItem view={AppView.VENDORS} icon={Users} label="Vendors" />
          <div className="my-2 border-t border-slate-100"></div>
          <NavItem view={AppView.SETTINGS} icon={SettingsIcon} label="System Settings" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-xs font-semibold text-slate-700">{currentUser.role} Role</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Ship className="text-blue-600" size={24} />
            <h1 className="text-lg font-bold text-slate-800">Unique CCS</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;