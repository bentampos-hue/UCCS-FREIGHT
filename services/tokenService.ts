
import { PortalToken } from '../types';

export const tokenService = {
  generate: (entityId: string, type: 'ENQUIRY' | 'QUOTE' | 'SHIPMENT', email: string): string => {
    // In production, use a cryptographic hash. For now, unique ID.
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const portalToken: PortalToken = {
      token,
      entityId,
      entityType: type,
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      recipientEmail: email
    };
    
    // Store in repo/firestore
    const tokens = JSON.parse(localStorage.getItem('uccs_tokens') || '[]');
    tokens.push(portalToken);
    localStorage.setItem('uccs_tokens', JSON.stringify(tokens));
    
    return token;
  },

  validate: (token: string): PortalToken | null => {
    const tokens: PortalToken[] = JSON.parse(localStorage.getItem('uccs_tokens') || '[]');
    const found = tokens.find(t => t.token === token);
    if (!found) return null;
    if (new Date(found.expiry) < new Date()) return null;
    return found;
  }
};
