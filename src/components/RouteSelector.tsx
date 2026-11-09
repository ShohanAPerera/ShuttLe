import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { VehicleType } from '../types/transit';
import { Search, Star, Bus, Train, Zap, Shield, Navigation } from 'lucide-react';

export const RouteSelector: React.FC = () => {
  const {
    routes,
    vehicles,
    selectedRouteId,
    selectRoute,
    selectedVehicleId,
    selectVehicle,
    toggleFavorite,
    isFavorite,
    trackVehicle,
    trackedVehicleId,
  } = useTransit();

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRoutes = routes.filter((route) => {
    const matchesType = filterType === 'all' || route.type === filterType;
    const matchesSearch =
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getVehicleTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'tram':
        return <Train className="w-4 h-4" />;
      case 'express':
        return <Zap className="w-4 h-4" />;
      case 'shuttle':
        return <Shield className="w-4 h-4" />;
      case 'bus':
      default:
        return <Bus className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lines or routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-colors"
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          {['all', 'bus', 'express', 'tram', 'shuttle'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-1 text-center font-medium capitalize rounded-md transition-colors ${
                filterType === type
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Routes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {filteredRoutes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No transit lines match your filter.
          </div>
        ) : (
          filteredRoutes.map((route) => {
            const isSelected = selectedRouteId === route.id;
            const routeVehicles = vehicles.filter((v) => v.routeId === route.id);
            const isFav = isFavorite(route.id);

            return (
              <div
                key={route.id}
                className={`transition-colors ${
                  isSelected
                    ? 'bg-blue-50/50 dark:bg-blue-950/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Route Header Row */}
                <div
                  onClick={() => selectRoute(isSelected ? null : route.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Route Code Box */}
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: route.color }}
                    >
                      {route.code}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {route.name}
                        </h4>
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="capitalize">{route.type}</span>
                        <span aria-hidden="true">·</span>
                        <span>Every {route.headwayMinutes} min</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{routeVehicles.length} active</span>
                      </div>
                    </div>
                  </div>

                  {/* Favorite star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite({
                        id: route.id,
                        type: 'route',
                        name: route.name,
                        code: route.code,
                        routeColor: route.color,
                      });
                    }}
                    className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                      isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Sub-list of vehicles on this route when selected */}
                {isSelected && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Live Fleet on {route.code}:
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {routeVehicles.map((vehicle) => {
                        const isVehSelected = selectedVehicleId === vehicle.id;
                        const isTracked = trackedVehicleId === vehicle.id;

                        return (
                          <div
                            key={vehicle.id}
                            onClick={() => {
                              selectVehicle(vehicle.id);
                              if (vehicle.isTripStarted) {
                                trackVehicle(vehicle.id);
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex flex-col gap-2 ${
                              isTracked
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500'
                                : isVehSelected
                                ? 'border-blue-400 bg-white dark:bg-slate-800 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getVehicleTypeIcon(vehicle.type)}
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{vehicle.label}</span>
                                    {vehicle.isTripStarted ? (
                                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>GPS Live</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                        Idle in Depot
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px] font-mono tabular-nums">
                                    {vehicle.isTripStarted ? `${vehicle.speedKmH} km/h · ${vehicle.occupancyPercent}% load` : 'Driver not started'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[11px] font-medium ${
                                    !vehicle.delayMinutes || vehicle.delayMinutes === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                                  }`}
                                >
                                  {vehicle.isTripStarted
                                    ? (!vehicle.delayMinutes || vehicle.delayMinutes === 0 ? 'On Time' : `+${vehicle.delayMinutes}m`)
                                    : 'Awaiting Run'}
                                </span>
                              </div>
                            </div>

                            {/* Passenger Live Location Tracking Button */}
                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {vehicle.isTripStarted ? `Lat: ${vehicle.currentLat.toFixed(3)}, Lng: ${vehicle.currentLng.toFixed(3)}` : 'Waiting for driver start'}
                              </span>

                              {vehicle.isTripStarted ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    trackVehicle(isTracked ? null : vehicle.id);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                    isTracked
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                                  }`}
                                >
                                  {isTracked ? 'Tracking Live ✓' : 'Track Real Location'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-amber-500 font-medium">
                                  Starts with driver
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
