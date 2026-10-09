
"use client";

import { useState, useEffect } from "react";
import DynamicMap from "@/components/Map"; // NoSSR wrapper
import StatCard from "@/components/Dashboard/StatCard";
import { VRPSolver } from "@/lib/vrpSolver";
import { SCENARIOS, STATIONS } from "@/lib/data";
import { Play, Pause, BarChart3, Truck, Package, Settings, Zap, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("ops");
    const [userScenarios, setUserScenarios] = useState([]);
    const [simulationRunning, setSimulationRunning] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState(1);
    // State duplication fixed
    const [rentalCapacity, setRentalCapacity] = useState(500); // Default 500kg
    const [solverResult, setSolverResult] = useState(null);
    const [config, setConfig] = useState({ unitCost: 1, rentalCost: 200 });
    const [vehicles, setVehicles] = useState([
        { id: 'V1', capacity: 1000, fixedCost: 0, type: 'owned' },
        { id: 'V2', capacity: 750, fixedCost: 0, type: 'owned' },
        { id: 'V3', capacity: 500, fixedCost: 0, type: 'owned' }
    ]);
    const [stations, setStations] = useState([]);
    const [newStation, setNewStation] = useState({ name: '', lat: '', lng: '' });
    const [solverMode, setSolverMode] = useState('unlimited'); // 'unlimited' or 'limited'

    // [NEW] Load Stations from LocalStorage or Fallback to Default
    useEffect(() => {
        const stored = localStorage.getItem('kou_logistics_stations');
        if (stored) {
            setStations(JSON.parse(stored));
        } else {
            setStations(STATIONS);
        }
    }, []);

    // [NEW] Save Stations to LocalStorage whenever they change
    useEffect(() => {
        if (stations.length > 0) {
            localStorage.setItem('kou_logistics_stations', JSON.stringify(stations));
            // Dispatch event for other tabs (User Portal) to pick up
            window.dispatchEvent(new Event("storage"));
        }
    }, [stations]);

    // Load User Scenarios on Mount
    useEffect(() => {
        const loadUserScenarios = () => {
            const requests = JSON.parse(localStorage.getItem('kou_logistics_requests') || '[]');
            const uniqueNames = [...new Set(requests.map(r => r.scenarioName || 'Default User Scenario'))];
            setUserScenarios(uniqueNames);
        };
        loadUserScenarios();
        window.addEventListener('storage', loadUserScenarios);
        return () => window.removeEventListener('storage', loadUserScenarios);
    }, []);

    const runOptimization = async () => {
        setSolverResult(null);
        // Simulate thinking delay for "AI" effect
        await new Promise(r => setTimeout(r, 1500));

        let mappedCargos = [];

        // Check if selectedScenario is a specific User Scenario (String prefixed with 'USER:')
        if (typeof selectedScenario === 'string' && selectedScenario.startsWith('USER:')) {
            const targetName = selectedScenario.replace('USER:', '');
            // Load from LocalStorage
            const stored = JSON.parse(localStorage.getItem('kou_logistics_requests') || '[]');

            // Filter by Name
            const scenarioRequests = stored.filter(req => (req.scenarioName || 'Default User Scenario') === targetName);

            mappedCargos = scenarioRequests.map(req => {
                const station = STATIONS.find(s => s.id === req.stationId);
                return {
                    name: station ? station.name : "Unknown",
                    count: req.count,
                    weight: req.weight,
                    stationId: req.stationId,
                    trackingId: req.trackingId,
                    scenarioName: req.scenarioName
                };
            });

            if (mappedCargos.length === 0) {
                alert("No requests found for this scenario name.");
                return;
            }
        } else {
            // Standard Scenarios (1-4)
            const scenarioIdx = Number(selectedScenario);
            mappedCargos = SCENARIOS[scenarioIdx].map((c, idx) => {
                const station = STATIONS.find(s => s.name === c.name);
                return {
                    ...c,
                    stationId: station ? station.id : -1,
                    trackingId: `SIM-${scenarioIdx}-${idx + 101}`
                };
            }).filter(c => c.stationId !== -1);
        }

        const solver = new VRPSolver(mappedCargos, vehicles, solverMode === 'unlimited', config, stations);
        const result = solver.solve();

        // [NEW] Assign Unique Tracking Code to EACH VEHICLE
        result.routes.forEach(route => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            route.trackingCode = code;
        });

        setSolverResult(result);

        // SAVE for User Portal
        localStorage.setItem('kou_logistics_last_result', JSON.stringify({
            timestamp: new Date().toISOString(),
            routes: result.routes,
            dropped: result.dropped,
            scenario: selectedScenario
        }));
        window.dispatchEvent(new Event("storage"));

        // Save to History (Database Persistence)
        const historyItem = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            scenarioId: selectedScenario,
            mode: solverMode,
            totalCost: result.totalCost,
            routes: result.routes,
            dropped: result.dropped,
            vehicleCount: result.routes.length
        };

        const existingHistory = JSON.parse(localStorage.getItem('kou_logistics_history') || '[]');
        const newHistory = [historyItem, ...existingHistory].slice(0, 50); // Keep last 50
        localStorage.setItem('kou_logistics_history', JSON.stringify(newHistory));

        // Secondary Save (Compat)
        localStorage.setItem('kou_logistics_results', JSON.stringify(result));
    };

    // History Helpers
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const loadHistory = () => {
        const stored = JSON.parse(localStorage.getItem('kou_logistics_history') || '[]');
        setHistory(stored);
        setShowHistory(true);
    };

    const restoreFromHistory = (item) => {
        setSolverResult({
            routes: item.routes,
            totalCost: item.totalCost,
            dropped: item.dropped
        });
        setShowHistory(false);
        setActiveTab("ops");
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col z-20">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        KOU COMMAND
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">v3.1.0 BETA</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab("ops")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "ops" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:bg-white/5"}`}
                    >
                        <Zap className="w-5 h-5" />
                        Live Operations
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "analytics" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "text-slate-400 hover:bg-white/5"}`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "settings" ? "bg-slate-500/10 text-white border border-white/20" : "text-slate-400 hover:bg-white/5"}`}
                    >
                        <Settings className="w-5 h-5" />
                        Parameters
                    </button>
                </nav>

                {/* Control Panel */}
                <div className="p-4 bg-white/5 m-4 rounded-xl border border-white/10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Scenario Control</h3>
                    <div className="space-y-3">
                        <select
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                            value={selectedScenario}
                            onChange={(e) => setSelectedScenario(e.target.value)}
                        >
                            <optgroup label="Standard Scenarios">
                                <option value="1" className="bg-slate-900 text-white">Scenario 1</option>
                                <option value="2" className="bg-slate-900 text-white">Scenario 2</option>
                                <option value="3" className="bg-slate-900 text-white">Scenario 3</option>
                                <option value="4" className="bg-slate-900 text-white">Scenario 4</option>
                            </optgroup>

                            {userScenarios.length > 0 && (
                                <optgroup label="User Custom Scenarios">
                                    {userScenarios.map((name, i) => (
                                        <option key={i} value={`USER:${name}`} className="bg-slate-900 text-cyan-400 font-bold">
                                            {name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        <div className="text-[10px] text-cyan-500 uppercase font-bold text-center mt-1">
                            {String(selectedScenario).includes('USER:') ? 'Custom Mode' : `Scenario ${selectedScenario}`}
                        </div>

                        {/* Clear Buttons */}
                        {String(selectedScenario).includes('USER:') && (
                            <button
                                onClick={() => {
                                    if (confirm('Delete this scenario and all its requests?')) {
                                        const name = selectedScenario.replace('USER:', '');
                                        const stored = JSON.parse(localStorage.getItem('kou_logistics_requests') || '[]');
                                        const kept = stored.filter(r => (r.scenarioName || 'Default User Scenario') !== name);
                                        localStorage.setItem('kou_logistics_requests', JSON.stringify(kept));
                                        window.dispatchEvent(new Event("storage"));
                                        setSelectedScenario("1"); // Reset
                                    }
                                }}
                                className="w-full text-xs text-red-500 hover:text-red-400 py-1"
                            >
                                Delete &quot;{selectedScenario.replace('USER:', '')}&quot;
                            </button>
                        )}

                        {/* Optimization Mode Toggle */}
                        <div className="bg-black/20 p-2 rounded-lg space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block">Mode</label>
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    onClick={() => setSolverMode('limited')}
                                    className={`py-1.5 rounded text-[10px] font-bold transition-all border ${solverMode === 'limited' ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                                >
                                    FIXED
                                </button>
                                <button
                                    onClick={() => setSolverMode('unlimited')}
                                    className={`py-1.5 rounded text-[10px] font-bold transition-all border ${solverMode === 'unlimited' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                                >
                                    FLEX
                                </button>
                            </div>
                        </div>



                        <div className="text-[10px] text-emerald-400 font-mono text-center mb-2">
                            STATUS: <span className="text-white">{solverMode === 'unlimited' ? `AUTO-RENTAL (${rentalCapacity}kg)` : 'STRICT LIMIT'}</span>
                        </div>

                        <button
                            onClick={runOptimization}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex justify-center items-center gap-2"
                        >
                            <Zap className="w-4 h-4 fill-black" />
                            OPTIMIZE ROUTE
                        </button>

                        <button
                            onClick={loadHistory}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-2 text-xs"
                        >
                            <BarChart3 className="w-4 h-4" />
                            VIEW HISTORY
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {activeTab === "ops" && (
                    <>
                        {/* Header Stats */}
                        <div className="h-24 border-b border-white/10 bg-[#0a0a0a]/50 backdrop-blur flex items-center px-8 gap-6 z-10">
                            <StatCard title="Active Fleet" value={solverResult ? new Set(solverResult.routes.map(r => r.vehicleId)).size : "Standby"} icon={Truck} color="cyan" />
                            <StatCard title="Total Cargo" value={solverResult ? `${solverResult.routes.reduce((acc, r) => acc + r.load, 0).toFixed(2)} kg` : "---"} icon={Package} color="violet" />
                            <StatCard title="Total Packages" value={solverResult ? solverResult.routes.reduce((acc, r) => acc + (r.cargoDetails?.length || 0), 0) : "---"} icon={Package} color="amber" />
                            <StatCard title="Total Cost" value={solverResult ? `$${solverResult.totalCost.toFixed(0)}` : "---"} color="emerald" />
                        </div>

                        {/* Work Area */}
                        <div className="flex-1 p-6 relative">
                            {/* Map Container */}
                            <div className="absolute inset-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a]">
                                <DynamicMap
                                    routes={solverResult?.routes || []}
                                    droppedItems={solverResult?.dropped || []}
                                    simulationRunning={simulationRunning}
                                    stations={stations}
                                />

                                {/* Simulation Overlay Controls */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 flex items-center gap-6 z-[500]">
                                    <button
                                        onClick={() => setActiveTab("settings")}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setSimulationRunning(!simulationRunning)}
                                        className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                                    >
                                        {simulationRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                    </button>
                                    <div className="text-xs text-slate-400 font-mono">
                                        SIMULATION: {simulationRunning ? <span className="text-emerald-500 animate-pulse">RUNNING</span> : "PAUSED"}
                                    </div>
                                </div>
                            </div>

                            {/* Results Floating Panel (Right) */}
                            {solverResult && (
                                <>
                                    <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-16rem)] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-[400] animate-in slide-in-from-right duration-500">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-cyan-400" />
                                            Route Breakdown
                                        </h3>
                                        <div className="space-y-4">
                                            {solverResult.routes.map((route, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${route.vehicleType === 'rented' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                                                            <span className="font-bold text-sm text-white">
                                                                {route.vehicleType === 'rented' ? `Rental #${idx + 1}` : `Vehicle ${route.vehicleId}`}
                                                            </span>
                                                        </div>
                                                        {route.trackingCode && (
                                                            <div className="text-[10px] font-mono text-cyan-400 mt-0.5 select-all cursor-copy" title="Copy Vehicle Code">
                                                                ID: <span className="font-black bg-cyan-500/20 px-1 rounded">{route.trackingCode}</span>
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                                                            ${route.cost.toFixed(0)}
                                                        </span>
                                                    </div>
                                                    <div className="relative pl-3 border-l border-white/10 ml-1 space-y-3 pb-1">
                                                        {route.stops.map((stopId, sIdx) => {
                                                            const station = stations.find(s => s.id === stopId);
                                                            const cargo = route.cargoDetails.filter(c => c.stationId === stopId);
                                                            return (
                                                                <div key={sIdx} className="relative">
                                                                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border border-white/20 bg-[#0f172a]"></div>
                                                                    <div className="text-xs text-slate-300 font-medium">
                                                                        {station ? station.name : "Unknown"}
                                                                        {station?.isDepot && <span className="text-[10px] text-slate-500 ml-1">(HQ)</span>}
                                                                    </div>
                                                                    {cargo.length > 0 && (
                                                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                                                            {cargo.map((c, i) => (
                                                                                <div key={i}>
                                                                                    📦 {c.weight.toFixed(0)}kg
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[10px] text-slate-400">
                                                        <span>Load: {route.load.toFixed(0)} / {route.capacity} kg</span>
                                                        <span>{route.distance.toFixed(1)} km</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dropped Items (Limited Mode) */}
                                    {solverResult.dropped && solverResult.dropped.length > 0 && (
                                        <div className="absolute bottom-4 right-4 w-80 bg-red-900/90 backdrop-blur-xl border border-red-500/50 rounded-2xl p-4 shadow-2xl z-[400]">
                                            <h3 className="text-sm font-bold text-red-200 uppercase mb-2 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Dropped Items ({solverResult.dropped.length})
                                            </h3>
                                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                {solverResult.dropped.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs text-red-300">
                                                        <span>{item.name || 'Cargo'}</span>
                                                        <span>{typeof item.weight === 'number' ? item.weight.toFixed(1) : item.weight} kg</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-red-400 mt-2 italic">
                                                Capacity exceeded. Enable &quot;Unlimited&quot; or add vehicles.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}



                {
                    activeTab === "settings" && (
                        <div className="flex-1 overflow-y-auto p-8">
                            <h2 className="text-2xl font-bold mb-6 text-white">System Parameters</h2>
                            <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">

                                {/* Cost Configuration */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-cyan-400 border-b border-white/10 pb-2">Cost Configuration</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Unit Cost (per km)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 pl-6 text-white text-sm focus:border-cyan-500 outline-none"
                                                    value={config.unitCost}
                                                    onChange={(e) => setConfig({ ...config, unitCost: Number(e.target.value) })}
                                                    min="0.1"
                                                    step="0.1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Rental Cost (Fixed)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 pl-6 text-white text-sm focus:border-cyan-500 outline-none"
                                                    value={config.rentalCost}
                                                    onChange={(e) => setConfig({ ...config, rentalCost: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Information (Editable) */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-violet-400 border-b border-white/10 pb-2">Fleet Information</h3>
                                    <div className="space-y-2">
                                        {vehicles.map((vehicle, idx) => (
                                            <div key={vehicle.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">Vehicle {idx + 1} ({vehicle.type})</span>
                                                    <span className="text-xs text-slate-500">Standard Logistics Truck</span>
                                                </div>
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-1 pr-8 pl-2 text-right text-cyan-400 font-bold text-sm focus:border-cyan-500 outline-none"
                                                        value={vehicle.capacity}
                                                        onChange={(e) => {
                                                            const newVehicles = [...vehicles];
                                                            newVehicles[idx].capacity = Number(e.target.value);
                                                            setVehicles(newVehicles);
                                                        }}
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-xs text-slate-500 pointer-events-none">kg</span>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-amber-500/20">
                                            <div className="flex flex-col">
                                                <span className="text-amber-400 font-medium">Rental Fleet</span>
                                                <span className="text-xs text-slate-500">Auto-assigned (Dynamic Capacity)</span>
                                            </div>
                                            <div className="relative w-24">
                                                <input
                                                    type="number"
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-1 pr-8 pl-2 text-right text-amber-400 font-bold text-sm focus:border-amber-500 outline-none"
                                                    value={rentalCapacity}
                                                    onChange={(e) => setRentalCapacity(Math.max(1, parseInt(e.target.value) || 0))}
                                                />
                                                <span className="absolute right-2 top-1.5 text-xs text-slate-500 pointer-events-none">kg</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Station Management [NEW] */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-emerald-400 border-b border-white/10 pb-2">Manage Stations</h3>

                                    {/* Add New Station Form */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Station Name"
                                            className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-emerald-500 outline-none"
                                            value={newStation.name}
                                            onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                                        />
                                        <div className="grid grid-cols-2 gap-2 col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Lat"
                                                className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-emerald-500 outline-none"
                                                value={newStation.lat}
                                                onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })}
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Lng"
                                                    className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-emerald-500 outline-none w-full"
                                                    value={newStation.lng}
                                                    onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })}
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (!newStation.name || !newStation.lat || !newStation.lng) return;
                                                        const newId = Math.max(...stations.map(s => s.id)) + 1;
                                                        const stationObj = {
                                                            id: newId,
                                                            name: newStation.name,
                                                            lat: parseFloat(newStation.lat),
                                                            lng: parseFloat(newStation.lng)
                                                        };

                                                        // [OSRM] Pre-fetch Real Distances
                                                        await VRPSolver.addStationToMatrix(stationObj, stations);

                                                        setStations([...stations, stationObj]);
                                                        setNewStation({ name: '', lat: '', lng: '' });
                                                    }}
                                                    className="bg-emerald-500 hover:bg-emerald-400 text-black p-2 rounded-lg font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Station List (Compact) */}
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {stations.map(station => (
                                            <div key={station.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-xs">
                                                <span className="text-slate-300 font-medium">{station.name} {station.isDepot ? '(Depot)' : ''}</span>
                                                <span className="text-slate-500 font-mono">{station.lat.toFixed(3)}, {station.lng.toFixed(3)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            if (confirm("Reset ALL parameters (Costs, Vehicles, Stations) to default?")) {
                                                setConfig({ unitCost: 1, rentalCost: 200 });
                                                setVehicles([
                                                    { id: 'V1', capacity: 1000, fixedCost: 0, type: 'owned' },
                                                    { id: 'V2', capacity: 750, fixedCost: 0, type: 'owned' },
                                                    { id: 'V3', capacity: 500, fixedCost: 0, type: 'owned' }
                                                ]);
                                                setStations(STATIONS);
                                                localStorage.removeItem('kou_logistics_stations');
                                                window.dispatchEvent(new Event("storage"));
                                            }
                                        }}
                                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                                    >
                                        Reset to Defaults
                                    </button>
                                    <button className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-sm">
                                        Update Parameters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === "analytics" && (
                        <div className="flex-1 overflow-y-auto p-8 animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                                <BarChart3 className="w-8 h-8 text-violet-400" />
                                Scenario Analytics
                            </h2>

                            {(() => {
                                const historyData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kou_logistics_history') || '[]') : [];

                                // Group by Scenario
                                const stats = {};
                                historyData.forEach(run => {
                                    if (!stats[run.scenarioId]) {
                                        stats[run.scenarioId] = {
                                            runs: 0,
                                            totalCost: 0,
                                            minCost: Infinity,
                                            maxCost: 0,
                                            routes: run.routes
                                        };
                                    }
                                    stats[run.scenarioId].runs += 1;
                                    stats[run.scenarioId].totalCost += run.totalCost;
                                    stats[run.scenarioId].minCost = Math.min(stats[run.scenarioId].minCost, run.totalCost);
                                    stats[run.scenarioId].maxCost = Math.max(stats[run.scenarioId].maxCost, run.totalCost);
                                });

                                const chartData = Object.keys(stats).map(k => ({
                                    name: `Scenario ${k}`,
                                    avgCost: stats[k].totalCost / stats[k].runs,
                                    minCost: stats[k].minCost
                                }));

                                return (
                                    <div className="space-y-8">
                                        {/* Charts Row */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-80">
                                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Average Cost Comparison</h3>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                                                        <YAxis stroke="#94a3b8" fontSize={10} unit="$" />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                        <Bar dataKey="avgCost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Executive Summary</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(stats).map(([id, data]) => (
                                                        <div key={id} className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                            <div className="text-xs text-slate-500 uppercase font-bold">Scenario {id}</div>
                                                            <div className="text-2xl font-bold text-white mt-1">${(data.totalCost / data.runs).toFixed(0)}</div>
                                                            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                                                                <span>Runs: {data.runs}</span>
                                                                <span className="text-emerald-400">Best: ${data.minCost.toFixed(0)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Table */}
                                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="p-4 border-b border-white/10 bg-white/5">
                                                <h3 className="font-bold text-white">Scenario Breakdown</h3>
                                            </div>
                                            <table className="w-full text-left text-sm text-slate-400">
                                                <thead className="bg-black/20 text-xs uppercase text-slate-500 font-bold">
                                                    <tr>
                                                        <th className="p-4">Scenario</th>
                                                        <th className="p-4">Total Runs</th>
                                                        <th className="p-4">Avg Cost</th>
                                                        <th className="p-4">Min Cost</th>
                                                        <th className="p-4">Max Cost</th>
                                                        <th className="p-4">Efficiency Rating</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {Object.entries(stats).map(([id, data]) => {
                                                        const avg = data.totalCost / data.runs;
                                                        // Fake efficiency rating based on cost
                                                        const efficiency = avg < 3000 ? 'Excellent' : avg < 5000 ? 'Good' : 'Poor';
                                                        const color = avg < 3000 ? 'text-emerald-400' : avg < 5000 ? 'text-amber-400' : 'text-red-400';

                                                        return (
                                                            <tr key={id} className="hover:bg-white/5">
                                                                <td className="p-4 font-bold text-white">Scenario {id}</td>
                                                                <td className="p-4">{data.runs}</td>
                                                                <td className="p-4 font-mono text-white">${avg.toFixed(0)}</td>
                                                                <td className="p-4 font-mono text-emerald-400">${data.minCost.toFixed(0)}</td>
                                                                <td className="p-4 font-mono text-red-400">${data.maxCost.toFixed(0)}</td>
                                                                <td className={`p-4 font-bold ${color}`}>{efficiency}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {Object.keys(stats).length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="p-8 text-center opacity-50">No data available. Run scenarios to generate analytics.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )
                }
            </main >
            {/* History Modal */}
            {showHistory && (
                <div className="absolute inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-cyan-400" />
                                Optimization History
                            </h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="text-xs uppercase bg-white/5 text-slate-300">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Scenario</th>
                                        <th className="p-3">Mode</th>
                                        <th className="p-3">Vehicles</th>
                                        <th className="p-3">Cost</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map(item => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3">{item.date}</td>
                                            <td className="p-3">Scenario {item.scenarioId}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${item.mode === 'unlimited' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {item.mode}
                                                </span>
                                            </td>
                                            <td className="p-3">{item.vehicleCount}</td>
                                            <td className="p-3 font-mono text-emerald-400">${item.totalCost.toFixed(0)}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => restoreFromHistory(item)}
                                                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded text-xs border border-cyan-500/30"
                                                >
                                                    Load
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center opacity-50">No history found. Run an optimization first.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
