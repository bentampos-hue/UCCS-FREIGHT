import { Vendor, Customer, Quotation, VendorEnquiry, ActivityLog, AppSettings, User } from '../types';
import { db, isFirebaseActive, collection, getDocs, setDoc, doc } from './firebase';

// --- SEED DATA ---

// Default Admin for First Run
const SEED_USERS: User[] = [
    {
        id: 'U001',
        name: 'System Admin',
        email: 'admin@uniqueccs.com', 
        role: 'ADMIN',
        password: 'admin123', 
        lastLogin: new Date().toISOString()
    }
];

const SEED_VENDORS: Vendor[] = [
    { 
      id: 'V001', 
      name: 'Maersk Line', 
      tier: 'Premium', 
      lanes: ['Shanghai->Hamburg', 'Ningbo->Rotterdam', 'Shanghai->Rotterdam'], 
      apiReady: true, 
      contractExpiry: '2025-12-31', 
      contacts: [{ id: 'vc1', name: 'Lars Jensen', role: 'Key Account Manager', email: 'lars.j@maersk.com', phone: '+45 3363 3363', isPrimary: true }],
      addresses: [{ id: 'va1', label: 'Copenhagen HQ', type: 'Both', street: 'Esplanaden 50', city: 'Copenhagen', country: 'Denmark', zip: '1098' }]
    }
];

const SEED_CUSTOMERS: Customer[] = [
    { 
      id: 'C001', 
      companyName: 'Global Retail Inc.', 
      tier: 'VIP',
      contacts: [
        { id: 'cc1', name: 'Alice Smith', role: 'Logistics Manager', email: 'alice@globalretail.com', phone: '+1-555-0101', isPrimary: true },
        { id: 'cc2', name: 'John Doe', role: 'Billing', email: 'billing@globalretail.com', phone: '+1-555-0102', isPrimary: false }
      ],
      addresses: [
        { id: 'ca1', label: 'NY Headquarters', type: 'Billing', street: '1235 6th Ave', city: 'New York', country: 'USA', zip: '10019' },
        { id: 'ca2', label: 'NJ Warehouse', type: 'Shipping', street: '400 Industrial Blvd', city: 'Newark', country: 'USA', zip: '07105' }
      ]
    }
];

const SEED_QUOTES: Quotation[] = [
    {
       id: 'Q-2024-001',
       // Fix: Added required 'modality' property
       modality: 'SEA',
       customerEmail: 'alice@globalretail.com',
       origin: 'Shanghai',
       destination: 'Hamburg',
       cargoType: '1x40HC',
       amount: 1450,
       currency: 'USD',
       status: 'CONFIRMED',
       date: '2024-09-01',
       source: 'SIMULATOR',
       milestones: [
         { status: 'BOOKING_CONFIRMED', date: '2024-09-02 09:30', updatedBy: 'System', notes: 'Booking initialized automatically.' },
         { status: 'CARGO_PICKED_UP', date: '2024-09-04 14:15', updatedBy: 'Ops Team', notes: 'Driver collected container.' }
       ]
    }
];

const SEED_ENQUIRIES: VendorEnquiry[] = [
    {
      id: 'E001',
      // Fix: Added required 'modality' property
      modality: 'SEA',
      reference: 'SPOT-SHA-LAX-009',
      origin: 'Shanghai',
      destination: 'Los Angeles',
      incoterms: 'FOB',
      readyDate: '2024-09-20',
      commodity: 'Consumer Electronics',
      equipmentType: '40HC',
      equipmentCount: 5,
      weight: 45000,
      volume: 320,
      currency: 'USD',
      status: 'BID_RECEIVED',
      sentDate: '2024-09-10',
      vendorsSentTo: ['V002', 'V004', 'V001'],
      bids: [
        {
          vendorId: 'V004',
          vendorName: 'Cosco Shipping',
          amount: 3200,
          currency: 'USD',
          transitTime: 18,
          validityDate: '2024-09-30',
          freeTime: 14,
          receivedAt: '2024-09-11 09:30',
          remarks: 'Space guaranteed.',
          isWinner: false
        }
      ]
    }
];

