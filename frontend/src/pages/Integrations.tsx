import { useEffect, useState, useRef } from 'react';
import { Loader } from '../components/ui/Loader';
import { ErrorBanner } from '../components/ui/ErrorBanner';

export default function Integrations() {
  const [loads, setLoads] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLoads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/loads`);
      if (!res.ok) throw new Error('Failed to fetch data');
      setLoads(await res.json());
    } catch (err) {
      console.error(err);
      setError('Tidak bisa terhubung ke server, pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  const handleExportCSV = () => {
    if (loads.length === 0) return alert('No loads to export');
    
    const header = 'id,origin,destination,weight_lbs,status,date';
    const rows = loads.map(l => `${l.id},"${l.origin}","${l.destination}",${l.weight_lbs},${l.status},${l.date}`);
    const csvContent = [header, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Skip header, parse basic rows
    const newLoads = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/"/g, ''));
      if (cols.length >= 3) {
        newLoads.push({
          origin: cols[1] || 'Unknown',
          destination: cols[2] || 'Unknown',
          weight_lbs: Number(cols[3]) || 2000,
          date: cols[5] || new Date().toISOString().split('T')[0]
        });
      }
    }

    if (newLoads.length > 0) {
      for (const load of newLoads) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/loads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(load)
          });
        } catch (err) {
          console.error(err);
        }
      }
      alert(`Successfully imported ${newLoads.length} loads!`);
      fetchLoads();
    } else {
      alert('No valid data found in CSV.');
    }
    
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Integration Gateway</h1>
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Export / Import CSV */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Bulk Data (CSV)</h2>
          
          {loading ? (
            <Loader text="Loading loads data..." />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border rounded">
                <h3 className="font-bold mb-2">Export Data</h3>
                <p className="text-sm text-gray-600 mb-3">Download all current Load data as a CSV file.</p>
                <button 
                  onClick={handleExportCSV}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold"
                >
                  Download CSV
                </button>
              </div>

            <div className="p-4 bg-gray-50 border rounded">
              <h3 className="font-bold mb-2">Import Data</h3>
              <p className="text-sm text-gray-600 mb-3">Upload a CSV file to create new Loads in bulk.</p>
              <input 
                type="file" 
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Upload CSV'}
              </button>
            </div>
          </div>
        )}
      </div>

        {/* API Docs */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">REST API Documentation</h2>
          <p className="text-sm text-gray-600 mb-4">Integrate your external systems directly with our endpoints.</p>
          
          <div className="space-y-3 h-[300px] overflow-y-auto pr-2">
            
            <div className="border rounded p-3 text-sm">
              <div className="flex gap-2 items-center mb-1">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-xs">GET</span>
                <span className="font-mono">/api/fleet/vehicles</span>
              </div>
              <p className="text-gray-600 text-xs">Returns array of vehicles.</p>
            </div>

            <div className="border rounded p-3 text-sm">
              <div className="flex gap-2 items-center mb-1">
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-xs">POST</span>
                <span className="font-mono">/api/loads</span>
              </div>
              <p className="text-gray-600 text-xs mb-2">Create a new load.</p>
              <pre className="bg-gray-800 text-green-400 p-2 rounded text-[10px] overflow-x-auto">
{`{
  "origin": "Dallas, TX",
  "destination": "Houston, TX",
  "weight_lbs": 33000,
  "date": "2026-10-15"
}`}
              </pre>
            </div>

            <div className="border rounded p-3 text-sm">
              <div className="flex gap-2 items-center mb-1">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold text-xs">PUT</span>
                <span className="font-mono">/api/loads/:id</span>
              </div>
              <p className="text-gray-600 text-xs">Update load status (e.g. matched, in_transit).</p>
            </div>

            <div className="border rounded p-3 text-sm">
              <div className="flex gap-2 items-center mb-1">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-xs">GET</span>
                <span className="font-mono">/api/schedules</span>
              </div>
              <p className="text-gray-600 text-xs">Get driver schedules and shifts.</p>
            </div>

            <div className="border rounded p-3 text-sm">
              <div className="flex gap-2 items-center mb-1">
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-xs">POST</span>
                <span className="font-mono">/api/insights/summary</span>
              </div>
              <p className="text-gray-600 text-xs">Generate AI summary of fleet and loads (Requires Anthropic API Key).</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
