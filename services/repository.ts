import { Vendor, Customer, Quotation, VendorEnquiry, ActivityLog, AppSettings, User, Shipment, CommunicationMessage, ApprovalRequest, AuditLog, CommercialParameters } from '../types';
import { db, isFirebaseActive, collection, getDocs, setDoc, doc, deleteDoc } from './firebase';

class Repository {
    private storageType: 'LOCAL' | 'CLOUD' = 'LOCAL';

    constructor() {
        this.storageType = isFirebaseActive ? 'CLOUD' : 'LOCAL';
    }

    async loadCollection<T>(key: string): Promise<T[]> {
        if (this.storageType === 'CLOUD') {
            const querySnapshot = await getDocs(collection(db, key));
            return querySnapshot.docs.map(doc => doc.data() as T);
        }
        return JSON.parse(localStorage.getItem(`uccs_${key}`) || '[]');
    }

    async saveItem<T extends { id: string }>(key: string, item: T, user: User) {
        // Audit Logging
        const log: AuditLog = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            action: 'SAVE',
            entityType: key,
            entityId: item.id,
            changes: JSON.stringify(item)
        };
        await this.addAuditLog(log);

        if (this.storageType === 'CLOUD') {
            await setDoc(doc(db, key, item.id), item);
        } else {
            const data = await this.loadCollection<T>(key);
            const index = data.findIndex(i => i.id === item.id);
            if (index > -1) data[index] = item; else data.push(item);
            localStorage.setItem(`uccs_${key}`, JSON.stringify(data));
        }
    }

    async saveItemsBulk<T extends { id: string }>(key: string, items: T[], user: User) {
        if (this.storageType === 'CLOUD') {
            for (const item of items) {
                await setDoc(doc(db, key, item.id), item);
            }
        } else {
            const data = await this.loadCollection<T>(key);
            const existingIds = new Set(data.map(i => i.id));
            const newData = [...data];
            
            items.forEach(item => {
                if (existingIds.has(item.id)) {
                    const idx = newData.findIndex(i => i.id === item.id);
                    newData[idx] = item;
                } else {
                    newData.push(item);
                }
            });
            localStorage.setItem(`uccs_${key}`, JSON.stringify(newData));
        }
        
        const log: ActivityLog = {
            id: `AL-BULK-${Date.now()}`,
            timestamp: new Date().toISOString(),
            module: 'Data',
            action: 'BULK_IMPORT',
            description: `Imported ${items.length} records into ${key}.`
        };
        // Log locally for simplicity in this context
        const logs = JSON.parse(localStorage.getItem('uccs_activity_logs') || '[]');
        localStorage.setItem('uccs_activity_logs', JSON.stringify([log, ...logs]));
    }

    // --- Specific Collections ---
    async getShipments() { return this.loadCollection<Shipment>('shipments'); }
    async getMessages() { return this.loadCollection<CommunicationMessage>('messages'); }
    async getApprovals() { return this.loadCollection<ApprovalRequest>('approvals'); }
    async getEnquiries() { return this.loadCollection<VendorEnquiry>('enquiries'); }
    async getQuotes() { return this.loadCollection<Quotation>('quotations'); }
    async getUsers() { return this.loadCollection<User>('users'); }
    async getVendors() { return this.loadCollection<Vendor>('vendors'); }
    async getCustomers() { return this.loadCollection<Customer>('customers'); }

    async saveQuote(quote: Quotation, user: User) { return this.saveItem('quotations', quote, user); }
    async saveShipment(ship: Shipment, user: User) { return this.saveItem('shipments', ship, user); }
    async saveMessages(msgs: CommunicationMessage[]) { 
        // Internal bulk save for local fallback
        localStorage.setItem('uccs_messages', JSON.stringify(msgs));
    }

    async addAuditLog(log: AuditLog) {
        if (this.storageType === 'CLOUD') {
            await setDoc(doc(db, 'audit_logs', log.id), log);
        } else {
            const logs = JSON.parse(localStorage.getItem('uccs_audit_logs') || '[]');
            logs.push(log);
            localStorage.setItem('uccs_audit_logs', JSON.stringify(logs));
        }
    }

    // Settings
    getSettings(defaultSettings: AppSettings): AppSettings {
        const stored = localStorage.getItem('uccs_settings');
        if (!stored) return defaultSettings;
        const parsed = JSON.parse(stored);
        
        // Migration: Ensure commercialParameters exist
        if (!parsed.commercialParameters) {
            parsed.commercialParameters = {
                sea: { lclMinCbm: 1, wmRule: 1000, docFee: 50, defaultLocalCharges: 150 },
                air: { volumetricFactor: 6000, minChargeableWeight: 45, defaultSurcharges: 85 }
            };
            this.saveSettings(parsed);
        }
        return parsed;
    }

    saveSettings(settings: AppSettings) {
        localStorage.setItem('uccs_settings', JSON.stringify(settings));
    }

    factoryReset() {
        localStorage.clear();
        window.location.reload();
    }
}

export const repo = new Repository();