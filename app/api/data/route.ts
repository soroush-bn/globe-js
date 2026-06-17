import { NextResponse } from 'next/server';
import { getRawData, FatalityRecord, GeocodedLocation } from '@/lib/data-utils';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rawData = getRawData();
    
    // Try to load geocoded locations
    const geocodePath = path.join(process.cwd(), 'public', 'geocoded_locations.json');
    let geocodedMap: Record<string, { lat: number, lng: number }> = {};
    
    if (fs.existsSync(geocodePath)) {
      const geocodeData: GeocodedLocation[] = JSON.parse(fs.readFileSync(geocodePath, 'utf-8'));
      geocodeData.forEach(loc => {
        geocodedMap[`${loc.city}, ${loc.state}`.toLowerCase()] = { lat: loc.lat, lng: loc.lng };
      });
    }

    // Merge data
    const mergedData = rawData.map(record => {
      const key = `${record.city}, ${record.state}`.toLowerCase();
      const coords = geocodedMap[key];
      return {
        ...record,
        lat: coords?.lat,
        lng: coords?.lng
      };
    });

    return NextResponse.json(mergedData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
