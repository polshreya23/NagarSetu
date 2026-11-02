import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Complaint, SeverityLevel } from '../types/index.ts';

interface InteractiveMapProps {
  complaints?: Complaint[];
  mode?: 'view' | 'pick';
  selectedLocation?: { lat: number; lng: number };
  onLocationSelect?: (lat: number, lng: number) => void;
  onSelectComplaint?: (complaint: Complaint) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  Low: '#10b981', // Emerald
  Medium: '#f59e0b', // Amber
  High: '#f97316', // Orange
  Critical: '#ef4444', // Red
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  complaints = [],
  mode = 'view',
  selectedLocation,
  onLocationSelect,
  onSelectComplaint,
  height = '500px',
  center = [18.5204, 73.8567], // Pune center
  zoom = 12,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map clicks for 'pick' mode
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (mode === 'pick' && onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Pick Mode Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (mode === 'pick') {
      if (selectedLocation) {
        const customPin = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="background-color: #1e3a8a; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid white; transform: translate(-50%, -50%);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        if (pickMarkerRef.current) {
          pickMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
        } else {
          const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
            icon: customPin,
            draggable: true,
          }).addTo(map);

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            if (onLocationSelect) {
              onLocationSelect(pos.lat, pos.lng);
            }
          });

          pickMarkerRef.current = marker;
        }

        map.panTo([selectedLocation.lat, selectedLocation.lng]);
      }
    } else {
      if (pickMarkerRef.current) {
        pickMarkerRef.current.remove();
        pickMarkerRef.current = null;
      }
    }
  }, [mode, selectedLocation, onLocationSelect]);

  // Handle View Mode Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer || mode !== 'view') return;

    markersLayer.clearLayers();

    complaints.forEach((c) => {
      const color = SEVERITY_COLORS[c.severity] || '#3b82f6';
      const statusBg =
        c.status === 'Resolved'
          ? 'bg-emerald-100 text-emerald-800'
          : c.status === 'In Progress'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-amber-100 text-amber-800';

      const customMarker = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${color}; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.35); border: 2.5px solid white; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
            <span style="font-size: 11px; font-weight: 800; font-family: monospace;">${c.priorityScore}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker([c.location.lat, c.location.lng], { icon: customMarker });

      const popupHtml = `
        <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: #475569; letter-spacing: 0.5px;">${c.id}</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background-color: ${
              c.status === 'Resolved' ? '#d1fae5' : c.status === 'In Progress' ? '#dbeafe' : '#fef3c7'
            }; color: ${
              c.status === 'Resolved' ? '#065f46' : c.status === 'In Progress' ? '#1e40af' : '#92400e'
            };">${c.status}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">${c.title}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">📍 ${c.location.address}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px; background-color: #f8fafc; border-radius: 6px; margin-bottom: 8px;">
            <span style="font-size: 11px; color: #334155;"><strong>Priority:</strong> ${c.priorityScore}/100 (${c.priorityLevel})</span>
            <span style="font-size: 11px; font-weight: 600; color: ${color};">${c.severity} Severity</span>
          </div>
          <button id="view-btn-${c.id}" style="width: 100%; background-color: #0f172a; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; text-align: center;">
            Inspect Complaint
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-btn-${c.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectComplaint) {
              onSelectComplaint(c);
            }
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [complaints, mode, onSelectComplaint]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50">
      <div ref={mapContainerRef} style={{ height }} className="w-full" />

      {mode === 'pick' && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-2 rounded-lg shadow-md text-xs font-medium text-slate-700 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <span>Click on map or drag pin to choose precise incident location</span>
        </div>
      )}

      {mode === 'view' && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 p-2.5 rounded-lg shadow-md text-[11px] font-medium text-slate-700 flex flex-wrap gap-3 items-center">
          <span className="font-semibold text-slate-900">Priority Score:</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span>Critical (75+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
            <span>High (50-74)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span>Medium (30-49)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>Low (&lt;30)</span>
          </div>
        </div>
      )}
    </div>
  );
};
