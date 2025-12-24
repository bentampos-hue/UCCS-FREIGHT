
export enum AppView {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  SIMULATOR = 'simulator',
  VENDORS = 'vendors',
  REPORTS = 'reports', // Now handles Shipments
  CRM = 'crm',
  ENQUIRY = 'enquiry',
  SETTINGS = 'settings',
  APPROVALS = 'approvals',
  VENDOR_PORTAL = 'vendor_portal',
  CUSTOMER_PORTAL = 'customer_portal'
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'OPS';
export type Modality = 'SEA' | 'AIR';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'AED';
export type QuoteStatus = 'SENT' | 'CONFIRMED' | 'LOST' | 'PENDING_APPROVAL' | 'RENEGOTIATE' | 'CANCELLED';
export type EnquiryStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'BID_RECEIVED' | 'AWARDED' | 'CLOSED';
export type ShipmentMilestoneStatus = 'BOOKING_CONFIRMED' | 'CARGO_PICKED_UP' | 'DEPARTED_POL' | 'AT_SEA' | 'ARRIVED_POD' | 'FLIGHT_DEPARTED' | 'FLIGHT_ARRIVED' | 'CUSTOMS_CLEARED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
export type PackagingType = 'PALLET' | 'BOX' | 'CRATE' | 'LOOSE';

// --- Base Entities ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  lastLogin?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface Address {
  id: string;
  label: string;
  type: 'Billing' | 'Shipping' | 'Both';
  street: string;
  city: string;
  country: string;
  zip: string;
}

// --- Governance & Security ---
export interface PortalToken {
  token: string;
  entityId: string;
  entityType: 'ENQUIRY' | 'QUOTE' | 'SHIPMENT';
  expiry: string;
  recipientEmail: string;
}

export interface ApprovalRequest {
  id: string;
  quoteId: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  marginAtRequest: number;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: string; // JSON string of diff
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  description: string;
}

// --- Communication ---
export interface CommunicationMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'SIMULATED_SENT';
  type: 'ENQUIRY' | 'QUOTE' | 'MILESTONE' | 'APPROVAL';
  referenceId: string;
}

// --- Logistics Entities ---
export interface Milestone {
  status: ShipmentMilestoneStatus | string;
  date: string;
  notes?: string;
  updatedBy: string;
  location?: string;
  isAutomated?: boolean;
}

export interface Shipment {
  id: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  trackingNumber: string; // AWB or Container No
  modality: Modality;
  origin: string;
  destination: string;
  status: 'BOOKED' | 'IN_TRANSIT' | 'ARRIVED' | 'CLEARED' | 'DELIVERED' | 'CANCELLED';
  milestones: Milestone[];
  createdAt: string;
}

export interface Quotation {
  id: string;
  portalToken: string;
  modality: Modality;
  customerId: string;
  customerName: string;
  customerEmail: string;
  origin: string;
  destination: string;
  amount: number;
  buyRate: number;
  margin: number;
  currency: Currency;
  status: QuoteStatus;
  date: string;
  trackingNumber?: string;
  milestones?: Milestone[];
  cargoType?: string;
}

export interface VendorBid {
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: Currency;
  transitTime: number;
  validityDate: string;
  receivedAt: string;
  freeTime?: number;
}

export interface VendorEnquiry {
  id: string;
  portalToken: string;
  modality: Modality;
  reference: string;
  status: EnquiryStatus;
  vendorsSentTo: string[]; // Vendor IDs
  bids: VendorBid[];
  sentDate: string;
  origin: string;
  destination: string;
  commodity: string;
  incoterms?: string;
  readyDate?: string;
  isHazmat?: boolean;
  isStackable?: boolean;
  equipmentType?: string;
  equipmentCount?: number;
  weight?: number;
  volume?: number;
  currency?: Currency;
  targetRate?: number;
  lastFollowUp?: string;
}

export interface Vendor {
  id: string;
  name: string;
  tier: 'Standard' | 'Premium';
  lanes: string[];
  apiReady: boolean;
  contractExpiry: string;
  contacts: Contact[];
  addresses: Address[];
}

export interface Customer {
  id: string;
  companyName: string;
  tier: 'Regular' | 'VIP';
  contacts: Contact[];
  addresses: Address[];
  notes?: string;
}

export interface PackagingDetail {
  type: PackagingType;
  quantity: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
}

export interface AppSettings {
  companyName: string;
  defaultCurrency: Currency;
  defaultMarginPercent: number;
  emailProvider?: string;
  emailSignature: string;
}

export interface QuoteRequest {
  modality: Modality;
  origin: string;
  destination: string;
  cargoType: string;
  weight?: number;
  volume?: number;
  etd?: string;
  transitTime?: number;
  buyRate: number;
  margin: number;
  currency: Currency;
  customerEmail: string;
  lineItems: { description: string; amount: number; quantity: number }[];
  sourceRef?: string;
  sourceVendor?: string;
  sourceVendorId?: string;
}

// Updated SharedProps for RBAC
export interface SharedProps {
  settings: AppSettings;
  userRole: UserRole;
  currentUser: User;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onLogActivity: (module: string, action: string, description: string) => void;
  onNavigate: (view: AppView) => void;
}
