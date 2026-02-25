// --- Real OSRM Distance Matrix (KM) ---
const OSRM_MATRIX = {
    "0": { "0": 0, "1": 17.29, "2": 61.36, "3": 57.55, "4": 16.4, "5": 43.3, "6": 54.92, "7": 25.44, "8": 47.15, "9": 43.36, "10": 17.32, "11": 24.83, "12": 9.21 },
    "1": { "0": 15.85, "1": 0, "2": 62.31, "3": 58.5, "4": 17.35, "5": 44.25, "6": 55.87, "7": 11.34, "8": 49.16, "9": 29.26, "10": 11.46, "11": 25.78, "12": 9.23 },
    "2": { "0": 61.29, "1": 62.77, "2": 0, "3": 7.37, "4": 45.75, "5": 20.14, "6": 7.37, "7": 60.25, "8": 99.98, "9": 42.28, "10": 61.77, "11": 43.31, "12": 54.21 },
    "3": { "0": 57.51, "1": 58.98, "2": 7.45, "3": 0, "4": 41.97, "5": 16.35, "6": 4.85, "7": 56.47, "8": 96.2, "9": 38.5, "10": 57.99, "11": 39.53, "12": 50.42 },
    "4": { "0": 16.24, "1": 17.72, "2": 46.47, "3": 42.66, "4": 0, "5": 27.45, "6": 40.03, "7": 25.87, "8": 54.7, "9": 58.86, "10": 16.73, "11": 8.97, "12": 9.16 },
    "5": { "0": 43.88, "1": 45.35, "2": 19.61, "3": 15.8, "4": 27.64, "5": 0, "6": 13.17, "7": 53.5, "8": 83.07, "9": 33.68, "10": 44.36, "11": 24.09, "12": 36.79 },
    "6": { "0": 54.28, "1": 55.75, "2": 7.01, "3": 4.59, "4": 38.74, "5": 13.12, "6": 0, "7": 53.24, "8": 92.97, "9": 35.27, "10": 54.76, "11": 36.3, "12": 47.19 },
    "7": { "0": 26.08, "1": 10.56, "2": 59.78, "3": 55.97, "4": 27.58, "5": 50.97, "6": 53.34, "7": 0, "8": 59.39, "9": 17.99, "10": 21.68, "11": 36, "12": 19.45 },
    "8": { "0": 46.55, "1": 49.79, "2": 100.83, "3": 97.02, "4": 54.64, "5": 83.59, "6": 94.39, "7": 59.3, "8": 0, "9": 77.22, "10": 47.61, "11": 64.76, "12": 45.85 },
    "9": { "0": 43.96, "1": 28.44, "2": 41.79, "3": 37.98, "4": 57.26, "5": 32.98, "6": 35.34, "7": 18.26, "8": 77.27, "9": 0, "10": 39.56, "11": 54.82, "12": 37.33 },
    "10": { "0": 16.86, "1": 12.68, "2": 62.2, "3": 58.38, "4": 17.23, "5": 44.13, "6": 55.75, "7": 22.18, "8": 47.23, "9": 40.1, "10": 0, "11": 25.66, "12": 9.61 },
    "11": { "0": 25.25, "1": 26.72, "2": 44.49, "3": 40.68, "4": 9.01, "5": 24.35, "6": 38.05, "7": 34.87, "8": 64.23, "9": 56.88, "10": 25.73, "11": 0, "12": 18.16 },
    "12": { "0": 9.35, "1": 10.86, "2": 53.31, "3": 49.5, "4": 8.35, "5": 35.25, "6": 46.87, "7": 19.01, "8": 47.84, "9": 36.93, "10": 9.87, "11": 16.78, "12": 0 }
};


