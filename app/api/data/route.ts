import { NextResponse } from 'next/server';
import { getRawData, GeocodedLocation } from '@/lib/data-utils';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rawData = getRawData();
    
    // Try to load geocoded locations
    const geocodedMap: Record<string, { lat: number, lng: number }> = {};
    
    // Add manual geocode for Nanaimo, BC
    geocodedMap['nanaimo, bc'] = { lat: 49.1659, lng: -123.9401 };
    
    try {
      const geocodePath = path.join(process.cwd(), 'public', 'geocoded_locations.json');
      if (fs.existsSync(geocodePath)) {
        // Inlining path.join in readFileSync helps Vercel's dependency tracer
        const fileContent = fs.readFileSync(path.join(process.cwd(), 'public', 'geocoded_locations.json'), 'utf-8');
        const geocodeData: GeocodedLocation[] = JSON.parse(fileContent);
        geocodeData.forEach(loc => {
          geocodedMap[`${loc.city}, ${loc.state}`.toLowerCase()] = { lat: loc.lat, lng: loc.lng };
        });
      }
    } catch (e) {
      console.error('Error loading geocoded locations:', e);
    }

    // Load Nanaimo data
    interface NanaimoRecord {
      name: string;
      occupation: string;
      hazard: string;
      mineName: string;
      date: string;
      city: string;
      state: string;
      killed?: number;
      lat?: number;
      lng?: number;
    }
    
    let nanaimoData: NanaimoRecord[] = [];
    try {
      const nanaimoPath = path.join(process.cwd(), 'public', 'nanaimo_data.json');
      if (fs.existsSync(nanaimoPath)) {
        const nanaimoContent = fs.readFileSync(path.join(process.cwd(), 'public', 'nanaimo_data.json'), 'utf-8');
        nanaimoData = JSON.parse(nanaimoContent).map((record: NanaimoRecord) => ({
          ...record,
          killed: 1 // Since each record is one person
        }));
      }
    } catch (e) {
      console.error('Error loading nanaimo data:', e);
    }

    // Merge data from Excel
    const mergedExcelData = rawData.map(record => {
      const key = `${record.city}, ${record.state}`.toLowerCase();
      const coords = geocodedMap[key];
      return {
        ...record,
        lat: coords?.lat,
        lng: coords?.lng
      };
    });

    // Merge data from Nanaimo
    const mergedNanaimoData = nanaimoData.map(record => {
      const key = `${record.city}, ${record.state}`.toLowerCase();
      const coords = geocodedMap[key];
      return {
        ...record,
        lat: coords?.lat,
        lng: coords?.lng
      };
    });

    return NextResponse.json([...mergedExcelData, ...mergedNanaimoData]);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
