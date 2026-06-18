import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

export interface FatalityRecord {
  date: string;
  mineName: string;
  city: string;
  state: string;
  killed: number;
  product: string;
  type: string;
  lat?: number;
  lng?: number;
}

export interface GeocodedLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export function getRawData(): FatalityRecord[] {
  const filePath = path.join(process.cwd(), 'Mining disasters.xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Header: ['Date', 'Mine Name', 'City', 'State', 'Killed', 'Product', 'Accident Type', 'Mine Type', 'Mining Sector']
  const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];
  
  return data.map(row => ({
    date: row['Date'],
    mineName: row['Mine Name'],
    city: row['City'],
    state: row['State'],
    killed: parseInt(row['Killed'] || '0') || 0,
    product: row['Product'],
    type: row['Accident Type']
  }));
}
