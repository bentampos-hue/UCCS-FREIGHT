
import { z } from 'zod';

export const cargoLineSchema = z.object({
  id: z.string(),
  type: z.enum(['PALLET', 'BOX', 'CRATE', 'LOOSE', 'CONTAINER']),
  qty: z.number().min(1, "Quantity required"),
  length: z.number().min(1, "Length required"),
  width: z.number().min(1, "Width required"),
  height: z.number().min(1, "Height required"),
  weight: z.number().min(0.1, "Weight required"),
  description: z.string().min(2, "Description too short")
});

export const intakeSchema = z.object({
  modality: z.enum(['SEA', 'AIR']),
  origin: z.string().min(2, "Origin required"),
  destination: z.string().min(2, "Destination required"),
  pickupAddress: z.string().min(5, "Pickup details required"),
  deliveryAddress: z.string().min(5, "Delivery details required"),
  incoterms: z.string().min(3, "Incoterms required"),
  readyDate: z.string().min(1, "Ready date required"),
  commodity: z.string().min(2, "Commodity required"),
  cargoLines: z.array(cargoLineSchema).min(1, "At least one cargo line required"),
  cargoValue: z.number().min(1, "Cargo value required"),
  shipperId: z.string().min(1, "Shipper required"),
  consigneeId: z.string().min(1, "Consignee required")
});

export const manualBidSchema = z.object({
  vendorName: z.string().min(2, "Vendor name required"),
  amount: z.number().min(1, "Bid amount must be > 0"),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CNY', 'AED']),
  transitTime: z.number().min(1, "Transit time required"),
  validityDate: z.string().min(1, "Validity date required"),
  receivedVia: z.enum(['PORTAL', 'EMAIL', 'WHATSAPP', 'PHONE', 'MANUAL'])
});

export const quoteSchema = z.object({
  buyPrice: z.number().min(0),
  sellPrice: z.number().min(1, "Sell price must be > 0"),
  validUntil: z.string().min(1, "Validity required")
});
