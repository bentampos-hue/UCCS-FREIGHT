import { Quotation, VendorEnquiry } from '../types';

export const analyticsService = {
  calculateKPIs: (quotes: Quotation[], enquiries: VendorEnquiry[]) => {
    const totalQuotes = quotes.length;
    const confirmed = quotes.filter(q => q.status === 'CONFIRMED').length;
    const lost = quotes.filter(q => q.status === 'LOST' || q.status === 'CANCELLED').length;
    
    const winRatio = (confirmed + lost) > 0 ? (confirmed / (confirmed + lost)) * 100 : 0;
    
    const revenue = quotes
      .filter(q => q.status === 'CONFIRMED')
      .reduce((sum, q) => sum + q.amount, 0);
      
    const avgMargin = quotes.length > 0 
      ? quotes.reduce((sum, q) => sum + q.margin, 0) / quotes.length 
      : 0;

    // Vendor competitiveness: average bids per enquiry
    const totalBids = enquiries.reduce((sum, e) => sum + e.bids.length, 0);
    const avgBidsPerReq = enquiries.length > 0 ? totalBids / enquiries.length : 0;

    return {
      winRatio,
      revenue,
      avgMargin,
      avgBidsPerReq,
      countActive: quotes.filter(q => q.status === 'SENT').length,
      countPending: quotes.filter(q => q.status === 'PENDING_APPROVAL').length
    };
  }
};