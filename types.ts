
export enum AppView {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  PROJECT_CENTER = 'project_center',
  CRM = 'crm',
  VENDORS = 'vendors',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  AUDIT = 'audit'
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'SALES' | 'FINANCE' | 'VIEWER' | 'MANAGER' | 'OPS';
export type Modality = 'SEA' | 'AIR' | 'COURIER' | 'ROAD';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'AED';
export type JobStatus = 'DRAFT' | 'INTAKE' | 'MARKET' | 'QUOTES' | 'AWARDED' | 'SHIPMENT' | 'COMPLETED' | 'CANCELLED';
export type PackagingType = 'PALLET' | 'BOX' | 'CRATE' | 'LOOSE' | 'CONTAINER';

export interface Permission {
  id: string;
  label: string;
  key: 'MANAGE_USERS' | 'DELETE_ALL' | 'EDIT_SETTINGS' | 'OVERRIDE_PHASE' | 'APPROVE_DISCOUNT' | 'VIEW_AUDIT' | 'MANAGE_API' | 'BULK_IMPORT';
}

export interface InternalMessage {
  id: string;
  timestamp: string;
  sender: string;
  recipientIds: string[];
  subject: string;
  body: string;
  status: 'SENT' | 'VIEWED' | 'REPLIED';
}

export interface CommunicationMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'DRAFT' | 'QUEUED' | 'SENT' | 'FAILED';
  type: 'RFQ' | 'QUOTE' | 'GENERAL';
  operatorId: string;
  attachments?: string[]; 
}

export interface AppSettings {
  companyName: string;
  baseCurrency: Currency;
  exchangeRates: Record<Currency, number>;
  defaultMarginPercent: number;
  minMarginThreshold: number;
  emailSignature: string;
  numbering: { jobPrefix: string; accountPrefix: string; vendorPrefix: string };
  legalTerms: {
    version: string;
    general: string;
    air: string;
    sea: string;
    courier: string;
    lastUpdated: string;
  };
  commercialParameters: {
    sea: { lclMinCbm: number; wmRule: number; docFee: number; defaultLocalCharges: number };
    air: { volumetricFactor: number; minChargeableWeight: number; defaultSurcharges: number };
  };
}

export interface CargoLine {
  id: string;
  type: PackagingType;
  qty: number;
  length: number;
  width: number;
  height: number;
  weight: number; 
  description: string;
  isStackable: boolean;
  notes?: string;
}

export interface IntakeData {
  modality: Modality;
  origin: string;
  destination: string;
  pickupAddress: string;
  deliveryAddress: string;
  incoterms: string;
  readyDate: string;
  validityDate?: string;
  commodity: string;
  hsCode?: string;
  cargoLines: CargoLine[];
  cargoValue: number;
  currency: Currency;
  isDG: boolean;
  dgDetails?: { un: string; class: string; pg: string };
  tempControl: boolean;
  tempRange?: string;
  handlingNotes: string;
  insuranceRequested: boolean;
  shipperId: string;
  consigneeId: string;
  transitPriority: string;
  
  seaDetails?: { type: 'FCL' | 'LCL'; containerType: string; vessel?: string; cutoff?: string };
  airDetails?: { airportOrigin: string; airportDest: string; airline?: string; chargeableWeightLogic: 'KG' | 'WM' };
  courierDetails?: { serviceLevel: 'Express' | 'Economy'; accountNo?: string; isDoorToDoor: boolean };
  roadDetails?: { truckType: 'FTL' | 'LTL'; vehicleType: string; isTemperatureControlled: boolean };

  customsClearance: boolean;
  lastMileDelivery: boolean;
  packingRequired: boolean;
}

export interface VendorBid {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: string;
  transitTime: number;
  validityDate: string;
  receivedVia: string;
  receivedAt: string;
  freeTime: number;
  isAwarded: boolean;
}

export interface QuoteLine {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  type: 'FREIGHT' | 'SURCHARGE' | 'LOCAL' | 'DUTY';
}

export interface QuoteVersion {
  id: string;
  version: number;
  sellPrice: number;
  buyPrice: number;
  margin: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED';
  validUntil: string;
  createdAt: string;
  buySource?: string;
  currency?: Currency;
  inclusions: string[];
  exclusions: string[];
  createdBy?: string;
  lines?: QuoteLine[];
  transitEstimate?: number;
  serviceLevel?: string;
}

export interface Job {
  id: string;
  reference: string; 
  status: JobStatus;
  intakeData: IntakeData;
  invitedVendorIds: string[];
  messages: InternalMessage[];
  completenessScore: number;
  quoteVersions: QuoteVersion[];
  vendorBids: VendorBid[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  shipmentDetails?: Shipment;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  password?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  country: string;
  zip?: string;
  building?: string;
  poBox?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  tier: 'Regular' | 'VIP';
  contacts: Contact[];
  addresses: Address[];
  notes?: string;
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
  capabilities: Modality[];
}

export interface SharedProps {
  settings: AppSettings;
  userRole: UserRole;
  currentUser: User;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onNavigate: (view: AppView, params?: any) => void;
  hasPermission: (key: Permission['key']) => boolean;
  onLogActivity: (message: string, action: string, type: string, id: string) => void;
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

export interface Quotation {
  id: string;
  customerName: string;
  origin: string;
  destination: string;
  modality: Modality;
  amount: number;
  buyRate: number;
  currency: Currency;
  margin: number;
  status: 'SENT' | 'CONFIRMED' | 'PENDING_APPROVAL' | 'LOST' | 'CANCELLED';
  date: string;
  validUntil: string;
  cargoType?: string;
}

export interface Shipment {
  id: string;
  status: string;
  origin: string;
  destination: string;
  modality: Modality;
  trackingNumber?: string;
  carrier?: string;
  etd?: string;
  eta?: string;
  milestones: {
    date: string;
    status: string;
    notes?: string;
  }[];
}

export interface PortalToken {
  token: string;
  entityId: string;
  entityType: 'bid' | 'quote' | 'track';
  createdAt: string;
  expiry: string;
  recipientEmail: string;
}

export interface DraftState {
  formId: string;
  data: any;
  lastSaved: string;
}

// Fixed: Added VendorEnquiry interface to resolve export errors
export interface VendorEnquiry {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  modality: Modality;
  commodity: string;
  equipmentCount: number;
  equipmentType: string;
  incoterms: string;
  currency: Currency;
  status: string;
  bids: VendorBid[];
}
