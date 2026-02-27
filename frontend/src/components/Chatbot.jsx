import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, X, Calendar, Clock, MapPin,
    ChevronRight, RotateCcw, Star, Phone, Building2,
    Stethoscope, Send, CheckCircle, LocateFixed
} from 'lucide-react';
import API from '../api';

const STORAGE_KEY = 'mw_chat_session_v2';

const SPECIALTIES = [
    { label: 'Cardiology', emoji: '❤️' },
    { label: 'Oncology', emoji: '🎗️' },
    { label: 'Orthopedics', emoji: '🦴' },
    { label: 'Neurology', emoji: '🧠' },
    { label: 'Pulmonology', emoji: '🫁' },
    { label: 'Gastroenterology', emoji: '🏥' },
    { label: 'Nephrology', emoji: '💧' },
    { label: 'General Medicine', emoji: '🩺' },
];

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('main');
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    const [user, setUser] = useState(null);
    const [myLocation, setMyLocation] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [customSpecialty, setCustomSpecialty] = useState('');
    const scrollRef = useRef(null);

    // ── load user + location ─────────────────────────────────────────────────
    useEffect(() => {
        API.get('/users/me').then(r => setUser(r.data)).catch(() => { });

        navigator.geolocation?.getCurrentPosition(
            pos => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setMyLocation(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    // ── restore session ───────────────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const d = JSON.parse(saved);
                setMessages(d.messages || []);
                setStep(d.step || 'main');
                setSelectedHospital(d.selectedHospital || null);
                setSelectedSpecialty(d.selectedSpecialty || '');
                setSelectedSlot(d.selectedSlot || null);
                setSymptoms(d.symptoms || '');
                if ((d.messages || []).length > 1) {
                    setMessages(prev => [...prev,
                    { role: 'bot', text: '👋 Welcome back! Shall we continue where we left off?' }
                    ]);
                }
            } catch (_) { }
        } else {
            // fresh greeting
            setMessages([{ role: 'bot', text: "👋 Hi there! I'm your MediWatch Health Assistant. How can I help you today?" }]);
        }
    }, []);

    // ── persist session ───────────────────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, step, selectedHospital, selectedSpecialty, selectedSlot, symptoms }));
    }, [messages, step, selectedHospital, selectedSpecialty, selectedSlot, symptoms]);

    // ── scroll to bottom ──────────────────────────────────────────────────────
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, step, open, hospitals, slots]);

    const addMsg = (role, text) => setMessages(prev => [...prev, { role, text }]);

    // ── reset ─────────────────────────────────────────────────────────────────
    const reset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([{ role: 'bot', text: '🔄 Chat reset. How can I help you?' }]);
        setStep('main'); setSelectedHospital(null); setSelectedSpecialty('');
        setSelectedSlot(null); setSymptoms(''); setHospitals([]); setSlots([]);
    };

    // ── Step: start booking ───────────────────────────────────────────────────
    const startBooking = async () => {
        addMsg('user', 'I want to book an appointment');

        if (!myLocation) {
            addMsg('bot', '📍 I need your location to find nearby hospitals. Please allow location access and try again.');
            // try again silently
            navigator.geolocation?.getCurrentPosition(
                pos => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { }
            );
            return;
        }

        addMsg('bot', `📡 Searching for multispeciality hospitals within 30 km of your location...`);
        setLoadingHospitals(true);
        setStep('select_hospital');

        try {
            const res = await API.get(`/agent/nearby-hospitals?lat=${myLocation.lat}&lng=${myLocation.lng}`);
            setHospitals(res.data);
            if (res.data.length === 0) {
                addMsg('bot', '😔 No multispeciality hospitals found within 30 km. Try expanding search or contact support.');
                setStep('main');
            } else {
                addMsg('bot', `✅ Found ${res.data.length} hospitals near you. Select one below.`);
            }
        } catch (e) {
            addMsg('bot', '❌ Could not fetch hospitals. Please try again.');
            setStep('main');
        } finally {
            setLoadingHospitals(false);
        }
    };

    // ── Step: choose hospital ─────────────────────────────────────────────────
    const pickHospital = (h) => {
        setSelectedHospital(h);
        addMsg('user', `I select ${h.name}`);
        addMsg('bot', `🏥 ${h.name} (⭐${h.rating}) is ${h.distance_km} km away. Now choose a speciality:`);
        setStep('select_specialty');
    };

    // ── Step: choose specialty ────────────────────────────────────────────────
    const pickSpecialty = (spec) => {
        setSelectedSpecialty(spec);
        addMsg('user', `I need ${spec}`);
        addMsg('bot', `🗓️ Loading available slots for ${spec} at ${selectedHospital.name}...`);
        setStep('select_time');

        API.get('/agent/slots').then(r => {
            setSlots(r.data);
        }).catch(() => addMsg('bot', '❌ Could not load slots.'));
    };

    // ── Step: choose time slot ────────────────────────────────────────────────
    const pickSlot = (s) => {
        setSelectedSlot(s);
        const d = new Date(s);
        addMsg('user', `I'll take ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        addMsg('bot', `✍️ Almost done! Briefly describe your symptoms or reason for visit (optional):`);
        setStep('symptoms');
    };

    // ── Step: confirm booking ────────────────────────────────────────────────
    const confirmBooking = async () => {
        addMsg('user', symptoms || 'No additional notes');
        addMsg('bot', '⏳ Booking your appointment...');
        try {
            await API.post('/agent/book-external', {
                hospital_name: selectedHospital.name,
                hospital_address: selectedHospital.address,
                hospital_lat: selectedHospital.lat,
                hospital_lng: selectedHospital.lng,
                specialty: selectedSpecialty,
                appointment_time: selectedSlot,
                user_input: symptoms || '',
            });

            const d = new Date(selectedSlot);
            addMsg('bot', `✅ Appointment confirmed!\n\n🏥 ${selectedHospital.name}\n🩺 ${selectedSpecialty}\n📅 ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\nThe hospital will assign a doctor and may contact you for confirmation.`);

            // refresh appointments list
            API.get('/agent/appointments/me').then(r => setAppointments(r.data)).catch(() => { });

            setTimeout(() => { setStep('main'); setSymptoms(''); }, 2000);
        } catch (e) {
            addMsg('bot', '❌ Booking failed: ' + (e.response?.data?.detail || 'Unknown error'));
        }
    };

    // ── load my appointments ───────────────────────────────────────────────────
    const loadAppointments = async () => {
        addMsg('user', 'Show my appointments');
        try {
            const res = await API.get('/agent/appointments/me');
            setAppointments(res.data);
            if (res.data.length === 0) {
                addMsg('bot', '📋 You have no upcoming appointments yet. Tap "Book an appointment" to get started!');
            } else {
                addMsg('bot', `📋 You have ${res.data.length} appointment(s). See below:`);
                setStep('show_appointments');
            }
        } catch (e) {
            addMsg('bot', '❌ Could not load appointments.');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {open && (
                <div className="bg-white w-[26rem] max-h-[640px] shadow-2xl rounded-2xl flex flex-col border border-slate-200 overflow-hidden mb-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold">
                            <div className="bg-white/20 p-1.5 rounded-lg"><MessageSquare size={18} /></div>
                            <div className="flex flex-col leading-tight">
                                <span>MediWatch Agent</span>
                                <span className="text-[10px] text-emerald-100 font-normal">
                                    {user ? `Hello, ${user.full_name || user.username}` : 'Health Assistant'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={reset} title="Reset" className="hover:bg-white/20 p-1.5 rounded-full transition"><RotateCcw size={14} /></button>
                            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={18} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[340px]">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${m.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none shadow'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {/* ── MAIN MENU ─────────────────────────────────────────────── */}
                        {step === 'main' && (
                            <div className="flex flex-col gap-2 pt-1">
                                <button onClick={startBooking} className="text-sm bg-white border border-emerald-500 text-emerald-700 p-3 rounded-xl hover:bg-emerald-50 transition font-semibold flex items-center justify-between shadow-sm group">
                                    <span className="flex items-center gap-2"><Calendar size={16} />  Book an Appointment</span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
                                </button>
                                <button onClick={loadAppointments} className="text-sm bg-white border border-slate-200 text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition font-medium flex items-center justify-between shadow-sm">
                                    <span className="flex items-center gap-2"><CheckCircle size={16} />  My Appointments</span>
                                    <ChevronRight size={14} />
                                </button>
                                {myLocation && (
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 px-1">
                                        <LocateFixed size={10} className="text-emerald-500" /> Location detected — hospitals search ready
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── HOSPITAL LIST ─────────────────────────────────────────── */}
                        {step === 'select_hospital' && (
                            <div className="space-y-2 pt-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nearby Hospitals · {hospitals.length} found</div>
                                {loadingHospitals && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 py-4 justify-center">
                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        Scanning for hospitals...
                                    </div>
                                )}
                                {hospitals.map((h, i) => (
                                    <button key={i} onClick={() => pickHospital(h)}
                                        className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-emerald-400 hover:bg-emerald-50 transition shadow-sm group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-bold text-slate-800 group-hover:text-emerald-700 text-xs leading-snug">{h.name}</div>
                                            <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold ml-1 shrink-0">
                                                ⭐ {h.rating}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} /> {h.address}
                                        </div>
                                        <div className="text-[10px] text-emerald-600 font-semibold mt-1">{h.distance_km} km away</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── SPECIALTIES ────────────────────────────────────────────── */}
                        {step === 'select_specialty' && (
                            <div className="space-y-2 pt-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Select Speciality</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {SPECIALTIES.map(s => (
                                        <button key={s.label} onClick={() => pickSpecialty(s.label)}
                                            className="text-xs bg-white border border-slate-200 rounded-xl p-3 hover:border-emerald-500 hover:bg-emerald-50 transition shadow-sm text-left font-semibold text-slate-700 flex items-center gap-2">
                                            <span className="text-lg">{s.emoji}</span>
                                            <span className="leading-tight">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {/* Custom specialty input */}
                                <div className="flex gap-2 mt-1">
                                    <input
                                        value={customSpecialty}
                                        onChange={e => setCustomSpecialty(e.target.value)}
                                        placeholder="Other speciality…"
                                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white"
                                    />
                                    <button
                                        onClick={() => { if (customSpecialty.trim()) pickSpecialty(customSpecialty.trim()); }}
                                        className="text-xs bg-emerald-600 text-white px-3 py-2 rounded-xl hover:bg-emerald-700 transition font-semibold"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── DATE SLOTS ─────────────────────────────────────────────── */}
                        {step === 'select_time' && (
                            <div className="space-y-2 pt-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Available Slots</div>
                                {slots.length === 0 && (
                                    <div className="text-xs text-slate-400 py-4 text-center animate-pulse">Loading slots…</div>
                                )}
                                {/* Group by date */}
                                {Array.from(new Set(slots.map(s => new Date(s).toDateString()))).map(dateStr => (
                                    <div key={dateStr}>
                                        <div className="text-[10px] text-slate-500 font-semibold mb-1 mt-2 px-0.5 flex items-center gap-1">
                                            <Calendar size={10} /> {dateStr}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {slots.filter(s => new Date(s).toDateString() === dateStr).map(s => (
                                                <button key={s} onClick={() => pickSlot(s)}
                                                    className="text-[11px] bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:border-emerald-500 hover:bg-emerald-50 transition font-bold text-slate-700 shadow-sm flex items-center gap-1">
                                                    <Clock size={10} className="text-emerald-500" />
                                                    {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── SYMPTOMS TEXT BOX ─────────────────────────────────────── */}
                        {step === 'symptoms' && (
                            <div className="space-y-3 pt-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Symptoms / Notes</div>
                                <textarea
                                    value={symptoms}
                                    onChange={e => setSymptoms(e.target.value)}
                                    rows={4}
                                    placeholder="e.g. Chest pain for 2 days, shortness of breath, dizziness..."
                                    className="w-full text-sm p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-white resize-none shadow-inner"
                                />
                                <button onClick={confirmBooking}
                                    className="w-full bg-emerald-600 text-white text-sm py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-lg">
                                    <Send size={15} /> Confirm Booking
                                </button>
                            </div>
                        )}

                        {/* ── MY APPOINTMENTS ──────────────────────────────────────── */}
                        {step === 'show_appointments' && (
                            <div className="space-y-2 pt-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Your Appointments</div>
                                {appointments.map(a => (
                                    <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-sm">
                                        <div className="font-bold text-slate-800 capitalize mb-1 flex justify-between items-center">
                                            <span className="flex items-center gap-1"><Stethoscope size={12} /> {a.specialty}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.status === 'shifted' ? 'bg-orange-100 text-orange-700' :
                                                a.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-100 text-slate-500'}`}>
                                                {a.status}
                                            </span>
                                        </div>
                                        <div className="text-slate-500 flex items-center gap-1 mb-0.5">
                                            <Building2 size={10} /> Hospital #{a.hospital_id}
                                        </div>
                                        <div className="text-slate-500 flex items-center gap-1">
                                            <Calendar size={10} /> {new Date(a.appointment_time).toLocaleString()}
                                        </div>
                                        {a.user_input && <div className="mt-1 text-slate-400 italic">"{a.user_input}"</div>}
                                        {a.status === 'shifted' && <div className="text-[9px] text-orange-600 mt-0.5 font-medium">⚠️ Reassigned due to emergency</div>}
                                    </div>
                                ))}
                                <button onClick={() => setStep('main')} className="text-xs text-emerald-600 font-semibold mt-1 hover:underline">← Back to menu</button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Session Active
                        </span>
                        {selectedHospital && (
                            <span className="text-emerald-600 font-bold truncate max-w-[160px]">
                                {selectedHospital.name}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button onClick={() => setOpen(!open)}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-90 ${open ? 'bg-slate-800 rotate-90 shadow-slate-500/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                    }`}>
                {open ? <X size={28} /> : (
                    <div className="relative">
                        <MessageSquare size={28} />
                        {messages.length > 1 && !open && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-emerald-600 text-[8px] flex items-center justify-center font-bold">!</div>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
}
