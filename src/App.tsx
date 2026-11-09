import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransitProvider, useTransit } from './context/TransitContext';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { RouteSelector } from './components/RouteSelector';
import { StopArrivalsPanel } from './components/StopArrivalsPanel';
import { DriverCockpit } from './components/driver/DriverCockpit';
import { VehicleDetailDrawer } from './components/VehicleDetailDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { MapPin, Navigation, Gauge, Radio, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    liveTripToast,
    dismissTripToast,
    trackVehicle,
    vehicles,
  } = useTransit();
  const { role } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Urban Blue Top Bar */}
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'driver_cockpit' ? (
          /* Driver Shift & Cabin View */
          <DriverCockpit />
        ) : (
          /* Map-Centric Views for Commuters & Route Observation */
          <>
            {/* Left Contextual Sidebar Panel (380px) */}
            <aside className="w-full md:w-[380px] lg:w-[420px] h-full shrink-0 z-20 flex flex-col shadow-sm">
              {activeTab === 'tracker' && <RouteSelector />}
              {activeTab === 'stops' && <StopArrivalsPanel />}
            </aside>

            {/* Interactive OpenStreetMap Canvas Viewport */}
            <main className="hidden md:block flex-1 h-full relative">
              <MapView />
              <VehicleDetailDrawer />
            </main>
          </>
        )}

        {/* Real-Time Driver Trip Broadcast Notification for Commuters */}
        {liveTripToast && (
          <div className="absolute top-4 right-6 z-50 max-w-sm bg-blue-600 text-white p-4 rounded-xl shadow-2xl border border-blue-400 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg text-white shrink-0 mt-0.5">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Driver Started Trip · Live Tracking Ready
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {liveTripToast.vehicleLabel} ({liveTripToast.routeName})
                </div>
                <p className="text-[11px] text-blue-100 mt-1 leading-snug">
                  {liveTripToast.message}
                </p>
                <button
                  onClick={() => {
                    const targetVeh = vehicles.find((v) => v.label === liveTripToast.vehicleLabel);
                    if (targetVeh) {
                      trackVehicle(targetVeh.id);
                      setActiveTab('tracker');
                    }
                    dismissTripToast();
                  }}
                  className="mt-2 text-[11px] font-bold bg-white text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors inline-block"
                >
                  Track Live Location on Map →
                </button>
              </div>
            </div>

            <button
              onClick={dismissTripToast}
              className="p-1 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Tailored to Commuter vs Driver) */}
      <div className="md:hidden flex items-center justify-around py-2.5 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30">
        {role === 'driver' ? (
          <>
            <button
              onClick={() => setActiveTab('driver_cockpit')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                activeTab === 'driver_cockpit' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>Cockpit</span>
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                activeTab === 'tracker' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Route Map</span>
            </button>
            <button
              onClick={() => setActiveTab('stops')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                activeTab === 'stops' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Stations</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                activeTab === 'tracker' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Live Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('stops')}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                activeTab === 'stops' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Stations & Stops</span>
            </button>
          </>
        )}
      </div>

      {/* Urban Blue Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TransitProvider>
        <MainLayout />
      </TransitProvider>
    </AuthProvider>
  );
}
