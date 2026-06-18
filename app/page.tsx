'use client';

import React, { useEffect, useState, useRef } from 'react';

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
        
        const fatalityPoints: GlobePoint[] = [];
        
        interface MergedRecord {
          lat?: number;
          lng?: number;
          killed: number;
          mineName?: string;
          city?: string;
          state?: string;
          date?: string;
          product?: string;
          type?: string;
          name?: string;
          occupation?: string;
          hazard?: string;
        }

        data.forEach((record: MergedRecord) => {
          if (record.lat && record.lng && record.killed > 0) {
            for (let i = 0; i < record.killed; i++) {
              const jitter = 0.05;
              
              // Build a rich HTML label for the tooltip
              let tooltipHtml = `<div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 4px; font-family: sans-serif; font-size: 12px; color: white;">`;
              
              if (record.name) {
                // Nanaimo format
                tooltipHtml += `<strong>${record.name}</strong><br/>`;
                if (record.occupation) tooltipHtml += `<b>Occupation:</b> ${record.occupation}<br/>`;
                if (record.hazard) tooltipHtml += `<b>Hazard:</b> ${record.hazard}<br/>`;
                if (record.mineName) tooltipHtml += `<b>Mine:</b> ${record.mineName}<br/>`;
                if (record.date) tooltipHtml += `<b>Date:</b> ${record.date}<br/>`;
              } else {
                // Excel format
                tooltipHtml += `<strong>${record.mineName || 'Unknown Mine'}</strong><br/>`;
                tooltipHtml += `<b>Location:</b> ${record.city}, ${record.state}<br/>`;
                if (record.date) tooltipHtml += `<b>Date:</b> ${record.date}<br/>`;
                if (record.product) tooltipHtml += `<b>Product:</b> ${record.product}<br/>`;
                if (record.type) tooltipHtml += `<b>Type:</b> ${record.type}<br/>`;
                // Add a note if this dot is one of many in a single incident
                if (record.killed > 1) tooltipHtml += `<em>Note: 1 of ${record.killed} fatalities in this incident</em><br/>`;
              }
              
              tooltipHtml += `</div>`;

              fatalityPoints.push({
                lat: record.lat + (Math.random() - 0.5) * jitter,
                lng: record.lng + (Math.random() - 0.5) * jitter,
                size: 0.1,
                color: 'red',
                label: tooltipHtml,
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

      <GlobeContainer points={points} />
      
      <div className="absolute bottom-4 right-4 z-10 text-white text-xs opacity-50">
        Data from Mining disasters.xlsx
      </div>
    </main>
  );
}

function GlobeContainer({ points }: { points: GlobePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let globeObj: any;
    const currentContainer = containerRef.current;

    async function initGlobe() {
      const Globe = (await import('globe.gl')).default;
      
      if (!currentContainer) return;

      // The TS definitions might expect `Globe()`, but sometimes `new Globe(...)` or just ignoring the type check is required for this specific vanilla JS library's typing quirks.
      // We will cast it to any first to bypass the strict type checker since the JS implementation is `Globe()(element)`.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GlobeConstructor = Globe as any;

      globeObj = GlobeConstructor()(currentContainer)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(points)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointRadius('size')
        .pointsMerge(true)
        .pointAltitude(0.01)
        .pointLabel('label');

      globeObj.controls().autoRotate = true;
      globeObj.controls().autoRotateSpeed = 0.5;
      
      globeInstance.current = globeObj;
    }

    initGlobe();

    const handleResize = () => {
      if (globeObj) {
        globeObj.width(window.innerWidth);
        globeObj.height(window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [points]);

  return <div ref={containerRef} className="w-full h-full" />;
}