export class VRPSolver {
    // Fetches real distances for a new station and adds them to OSRM_MATRIX,
    // preventing the algorithm from falling back to Haversine.
    static async addStationToMatrix(newStation, allStations) {
        const uniqueIds = allStations.map(s => String(s.id));
        const newId = String(newStation.id);

        if (!OSRM_MATRIX[newId]) OSRM_MATRIX[newId] = {};

        const fetchDist = async (fromId, toId) => {
            if (fromId === toId) return;
            if (OSRM_MATRIX[fromId] && OSRM_MATRIX[fromId][toId] !== undefined) return;

            const s = (String(newStation.id) === fromId) ? newStation : allStations.find(st => String(st.id) === fromId);
            const e = (String(newStation.id) === toId) ? newStation : allStations.find(st => String(st.id) === toId);

            if (!s || !e) return;

            try {
                const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${s.lng},${s.lat};${e.lng},${e.lat}?overview=false`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.code === 'Ok' && data.routes.length > 0) {
                    const distKm = data.routes[0].distance / 1000;
                    if (!OSRM_MATRIX[fromId]) OSRM_MATRIX[fromId] = {};
                    OSRM_MATRIX[fromId][toId] = distKm;
                }
            } catch (err) {
                console.warn(`[OSRM] Failed query for ${fromId}->${toId}`, err);
            }
        };

        const promises = [];
        for (let otherId of uniqueIds) {
            promises.push(fetchDist(newId, otherId));
            promises.push(fetchDist(otherId, newId));
        }

        await Promise.all(promises);
    }

    constructor(cargos, vehicles, isFlexible = false, config = {}, stations = []) {
        this.cargos = cargos;
        this.vehicles = vehicles.sort((a, b) => b.capacity - a.capacity); // Largest first
        this.isFlexible = isFlexible;
        this.config = { unitCost: 1, rentalCost: 200, ...config };
        this.stations = stations;
        this.DEPOT = 0;
    }

    getDist(start, end) {
        const s = String(start);
        const e = String(end);

        // 1. Try Cached OSRM Matrix
        if (OSRM_MATRIX[s] && OSRM_MATRIX[s][e] !== undefined) return OSRM_MATRIX[s][e];

        // 2. Fallback: Haversine Distance with road factor
        if (this.stations && this.stations.length > 0) {
            const sNode = this.stations.find(st => String(st.id) === s);
            const eNode = this.stations.find(st => String(st.id) === e);

            if (sNode && eNode) {
                const R = 6371;
                const dLat = (eNode.lat - sNode.lat) * Math.PI / 180;
                const dLon = (eNode.lng - sNode.lng) * Math.PI / 180;
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(sNode.lat * Math.PI / 180) * Math.cos(eNode.lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                // Apply road factor: straight line is too short. 1.4 is a standard urban approximation.
                return R * c * 1.4;
            }
        }

        return 9999;
    }

    calculateRouteCost(stops, fixedCost) {
        if (!stops || stops.length === 0) return 0;
        let dist = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            dist += this.getDist(stops[i], stops[i + 1]);
        }
        return (dist * this.config.unitCost) + fixedCost;
    }

    preprocessCargos() {
        let items = [];
        this.cargos.filter(c => c.count > 0 && c.weight > 0).forEach(req => {
            const unitWeight = req.weight / req.count;
            for (let i = 0; i < req.count; i++) {
                items.push({
                    id: Math.random().toString(36).slice(2, 11),
                    stationId: req.stationId,
                    name: req.name,
                    weight: unitWeight,
                    count: 1,
                    originalReq: req
                });
            }
        });
        return items;
    }

    solveParallelInsertion() {
        const items = this.preprocessCargos();

        let finalRoutes = [];
        let droppedItems = [];

        const finalize = (veh, items, routeStops) => {
            const optimizedStops = this.solveTSP(routeStops);
            let dist = 0;
            for (let i = 0; i < optimizedStops.length - 1; i++) {
                dist += this.getDist(optimizedStops[i], optimizedStops[i + 1]);
            }
            return {
                vehicleId: veh.id,
                vehicleType: veh.type || 'owned',
                capacity: veh.capacity,
                fixedCost: veh.fixedCost,
                load: items.reduce((s, x) => s + x.weight, 0),
                stops: optimizedStops,
                detailedStops: optimizedStops,
                cargoDetails: items,
                distance: dist,
                cost: dist * this.config.unitCost + (veh.fixedCost || 0)
            };
        };

        const availableVehicles = [...this.vehicles];
        let allItems = items.sort((a, b) => b.weight - a.weight);

        for (let veh of availableVehicles) {
            let vehLoad = 0;
            let vehItems = [];
            let remaining = [];
            for (let item of allItems) {
                if (vehLoad + item.weight <= veh.capacity) {
                    vehLoad += item.weight;
                    vehItems.push(item);
                } else {
                    remaining.push(item);
                }
            }
            if (vehItems.length > 0) {
                const uniqueStops = [...new Set(vehItems.map(i => i.stationId))];
                finalRoutes.push(finalize(veh, vehItems, uniqueStops));
                allItems = remaining;
            }
        }

        if (allItems.length > 0) {
            if (this.isFlexible) {
                let rentalCount = 1;
                const rentalCap = 500;
                const rentalFleets = [];
                for (let item of allItems) {
                    let placed = false;
                    for (let r of rentalFleets) {
                        if (r.load + item.weight <= rentalCap) {
                            r.load += item.weight;
                            r.items.push(item);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        rentalFleets.push({ load: item.weight, items: [item] });
                    }
                }
                for (let rf of rentalFleets) {
                    const rVeh = { id: `Rent-${rentalCount++}`, capacity: 500, fixedCost: 200, type: 'rented' };
                    const uniqueStops = [...new Set(rf.items.map(i => i.stationId))];
                    finalRoutes.push(finalize(rVeh, rf.items, uniqueStops));
                }
            } else {
                droppedItems = allItems;
            }
        }

        return this.runSA({ routes: finalRoutes, totalCost: 0, dropped: droppedItems });
    }

    solveParallelNNUser() {
        let traceLogs = [];
        let items = this.preprocessCargos();
        const ownedVehicles = this.vehicles.filter(v => (!v.type || v.type === 'owned'));
        const N = ownedVehicles.length;

        // --- STEP 1: Get Active Stations ---
        const uniqueStationIds = [...new Set(items.map(i => i.stationId))];
        let stations = uniqueStationIds.map(id => ({ id, dist0: this.getDist(id, this.DEPOT) }));

        // --- STEP 2: MAXIMIN SEEDING ---
        // Select starting stations that are maximally spread apart
        const seeds = [];
        let remainingStations = [...stations];
        remainingStations.sort((a, b) => b.dist0 - a.dist0);
        if (remainingStations.length > 0) {
            seeds.push(remainingStations[0]);
            remainingStations.shift();
        }
        while (seeds.length < N && remainingStations.length > 0) {
            let bestCand = null;
            let maxMinDist = -1;
            for (let cand of remainingStations) {
                const minDist = Math.min(
                    cand.dist0,
                    ...seeds.map(s => this.getDist(cand.id, s.id))
                );
                if (minDist > maxMinDist) {
                    maxMinDist = minDist;
                    bestCand = cand;
                }
            }
            if (bestCand) {
                seeds.push(bestCand);
                remainingStations = remainingStations.filter(s => s.id !== bestCand.id);
            } else {
                break;
            }
        }

        // --- STEP 3: INITIALIZE ROUTES & ASSIGN SEEDS ---
        const routes = seeds.map((seed, idx) => ({
            id: idx,
            stops: [seed.id],
            items: [],
            currentEnd: seed.id,
            vehicle: ownedVehicles[idx]
        }));

        routes.forEach(r => {
            const stationItems = items.filter(x => x.stationId === r.currentEnd);
            r.items.push(...stationItems);
            items = items.filter(x => x.stationId !== r.currentEnd);
        });

        // --- STEP 4: PARALLEL BEST-FIRST CONSTRUCTION ---
        // Metric: distance + 1.3 * detour (tuned for optimal cluster/flow balance)
        const unvisited = new Set(remainingStations.map(s => s.id));

        while (unvisited.size > 0) {
            let bestMove = null;
            let minMoveDist = Infinity;

            for (let rIdx = 0; rIdx < routes.length; rIdx++) {
                const r = routes[rIdx];
                for (let candId of unvisited) {
                    const distMe = this.getDist(r.currentEnd, candId);
                    const distToDepot = this.getDist(candId, this.DEPOT);
                    const distCurToDepot = this.getDist(r.currentEnd, this.DEPOT);
                    const detour = (distMe + distToDepot) - distCurToDepot;
                    const d = distMe + (1.3 * detour);

                    if (d < minMoveDist) {
                        minMoveDist = d;
                        bestMove = { routeIdx: rIdx, target: candId, dist: d };
                    }
                }
            }

            if (bestMove) {
                const r = routes[bestMove.routeIdx];
                r.stops.push(bestMove.target);
                r.currentEnd = bestMove.target;
                const newItems = items.filter(x => x.stationId === bestMove.target);
                r.items.push(...newItems);
                items = items.filter(x => x.stationId !== bestMove.target);
                unvisited.delete(bestMove.target);
            } else {
                break;
            }
        }

        // --- STEP 5: VEHICLE ASSIGNMENT & CAPACITY ---
        const finalRoutes = [];
        let droppedItems = [];
        const routeLoads = routes.map(r => ({
            ...r,
            totalLoad: r.items.reduce((s, x) => s + x.weight, 0)
        }));
        routeLoads.sort((a, b) => b.totalLoad - a.totalLoad);
        ownedVehicles.sort((a, b) => b.capacity - a.capacity);

        for (let i = 0; i < routeLoads.length; i++) {
            const r = routeLoads[i];
            const v = ownedVehicles[i] || ownedVehicles[ownedVehicles.length - 1];
            const assignedItems = [];
            let currentLoad = 0;
            for (let item of r.items) {
                if (currentLoad + item.weight <= v.capacity) {
                    currentLoad += item.weight;
                    assignedItems.push(item);
                } else {
                    droppedItems.push(item);
                }
            }
            const finalStops = this.solveTSP(r.stops);
            let dist = 0;
            for (let k = 0; k < finalStops.length - 1; k++) {
                dist += this.getDist(finalStops[k], finalStops[k + 1]);
            }

            finalRoutes.push({
                vehicleId: v.id,
                vehicleType: 'owned',
                capacity: v.capacity,
                fixedCost: v.fixedCost,
                load: currentLoad,
                stops: finalStops,
                cargoDetails: assignedItems,
                distance: dist,
                cost: dist * this.config.unitCost + (v.fixedCost || 0)
            });
        }

        // --- STEP 6: CARGO RESCUE (PASS 2) ---
        // Try to assign dropped items to any vehicle with remaining capacity, prioritizing proximity.
        if (droppedItems.length > 0) {
            traceLogs.push(`[RESCUE] Attempting to rescue ${droppedItems.length} dropped items...`);
            const stillDropped = [];

            droppedItems.sort((a, b) => b.weight - a.weight);

            for (let item of droppedItems) {
                let bestVehIdx = -1;
                let minAddedDist = Infinity;

                for (let i = 0; i < finalRoutes.length; i++) {
                    const r = finalRoutes[i];
                    if (r.load + item.weight <= r.capacity) {
                        let bestStopDist = Infinity;
                        for (let stop of r.stops) {
                            if (stop === this.DEPOT) continue;
                            const d = this.getDist(stop, item.stationId);
                            if (d < bestStopDist) bestStopDist = d;
                        }
                        if (r.stops.length <= 1) bestStopDist = this.getDist(this.DEPOT, item.stationId);

                        if (bestStopDist < minAddedDist) {
                            minAddedDist = bestStopDist;
                            bestVehIdx = i;
                        }
                    }
                }

                if (bestVehIdx !== -1) {
                    const r = finalRoutes[bestVehIdx];
                    traceLogs.push(`[RESCUE] Rescued Item ${item.name} (${item.weight}kg) -> Vehicle ${r.vehicleId} (Prox: ${minAddedDist.toFixed(2)}km)`);

                    r.load += item.weight;
                    r.cargoDetails.push(item);

                    if (!r.stops.includes(item.stationId)) {
                        r.stops.splice(r.stops.length - 1, 0, item.stationId);
                        r.stops = this.solveTSP(r.stops.filter(s => s !== this.DEPOT));
                    }

                    let dist = 0;
                    for (let k = 0; k < r.stops.length - 1; k++) {
                        dist += this.getDist(r.stops[k], r.stops[k + 1]);
                    }
                    r.distance = dist;
                    r.cost = dist * this.config.unitCost + r.fixedCost;

                } else {
                    stillDropped.push(item);
                    traceLogs.push(`[RESCUE] Failed to rescue Item ${item.name} (${item.weight}kg) - No Capacity`);
                }
            }
        }

        // --- STEP 7: RENTAL VEHICLES (FLEXIBLE MODE) ---
        if (droppedItems.length > 0 && this.isFlexible) {
            traceLogs.push(`[RENTAL] Found ${droppedItems.length} items needing rental vehicles...`);

            const rentalCap = this.config.rentalCapacity || 500;
            const rentalFixedCost = this.config.rentalCost || 200;
            let rentalCount = 1;

            droppedItems.sort((a, b) => b.weight - a.weight);

            const rentals = [];
            for (let item of droppedItems) {
                let placed = false;
                for (let r of rentals) {
                    if (r.load + item.weight <= rentalCap) {
                        r.load += item.weight;
                        r.items.push(item);
                        r.stops.add(item.stationId);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    rentals.push({
                        id: `Rent-${rentalCount++}`,
                        load: item.weight,
                        items: [item],
                        stops: new Set([item.stationId])
                    });
                }
            }

            for (let r of rentals) {
                const stopList = Array.from(r.stops);
                const optimizedStops = this.solveTSP(stopList);
                let dist = 0;
                for (let k = 0; k < optimizedStops.length - 1; k++) {
                    dist += this.getDist(optimizedStops[k], optimizedStops[k + 1]);
                }

                finalRoutes.push({
                    vehicleId: r.id,
                    vehicleType: 'rented',
                    capacity: rentalCap,
                    fixedCost: rentalFixedCost,
                    load: r.load,
                    stops: optimizedStops,
                    cargoDetails: r.items,
                    distance: dist,
                    cost: dist * this.config.unitCost + rentalFixedCost
                });
                traceLogs.push(`[RENTAL] Created ${r.id} with ${r.load}kg load. Cost: ${dist * this.config.unitCost + rentalFixedCost}`);
            }

            droppedItems = [];
        }

        return {
            routes: finalRoutes,
            dropped: droppedItems,
            totalCost: finalRoutes.reduce((s, x) => s + x.cost, 0),
            debugLogs: [`[USER ALGO] Created ${routes.length} routes.`, ...traceLogs]
        };
    }

    solve() {
        const resA = this.solveParallelInsertion();
        const resB = this.solveParallelNNUser();
        const winner = (resA.totalCost <= resB.totalCost) ? resA : resB;
        winner.debugLogs = [
            `[STRATEGY] Winner: ${resA.totalCost <= resB.totalCost ? 'A' : 'B'}`,
            `[STATS] A: ${resA.totalCost.toFixed(2)}, B: ${resB.totalCost.toFixed(2)}`,
            ...resB.debugLogs
        ];
        return winner;
    }

    solveTSP(stations) {
        const validStations = stations.filter(s => String(s) !== String(this.DEPOT));
        if (validStations.length === 0) return [this.DEPOT];

        // Open path cost: sum of legs + last node -> depot (no depot->first leg cost)
        const getOpenPathCost = (path) => {
            let d = 0;
            for (let i = 0; i < path.length - 1; i++) {
                d += this.getDist(path[i], path[i + 1]);
            }
            d += this.getDist(path[path.length - 1], this.DEPOT);
            return d;
        };

        // Greedy nearest-neighbor from a given start node
        const solveGreedyFrom = (startNode) => {
            const unvisited = new Set(validStations);
            const path = [startNode];
            let current = startNode;
            unvisited.delete(startNode);

            while (unvisited.size > 0) {
                let best = null;
                let minD = Infinity;
                for (let cand of unvisited) {
                    const d = this.getDist(cand, current);
                    if (d < minD) { minD = d; best = cand; }
                }
                if (best !== null) {
                    path.push(best);
                    unvisited.delete(best);
                    current = best;
                } else { break; }
            }
            return path;
        };

        // Try every node as start, pick the path with lowest total cost
        let bestPath = null;
        let minCost = Infinity;

        for (let startNode of validStations) {
            const path = solveGreedyFrom(startNode);
            const cost = getOpenPathCost(path);
            if (cost < minCost) {
                minCost = cost;
                bestPath = path;
            }
        }

        if (bestPath) {
            bestPath.push(this.DEPOT);
        } else {
            bestPath = [this.DEPOT];
        }

        return bestPath;
    }

    runSA(solution) {
        // Recalculate distances and costs for all routes, then return a clean copy
        let total = 0;
        solution.routes.forEach(r => {
            let d = 0;
            for (let i = 0; i < r.stops.length - 1; i++) {
                d += this.getDist(r.stops[i], r.stops[i + 1]);
            }
            r.distance = d;
            r.cost = d * this.config.unitCost + r.fixedCost;
            total += r.cost;
        });
        solution.totalCost = total;
        return JSON.parse(JSON.stringify(solution));
    }
}
