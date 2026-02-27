import EmergencyMap from "./EmergencyMap";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE;

export default function EmergencyPanel({ alert, token }) {
  const acknowledge = async () => {
    await axios.post(
      `${API}/alerts/${alert.id}/ack`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    alert.acknowledged = true;
  };

  return (
    <div className="bg-red-700 text-white p-4 rounded mt-4">
      <h2 className="text-xl font-bold">🚨 Emergency Escalation</h2>

      <p><b>Patient:</b> {alert.patient_name}</p>
      <p><b>Location:</b> {alert.address}</p>

      <p className="mt-2">
        <b>Nearest Hospital:</b> {alert.hospital.name}
      </p>
      <p>
        <b>Distance:</b> {alert.hospital.distance_km || "Nearby"} km
      </p>

      <div className="mt-2">
        📞 Family Call: <b>TRIGGERED</b><br />
        🏥 Hospital Call: <b>TRIGGERED (DEMO MODE)</b>
      </div>

      {!alert.acknowledged && (
        <button
          onClick={acknowledge}
          className="mt-3 bg-black px-4 py-2 rounded"
        >
          Acknowledge Alert
        </button>
      )}

      <div className="mt-4">
        <EmergencyMap
          patient={alert.patient_location}
          hospital={alert.hospital}
        />
      </div>
    </div>
  );
}
