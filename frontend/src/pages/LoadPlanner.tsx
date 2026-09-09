import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Loader } from '../components/ui/Loader';
import { ErrorBanner } from '../components/ui/ErrorBanner';

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_lbs: number;
  status: string;
}

interface CargoItem {
  id: number;
  partNo: string;
  desc: string;
  qty: number;
  l: number;
  w: number;
  h: number;
  weight: number;
  color: string;
  rotatable: boolean;
  bottomOnly: boolean;
  maxStack: number;
  priority: number;
}

// Bin Packing Algorithm (Simplified & Adapted from original app.js)
function calculateBinPacking(containerType: any, cargoItems: CargoItem[]) {
  let itemsToPack: any[] = [];
  cargoItems.forEach(c => {
    for (let i = 0; i < c.qty; i++) {
      itemsToPack.push({ ...c, l: Number(c.l), w: Number(c.w), h: Number(c.h), weight: Number(c.weight), priority: Number(c.priority) });
    }
  });

  itemsToPack.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.bottomOnly !== b.bottomOnly) return a.bottomOnly ? -1 : 1;
    const areaA = a.l * a.w;
    const areaB = b.l * b.w;
    if (areaA !== areaB) return areaB - areaA;
    if (a.h !== b.h) return b.h - a.h;
    return b.weight - a.weight;
  });

  let loadPlan = [];
  let remainingItems = [...itemsToPack];

  let container = {
    profile: containerType,
    items: [] as any[],
    weightLoaded: 0,
    volumeLoaded: 0
  };

  let unassigned = [];

  function getSupportedZ(x: number, y: number, l: number, w: number, placedItems: any[]) {
    let maxZ = 0;
    const inset = 0.5;
    for (let p of placedItems) {
      if (x + inset < p.x + p.l && x + l - inset > p.x && y + inset < p.y + p.w && y + w - inset > p.y) {
        maxZ = Math.max(maxZ, p.z + p.h);
      }
    }
    return maxZ;
  }

  for (let item of remainingItems) {
    const cL = containerType.lUse;
    const cW = containerType.wUse;
    const cH = containerType.hUse;

    if (container.weightLoaded + item.weight > containerType.weight) {
      unassigned.push(item);
      continue;
    }

    let orientations = item.rotatable ? [{ l: item.l, w: item.w, h: item.h }, { l: item.w, w: item.l, h: item.h }] : [{ l: item.l, w: item.w, h: item.h }];
    let best: any = null;

    let xSet = new Set([0]);
    let ySet = new Set([0]);
    for (let p of container.items) {
      if (p.x + p.l < cL) xSet.add(p.x + p.l);
      if (p.y + p.w < cW) ySet.add(p.y + p.w);
      xSet.add(p.x);
      ySet.add(p.y);
    }

    let xCands = Array.from(xSet).sort((a, b) => a - b);
    let yCands = Array.from(ySet).sort((a, b) => a - b);

    for (let ori of orientations) {
      for (let y of yCands) {
        if (y + ori.w > cW) continue;
        for (let x of xCands) {
          if (x + ori.l > cL) continue;
          let z = getSupportedZ(x, y, ori.l, ori.w, container.items);
          if (z + ori.h > cH) continue;
          if (item.bottomOnly && z > 0) continue;
          if (best && z > best.z) continue;

          if (!best || z < best.z) {
            best = { x, y, z, l: ori.l, w: ori.w, h: ori.h };
          }
        }
      }
    }

    if (!best) {
      unassigned.push(item);
      continue;
    }

    container.items.push({
      ...item,
      x: best.x, y: best.y, z: best.z, l: best.l, w: best.w, h: best.h
    });
    container.weightLoaded += item.weight;
    // Volume calculation simplified for arbitrary units (just cu)
    container.volumeLoaded += (best.l * best.w * best.h);
  }

  loadPlan.push(container);
  return { loadPlan, leftOutItems: unassigned };
}

