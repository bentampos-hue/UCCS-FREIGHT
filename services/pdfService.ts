import { jsPDF } from 'jspdf';
import { Job, QuoteVersion, AppSettings } from '../types';

export const pdfService = {
  generateQuotePDF: async (job: Job, quote: QuoteVersion, settings: AppSettings): Promise<string> => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Header Branding
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('UCCS LOGISTICS OFFER', margin, 25);
    doc.setFontSize(10);
    doc.text(`REFERENCE: ${job.reference}`, margin, 35);
    doc.text(`VALID UNTIL: ${quote.validUntil}`, 140, 35);

    y = 60;
    doc.setTextColor(30, 41, 59);
    
    // Section 1: Route DNA
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. ROUTING PROTOCOL', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Origin Node: ${job.intakeData.origin}`, margin, y);
    doc.text(`Destination Node: ${job.intakeData.destination}`, 110, y);
    y += 7;
    doc.text(`Modality: ${job.intakeData.modality}`, margin, y);
    doc.text(`Incoterms: ${job.intakeData.incoterms}`, 110, y);
    y += 15;

    // Section 2: Commodity & Compliance
    doc.setFont('helvetica', 'bold');
    doc.text('2. COMMODITY ARCHITECTURE', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Commodity: ${job.intakeData.commodity}`, margin, y);
    doc.text(`HS Code: ${job.intakeData.hsCode || 'Not Declared'}`, 110, y);
    y += 7;
    doc.text(`Regulatory: ${job.intakeData.isDG ? 'DANGEROUS GOODS' : 'NON-DG'}`, margin, y);
    doc.text(`Temp Control: ${job.intakeData.tempControl ? 'ACTIVE' : 'NONE'}`, 110, y);
    y += 15;

    // Section 3: Physical Payload Node Breakdown
    doc.setFont('helvetica', 'bold');
    doc.text('3. PHYSICAL PAYLOAD MATRIX', margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', margin, y);
    doc.text('QTY', margin + 15, y);
    doc.text('TYPE', margin + 30, y);
    doc.text('DIMENSIONS (CM)', margin + 60, y);
    doc.text('WEIGHT (KG)', margin + 110, y);
    doc.text('STACK', margin + 140, y);
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, 190, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    job.intakeData.cargoLines.forEach((line, i) => {
      doc.text(`${i+1}`, margin, y);
      doc.text(`${line.qty}`, margin + 15, y);
      doc.text(`${line.type}`, margin + 30, y);
      doc.text(`${line.length}x${line.width}x${line.height}`, margin + 60, y);
      doc.text(`${line.weight}`, margin + 110, y);
      doc.text(`${line.isStackable ? 'YES' : 'NO'}`, margin + 140, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    y += 10;
    // Section 4: Pricing Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4. COMMERCIAL SETTLEMENT', margin, y);
    y += 10;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, 170, 30, 'F');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(`TOTAL PRICE: ${job.intakeData.currency} ${quote.sellPrice.toLocaleString()}`, margin + 10, y + 15);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`All-inclusive service rate excluding statutory duties and taxes.`, margin + 10, y + 23);
    
    y += 45;
    // Section 5: Terms
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('5. LEGAL GOVERNANCE & TERMS', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const terms = doc.splitTextToSize(`${settings.legalTerms.general}\n\n${job.intakeData.modality === 'SEA' ? settings.legalTerms.sea : settings.legalTerms.air}`, 170);
    doc.text(terms, margin, y);

    return doc.output('bloburl').toString();
  },

  downloadFile: (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
