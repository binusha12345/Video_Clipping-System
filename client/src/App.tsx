import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import EditorPage from './pages/EditorPage';
import RenderPage from './pages/RenderPage';
import Navbar from './components/Navbar';

/**
 * This build has no accounts, so there is no sign-in wall.
 * Every route is public; the app just boots into the dashboard by default.
 * The AuthPage route is intentionally absent — there is no register/login flow.
 */
export default function App() {
  return (
    <div className="glow-bg min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<><Navbar /><DashboardPage /></>} />
        <Route path="/project/:id" element={<><Navbar /><AnalysisPage /></>} />
        <Route path="/project/:id/editor/:clipId" element={<><Navbar /><EditorPage /></>} />
        <Route path="/render/:jobId" element={<><Navbar /><RenderPage /></>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
