'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Globe.gl to avoid SSR issues
const Globe = dynamic(() => import('globe.gl'), { 
  ssr: false,
  loading: () => <div className="flex h-screen w-screen items-center justify-center bg-black text-white">Loading Globe...</div>
});

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
  details: unknown;
}

export default function Home() {
  const [points, setPoints] = useState<GlobePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // Transform fatalities into points
        const fatalityPoints: GlobePoint[] = [];
        
        data.forEach((record: { lat?: number; lng?: number; killed: number; mineName: string; city: string; state: string }) => {
          if (record.lat && record.lng && record.killed > 0) {
            for (let i = 0; i < record.killed; i++) {
              // Add small random jitter so they don't perfectly overlap
              const jitter = 0.05;
              fatalityPoints.push({
                lat: record.lat + (Math.random() - 0.5) * jitter,
                lng: record.lng + (Math.random() - 0.5) * jitter,
                size: 0.1,
                color: 'red',
                label: `${record.mineName} (${record.city}, ${record.state})`,
                details: record
              });
            }
          }
        });
        
        setPoints(fatalityPoints);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 text-white pointer-events-none">
        <h1 className="text-2xl font-bold">Mining Fatalities Globe</h1>
        <p className="text-sm opacity-70">Each red dot represents one fatality</p>
        {loading && <p className="mt-2 animate-pulse">Loading data...</p>}
        {!loading && <p className="mt-1">{points.length} fatalities mapped</p>}
      </div>

      <GlobeWrapper points={points} />
      
      <div className="absolute bottom-4 right-4 z-10 text-white text-xs opacity-50">
        Data from Mining disasters.xlsx
      </div>
    </main>
  );
}

// Wrapper to handle globe.gl client-side
function GlobeWrapper({ points }: { points: GlobePoint[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>();

  useEffect(() => {
    if (globeRef.current) {
      // Configure globe
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
    }
  }, []);

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointsMerge={true}
        pointAltitude={0.01}
        pointLabel="label"
      />
    </div>
  );
}
