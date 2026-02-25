import { NextResponse } from 'next/server';
import { VRPSolver } from '../../../lib/vrpSolver';

// This endpoint verifies VRP solutions for Scenarios 1, 3, and 4.

export async function GET() {
    // Define Stations (Partial List for Context)
    const STATIONS = [
        { id: 1, name: 'İzmit', lat: 40.765, lon: 29.941 },
        { id: 2, name: 'Kandıra', lat: 41.070, lon: 30.150 },
        { id: 3, name: 'Derince', lat: 40.754, lon: 29.829 },
        { id: 4, name: 'Gebze', lat: 40.802, lon: 29.431 },
        { id: 5, name: 'Dilovası', lat: 40.787, lon: 29.544 },
        { id: 6, name: 'Körfez', lat: 40.776, lon: 29.736 },
        { id: 7, name: 'Gölcük', lat: 40.720, lon: 29.778 },
        { id: 8, name: 'Karamürsel', lat: 40.692, lon: 29.616 },
        { id: 9, name: 'Kartepe', lat: 40.753, lon: 30.016 },
        { id: 10, name: 'Başiskele', lat: 40.713, lon: 29.932 },
        { id: 11, name: 'Çayırova', lat: 40.817, lon: 29.373 },
        { id: 12, name: 'Darıca', lat: 40.774, lon: 29.406 }
    ];

    // SCENARIO CONFIGURATION
    const SCENARIOS = {
        1: [
            { id: "1", name: "Gölcük", weight: 300, count: 1 },
            { id: "2", name: "Karamürsel", weight: 60, count: 1 },
            { id: "3", name: "Kandıra", weight: 400, count: 1 },
            { id: "4", name: "Derince", weight: 250, count: 1 },
            { id: "5", name: "Gebze", weight: 260, count: 1 },
            { id: "6", name: "Çayırova", weight: 215, count: 1 },
            { id: "7", name: "Darıca", weight: 155, count: 1 },
            { id: "8", name: "Darıca", weight: 455, count: 1 },
            { id: "9", name: "Dilovası", weight: 175, count: 1 },
            { id: "10", name: "Körfez", weight: 80, count: 1 },
            { id: "11", name: "Başiskele", weight: 160, count: 1 },
            { id: "12", name: "Kartepe", weight: 150, count: 1 },
            { id: "13", name: "İzmit", weight: 100, count: 1 }
        ],
        3: [
            { id: "1", name: "Kandıra", weight: 880, count: 1 },
            { id: "2", name: "Dilovası", weight: 600, count: 1 },
            { id: "3", name: "Körfez", weight: 300, count: 1 },
            { id: "4", name: "Darıca", weight: 380, count: 1 }
        ],
        4: [
            { id: "1", name: "İzmit", weight: 250, count: 1 },
            { id: "2", name: "Gölcük", weight: 250, count: 1 },
            { id: "3", name: "Kartepe", weight: 250, count: 1 },
            { id: "4", name: "Başiskele", weight: 150, count: 1 },
            { id: "5", name: "Karamürsel", weight: 250, count: 1 },
            { id: "6", name: "Çayırova", weight: 400, count: 1 }
        ]
    };

    let report = {};

    // Vehicles
    const vehiclesFixed = [
        { id: 'V1', capacity: 1000, fixedCost: 0, type: 'owned' },
        { id: 'V2', capacity: 1000, fixedCost: 0, type: 'owned' },
        { id: 'V3', capacity: 500, fixedCost: 0, type: 'owned' }
    ];

    // SCENARIO 1
    {
        const cargos = SCENARIOS[1].map(c => ({ ...c, stationId: STATIONS.find(s => s.name === c.name).id }));
        // Enable Flexible Mode for Sc1 to test Rental Logic
        const solver = new VRPSolver(cargos, vehiclesFixed, true, { unitCost: 1 });
        const res = solver.solve();
        report["Scenario 1"] = {
            cost: res.totalCost,
            routes: res.routes.map(r => `${r.vehicleId} [${r.load}kg] -> Stops: ${r.stops.join(',')}`),
            dropped: res.dropped ? res.dropped.length : 0, // Should be 0 if rentals work
            debug: res.debugLogs
        };
    }
    // SCENARIO 3
    {
        const cargos = SCENARIOS[3].map(c => ({ ...c, stationId: STATIONS.find(s => s.name === c.name).id }));
        const solver = new VRPSolver(cargos, vehiclesFixed, false, { unitCost: 1 });
        const res = solver.solve();
        report["Scenario 3"] = {
            cost: res.totalCost,
            routes: res.routes.map(r => `${r.vehicleId} [${r.load}kg] -> Stops: ${r.stops.join(',')}`),
            dropped: res.dropped ? res.dropped.length : 0,
            debug: res.debugLogs.filter(l => l.includes("[RESCUE]"))
        };
    }
    // SCENARIO 4
    {
        const cargos = SCENARIOS[4].map(c => ({ ...c, stationId: STATIONS.find(s => s.name === c.name).id }));
        const solver = new VRPSolver(cargos, vehiclesFixed, false, { unitCost: 1 });
        const res = solver.solve();
        report["Scenario 4"] = {
            cost: res.totalCost,
            routes: res.routes.map(r => `${r.vehicleId} [${r.load}kg] -> Stops: ${r.stops.join(',')}`),
            dropped: res.dropped ? res.dropped.length : 0,
            debug: res.debugLogs
        };
    }

    return NextResponse.json(report);
}
