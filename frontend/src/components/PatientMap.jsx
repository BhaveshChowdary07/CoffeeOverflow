import { useEffect, useRef } from 'react'

export default function PatientMap({ lat, lng }) {
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!lat || !lng) return
    if (!window.google) return

    const position = {
      lat: Number(lat),
      lng: Number(lng)
    }

    // Create map once
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: position,
        zoom: 15,
        mapTypeId: 'roadmap',
      })

      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        title: 'Patient live location',
      })
    } else {
      // Update position
      markerRef.current.setPosition(position)
      mapRef.current.setCenter(position)
    }
  }, [lat, lng])

  if (!lat || !lng) {
    return (
      <div className="text-xs text-slate-500">
        Patient live location not available yet.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-64 rounded-xl border border-slate-700"
    />
  )
}


// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

// // Fix marker icon issue in React
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
// });

// export default function PatientMap({ lat, lng }) {

//   if (!lat || !lng) {
//     return (
//       <div className="text-xs text-slate-500">
//         Location not available yet.
//       </div>
//     );
//   }

//   return (
//     <MapContainer
//       key={`${lat}-${lng}`}   // forces refresh when location changes
//       center={[lat, lng]}
//       zoom={15}
//       style={{
//         height: "300px",
//         width: "100%",
//         borderRadius: "12px"
//       }}
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       <Marker position={[lat, lng]}>
//         <Popup>
//           Live Patient Location
//         </Popup>
//       </Marker>
//     </MapContainer>
//   );
// }
