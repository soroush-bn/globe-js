'use client';

import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  details: unknown;
}

export default function Home() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        const fatalityPoints: MapPoint[] = [];
        
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
              // Add a bit of jitter to separate overlapping points
              const jitterLat = (Math.random() - 0.5) * 0.05;
              const jitterLng = (Math.random() - 0.5) * 0.05;
              
              // Build a rich HTML label for the tooltip
              let tooltipHtml = `<div style="font-family: sans-serif; font-size: 12px; color: #333; max-width: 250px;">`;
              
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
                lat: record.lat + jitterLat,
                lng: record.lng + jitterLng,
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
      <div className="absolute top-4 left-4 z-10 text-white pointer-events-none drop-shadow-md">
        <h1 className="text-2xl font-bold">Mining Fatalities Map</h1>
        <p className="text-sm opacity-90">Each red dot represents one fatality</p>
        {loading && <p className="mt-2 animate-pulse">Loading data...</p>}
        {!loading && <p className="mt-1">{points.length} fatalities mapped</p>}
      </div>

      <MapLibreContainer points={points} />
      
      <div className="absolute bottom-8 left-4 z-10 text-white text-[10px] leading-relaxed opacity-60 max-w-4xl pointer-events-none drop-shadow-md pr-4">
        <p>Data provided by the Centers for Disease Control and Prevention (CDC). Reference to specific data elements, datasets, or web tools does not constitute or imply its endorsement, recommendation, or favoring by the U.S. Government, the Department of Health and Human Services, or the CDC.</p>
        <p className="mt-1">Historical data and records courtesy of the Nanaimo Community Archives, Nanaimo, British Columbia</p>
      </div>
    </main>
  );
}

function MapLibreContainer({ points }: { points: MapPoint[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return; // initialize map only once
    if (!mapContainer.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-98.5795, 39.8283], // Center over North America
      zoom: 3,
      minZoom: 2,
    });

    mapRef.current.on('load', () => {
      if (!mapRef.current) return;

      mapRef.current.addSource('fatalities', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapRef.current.addLayer({
        id: 'fatalities-layer',
        type: 'circle',
        source: 'fatalities',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 2,
            5, 4,
            10, 6
          ],
          'circle-color': '#ff0000',
          'circle-opacity': 0.8,
          'circle-stroke-width': 0.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px'
      });

      mapRef.current.on('mouseenter', 'fatalities-layer', (e) => {
        if (!mapRef.current) return;
        mapRef.current.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          if (feature.geometry.type === 'Point') {
            // Using unknown to bypass strict any checks while accessing coordinates
            const geom = feature.geometry as unknown as { coordinates: [number, number] };
            const coordinates = [...geom.coordinates] as [number, number];
            const description = feature.properties?.label;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup.setLngLat(coordinates)
              .setHTML(description)
              .addTo(mapRef.current);
          }
        }
      });

      mapRef.current.on('mouseleave', 'fatalities-layer', () => {
        if (!mapRef.current) return;
        mapRef.current.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const geojson = {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        },
        properties: {
          label: p.label
        }
      }))
    };

    const source = mapRef.current.getSource('fatalities');
    if (source && source.type === 'geojson') {
      // @ts-expect-error - geojson conforms to the required interface
      (source as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      mapRef.current.once('load', () => {
        const s = mapRef.current?.getSource('fatalities');
        if (s && s.type === 'geojson') {
          // @ts-expect-error - geojson conforms to the required interface
          (s as maplibregl.GeoJSONSource).setData(geojson);
        }
      });
    }
  }, [points]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
