import React, { useEffect, useState } from 'react';
import { Loader } from '../components/ui/Loader';
import { ErrorBanner } from '../components/ui/ErrorBanner';

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_lbs: number;
  status: string;
  mileage: number;
}

interface Driver {
  id: string;
  name: string;
  license_number: string;
  status: string;
  phone: string;
}

export default function FleetHub() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Forms
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate_number: '', type: '20ft Container', capacity_lbs: 61000 });

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', license_number: '', phone: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [vehRes, drvRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`),
        fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`)
      ]);
      
      if (!vehRes.ok || !drvRes.ok) throw new Error('Failed to fetch data');

      const vehData = await vehRes.json();
      const drvData = await drvRes.json();
      setVehicles(vehData);
      setDrivers(drvData);
    } catch (err: any) {
      console.error('Error fetching fleet data', err);
      setError('Tidak bisa terhubung ke server, pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle)
      });
      setShowVehicleForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to add vehicle');
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver)
      });
      setShowDriverForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to add driver');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Fleet Hub</h1>
      
      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Loader text="Loading fleet data..." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Vehicles Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Vehicles</h2>
              <button 
                onClick={() => setShowVehicleForm(!showVehicleForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {showVehicleForm ? 'Cancel' : 'Add Vehicle'}
              </button>
            </div>

            {showVehicleForm && (
              <form onSubmit={handleAddVehicle} className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plate Number</label>
                    <input required className="w-full border p-2 rounded" value={newVehicle.plate_number} onChange={e => setNewVehicle({...newVehicle, plate_number: e.target.value})} placeholder="CA-9XYZ23" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select className="w-full border p-2 rounded" value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}>
                      <option>20ft Container</option>
                      <option>40ft Container</option>
                      <option>Box Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity (lbs)</label>
                    <input required type="number" className="w-full border p-2 rounded" value={newVehicle.capacity_lbs} onChange={e => setNewVehicle({...newVehicle, capacity_lbs: Number(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">Save Vehicle</button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="border-b">
                    <th className="py-3 px-4 font-semibold">Plate</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Capacity</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">{v.plate_number}</td>
                      <td className="py-3 px-4">{v.type}</td>
                      <td className="py-3 px-4">{v.capacity_lbs} lbs</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === 'active' ? 'bg-green-100 text-green-800' : v.status === 'maintenance' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-500">No vehicles found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drivers Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Drivers</h2>
              <button 
                onClick={() => setShowDriverForm(!showDriverForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {showDriverForm ? 'Cancel' : 'Add Driver'}
              </button>
            </div>

            {showDriverForm && (
              <form onSubmit={handleAddDriver} className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input required className="w-full border p-2 rounded" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">License No</label>
                    <input required className="w-full border p-2 rounded" value={newDriver.license_number} onChange={e => setNewDriver({...newDriver, license_number: e.target.value})} placeholder="CDL-CA-123456" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input required className="w-full border p-2 rounded" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} placeholder="+1-555-0198" />
                  </div>
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">Save Driver</button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="border-b">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">License</th>
                    <th className="py-3 px-4 font-semibold">Phone</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{d.name}</td>
                      <td className="py-3 px-4">{d.license_number}</td>
                      <td className="py-3 px-4">{d.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === 'available' ? 'bg-green-100 text-green-800' : d.status === 'on_duty' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-500">No drivers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

