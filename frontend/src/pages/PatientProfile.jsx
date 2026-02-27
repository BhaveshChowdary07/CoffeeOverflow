import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function PatientProfile(){
  const token = localStorage.getItem('mw_token')
  const [profile, setProfile] = useState(null)
  const [contacts, setContacts] = useState(['','',''])

  useEffect(()=>{
    if(!token) return
    axios.get('http://localhost:8000/users/me', { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>{
        // find patient record
        axios.get('http://localhost:8000/patients', { headers: { Authorization: `Bearer ${token}` }})
          .then(rr=>{
            const p = rr.data.find(x => x.user?.username === r.data.username || x.user_id === r.data.id)
            if(p){
              setProfile(p)
              const c = p.emergency_contacts ? JSON.parse(p.emergency_contacts) : ['','','']
              setContacts([c[0]||'', c[1]||'', c[2]||''])
            }
          })
      }).catch(()=>{})
  },[])

  const save = async () => {
    if(!profile) return
    const arr = contacts.filter(Boolean).slice(0,3)
    await axios.put(`http://localhost:8000/patients/${profile.id}/contacts`, { contacts: arr }, { headers: { Authorization: `Bearer ${token}` }})
    alert('Saved')
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl mb-4">My Profile</h2>
      <div className="p-4 bg-slate-900 rounded space-y-3">
        <div><strong>Name:</strong> {profile?.user?.full_name || profile?.user?.username}</div>
        <div><strong>Patient ID:</strong> {profile?.id}</div>

        <div>
          <label className="block mb-1 font-semibold">Emergency Contacts (up to 3)</label>
          {contacts.map((c,i)=>(
            <input key={i} value={contacts[i]} onChange={e=> {
              const cp = [...contacts]; cp[i]=e.target.value; setContacts(cp)
            }} placeholder={`Contact ${i+1}`} className="w-full p-2 rounded bg-slate-800 mb-2"/>
          ))}
          <div className="flex gap-2">
            <button onClick={save} className="p-2 rounded bg-emerald-500">Save contacts</button>
          </div>
        </div>
      </div>
    </div>
  )
}
