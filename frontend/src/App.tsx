import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FleetHub from './pages/FleetHub';
import LoadPlanner from './pages/LoadPlanner';
import CrewPlanner from './pages/CrewPlanner';
import DispatchBoard from './pages/DispatchBoard';
import InsightAI from './pages/InsightAI';
import Integrations from './pages/Integrations';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <nav className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex gap-4 items-center">
            <div className="font-bold text-xl mr-8">RoadStar Winjay</div>
            <Link to="/" className="hover:text-blue-200 font-medium">Fleet Hub</Link>
            <Link to="/planner" className="hover:text-blue-200 font-medium">Load Planner</Link>
            <Link to="/crew" className="hover:text-blue-200 font-medium">Crew & Route</Link>
            <Link to="/dispatch" className="hover:text-blue-200 font-medium">Dispatch</Link>
            <Link to="/insights" className="hover:text-blue-200 font-medium">Insight AI</Link>
            <Link to="/integrations" className="hover:text-blue-200 font-medium">Integrations</Link>
          </div>
        </nav>
        
        <main className="container mx-auto mt-6 flex-1">
          <Routes>
            <Route path="/" element={<FleetHub />} />
            <Route path="/planner" element={<LoadPlanner />} />
            <Route path="/crew" element={<CrewPlanner />} />
            <Route path="/dispatch" element={<DispatchBoard />} />
            <Route path="/insights" element={<InsightAI />} />
            <Route path="/integrations" element={<Integrations />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
