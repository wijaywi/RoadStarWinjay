import { useEffect, useState } from 'react';
import { Loader } from '../components/ui/Loader';
import { ErrorBanner } from '../components/ui/ErrorBanner';

interface Load {
  id: string;
  origin: string;
  destination: string;
  weight_lbs: number;
  date: string;
  status: 'new' | 'matched' | 'in_transit' | 'delivered';
  assigned_vehicle_id: string | null;
  assigned_driver_id: string | null;
}

interface Vehicle {
  id: string;
  plate_number: string;
  capacity_lbs: number;
  status: string;
  type?: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
  license_number?: string;
}

interface Schedule {
  driver_id: string;
  date: string;
}

export default function DispatchBoard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / Dialogs
  const [suggestedMatch, setSuggestedMatch] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [lRes, vRes, dRes, sRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/loads`),
        fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`),
        fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/schedules`)
      ]);
      if (!lRes.ok || !vRes.ok || !dRes.ok || !sRes.ok) throw new Error('Failed to fetch data');
      setLoads(await lRes.json());
      setVehicles(await vRes.json());
      setDrivers(await dRes.json());
      setSchedules(await sRes.json());
    } catch (err) {
      console.error(err);
      setError('Tidak bisa terhubung ke server, pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateLoadStatus = async (load: Load, newStatus: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/loads/${load.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestMatch = (load: Load) => {
    // 1. Capable trucks (capacity >= load weight and status is active)
    const capableTrucks = vehicles.filter(v => v.capacity_lbs >= load.weight_lbs && v.status === 'active');

    // 2. Available drivers (status === 'available')
    const availableDrivers = drivers.filter(d => d.status === 'available');

    // 3. Busy drivers on this date
    const busyDriverIds = schedules.filter(s => s.date === load.date).map(s => s.driver_id);
    const validDrivers = availableDrivers.filter(d => !busyDriverIds.includes(d.id));

    if (capableTrucks.length > 0 && validDrivers.length > 0) {
      setSuggestedMatch({
        load,
        vehicle: capableTrucks[0],
        driver: validDrivers[0]
      });
    } else {
      alert("No suitable match found! (Either no truck has enough capacity, or no driver is available on this date).");
    }
  };

  const confirmMatch = async () => {
    if (!suggestedMatch) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/loads/${suggestedMatch.load.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'matched',
          assigned_vehicle_id: suggestedMatch.vehicle.id,
          assigned_driver_id: suggestedMatch.driver.id
        })
      });
      setSuggestedMatch(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { id: 'new', title: 'New Load' },
    { id: 'matched', title: 'Matched' },
    { id: 'in_transit', title: 'In Transit' },
    { id: 'delivered', title: 'Delivered' }
  ];

  const getNextStatus = (current: string) => {
    const idx = columns.findIndex(c => c.id === current);
    return idx < columns.length - 1 ? columns[idx + 1].id : null;
  };

  const getPrevStatus = (current: string) => {
    const idx = columns.findIndex(c => c.id === current);
    return idx > 0 ? columns[idx - 1].id : null;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Dispatch Board (Load Matching)</h1>

      {error && <ErrorBanner message={error} />}

      {/* Kanban Board */}
      {loading ? (
        <Loader text="Loading loads and fleet status..." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className="bg-gray-100 p-4 rounded-lg flex-1 min-w-[300px] border border-gray-200">
              <h2 className="font-bold text-lg mb-4 border-b pb-2">{col.title}</h2>
            
            <div className="space-y-4">
              {loads.filter(l => l.status === col.id).map(load => {
                const assignedTruck = vehicles.find(v => v.id === load.assigned_vehicle_id);
                const assignedDriver = drivers.find(d => d.id === load.assigned_driver_id);

                return (
                  <div key={load.id} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm">{load.origin} ➔ {load.destination}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{load.date}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Weight: <strong>{load.weight_lbs} lbs</strong>
                    </div>

                    {load.assigned_vehicle_id && (
                      <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded mb-3">
                        <div>🚛 {assignedTruck ? assignedTruck.plate_number : load.assigned_vehicle_id}</div>
                        <div>👨‍✈️ {assignedDriver ? assignedDriver.name : load.assigned_driver_id}</div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {load.status === 'new' && (
                        <button 
                          onClick={() => handleSuggestMatch(load)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded"
                        >
                          Suggest Match
                        </button>
                      )}

                      <div className="flex justify-between mt-2 gap-2">
                        {getPrevStatus(load.status) && (
                          <button 
                            onClick={() => updateLoadStatus(load, getPrevStatus(load.status)!)}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-xs py-1 rounded font-medium"
                          >
                            ◀ Prev
                          </button>
                        )}
                        {getNextStatus(load.status) && load.status !== 'new' && (
                          <button 
                            onClick={() => updateLoadStatus(load, getNextStatus(load.status)!)}
                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs py-1 rounded font-medium"
                          >
                            Next ▶
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {loads.filter(l => l.status === col.id).length === 0 && (
                <div className="text-gray-400 text-sm text-center italic py-4">No loads</div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Suggestion Modal */}
      {suggestedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Suggested Match</h2>
            <p className="text-sm mb-4">We found the best available truck and driver for this load:</p>
            
            <div className="bg-gray-50 p-4 rounded border mb-4">
              <div className="mb-2">
                <strong className="block text-xs text-gray-500">Load Route</strong>
                {suggestedMatch.load.origin} ➔ {suggestedMatch.load.destination} ({suggestedMatch.load.weight_lbs} lbs)
              </div>
              <div className="mb-2">
                <strong className="block text-xs text-gray-500">Assigned Truck</strong>
                {suggestedMatch.vehicle.plate_number} - {suggestedMatch.vehicle.type} (Cap: {suggestedMatch.vehicle.capacity_lbs} lbs)
              </div>
              <div>
                <strong className="block text-xs text-gray-500">Assigned Driver</strong>
                {suggestedMatch.driver.name} (License: {suggestedMatch.driver.license_number})
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSuggestedMatch(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmMatch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm"
              >
                Accept & Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
