import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin, Phone, Star, Navigation } from 'lucide-react';

export default function NearbyHospitals({ lat, lng }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const mapSrc = lat && lng
    ? `https://maps.google.com/maps?q=hospitals&center=${lat},${lng}&z=12&output=embed`
    : `https://maps.google.com/maps?q=hospitals%20near%20Hyderabad&z=12&output=embed`;

  return (
    <div className="space-y-4">
      {/* Map Section */}
      <section className="medi-card">
        <div className="medi-title text-sm mb-2 flex items-center gap-2">
          <Navigation size={16} className="text-sky-500" />
          Live Hospital Map
        </div>
        <iframe
          title="Nearby Hospitals"
          width="100%"
          height="250"
          style={{ border: 0, borderRadius: "12px" }}
          loading="lazy"
          src={mapSrc}
        />
      </section>

      {/* List Section */}
      <section className="medi-card">
        <div className="medi-title text-sm mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            Top Multispeciality Centers
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Within 30km · Rating 4.0+</span>
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
            Scanning for nearest multispeciality facilities...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No large multispeciality hospitals found in the 30km radius.
          </div>
        ) : (
          <div className="space-y-3">
            {hospitals.map((h, i) => (
              <div
                key={i}
                className="border border-slate-200 bg-white rounded-xl p-3 shadow-sm hover:border-emerald-300 transition-all group"
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
                    className="text-emerald-700 text-[11px] hover:text-emerald-800 flex items-center gap-1 font-bold"
                  >
                    <Phone size={12} /> Call
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + h.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 text-[11px] hover:text-sky-700 flex items-center gap-1 font-bold"
                  >
                    <Navigation size={12} /> Navigate
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
