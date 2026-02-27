import React, { useEffect, useState } from "react";
import API from "../api";

export default function PatientList({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  useEffect(() => {
    API.get("/patients")
      .then(res => setPatients(res.data))
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Patients</h3>
      <ul>
        {patients.map(p => (
          <li
            key={p.id}
            className="cursor-pointer p-2 rounded hover:bg-slate-800/50"
            onClick={() => onSelectPatient(p)}
          >
            {p.user_id ? `Patient ${p.user_id}` : `ID ${p.id}`}{" "}
            <div className="text-xs text-slate-400">
              contacts: {p.emergency_contacts?.join(", ") || "—"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
