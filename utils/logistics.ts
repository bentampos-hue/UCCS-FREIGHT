import { CargoLine, Modality, JobStatus, IntakeData } from '../types';

export const generateReference = (modality: Modality, status: JobStatus, sequence: number): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const phaseMap: Record<JobStatus, string> = {
    DRAFT: 'DFT', INTAKE: 'INT', MARKET: 'MKT', QUOTES: 'QTE',
    AWARDED: 'AWD', SHIPMENT: 'TRN', COMPLETED: 'CLS', CANCELLED: 'CAN'
  };
  const seq = sequence.toString().padStart(6, '0');
  return `${(modality || 'SEA').substring(0, 3)}-${phaseMap[status] || 'DFT'}-${year}-${seq}`;
};

export const validatePhaseAdvance = (status: JobStatus, data: IntakeData): { ok: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!data) return { ok: false, errors: ["Data Protocol Missing"] };
  
  if (!data.shipperId) errors.push("Shipper Identity Required");
  if (!data.consigneeId) errors.push("Consignee Identity Required");
  if (!data.incoterms) errors.push("Incoterms Required");
  if (!data.origin) errors.push("Origin Hub Required");
  if (!data.destination) errors.push("Destination Hub Required");

  const lines = data.cargoLines || [];
  if (lines.length === 0) {
    errors.push("At least one Physical Payload Node is required");
  } else {
    // Dimensions are MANDATORY for all modes except SEA FCL or ROAD FTL (unless specific dims needed)
    const modeNeedsDims = (data.modality === 'AIR' || 
                           data.modality === 'COURIER' || 
                           (data.modality === 'SEA' && data.seaDetails?.type === 'LCL') ||
                           (data.modality === 'ROAD' && data.roadDetails?.truckType === 'LTL'));
    
    if (modeNeedsDims) {
      lines.forEach((line, idx) => {
        if (!line.length || !line.width || !line.height) {
          errors.push(`Dimensions mandatory for payload node #${idx + 1} in ${data.modality} mode`);
        }
      });
    }
  }

  if (!data.commodity) errors.push("Commodity Description Required");

  return { ok: errors.length === 0, errors };
};

export const calculateCargoMetrics = (lines: CargoLine[] | undefined, modality: Modality) => {
  const safeLines = lines || [];
  const totalActualWeight = safeLines.reduce((s, l) => s + ((l.weight || 0) * (l.qty || 0)), 0);
  const totalVolumeCbm = safeLines.reduce((s, l) => s + (((l.length || 0) * (l.width || 0) * (l.height || 0)) / 1000000 * (l.qty || 0)), 0);
  
  let chargeableUnits = totalActualWeight;
  if (modality === 'AIR') {
    const volWeight = (totalVolumeCbm * 1000000) / 6000;
    chargeableUnits = Math.max(totalActualWeight, volWeight);
  } else if (modality === 'SEA') {
    chargeableUnits = Math.max(totalVolumeCbm, totalActualWeight / 1000); 
  } else if (modality === 'COURIER') {
    const volWeight = (totalVolumeCbm * 1000000) / 5000;
    chargeableUnits = Math.max(totalActualWeight, volWeight);
  } else if (modality === 'ROAD') {
    // Default 1 CBM = 333kg for road standard, adjust as needed
    chargeableUnits = Math.max(totalActualWeight, totalVolumeCbm * 333); 
  }

  return { 
    totalActualWeight, 
    totalVolumeCbm, 
    chargeableUnits: Number(chargeableUnits.toFixed(2)) 
  };
};

export const calculateJobCompleteness = (data: IntakeData): number => {
  if (!data) return 0;
  let score = 0;
  
  if (data.shipperId && data.consigneeId && data.incoterms && data.currency) score += 25;
  
  const lines = data.cargoLines || [];
  if (lines.length > 0) {
    const hasWeights = lines.every(l => (l.weight || 0) > 0);
    const modeNeedsDims = (data.modality === 'AIR' || data.modality === 'COURIER' || (data.modality === 'SEA' && data.seaDetails?.type === 'LCL'));
    const hasDims = !modeNeedsDims || lines.every(l => l.length > 0 && l.width > 0 && l.height > 0);
    if (hasWeights && hasDims) score += 25;
  }
  
  if (data.origin && data.destination && data.readyDate) score += 25;
  
  if (data.commodity && (data.hsCode || data.isDG)) score += 25;
  else if (data.commodity) score += 15;

  return Math.min(score, 100);
};
