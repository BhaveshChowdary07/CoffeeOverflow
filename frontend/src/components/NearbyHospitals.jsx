import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MapPin, Phone, Star, Navigation, LocateFixed } from 'lucide-react';

export default function NearbyHospitals({ lat, lng }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // 1. Fetch Hospitals from Backend
  useEffect(() => {
    if (!lat || !lng) return;

    setLoading(true);
    axios.get(`http://localhost:8000/hospitals/nearest?lat=${lat}&lng=${lng}`)
      .then(res => {
        setHospitals(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch live hospitals:", err);
        setLoading(false);
      });
  }, [lat, lng]);

  // 2. Render Google Map and Markers
  useEffect(() => {
    if (!lat || !lng || !window.google) return;

    const userPos = { lat: Number(lat), lng: Number(lng) };

    // Initialize Map if not already done
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: userPos,
        zoom: 13,
        mapId: 'DEMO_MAP_ID', // Optional: for more modern styling
        styles: [
          {
            "featureType": "poi.business",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi.medical",
            "stylers": [{ "visibility": "on" }]
          }
        ]
      });
    } else {
      mapRef.current.setCenter(userPos);
    }

    // 3. Update User Marker ("Me")
    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userPos,
        map: mapRef.current,
        title: "You are here",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: "white",
        },
        zIndex: 1000
      });
    } else {
      userMarkerRef.current.setPosition(userPos);
    }

    // 4. Update Hospital Markers
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(userPos);

    hospitals.forEach(h => {
      const pos = { lat: h.lat, lng: h.lng };
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: h.name,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; font-family: sans-serif;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${h.name}</div>
            <div style="font-size: 12px; color: #64748b;">${h.rating} ⭐ (${h.user_ratings_total} reviews)</div>
            <div style="font-size: 11px; margin-top: 5px;">${h.distance_km} km away</div>
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    // Fit map to show all markers if there are hospitals
    if (hospitals.length > 0) {
      mapRef.current.fitBounds(bounds);
    }

  }, [lat, lng, hospitals]);

  return (
    <div className="space-y-4">
      {/* Map Section */}
      <section className="medi-card">
        <div className="medi-title text-sm mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-sky-500" />
            Interactive Health Map
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> You</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Hospitals</span>
          </div>
        </div>

        <div
          ref={containerRef}
          className="w-full h-[300px] rounded-2xl border border-slate-200 overflow-hidden shadow-inner"
        />

        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 italic">
          <LocateFixed size={12} /> Live tracking enabled. All top multispeciality centers within 30km are pinned.
        </div>
      </section>

      {/* List Section */}
      <section className="medi-card">
        <div className="medi-title text-sm mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            Top Multispeciality Centers
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Ranked by Rating & Distance</span>
        </div>

        {loading ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs text-slate-500">Scanning satellite data for medical centers...</div>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No large multispeciality hospitals found in the 30km radius.
          </div>
        ) : (
          <div className="space-y-3">
            {hospitals.map((h, i) => (
              <div
                key={i}
                className="border border-slate-200 bg-white rounded-xl p-3 shadow-sm hover:border-emerald-400 transition-all group cursor-pointer"
                onClick={() => {
                  mapRef.current.setCenter({ lat: h.lat, lng: h.lng });
                  mapRef.current.setZoom(16);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition">
                    {h.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                    <Star size={10} fill="currentColor" /> {h.rating} ({h.user_ratings_total})
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                  <MapPin size={12} className="text-slate-400" /> {h.address}
                  <span className="ml-auto font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded">{h.distance_km} km away</span>
                </div>

                <div className="mt-2 flex gap-4 pt-2 border-t border-slate-50">
                  <a
                    href={`tel:${h.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-700 text-[11px] hover:text-emerald-800 flex items-center gap-1 font-bold"
                  >
                    <Phone size={12} /> Call Hospital
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + h.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sky-600 text-[11px] hover:text-sky-700 flex items-center gap-1 font-bold"
                  >
                    <Navigation size={12} /> Open in Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
