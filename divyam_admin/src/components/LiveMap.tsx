"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface LiveMapProps {
  center: [number, number];
  zoom: number;
  records: any[];
  selectedRecordId: string | null;
  hospitalCenter?: [number, number];
  geofenceRadius?: number;
}

export function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  const R = 6371e3; // metres
  const φ1 = coords1[0] * Math.PI / 180;
  const φ2 = coords2[0] * Math.PI / 180;
  const Δφ = (coords2[0] - coords1[0]) * Math.PI / 180;
  const Δλ = (coords2[1] - coords1[1]) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in metres
}

export default function LiveMap({ 
  center, 
  zoom, 
  records, 
  selectedRecordId,
  hospitalCenter = [28.024511, 73.312445],
  geofenceRadius = 200
}: LiveMapProps) {
  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Geo-Fence Circle */}
        <Circle 
          center={hospitalCenter} 
          pathOptions={{ color: '#185FA5', fillColor: '#185FA5', fillOpacity: 0.1 }} 
          radius={geofenceRadius} 
        />

        <RecenterMap center={center} zoom={zoom} />

        {/* Employee Pins */}
        {records.map((record) => {
          const lat = record.check_in_lat;
          const lng = record.check_in_lng;
          if (!lat || !lng) return null;
          
          const distance = haversineDistance(hospitalCenter, [lat, lng]);
          const isViolation = distance > geofenceRadius;
          const isSelected = selectedRecordId === record.id;

          return (
            <Marker 
              key={record.id} 
              position={[lat, lng]} 
              icon={isSelected ? activeIcon : customIcon}
            >
              <Popup>
                <div className="text-sm min-w-[150px]">
                  <div className="font-bold text-base text-slate-900 mb-1">
                    {record.employee?.full_name || record.employees?.full_name || 'Staff Member'}
                  </div>
                  <div className="text-slate-500 mb-2">
                    {record.employee?.departments?.name || record.employees?.departments?.name || record.employee?.dept?.name || record.dept || 'Staff'}
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Check-In:</strong> {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '—'}
                  </div>
                  {isViolation && (
                    <div className="text-red-600 font-bold mt-2 text-xs bg-red-50 p-1.5 rounded border border-red-200 flex items-center gap-1">
                      ⚠️ Outside Geo-Fence ({Math.round(distance)}m away)
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
