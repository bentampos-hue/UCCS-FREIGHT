
import { PortalToken } from '../types';

export const tokenService = {
  /* Fixed: Signature now uses 'bid' | 'quote' | 'track' to match PortalToken definition */
  generate: (entityId: string, type: 'bid' | 'quote' | 'track', email: string): string => {
    // Cryptographically secure random hex string
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    const token = Array.from(array)
      .map(b => b.toString(16).padStart(8, '0'))
      .join('');
    
    const portalToken: PortalToken = {
      token,
      entityId,
      entityType: type,
      createdAt: new Date().toISOString(),
      expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      recipientEmail: email
    };
    
    // Store in local storage or repository
    const tokens = JSON.parse(localStorage.getItem('uccs_tokens') || '[]');
    tokens.push(portalToken);
    localStorage.setItem('uccs_tokens', JSON.stringify(tokens));
    
    return token;
  },

  validate: (token: string): PortalToken | null => {
    const tokens: PortalToken[] = JSON.parse(localStorage.getItem('uccs_tokens') || '[]');
    const found = tokens.find(t => t.token === token);
    if (!found) return null;
    
    const isExpired = new Date(found.expiry) < new Date();
    if (isExpired) return null;
    
    return found;
  },

  revoke: (tokenString: string) => {
    const tokens: PortalToken[] = JSON.parse(localStorage.getItem('uccs_tokens') || '[]');
    const filtered = tokens.filter(t => t.token !== tokenString);
    localStorage.setItem('uccs_tokens', JSON.stringify(filtered));
  }
};
