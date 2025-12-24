export enum AppView {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  SIMULATOR = 'simulator',
  VENDORS = 'vendors',
  REPORTS = 'reports',
  CRM = 'crm',
  ENQUIRY = 'enquiry',
  SETTINGS = 'settings',
  APPROVALS = 'approvals',
  AUDIT = 'audit',
  VENDOR_PORTAL = 'vendor_portal',
  CUSTOMER_PORTAL = 'customer_portal',
  TRACKING_PORTAL = 'tracking_portal'
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'OPS';
export type Modality = 'SEA' | 'AIR';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'AED';
export type QuoteStatus = 'SENT' | 'CONFIRMED' | 'LOST' | 'PENDING_APPROVAL' | 'RENEGOTIATE' | 'CANCELLED';
export type EnquiryStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'BID_RECEIVED' | 'AWARDED' | 'CLOSED';
export type ShipmentMilestoneStatus = 'BOOKING_CONFIRMED' | 'CARGO_PICKED_UP' | 'DEPARTED_POL' | 'AT_SEA' | 'ARRIVED_POD' | 'FLIGHT_DEPARTED' | 'FLIGHT_ARRIVED' | 'CUSTOMS_CLEARED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
export type PackagingType = 'PALLET' | 'BOX' | 'CRATE' | 'LOOSE' | 'CONTAINER';

export interface DraftState {
  formId: string;
  data: any;
  lastSaved: string;
}

export interface PackagingLine {
  id: string;
  type: PackagingType;
  quantity: number;
  length: number;
  width: number;
  height: number;
  weightPerUnit: number;
  description: string;
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

export interface PortalToken {
  token: string;
  entityId: string;
  entityType: 'ENQUIRY' | 'QUOTE' | 'SHIPMENT';
  expiry: string;
  recipientEmail: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  description: string;
}

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

export interface Milestone {
  status: ShipmentMilestoneStatus | string;
  date: string;
  notes?: string;
  updatedBy: string;
  location?: string;
  isAutomated?: boolean;
}

export interface Quotation {
  id: string;
  portalToken?: string;
  isManual?: boolean;
  modality: Modality;
  customerId: string;
  customerName: string;
  customerEmail: string;
  origin: string;
  destination: string;
  originAddress?: string;
  destinationAddress?: string;
  amount: number;
  buyRate: number;
  margin: number;
  currency: Currency;
  status: QuoteStatus;
  date: string;
  cargoType?: string;
  cargoLines?: PackagingLine[];
  milestones?: Milestone[];
  sourceEnquiryId?: string;
  sourceBidId?: string;
  linkedJobId?: string;
  approvalComments?: string;
  details?: {
    weight?: number;
    volume?: number;
    chargeable?: number;
    equipment?: string;
  };
}

export interface Shipment {
  id: string;
  quoteId: string;
  trackingToken: string;
  status: ShipmentMilestoneStatus;
  modality: Modality;
  customerName: string;
  origin: string;
  destination: string;
  milestones: Milestone[];
  cargoLines: PackagingLine[];
  documents: { id: string; name: string; type: string; url: string; uploadedAt: string }[];
  hblReference?: string;
  mblReference?: string;
  containerNumber?: string;
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
  vendorsSentTo: string[];
  bids: VendorBid[];
  sentDate: string;
  origin: string;
  destination: string;
  pickupZip?: string;
  deliveryZip?: string;
  commodity: string;
  cargoLines: PackagingLine[];
  incoterms?: string;
  readyDate?: string;
  currency?: Currency;
  targetRate?: number;
  equipmentType?: string;
  equipmentCount?: number;
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

export interface CommercialParameters {
  sea: {
    lclMinCbm: number;
    wmRule: number;
    docFee: number;
    defaultLocalCharges: number;
  };
  air: {
    volumetricFactor: number;
    minChargeableWeight: number;
    defaultSurcharges: number;
  };
}

export interface AppSettings {
  companyName: string;
  defaultCurrency: Currency;
  defaultMarginPercent: number;
  emailProvider?: string;
  emailSignature: string;
  commercialParameters: CommercialParameters;
}

export interface QuoteRequest {
  modality: Modality;
  origin: string;
  destination: string;
  originAddress?: string;
  destinationAddress?: string;
  cargoType: string;
  cargoLines?: PackagingLine[];
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
  sourceEnquiryId?: string;
}

export interface WorkflowContext {
  sourceType: 'ENQUIRY' | 'CLONE' | null;
  sourceId: string | null;
  payload: QuoteRequest | null;
}

export interface SharedProps {
  settings: AppSettings;
  userRole: UserRole;
  currentUser: User;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onLogActivity: (module: string, action: string, description: string) => void;
  onNavigate: (view: AppView) => void;
}

export interface ApprovalRequest {
  id: string;
  quoteId: string;
  requestedBy: string;
  requestedAt: string;
  margin: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: string;
}