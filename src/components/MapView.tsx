import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTransit } from '../context/TransitContext';
import { Locate, Maximize2, Layers } from 'lucide-react';

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayersRef = useRef<{ [routeId: string]: L.Polyline }>({});
  const vehicleMarkersRef = useRef<{ [vehicleId: string]: L.Marker }>({});
  const stopMarkersRef = useRef<{ [stopId: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  const {
    routes,
    vehicles,
    selectedRouteId,
    selectedVehicleId,
    selectedStopId,
    userLocation,
    selectRoute,
    selectVehicle,
    selectStop,
    theme,
    trackedVehicleId,
    trackVehicle,
  } = useTransit();

  const [mapStyle, setMapStyle] = useState<'osm' | 'carto' | 'voyager'>('osm');
  const [isFollowingVehicle, setIsFollowingVehicle] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center around Downtown Transit Corridor
    const map = L.map(mapContainerRef.current, {
      center: [37.7858, -122.4065],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer: OpenStreetMap
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on theme or style change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    if (mapStyle === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (theme === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapStyle === 'carto') {
      url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }

    tileLayerRef.current.setUrl(url);
  }, [theme, mapStyle]);

  // Render Routes (Polylines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear removed routes
    Object.keys(routeLayersRef.current).forEach((id) => {
      if (!routes.some((r) => r.id === id)) {
        routeLayersRef.current[id].remove();
        delete routeLayersRef.current[id];
      }
    });

    routes.forEach((route) => {
      const isSelected = selectedRouteId === route.id;
      const isDimmed = selectedRouteId !== null && !isSelected;

      const polylineOpts: L.PolylineOptions = {
        color: route.color,
        weight: isSelected ? 6 : isDimmed ? 3 : 4,
        opacity: isSelected ? 0.95 : isDimmed ? 0.25 : 0.75,
        lineCap: 'round',
        lineJoin: 'round',
      };

      if (!routeLayersRef.current[route.id]) {
        const polyline = L.polyline(route.waypoints, polylineOpts).addTo(map);
        polyline.on('click', () => {
          selectRoute(route.id);
        });
        routeLayersRef.current[route.id] = polyline;
      } else {
        routeLayersRef.current[route.id].setStyle(polylineOpts);
      }
    });
  }, [routes, selectedRouteId, selectRoute]);

  // Render Stops Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Gather visible stops based on selected route
    const allStops = routes.flatMap((r) =>
      r.stops.map((s) => ({ ...s, routeColor: r.color, routeCode: r.code, routeId: r.id }))
    );

    // Remove obsolete
    Object.keys(stopMarkersRef.current).forEach((stopId) => {
      if (!allStops.some((s) => s.id === stopId)) {
        stopMarkersRef.current[stopId].remove();
        delete stopMarkersRef.current[stopId];
      }
    });

    allStops.forEach((stop) => {
      const isSelected = selectedStopId === stop.id;
      const isRouteSelected = selectedRouteId === null || selectedRouteId === stop.routeId;

      const stopHtml = `
        <div style="
          width: ${isSelected ? '24px' : '14px'};
          height: ${isSelected ? '24px' : '14px'};
          border-radius: 9999px;
          background: ${isSelected ? '#FFFFFF' : stop.routeColor};
          border: ${isSelected ? `4px solid ${stop.routeColor}` : '2px solid #FFFFFF'};
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: ${isRouteSelected ? '1' : '0.3'};
        "></div>
      `;

      const icon = L.divIcon({
        className: 'stop-marker-icon',
        html: stopHtml,
        iconSize: [isSelected ? 24 : 14, isSelected ? 24 : 14],
        iconAnchor: [isSelected ? 12 : 7, isSelected ? 12 : 7],
      });

      if (!stopMarkersRef.current[stop.id]) {
        const marker = L.marker([stop.lat, stop.lng], { icon, zIndexOffset: isSelected ? 100 : 20 }).addTo(map);
        marker.on('click', () => {
          selectStop(stop.id);
        });
        stopMarkersRef.current[stop.id] = marker;
      } else {
        const marker = stopMarkersRef.current[stop.id];
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 100 : 20);
      }
    });
  }, [routes, selectedStopId, selectedRouteId, selectStop]);

  // Render Vehicles Markers with real-time smooth animation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up old markers
    Object.keys(vehicleMarkersRef.current).forEach((vId) => {
      if (!vehicles.some((v) => v.id === vId)) {
        vehicleMarkersRef.current[vId].remove();
        delete vehicleMarkersRef.current[vId];
      }
    });

    vehicles.forEach((vehicle) => {
      const route = routes.find((r) => r.id === vehicle.routeId);
      const isSelected = selectedVehicleId === vehicle.id;
      const isTracked = trackedVehicleId === vehicle.id;
      const isDimmed = selectedRouteId !== null && selectedRouteId !== vehicle.routeId;

      const color = route ? route.color : '#3B82F6';
      const label = route ? route.code : vehicle.label;

      const vehicleHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: ${isDimmed ? '0.25' : '1'};
          transform: scale(${isSelected || isTracked ? '1.2' : '1'});
          transition: transform 0.2s ease;
        ">
          ${
            isTracked && vehicle.isTripStarted
              ? `<div class="user-pulse" style="
                  position: absolute;
                  width: 50px;
                  height: 50px;
                  border-radius: 9999px;
                  background: rgba(37,99,235,0.3);
                  pointer-events: none;
                "></div>`
              : ''
          }

          <!-- Bearing pointer arrow -->
          <div style="
            position: absolute;
            width: 38px;
            height: 38px;
            transform: rotate(${vehicle.bearing}deg);
            pointer-events: none;
          ">
            <div style="
              width: 0;
              height: 0;
              margin: 0 auto;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-bottom: 9px solid ${color};
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
            "></div>
          </div>

          <!-- Vehicle body pill -->
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${vehicle.isTripStarted ? color : '#64748B'};
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 7px;
            border-radius: 9999px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
            z-index: 2;
          ">
            <span>${label}</span>
            ${
              !vehicle.isTripStarted
                ? `<span style="font-size: 8px; opacity: 0.9;">DEPOT</span>`
                : vehicle.speedKmH > 0
                ? `<span style="font-size: 9px; opacity: 0.9; font-weight: 500;">${vehicle.speedKmH}k</span>`
                : `<span style="font-size: 9px; opacity: 0.9;">STOP</span>`
            }
          </div>

          ${
            isTracked && vehicle.isTripStarted
              ? `<div style="
                  position: absolute;
                  bottom: -18px;
                  background: #2563EB;
                  color: white;
                  font-size: 9px;
                  font-weight: 700;
                  padding: 1px 6px;
                  border-radius: 4px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  z-index: 3;
                ">LIVE TRACKING</div>`
              : ''
          }
        </div>
      `;

      const icon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: vehicleHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!vehicleMarkersRef.current[vehicle.id]) {
        const marker = L.marker([vehicle.currentLat, vehicle.currentLng], {
          icon,
          zIndexOffset: isSelected || isTracked ? 500 : 300,
        }).addTo(map);

        marker.on('click', () => {
          selectVehicle(vehicle.id);
        });

        vehicleMarkersRef.current[vehicle.id] = marker;
      } else {
        const marker = vehicleMarkersRef.current[vehicle.id];
        marker.setLatLng([vehicle.currentLat, vehicle.currentLng]);
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected || isTracked ? 500 : 300);
      }
    });
  }, [vehicles, routes, selectedVehicleId, selectedRouteId, trackedVehicleId, selectVehicle]);

  // User location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const userHtml = `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <div class="user-pulse" style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: rgba(37,99,235,0.4);"></div>
        <div style="width: 12px; height: 12px; border-radius: 9999px; background: #2563EB; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.3); z-index: 2;"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'stop-marker-icon',
      html: userHtml,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 400,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Auto-pan / follow selected or live tracked vehicle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isFollowingVehicle) return;

    const targetVehicleId = trackedVehicleId || selectedVehicleId;
    if (!targetVehicleId) return;

    const v = vehicles.find((item) => item.id === targetVehicleId);
    if (v) {
      map.panTo([v.currentLat, v.currentLng], { animate: true, duration: 0.6 });
    }
  }, [vehicles, selectedVehicleId, trackedVehicleId, isFollowingVehicle]);

  // Recenter / Fit All Routes
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedRouteId) {
      const route = routes.find((r) => r.id === selectedRouteId);
      if (route && route.waypoints.length > 0) {
        const bounds = L.latLngBounds(route.waypoints);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
        return;
      }
    }

    const allCoords = routes.flatMap((r) => r.waypoints);
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  };

  const handleCenterUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Utility Bar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Recenter Bounds */}
        <button
          onClick={handleFitAll}
          title="Fit view to route network"
          className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Center User */}
        <button
          onClick={handleCenterUser}
          title="Center on my location"
          className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <Locate className="w-4 h-4" />
        </button>

        {/* Style Switcher */}
        <button
          onClick={() => {
            setMapStyle((prev) => (prev === 'carto' ? 'osm' : prev === 'osm' ? 'voyager' : 'carto'));
          }}
          title="Toggle map style"
          className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Follow Vehicle Toggle */}
        {(selectedVehicleId || trackedVehicleId) && (
          <button
            onClick={() => setIsFollowingVehicle(!isFollowingVehicle)}
            title={isFollowingVehicle ? 'Camera tracking locked' : 'Camera tracking paused'}
            className={`flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-md transition-colors border ${
              isFollowingVehicle
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            {isFollowingVehicle ? 'Tracking Locked' : 'Free Pan'}
          </button>
        )}
      </div>

      {/* Network Live Legend */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-4 px-3 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">Lines:</span>
        {routes.map((r) => (
          <button
            key={r.id}
            onClick={() => selectRoute(selectedRouteId === r.id ? null : r.id)}
            className={`flex items-center gap-1.5 transition-opacity ${
              selectedRouteId === null || selectedRouteId === r.id ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <span className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: r.color }} />
            <span className="text-slate-800 dark:text-slate-200">{r.code}</span>
          </button>
        ))}
        {selectedRouteId && (
          <button
            onClick={() => selectRoute(null)}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline ml-1"
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};
