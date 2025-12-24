export const csvHelper = {
  downloadTemplate: (type: 'CUSTOMERS' | 'VENDORS') => {
    let headers = "";
    if (type === 'CUSTOMERS') {
      headers = "companyName,tier,primaryContactName,primaryContactEmail,primaryContactPhone,street,city,country,zip\nGlobal Logistics,VIP,John Doe,john@example.com,+1234567,123 Port St,New York,USA,10001";
    } else {
      headers = "name,tier,contractExpiry,lanes,apiReady,primaryContactName,primaryContactEmail,primaryContactPhone\nOcean Carrier Inc,Premium,2026-12-31,\"Shanghai->LA, RTM->NY\",true,Jane Smith,jane@ocean.com,+987654";
    }
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FreightFlow_${type}_Template.csv`;
    link.click();
  },

  parseCSV: (csvText: string): any[] => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Simple CSV split (handles basic quotes)
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!values || values.length < headers.length) continue;

      const obj: any = {};
      headers.forEach((header, index) => {
        let val = values[index].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        obj[header] = val;
      });
      data.push(obj);
    }
    return data;
  }
};