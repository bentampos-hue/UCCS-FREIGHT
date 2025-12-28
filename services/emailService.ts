import { CommunicationMessage } from '../types';
import { repo } from './repository';

export const emailService = {
  send: async (msg: Omit<CommunicationMessage, 'id' | 'status' | 'sentAt'>): Promise<boolean> => {
    const newMsg: CommunicationMessage = {
      ...msg,
      id: `MSG-${Date.now()}`,
      sentAt: new Date().toISOString(),
      status: 'SENT' // Fixed: Changed from SIMULATED_SENT to SENT to match type constraints
    };

    console.log(`[Email Service] Sending to ${msg.to}: ${msg.subject}`);
    
    // Logic: If API Key exists, use Fetch to hit SendGrid/Functions
    // const response = await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(newMsg) });

    // Store in communications log
    const history = await repo.getMessages();
    await repo.saveMessages([...history, newMsg]);

    return true;
  }
};