export default function LoadPlanner() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cargo, setCargo] = useState<CargoItem[]>([
    { id: 1, color: "#ff3333", partNo: "MK334", desc: "Mess Kits", qty: 50, l: 10, w: 15, h: 10, weight: 26, rotatable: true, bottomOnly: false, maxStack: 10, priority: 1 },
    { id: 2, color: "#eebb00", partNo: "BG409", desc: "Hiking Boots", qty: 20, l: 15, w: 23, h: 18, weight: 48, rotatable: false, bottomOnly: false, maxStack: 5, priority: 1 }
  ]);
  const [loadResult, setLoadResult] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fleet/vehicles`)
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then(data => {
        setVehicles(data);
        if (data.length > 0) setSelectedVehicleId(data[0].id);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Tidak bisa terhubung ke server, pastikan backend berjalan.');
        setLoading(false);
      });
  }, []);

  const handleCalculate = () => {
    const v = vehicles.find(x => x.id === selectedVehicleId);
    if (!v) return;

    // Map DB vehicle to container profile (in inches)
    // 40ft = ~472 inches, 20ft = ~232 inches, else ~157 inches
    let profile = {
      lUse: v.type.includes('40ft') ? 472 : v.type.includes('20ft') ? 232 : 157,
      wUse: 92, // ~92 inches wide
      hUse: 94, // ~94 inches high
      weight: v.capacity_lbs
    };

    const result = calculateBinPacking(profile, cargo);
    setLoadResult(result);
    render3D(result.loadPlan[0]);
  };

  const render3D = (containerData: any) => {
    if (!containerRef.current) return;
    
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setSize(containerRef.current.clientWidth, 400);
      containerRef.current.appendChild(rendererRef.current.domElement);
    }
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e5e9eb');
    
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / 400, 1, 10000);
    const controls = new OrbitControls(camera, rendererRef.current.domElement);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(1000, 2000, 1000);
    scene.add(dirLight);

    const group = new THREE.Group();
    const cWidth = containerData.profile.lUse;
    const cHeight = containerData.profile.hUse;
    const cDepth = containerData.profile.wUse;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(cWidth, cDepth), new THREE.MeshStandardMaterial({ color: '#cccccc', side: THREE.DoubleSide }));
    floor.rotation.x = Math.PI / 2;
    floor.position.set(cWidth/2, 0, cDepth/2);
    group.add(floor);

    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(cWidth, cHeight, cDepth)), 
      new THREE.LineBasicMaterial({ color: 0x003d9b })
    );
    wireframe.position.set(cWidth/2, cHeight/2, cDepth/2);
    group.add(wireframe);

    containerData.items.forEach((item: any) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(item.l, item.h, item.w), 
        new THREE.MeshStandardMaterial({ color: item.color })
      );
      mesh.position.set(item.x + item.l/2, item.z + item.h/2, item.y + item.w/2);
      
      const iEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(item.l, item.h, item.w)),
        new THREE.LineBasicMaterial({ color: 0x000, transparent: true, opacity: 0.3 })
      );
      iEdges.position.copy(mesh.position);
      
      group.add(mesh);
      group.add(iEdges);
    });

    group.position.set(-cWidth/2, 0, -cDepth/2);
    scene.add(group);

    const maxDim = Math.max(cWidth, cHeight, cDepth);
    camera.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2);
    camera.lookAt(0, cHeight/2, 0);
    controls.target.set(0, cHeight/2, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      rendererRef.current?.render(scene, camera);
    };
    animate();
  };

  const addCargo = () => {
    setCargo([...cargo, { 
      id: Date.now(), color: "#44aa44", partNo: "NEW", desc: "New Box", 
      qty: 10, l: 20, w: 20, h: 20, weight: 33, rotatable: true, bottomOnly: false, maxStack: 5, priority: 2 
    }]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Freight Optimization (Load Planner)</h1>
      
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-4 rounded shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Truck / Container</label>
            {loading ? (
              <Loader text="Loading vehicles..." />
            ) : (
              <select 
                className="w-full border p-2 rounded" 
                value={selectedVehicleId} 
                onChange={e => setSelectedVehicleId(e.target.value)}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate_number} - {v.type} ({v.capacity_lbs} lbs)</option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Cargo Items</label>
              <button onClick={addCargo} className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">Add</button>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded p-2">
              {cargo.map(c => (
                <div key={c.id} className="border-b pb-2 mb-2 text-sm flex gap-2 items-center flex-wrap">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1" style={{backgroundColor: c.color}}></div>
                  <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <strong className="flex-1">{c.partNo}</strong>
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input 
                        type="number" min="1" className="border rounded px-1 w-12 text-center" 
                        value={c.qty} 
                        onChange={e => setCargo(cargo.map(x => x.id === c.id ? {...x, qty: Number(e.target.value)} : x))}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <input 
                        type="number" min="1" className="border rounded px-1 w-10 text-center" 
                        value={c.l} 
                        onChange={e => setCargo(cargo.map(x => x.id === c.id ? {...x, l: Number(e.target.value)} : x))}
                      />
                      <span>x</span>
                      <input 
                        type="number" min="1" className="border rounded px-1 w-10 text-center" 
                        value={c.w} 
                        onChange={e => setCargo(cargo.map(x => x.id === c.id ? {...x, w: Number(e.target.value)} : x))}
                      />
                      <span>x</span>
                      <input 
                        type="number" min="1" className="border rounded px-1 w-10 text-center" 
                        value={c.h} 
                        onChange={e => setCargo(cargo.map(x => x.id === c.id ? {...x, h: Number(e.target.value)} : x))}
                      />
                      <span className="text-gray-500">in</span>
                      <span className="mx-1">-</span>
                      <input 
                        type="number" min="1" className="border rounded px-1 w-12 text-center" 
                        value={c.weight} 
                        onChange={e => setCargo(cargo.map(x => x.id === c.id ? {...x, weight: Number(e.target.value)} : x))}
                      />
                      <span className="text-gray-500">lbs</span>
                    </div>
                  </div>
                  <button onClick={() => setCargo(cargo.filter(x => x.id !== c.id))} className="text-red-500 font-bold ml-2">X</button>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Calculate & Render 3D
          </button>

          {loadResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h3 className="font-bold text-green-800">Results</h3>
              <p className="text-sm">Loaded: {loadResult.loadPlan[0].items.length} items</p>
              <p className="text-sm">Weight: {loadResult.loadPlan[0].weightLoaded} lbs</p>
              <p className="text-sm text-red-600">Left out: {loadResult.leftOutItems.length} items</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-4 rounded shadow-md border border-gray-100 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">3D Viewer</h2>
          <div ref={containerRef} className="w-full h-[400px] bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
            {!loadResult && <p className="text-gray-400">Click "Calculate & Render 3D" to view</p>}
          </div>
          <p className="text-sm text-gray-500 mt-2">Use mouse to rotate (Left Click), pan (Right Click), and zoom (Scroll).</p>
        </div>
      </div>
    </div>
  );
}
