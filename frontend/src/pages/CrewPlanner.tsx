import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader } from '../components/ui/Loader';
import { ErrorBanner } from '../components/ui/ErrorBanner';

// Fix Leaflet default icon issues in Vite/Webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Driver {
  id: string;
  name: string;
  license_number: string;
  status: string;
}

interface Schedule {
  id: string;
  driver_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function MapInteraction({ setOrigin, setDestination, origin, destination }: any) {
  useMapEvents({
    click(e) {
      if (!origin) {
        setOrigin(e.latlng);
      } else if (!destination) {
        setDestination(e.latlng);
      } else {
        // reset if both are already set
        setOrigin(e.latlng);
        setDestination(null);
      }
    },
  });
  return null;
}

export default function CrewPlanner() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    driver_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '16:00'
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Map state
  const [origin, setOrigin] = useState<L.LatLng | null>(null);
  const [destination, setDestination] = useState<L.LatLng | null>(null);
  const [routeLine, setRouteLine] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dRes, sRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/schedules`)
      ]);
      if (!dRes.ok || !sRes.ok) throw new Error('Failed to fetch data');
      const dData = await dRes.json();
      const sData = await sRes.json();
      setDrivers(dData);
      setSchedules(sData);
      if (dData.length > 0 && !form.driver_id) {
        setForm(f => ({ ...f, driver_id: dData[0].id }));
      }
    } catch (err) {
      console.error(err);
      setError('Tidak bisa terhubung ke server, pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation 1: Max 8 hours
    const startMins = parseTime(form.start_time);
    const endMins = parseTime(form.end_time);
    
    if (endMins <= startMins) {
      setErrorMsg('End time must be after start time.');
      return;
    }
    if (endMins - startMins > 8 * 60) {
      setErrorMsg('Shift cannot exceed 8 hours.');
      return;
    }

    // Validation 2: No overlap for same driver & date
    const overlapping = schedules.some(s => {
      if (s.driver_id !== form.driver_id || s.date !== form.date) return false;
      const sStart = parseTime(s.start_time);
      const sEnd = parseTime(s.end_time);
      // Overlap condition
      return Math.max(startMins, sStart) < Math.min(endMins, sEnd);
    });

    if (overlapping) {
      setErrorMsg('This driver already has an overlapping shift on this date.');
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Route from OSRM when origin and destination change
  useEffect(() => {
    if (origin && destination) {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]); // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
            setRouteLine(coords);
            setRouteInfo({
              distance: route.distance,
              duration: route.duration
            });
          }
        })
        .catch(console.error);
    } else {
      setRouteLine([]);
      setRouteInfo({ distance: 0, duration: 0 });
    }
  }, [origin, destination]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Crew & Route Planner</h1>
      
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Crew Scheduling */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Driver Shifts</h2>
          
          <form onSubmit={handleAddSchedule} className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-medium text-sm mb-3">Assign New Shift</h3>
            {errorMsg && <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">{errorMsg}</div>}
            
            {loading ? (
              <Loader text="Loading drivers..." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Driver</label>
                    <select className="w-full border p-2 rounded text-sm" value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})}>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Date</label>
                    <input type="date" required className="w-full border p-2 rounded text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Start Time</label>
                    <input type="time" required className="w-full border p-2 rounded text-sm" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">End Time</label>
                    <input type="time" required className="w-full border p-2 rounded text-sm" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">Save Shift</button>
              </>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr className="border-b">
                  <th className="py-2 px-3">Driver</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Shift</th>
                  <th className="py-2 px-3">Hours</th>
                </tr>
              </thead>
              <tbody>
                {loading && schedules.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center"><Loader text="Loading schedules..." /></td></tr>
                ) : schedules.map(s => {
                  const driver = drivers.find(d => d.id === s.driver_id);
                  const hrs = ((parseTime(s.end_time) - parseTime(s.start_time)) / 60).toFixed(1);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{driver ? driver.name : s.driver_id}</td>
                      <td className="py-2 px-3">{s.date}</td>
                      <td className="py-2 px-3">{s.start_time} - {s.end_time}</td>
                      <td className="py-2 px-3">{hrs} h</td>
                    </tr>
                  )
                })}
                {!loading && schedules.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No shifts scheduled yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Route Planner */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col h-[600px]">
          <h2 className="text-xl font-semibold mb-2">Route Planner</h2>
          <p className="text-xs text-gray-500 mb-4">Click map once to set Origin, click again to set Destination.</p>
          
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex-1 bg-gray-50 p-2 rounded border">
              <span className="font-semibold block text-xs">Origin</span>
              {origin ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}` : 'Not set'}
            </div>
            <div className="flex-1 bg-gray-50 p-2 rounded border">
              <span className="font-semibold block text-xs">Destination</span>
              {destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : 'Not set'}
            </div>
          </div>
          
          {routeInfo.distance > 0 && (
            <div className="mb-4 bg-green-50 p-2 rounded border border-green-200 text-sm flex gap-4">
              <div><strong>Distance:</strong> {(routeInfo.distance / 1609.34).toFixed(2)} miles</div>
              <div><strong>Est. Time:</strong> {Math.round(routeInfo.duration / 60)} mins</div>
            </div>
          )}

          <div className="flex-1 bg-gray-200 rounded border overflow-hidden relative">
            <MapContainer 
                center={[32.7767, -96.7970]} 
                zoom={10} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* Simulated markers */}
                <Marker position={[32.7767, -96.7970]}>
                  <Popup> Dallas Hub <br/> 5 Drivers Active </Popup>
                </Marker>
                <Marker position={[32.85, -97.00]}>
                  <Popup> Driver: {drivers[0]?.name || 'Jane'} <br/> Status: En route </Popup>
                </Marker>

              <MapInteraction setOrigin={setOrigin} setDestination={setDestination} origin={origin} destination={destination} />
              
              {origin && <Marker position={origin}><Popup>Origin</Popup></Marker>}
              {destination && <Marker position={destination}><Popup>Destination</Popup></Marker>}
              {routeLine.length > 0 && <Polyline positions={routeLine as any} color="blue" weight={4} />}
            </MapContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
