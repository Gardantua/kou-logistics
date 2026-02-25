"use client";
import React, { useState } from 'react';
import { STATIONS } from '@/lib/data';
import { Send, PackageCheck, AlertCircle, MapPin, Search, Lock } from 'lucide-react';
import DynamicMap from "@/components/Map"; // Reuse the map component

export default function UserPortal() {
    const [formData, setFormData] = useState({ stationId: '', count: '', weight: '' });
    const [status, setStatus] = useState(null); // success | error
    const [lastResult, setLastResult] = useState(null);

    // Tracking State
    const [trackingInput, setTrackingInput] = useState("");
    const [trackedCargo, setTrackedCargo] = useState(null);

    // [NEW] Dynamic Stations State
    const [stations, setStations] = useState(STATIONS);

    // Sync Stations from Admin Panel updates
    React.useEffect(() => {
        const loadStations = () => {
            const stored = localStorage.getItem('kou_logistics_stations');
            if (stored) {
                setStations(JSON.parse(stored));
            }
        };
        loadStations();
        window.addEventListener('storage', loadStations);
        return () => window.removeEventListener('storage', loadStations);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.stationId || !formData.count || !formData.weight) return;

        // Create new request object (No individual tracking ID)
        const newRequest = {
            id: Date.now(),
            scenarioName: formData.scenarioName || 'Default User Scenario', // Grouping ID
            stationId: parseInt(formData.stationId),
            count: parseInt(formData.count),
            weight: parseFloat(formData.weight),
            timestamp: new Date().toISOString()
        };

        // Save to localStorage
        const existing = JSON.parse(localStorage.getItem('kou_logistics_requests') || '[]');
        const updated = [...existing, newRequest];
        localStorage.setItem('kou_logistics_requests', JSON.stringify(updated));

        // Dispatch storage event manually for same-tab updates (optional)
        window.dispatchEvent(new Event("storage"));

        setStatus('success');
        setFormData({ stationId: '', count: '', weight: '' });
    };

    // Load latest result
    React.useEffect(() => {
        const checkStatus = () => {
            const stored = localStorage.getItem('kou_logistics_last_result');
            if (stored) {
                setLastResult(JSON.parse(stored));
            }
        };
        checkStatus();
        window.addEventListener('storage', checkStatus);
        return () => window.removeEventListener('storage', checkStatus);
    }, []);

    // Secure Tracking Logic
    const handleTrack = (e) => {
        e.preventDefault();
        if (!lastResult || !trackingInput) return;

        const match = lastResult.routes.find(r => r.trackingCode === trackingInput);
        if (match) {
            setTrackedCargo({ status: 'scheduled', item: { name: 'Full Vehicle Tracking' }, vehicleMode: true, route: match });
        } else {
            setTrackedCargo({ status: 'not_found' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-[#050505] p-6 gap-8 text-white font-sans">

            {/* LEFT: Request Form */}
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-white flex items-center gap-3">
                            <Send className="w-6 h-6 text-cyan-500" />
                            Send Cargo
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">Secure Logistics Request Protocol</p>
                    </div>

                    {!status ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Custom Scenario Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:bg-white/10 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="e.g. My Test Batch 1"
                                    value={formData.scenarioName || ''}
                                    onChange={e => setFormData({ ...formData, scenarioName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Destination</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:bg-white/10 outline-none transition-all"
                                    value={formData.stationId}
                                    onChange={e => setFormData({ ...formData, stationId: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900 text-white">Select District Node...</option>
                                    {stations.filter(s => !s.isDepot).map(s => (
                                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Count</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500 focus:bg-white/10 outline-none transition-all"
                                        placeholder="1"
                                        value={formData.count}
                                        onChange={e => setFormData({ ...formData, count: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Weight (kg)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-cyan-500 focus:bg-white/10 outline-none transition-all"
                                        placeholder="0.0"
                                        value={formData.weight}
                                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all active:scale-[0.98] mt-4"
                            >
                                GENERATE REQUEST
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in zoom-in duration-300">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                                    <PackageCheck className="w-8 h-8 text-black" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Request Accepted</h3>
                                <p className="text-slate-400 text-xs mb-6">Your cargo has been queued. Please wait for Route Optimisation and Vehicle Assignment.</p>

                                <button
                                    onClick={() => setStatus(null)}
                                    className="text-emerald-400 hover:text-white text-sm font-bold underline decoration-emerald-500/30 underline-offset-4"
                                >
                                    Submit Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Tracking Panel */}
            <div className="w-full max-w-xl h-[600px] rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a] z-20">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-violet-400" />
                        Secure Tracking
                    </h3>
                    <form onSubmit={handleTrack} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="TRK-XXXX"
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-32 focus:w-40 transition-all focus:border-violet-500 outline-none font-mono uppercase"
                            value={trackingInput}
                            onChange={e => setTrackingInput(e.target.value.toUpperCase())}
                        />
                        <button type="submit" className="bg-violet-600 hover:bg-violet-500 px-3 rounded-lg flex items-center justify-center">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#0f172a] relative">
                    {!trackedCargo ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                            <MapPin className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Enter a valid <strong>Tracking ID</strong> to view real-time location and route telemetry.</p>
                            <p className="text-xs mt-2 opacity-50">Access is restricted to authorized ID holders only.</p>
                        </div>
                    ) : trackedCargo.status === 'not_found' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 text-center">
                            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                            <p className="font-bold">ID Not Found</p>
                            <p className="text-xs mt-1 text-red-400/70">The system has no record of this shipment yet.<br />Please check the ID or wait for the next optimization cycle.</p>
                        </div>
                    ) : trackedCargo.status === 'dropped' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-400 p-8 text-center">
                            <AlertCircle className="w-12 h-12 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Shipment Delayed</h3>
                            <p className="text-sm max-w-xs mx-auto text-amber-200/70">
                                Your cargo ({trackedCargo.item.name}) is currently in the warehouse due to fleet capacity constraints.
                                It is prioritized for the next departure.
                            </p>
                        </div>
                    ) : (
                        /* SUCCESS - SHOW MAP */
                        <div className="w-full h-full relative">
                            <DynamicMap
                                routes={[trackedCargo.route]}
                                simulationRunning={true} // Auto-play for user
                                stations={stations} // [FIX] Use dynamic state
                            // We might want to highlight just this stations?
                            />

                            {/* Overlay Info */}
                            <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl z-[1000] flex justify-between items-center animate-in slide-in-from-bottom duration-500">
                                <div>
                                    <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">Assigned Unit</div>
                                    <div className="text-xl font-bold text-white">
                                        {trackedCargo.route.vehicleType === 'rented' ? 'Rental Express' : `Vehicle ${trackedCargo.route.vehicleId}`}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Route: {trackedCargo.route.stops.map(id => stations.find(s => String(s.id) === String(id))?.name || 'Unknown').join(' → ')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm font-bold text-white bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                                        In Transit
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