// --- REPOSITORY CLASS ---

class Repository {
    private storageType: 'LOCAL' | 'CLOUD' = 'LOCAL';

    constructor() {
        this.storageType = isFirebaseActive ? 'CLOUD' : 'LOCAL';
    }

    getStorageType() { return this.storageType; }

    // GENERIC LOAD
    async loadCollection<T>(key: string, seedData: T[]): Promise<T[]> {
        if (this.storageType === 'CLOUD') {
            try {
                const querySnapshot = await getDocs(collection(db, key));
                const data: T[] = [];
                querySnapshot.forEach((doc) => {
                    data.push(doc.data() as T);
                });
                return data.length > 0 ? data : seedData;
            } catch (error) {
                console.error(`Firebase Load Error [${key}]:`, error);
                const stored = localStorage.getItem(`uccs_${key}`);
                if (stored) return JSON.parse(stored);
                return seedData;
            }
        } else {
            const stored = localStorage.getItem(`uccs_${key}`);
            if (stored) {
                const data = JSON.parse(stored);
                // IF it's empty, return seed
                if (Array.isArray(data) && data.length === 0 && seedData.length > 0) return seedData;
                return data;
            }
            localStorage.setItem(`uccs_${key}`, JSON.stringify(seedData));
            return seedData;
        }
    }

    // GENERIC SAVE
    async saveCollection<T extends { id: string }>(key: string, data: T[]): Promise<void> {
        if (this.storageType === 'CLOUD') {
            try {
                const promises = data.map(item => 
                    setDoc(doc(db, key, item.id), item)
                );
                await Promise.all(promises);
            } catch (error) {
                console.error(`Firebase Save Error [${key}]:`, error);
            }
        } else {
            localStorage.setItem(`uccs_${key}`, JSON.stringify(data));
        }
    }

    // SPECIFIC LOADERS
    async getUsers() { 
        const users = await this.loadCollection<User>('users', SEED_USERS);
        // CRITICAL: Ensure admin@uniqueccs.com always exists
        if (!users.find(u => u.email === 'admin@uniqueccs.com')) {
            const updated = [...users, ...SEED_USERS];
            this.saveUsers(updated);
            return updated;
        }
        return users; 
    }
    async getVendors() { return this.loadCollection<Vendor>('vendors', SEED_VENDORS); }
    async getCustomers() { return this.loadCollection<Customer>('customers', SEED_CUSTOMERS); }
    async getQuotes() { return this.loadCollection<Quotation>('quotations', SEED_QUOTES); }
    async getEnquiries() { return this.loadCollection<VendorEnquiry>('enquiries', SEED_ENQUIRIES); }
    async getLogs() { return this.loadCollection<ActivityLog>('activity', []); }
    
    // SPECIFIC SAVERS
    async saveUsers(data: User[]) { return this.saveCollection('users', data); }
    async saveVendors(data: Vendor[]) { return this.saveCollection('vendors', data); }
    async saveCustomers(data: Customer[]) { return this.saveCollection('customers', data); }
    async saveQuotes(data: Quotation[]) { return this.saveCollection('quotations', data); }
    async saveEnquiries(data: VendorEnquiry[]) { return this.saveCollection('enquiries', data); }
    async saveLogs(data: ActivityLog[]) { return this.saveCollection('activity', data); }
    
    getSettings(defaultSettings: AppSettings): AppSettings {
        const stored = localStorage.getItem('uccs_settings');
        return stored ? JSON.parse(stored) : defaultSettings;
    }
    saveSettings(settings: AppSettings) {
        localStorage.setItem('uccs_settings', JSON.stringify(settings));
    }

    // New: Hard reset tool
    factoryReset() {
        localStorage.clear();
        window.location.reload();
    }
}

export const repo = new Repository();