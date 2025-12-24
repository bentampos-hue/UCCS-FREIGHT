
export enum AppView {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  WORKFLOW = 'workflow',
  SIMULATOR = 'simulator',
  VENDORS = 'vendors',
  REPORTS = 'reports',
  CRM = 'crm',
  ENQUIRY = 'enquiry',
  SETTINGS = 'settings',
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'OPS';
export type Modality = 'SEA' | 'AIR';
export type PackagingType = 'Pallet' | 'Carton' | 'Crate' | 'Loose' | 'Container-Load' | 'Skid' | 'Bundle' | 'Roll';

export interface PackagingDetail {
  id: string;
  type: PackagingType;
  length: number;
  width: number;
  height: number;
  quantity: number;
  unitWeight: number; // KG
}

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

export interface Vendor {
  id: string;
  name: string;
  tier: 'Premium' | 'Standard';
  lanes: string[];
  apiReady: boolean;
  contractExpiry: string;
  contacts: Contact[];
  addresses: Address[];
}

export interface Customer {
  id: string;
  companyName: string;
  tier: 'VIP' | 'Regular';
  notes?: string;
  contacts: Contact[];
  addresses: Address[];
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'AED' | 'JPY' | 'AUD' | 'CAD';

export interface QuoteLineItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface QuoteRequest {
  modality: Modality;
  origin: string;
  destination: string;
  cargoType: string;
  weight?: number;
  volume?: number;
  packaging?: PackagingDetail[];
  chargeableWeight?: number; 
  etd?: string;
  transitTime?: number;
  buyRate: number;
  margin: number;
  currency: Currency;
  customerId?: string;
  contactId?: string;
  customerEmail: string;
  customerName?: string;
  ccEmail?: string;
  lineItems: QuoteLineItem[];
  sourceRef?: string;
  sourceVendor?: string;
  sourceVendorId?: string;
}

export type QuoteStatus = 'SENT' | 'CONFIRMED' | 'LOST' | 'CANCELLED' | 'RENEGOTIATE' | 'RECALLED' | 'PENDING_APPROVAL';

export type ShipmentMilestoneStatus = 'BOOKING_CONFIRMED' | 'CARGO_PICKED_UP' | 'DEPARTED_POL' | 'ARRIVED_POD' | 'CUSTOMS_CLEARED' | 'DELIVERED' | 'EXCEPTION' | 'FLIGHT_DEPARTED' | 'FLIGHT_ARRIVED';

export interface Milestone {
  status: ShipmentMilestoneStatus;
  date: string;
  location?: string;
  notes?: string;
  updatedBy: string;
}

export interface Quotation {
  id: string;
  modality: Modality;
  customerId?: string;
  customerName?: string;
  customerEmail: string;
  ccEmail?: string;
  origin: string;
  destination: string;
  cargoType: string;
  amount: number;
  currency: Currency;
  status: QuoteStatus;
  date: string;
  notes?: string;
  etd?: string;
  transitTime?: number;
  packaging?: PackagingDetail[];
  lineItems?: QuoteLineItem[];
  source?: 'SIMULATOR' | 'SPOT_BID';
  sourceRef?: string;
  sourceVendorId?: string;
  sourceVendor?: string;
  milestones?: Milestone[];
}

export type EnquiryStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'BID_RECEIVED' | 'CLOSED' | 'AWARDED';

export interface VendorBid {
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: Currency;
  transitTime: number;
  validityDate: string;
  freeTime: number;
  remarks?: string;
  receivedAt: string;
  isWinner?: boolean;
}

export interface VendorEnquiry {
  id: string;
  modality: Modality;
  reference: string;
  origin: string;
  destination: string;
  incoterms: string;
  readyDate: string;
  commodity: string;
  isHazmat?: boolean;
  isStackable?: boolean;
  equipmentType: string;
  equipmentCount: number;
  weight: number;
  volume: number;
  packaging?: PackagingDetail[];
  currency: Currency;
  targetRate?: number;
  status: EnquiryStatus;
  sentDate: string;
  lastFollowUp?: string;
  vendorsSentTo: string[];
  bids: VendorBid[];
}

export interface AppSettings {
  companyName: string;
  defaultCurrency: Currency;
  defaultMarginPercent: number;
  emailSignature: string;
  enableNotifications: boolean;
  themeColor: string;
  emailProvider: 'NATIVE' | 'OFFICE365' | 'GMAIL';
}

export interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  module: string;
  action: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface SharedProps {
  settings: AppSettings;
  userRole: UserRole;
  currentUser: User;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onLogActivity: (module: string, action: string, description: string) => void;
  onNavigate: (view: AppView) => void;
}
