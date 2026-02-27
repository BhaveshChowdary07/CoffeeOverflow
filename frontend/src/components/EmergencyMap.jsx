import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";

export default function EmergencyMap({ patient, hospital }) {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        zoom={14}
        center={{ lat: patient.lat, lng: patient.lng }}
        mapContainerStyle={{ width: "100%", height: "300px" }}
      >
        <Marker
          position={{ lat: patient.lat, lng: patient.lng }}
          label="P"
        />
        <Marker
          position={{ lat: hospital.lat, lng: hospital.lng }}
          label="H"
        />
      </GoogleMap>
    </LoadScript>
  );
}
