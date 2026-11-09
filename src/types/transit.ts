export type VehicleType = 'bus' | 'tram' | 'express' | 'shuttle';

export type VehicleStatus = 'in_transit' | 'at_stop' | 'depot';

export interface TransitStop {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  shelter: boolean;
  wheelchair: boolean;
  realtimeDisplay: boolean;
  transfers: string[];
}

export interface TransitRoute {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  color: string;
  textColor: string;
  headwayMinutes: number;
  operatingHours: string;
  stops: TransitStop[];
  waypoints: [number, number][]; // [lat, lng]
  description: string;
}

export interface TransitVehicle {
  id: string;
  routeId: string;
  label: string;
  vehicleNumber: string;
  type: VehicleType;
  driverName: string;
  driverRating: number;
  driverTrips: number;
  currentLat: number;
  currentLng: number;
  bearing: number;
  speedKmH: number;
  status: VehicleStatus;
  occupancyPercent: number;
  capacity: number;
  currentPassengers: number;
  nextStopId: string;
  nextStopEtaSeconds: number;
  progressPercent: number;
  waypointIndex: number;
  isTripStarted: boolean; // Driver started the trip -> live tracking active
  tripStartedAt?: number;
  tripCode?: string;
  currentRoad?: string;
  delayMinutes?: number;
  batteryOrFuelPercent?: number;
  features?: {
    wheelchair?: boolean;
    ac?: boolean;
    wifi?: boolean;
    bikeRack?: boolean;
  };
  isDoorOpen?: boolean;
  lastPing: number;
}

export interface FavoriteItem {
  id: string;
  type: 'route' | 'stop';
  name: string;
  code: string;
  routeColor?: string;
}
