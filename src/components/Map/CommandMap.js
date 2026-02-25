"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";
import { STATIONS } from "@/lib/data";

const VEHICLE_COLORS = [
    "#22d3ee", // Cyan-400
    "#a78bfa", // Violet-400
    "#34d399", // Emerald-400
    "#f472b6", // Pink-400
    "#fbbf24", // Amber-400
];

const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const truckIcon = new L.DivIcon({
    html: '<div class="w-8 h-8 flex items-center justify-center bg-white rounded-full border-2 border-cyan-500 shadow-lg text-lg">🚚</div>',
    className: "custom-truck-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const DepotIcon = new L.DivIcon({
    html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]"></div>',
    className: "custom-depot-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const DroppedIcon = new L.DivIcon({
    html: '<div class="w-6 h-6 bg-red-600 rounded-sm border-2 border-white flex items-center justify-center shadow-lg text-white font-bold text-xs">!</div>',
    className: "custom-dropped-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Helper to decode OSRM - Restored for Visualization Only
// Logic is Graph-Based (Dijkstra), but Drawing is OSRM-Based (Real Road curvature).
async function fetchFullRoute(waypoints) {
    if (!waypoints || waypoints.length < 2) return [];

    // Filter invalid coordinates
    const validWaypoints = waypoints.filter(p => !isNaN(p[0]) && !isNaN(p[1]));
    if (validWaypoints.length < 2) return waypoints;

    try {
        // Construct coordinate string: "lng,lat;lng,lat;..."
        const coordString = validWaypoints.map(p => `${p[1]},${p[0]}`).join(';');

        // Using OpenStreetMap.de for better reliability
        const response = await fetch(
            `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordString}?overview=full&geometries=geojson`
        );

        if (!response.ok) throw new Error(`OSRM Status: ${response.status}`);

        const data = await response.json();
        if (data.routes && data.routes[0]) {
            return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        }
    } catch (error) {
        console.warn("OSRM Polyline Fetch Error:", error);
    }
    return validWaypoints; // Fallback to straight lines
}

export default function CommandMap({ routes = [], droppedItems = [], simulationRunning = false, stations = STATIONS }) {
    const [vehiclePositions, setVehiclePositions] = useState([]);
    const [detailedRoutes, setDetailedRoutes] = useState([]);
    const animationRef = useRef(null);

    // Process Graph Paths & Enhance with OSRM
    useEffect(() => {
        let isMounted = true;

        const loadRoutes = async () => {
            if (!routes || routes.length === 0) {
                setDetailedRoutes([]);
                return;
            }

            // Sequential Fetch to avoid OSRM Rate Limiting
            const newDetailedRoutes = [];
            for (const route of routes) {
                if (!route.stops || route.stops.length < 2) {
                    newDetailedRoutes.push([]);
                    continue;
                }

                // Robust ID Matching (String vs Number)
                const waypoints = route.stops
                    .map(id => ({ id, station: stations.find(s => String(s.id) === String(id)) }))
                    .filter(({ id, station }) => {
                        if (!station) console.warn(`[CommandMap] Station not found for ID: ${id}`);
                        return station;
                    })
                    .map(({ station }) => [station.lat, station.lng]);

                if (waypoints.length < 2) {
                    newDetailedRoutes.push([]);
                    continue;
                }

                // Fetch with small delay (300ms) for stability without being too slow
                await new Promise(r => setTimeout(r, 300));
                const path = await fetchFullRoute(waypoints);
                newDetailedRoutes.push(path);
            }

            if (isMounted) {
                setDetailedRoutes(newDetailedRoutes);
            }
        };

        loadRoutes();
        return () => { isMounted = false; };
    }, [routes, stations]);

    useEffect(() => {
        if (!simulationRunning || detailedRoutes.length === 0) {
            setVehiclePositions([]);
            return;
        }

        const startTime = performance.now();

        // Normalize speed: Longest route takes 15 seconds
        const maxDist = Math.max(...routes.map(r => r.distance || 0));
        const MAX_DURATION = 15000;
        const durations = routes.map(r => {
            if (!maxDist) return MAX_DURATION;
            // Ensure minimum duration (e.g. 2s) so short routes don't zip too fast
            return Math.max((r.distance / maxDist) * MAX_DURATION, 2000);
        });

        const animate = (time) => {
            const elapsed = time - startTime;

            // Loop animation for longest route to keep cycle going? 
            // Or just one-shot? The previous one looped (elapsed % DURATION).
            // Let's loop based on the longest duration.
            const cycleElapsed = elapsed % (MAX_DURATION + 2000); // Add 2s pause at end

            // Calculate positions along the detailed path
            const currentPositions = detailedRoutes.map((path, idx) => {
                if (!path || path.length < 2) return null;

                const duration = durations[idx];

                // If this specific vehicle has finished its route in this cycle
                if (cycleElapsed >= duration) {
                    return path[path.length - 1]; // Stay at end
                }

                const vehicleProgress = cycleElapsed / duration;

                const totalPoints = path.length - 1;
                const exactIndex = vehicleProgress * totalPoints;
                const currentIndex = Math.floor(exactIndex);
                const nextIndex = Math.min(currentIndex + 1, totalPoints);
                const segmentProgress = exactIndex - currentIndex;

                const start = path[currentIndex];
                const end = path[nextIndex];

                if (!start || !end) return path[path.length - 1];

                const lat = start[0] + (end[0] - start[0]) * segmentProgress;
                const lng = start[1] + (end[1] - start[1]) * segmentProgress;

                return [lat, lng];
            }).filter(pos => pos !== null);

            setVehiclePositions(currentPositions);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [simulationRunning, detailedRoutes, routes]);

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
            <MapContainer
                center={[40.7656, 29.9189]} // Izmit Center
                zoom={10}
                style={{ height: "100%", width: "100%", background: "#0f172a" }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Stations */}
                {stations.map((station) => (
                    <Marker
                        key={station.id}
                        position={[station.lat, station.lng]}
                        icon={station.isDepot ? DepotIcon : customIcon}
                    >
                        <Popup>
                            <div className="text-black">
                                <strong>{station.name}</strong>
                                {station.isDepot && <><br />Depot (HQ)</>}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Dropped Items Visualization */}
                {droppedItems.map((item, idx) => {
                    const station = stations.find(s => s.id === item.stationId);
                    if (!station) return null;
                    return (
                        <Marker
                            key={`dropped-${idx}`}
                            position={[station.lat, station.lng]} // Maybe offset slightly?
                            icon={DroppedIcon}
                            zIndexOffset={2000} // Above everything
                        >
                            <Popup>
                                <div className="text-red-600 font-bold">
                                    DROPPED: {item.weight}kg <br />
                                    {item.name}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Routes */}
                {detailedRoutes.map((path, idx) => (
                    <Polyline
                        key={idx}
                        positions={path}
                        pathOptions={{
                            color: VEHICLE_COLORS[idx % VEHICLE_COLORS.length],
                            weight: 4,
                            opacity: 0.5,
                            dashArray: "10, 10",
                        }}
                    />
                ))}

                {/* Animated Vehicles */}
                {simulationRunning && vehiclePositions.map((pos, idx) => (
                    <Marker
                        key={`v-${idx}`}
                        position={pos}
                        icon={truckIcon}
                        zIndexOffset={1000}
                    >
                        <Popup>Vehicle {idx + 1}</Popup>
                    </Marker>
                ))}

            </MapContainer>

            {/* Legend / Overlay */}
            <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur text-white p-2 rounded-lg border border-white/10 text-xs">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    HQ Node
                </div>
            </div>
        </div>
    );
}
