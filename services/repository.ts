
import { Job, User, AuditLog, AppSettings, CommunicationMessage, Shipment, VendorEnquiry, Quotation } from '../types';
import { db, isFirebaseActive, collection, getDocs, setDoc, doc, deleteDoc } from './firebase';

class Repository {
    private storageType: 'LOCAL' | 'CLOUD' = isFirebaseActive ? 'CLOUD' : 'LOCAL';

    async getJobs(): Promise<Job[]> {
        return this.loadCollection<Job>('jobs');
    }

    async getJobById(id: string): Promise<Job | null> {
        const jobs = await this.getJobs();
        return jobs.find(j => j.id === id) || null;
    }

    async saveJob(job: Job, user: User) {
        job.updatedAt = new Date().toISOString();
        await this.saveItem('jobs', job, user);
    }

    async getMessages(): Promise<CommunicationMessage[]> {
        return this.loadCollection<CommunicationMessage>('messages');
    }

    async saveMessages(messages: CommunicationMessage[]) {
        if (this.storageType === 'CLOUD' && db) {
            for (const msg of messages) {
                await setDoc(doc(db, 'messages', msg.id), msg);
            }
        } else {
            localStorage.setItem('uccs_messages', JSON.stringify(messages));
        }
    }

    async getEnquiries(): Promise<VendorEnquiry[]> {
        return this.loadCollection<VendorEnquiry>('enquiries');
    }

    async getQuotes(): Promise<Quotation[]> {
        return this.loadCollection<Quotation>('quotes');
    }

    async saveQuote(quote: Quotation, user: User) {
        await this.saveItem('quotes', quote, user);
    }

    async getShipments(): Promise<Shipment[]> {
        return this.loadCollection<Shipment>('shipments');
    }

    async loadCollection<T>(key: string): Promise<T[]> {
        if (this.storageType === 'CLOUD' && db) {
            const querySnapshot = await getDocs(collection(db, key));
            return querySnapshot.docs.map(doc => doc.data() as T);
        }
        return JSON.parse(localStorage.getItem(`uccs_${key}`) || '[]');
    }

    async saveItem<T extends { id: string }>(key: string, item: T, user: User) {
        if (this.storageType === 'CLOUD' && db) {
            await setDoc(doc(db, key, item.id), item);
        } else {
            const data = await this.loadCollection<T>(key);
            const index = data.findIndex(i => i.id === item.id);
            if (index > -1) {
                // Ensure arrays are preserved by merging top-level keys properly
                data[index] = { ...data[index], ...item };
            } else {
                data.push(item);
            }
            localStorage.setItem(`uccs_${key}`, JSON.stringify(data));
        }
        this.addAuditLog(user, 'SAVE', key, item.id);
    }

    async deleteItem(key: string, id: string, user: User) {
        if (this.storageType === 'CLOUD' && db) {
            await deleteDoc(doc(db, key, id));
        } else {
            const data = await this.loadCollection<{id: string}>(key);
            const filtered = data.filter(i => i.id !== id);
            localStorage.setItem(`uccs_${key}`, JSON.stringify(filtered));
        }
        this.addAuditLog(user, 'DELETE', key, id);
    }

    async getAuditLogs(): Promise<AuditLog[]> {
        return JSON.parse(localStorage.getItem('uccs_audit_logs') || '[]');
    }

    async addAuditLog(user: User, action: string, type: string, id: string) {
        const log: AuditLog = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            action,
            entityType: type,
            entityId: id,
            changes: 'State Mutation Synchronized'
        };
        const logs = JSON.parse(localStorage.getItem('uccs_audit_logs') || '[]');
        logs.unshift(log);
        localStorage.setItem('uccs_audit_logs', JSON.stringify(logs.slice(0, 500)));
    }

    getSettings(defaultSettings: AppSettings): AppSettings {
        const stored = localStorage.getItem('uccs_settings');
        if (!stored) return defaultSettings;
        return JSON.parse(stored);
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
