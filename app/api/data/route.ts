import { NextResponse } from 'next/server';
import { getRawData, GeocodedLocation } from '@/lib/data-utils';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rawData = getRawData();
    
    // Try to load geocoded locations
    const geocodedMap: Record<string, { lat: number, lng: number }> = {};
    
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
