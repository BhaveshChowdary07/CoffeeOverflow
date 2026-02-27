import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, MapPin, Calendar, Clock, ChevronRight, RotateCcw } from 'lucide-react';
import API from '../api';

const STORAGE_KEY = 'mw_chat_session';

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hello! I am your MediWatch Health Assistant. How can I help you today?' }
    ]);
    const [step, setStep] = useState('main'); // main, select_hospital, select_specialty, select_time, symptoms, confirm
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    const [user, setUser] = useState(null);
    const [hasAlert, setHasAlert] = useState(false);

    const scrollRef = useRef(null);

    // Load User and Check Alerts for Context
    useEffect(() => {
        const token = localStorage.getItem('mw_token');
        if (token) {
            API.get('/users/me').then(res => {
                setUser(res.data);
                // Initial greeting with name
                setMessages(prev => [
                    { role: 'bot', text: `Hello ${res.data.full_name || res.data.username}! I am your MediWatch Assistant. I'm monitoring your vitals in real-time.` }
                ]);
            });

            // Check if patient has critical alerts
            API.get('/patients').then(res => {
                const p = res.data[0];
                if (p) {
                    API.get(`/patients/${p.id}/history`).then(hist => {
                        const critical = hist.data.alerts.some(a => a.severity === 'critical' && !a.resolved);
                        if (critical) {
                            setHasAlert(true);
                            setMessages(prev => [...prev, { role: 'bot', text: "⚠️ I noticed you have an unacknowledged critical alert. Please check your vitals or I can help you book a priority appointment." }]);
                        }
                    });
                }
            });
        }
    }, []);

    // 1. Load context from session on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setMessages(data.messages || []);
                setStep(data.step || 'main');
                setSelectedHospital(data.selectedHospital || null);
                setSelectedSpecialty(data.selectedSpecialty || '');
                setSelectedSlot(data.selectedSlot || null);
                setSymptoms(data.symptoms || '');

                // If it's a resumed session, add a small nudge
                if (data.messages && data.messages.length > 1) {
                    setMessages(prev => [
                        ...prev,
                        { role: 'bot', text: 'Welcome back! I remember what we were discussing. Should we continue?' }
                    ]);
                }
            } catch (e) {
                console.error("Failed to load chat context", e);
            }
        }
    }, []);

    // 2. Save context to session whenever it changes
    useEffect(() => {
        const context = {
            messages,
            step,
            selectedHospital,
            selectedSpecialty,
            selectedSlot,
            symptoms
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    }, [messages, step, selectedHospital, selectedSpecialty, selectedSlot, symptoms]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open]);

    const addMessage = (role, text) => {
        setMessages(prev => [...prev, { role, text }]);
    };

    const resetChat = () => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([{ role: 'bot', text: 'Chat reset. How can I help you today?' }]);
        setStep('main');
        setSelectedHospital(null);
        setSelectedSpecialty('');
        setSelectedSlot(null);
        setSymptoms('');
    };

    const startBooking = async () => {
        addMessage('user', 'I want to book an appointment');
        addMessage('bot', 'Sure! Let me find the nearest partner hospitals for you...');
        setStep('select_hospital');
        try {
            const res = await API.get('/agent/hospitals');
            setHospitals(res.data);
            if (res.data.length === 0) {
                addMessage('bot', 'Sorry, I couldn\'t find any partner hospitals nearby.');
                setStep('main');
            }
        } catch (e) {
            addMessage('bot', 'Error fetching hospitals. Please try again later.');
        }
    };

    const handleHospitalSelect = async (h) => {
        setSelectedHospital(h);
        addMessage('user', `I select ${h.name}`);
        addMessage('bot', `Great! Based on our records, ${h.name} is a top multispecialty facility. What kind of specialist do you need there?`);
        setStep('select_specialty');
        try {
            const res = await API.get(`/agent/hospitals/${h.id}/specialties`);
            setSpecialties(res.data);
        } catch (e) {
            addMessage('bot', 'Error fetching specialties.');
        }
    };

    const handleSpecialtySelect = async (spec) => {
        setSelectedSpecialty(spec);
        addMessage('user', `I need a ${spec} specialist`);
        addMessage('bot', `I'm checking for available ${spec} specialists at ${selectedHospital.name}...`);
        setStep('select_time');
        try {
            const res = await API.get(`/agent/hospitals/${selectedHospital.id}/availability?specialty=${spec}`);
            setSlots(res.data);
        } catch (e) {
            addMessage('bot', 'Error fetching availability.');
        }
    };

    const handleTimeSelect = (slot) => {
        setSelectedSlot(slot);
        const dateStr = new Date(slot).toLocaleString();
        addMessage('user', `I'll take the slot on ${dateStr}`);
        addMessage('bot', `Perfect. You've selected ${selectedSpecialty} at ${selectedHospital.name} for ${dateStr}. To help the doctor prepare, could you briefly describe your symptoms or the reason for this visit?`);
        setStep('symptoms');
    };

    const handleConfirm = async () => {
        addMessage('user', symptoms);
        addMessage('bot', 'Processing your booking with the context provided...');
        try {
            await API.post('/agent/book', {
                hospital_id: selectedHospital.id,
                specialty: selectedSpecialty,
                appointment_time: selectedSlot,
                user_input: symptoms
            });
            addMessage('bot', `Verified! Your appointment is successfully booked. The hospital has been notified of your symptoms: "${symptoms}". See you at ${selectedHospital.name}!`);

            // Wait a bit then reset to main but keep history for a bit
            setTimeout(() => {
                setStep('main');
                setSymptoms('');
                // We keep history so they can scroll up and see what they did
            }, 2000);
        } catch (e) {
            addMessage('bot', 'Booking failed: ' + (e.response?.data?.detail || 'Unknown error'));
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* The actual chat window */}
            {open && (
                <div className="bg-white w-96 max-h-[550px] shadow-2xl rounded-2xl flex flex-col border border-slate-200 overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
                    <div className="bg-emerald-600 p-4 text-white flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-500 shadow-md">
                        <div className="flex items-center gap-2 font-bold">
                            <div className="bg-white/20 p-1 rounded-lg">
                                <MessageSquare size={18} />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span>MediWatch Agent</span>
                                <span className="text-[10px] text-emerald-100 font-normal">Session-Aware Intelligence</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={resetChat} title="Reset Conversation" className="hover:bg-white/20 p-1.5 rounded-full transition"><RotateCcw size={16} /></button>
                            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={18} /></button>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[350px]">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {/* Interactive UI components based on Step */}
                        {step === 'main' && (
                            <div className="flex flex-col gap-2 pt-2">
                                <button onClick={startBooking} className="text-sm bg-white border border-emerald-600 text-emerald-600 p-3 rounded-xl hover:bg-emerald-50 transition font-bold flex items-center justify-between shadow-sm group">
                                    <span className="flex items-center gap-3">
                                        <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Calendar size={16} /></div>
                                        Book an Appointment
                                    </span>
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
                                </button>
                                <button onClick={() => addMessage('bot', 'I remember your session details. I can browse partner multispeciality centers and manage your appointments based on our previous conversation.')} className="text-sm bg-white border border-slate-200 text-slate-600 p-3 rounded-xl hover:bg-slate-50 transition font-medium flex items-center justify-between shadow-sm">
                                    <span className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-1.5 rounded-lg text-slate-400"><MessageSquare size={16} /></div>
                                        How does this session work?
                                    </span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        {step === 'select_hospital' && (
                            <div className="grid grid-cols-1 gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Nearby Partner Hospitals</div>
                                {hospitals.map(h => (
                                    <button key={h.id} onClick={() => handleHospitalSelect(h)} className="text-xs bg-white border border-slate-200 p-3 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-left transition shadow-sm group">
                                        <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1 flex items-center justify-between">
                                            {h.name}
                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Verified</span>
                                        </div>
                                        <div className="text-slate-500 flex items-center gap-1"><MapPin size={12} /> {h.city}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'select_specialty' && (
                            <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-full text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1 mb-1">Available Specialties</div>
                                {specialties.map(s => (
                                    <button key={s} onClick={() => handleSpecialtySelect(s)} className="text-xs px-4 py-2 bg-white border border-slate-200 rounded-full hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition shadow-sm capitalize font-bold">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'select_time' && (
                            <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="col-span-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1 mb-1">Select a Time Slot</div>
                                {slots.map(s => (
                                    <button key={s} onClick={() => handleTimeSelect(s)} className="text-[10px] p-2.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center shadow-sm group">
                                        <div className="flex items-center gap-1 text-slate-500 mb-1"><Calendar size={10} /> {new Date(s).toLocaleDateString()}</div>
                                        <div className="flex items-center gap-1 font-bold text-slate-800 group-hover:text-emerald-700"><Clock size={10} /> {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'symptoms' && (
                            <div className="flex flex-col gap-3 pt-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-1">Describe Symptoms</div>
                                <textarea
                                    value={symptoms}
                                    onChange={e => setSymptoms(e.target.value)}
                                    placeholder="Please provide details (e.g. onset, severity, specific concerns)..."
                                    className="w-full text-sm p-4 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500 bg-white shadow-inner resize-none min-h-[100px]"
                                ></textarea>
                                <button onClick={handleConfirm} className="bg-emerald-600 text-white text-sm p-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 active:scale-[0.98] transition shadow-lg">
                                    <Send size={16} /> Book Appointment Now
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-400 font-medium">Session Active</span>
                        </div>
                        {selectedHospital && (
                            <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[150px]">
                                {selectedHospital.name}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button onClick={() => setOpen(!open)} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-90 ${open
                ? 'bg-slate-800 rotate-90 shadow-slate-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                }`}>
                {open ? <X size={28} /> : (
                    <div className="relative">
                        <MessageSquare size={28} />
                        {!open && messages.length > 1 && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-emerald-600 text-[10px] flex items-center justify-center font-bold">
                                !
                            </div>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
}
