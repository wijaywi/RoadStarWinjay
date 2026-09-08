import { useEffect, useState } from 'react';
import { Loader } from '../components/ui/Loader';
import { ErrorBanner } from '../components/ui/ErrorBanner';

interface Load {
  id: string;
  origin: string;
  destination: string;
  weight_lbs: number;
  status: string;
  assigned_vehicle_id: string | null;
}

interface Vehicle {
  id: string;
  plate_number: string;
  capacity_lbs: number;
  mileage: number;
  type: string;
}

export default function InsightAI() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/loads`),
      fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`)
    ])
    .then(async ([lRes, vRes]) => {
      if (!lRes.ok || !vRes.ok) throw new Error('Failed to fetch data');
      const lData = await lRes.json();
      const vData = await vRes.json();
      setLoads(lData);
      setVehicles(vData);
    })
    .catch(err => {
      console.error(err);
      setError('Tidak bisa terhubung ke server, pastikan backend berjalan.');
    })
    .finally(() => setLoading(false));
  }, []);

  const calculateRisk = (load: Load) => {
    if (!load.assigned_vehicle_id) return 'Unknown';
    const truck = vehicles.find(v => v.id === load.assigned_vehicle_id);
    if (!truck) return 'Unknown';
    
    // Heuristic: Weight close to capacity = higher risk of delay (due to speed/performance)
    const utilization = load.weight_lbs / truck.capacity_lbs;
    if (utilization > 0.9) return 'High';
    if (utilization > 0.7) return 'Medium';
    return 'Low';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'High') return 'bg-red-100 text-red-800';
    if (risk === 'Medium') return 'bg-yellow-100 text-yellow-800';
    if (risk === 'Low') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const generateSummary = async () => {
    setLoadingAI(true);
    setAiSummary('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/insights/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleet: vehicles, loads })
      });
      const data = await res.json();
      if (data.error) {
        setAiSummary(`Error: ${data.error}`);
      } else {
        setAiSummary(data.summary);
      }
    } catch (err: any) {
      setAiSummary(`Request failed: ${err.message}`);
    }
    setLoadingAI(false);
  };

  const activeLoads = loads.filter(l => ['matched', 'in_transit'].includes(l.status));
  const alerts = vehicles.filter(v => v.mileage >= 100000);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Insight AI (Predictive Analytics)</h1>
      
      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Loader text="Loading insights data..." />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Delay Risk */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-blue-900">Delay Risk (Active Loads)</h2>
              <div className="space-y-3">
                {activeLoads.length === 0 && <p className="text-gray-500 text-sm">No active loads.</p>}
                {activeLoads.map(load => {
                  const risk = calculateRisk(load);
                  return (
                    <div key={load.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">{load.origin} ➔ {load.destination}</div>
                        <div className="text-xs text-gray-500">Weight: {load.weight_lbs} lbs | Truck: {load.assigned_vehicle_id}</div>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${getRiskColor(risk)}`}>
                        {risk} Risk
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Maintenance Alert */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-red-900">Maintenance Alerts</h2>
              <div className="space-y-3">
                {alerts.length === 0 && <p className="text-gray-500 text-sm">All vehicles are in good condition.</p>}
                {alerts.map(v => (
                  <div key={v.id} className="flex justify-between items-center p-3 border rounded border-red-200 bg-red-50">
                    <div>
                      <div className="font-medium text-sm">🚚 {v.plate_number}</div>
                      <div className="text-xs text-red-600">Type: {v.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-800">{v.mileage.toLocaleString()} mi</div>
                      <div className="text-xs text-red-600 font-medium">Service Required</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-lg shadow-lg text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">✨ Claude AI Summary</h2>
              <button 
                onClick={generateSummary}
                disabled={loadingAI}
                className="bg-white text-blue-900 px-6 py-2 rounded font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                {loadingAI ? 'Generating...' : 'Generate AI Summary'}
              </button>
            </div>
            
            <div className="bg-white/10 p-6 rounded min-h-[150px]">
              {aiSummary ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiSummary}</div>
              ) : (
                <div className="text-blue-200 text-sm italic">Click the button above to generate an executive summary based on current fleet and load data. (Requires ANTHROPIC_API_KEY in backend .env)</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
