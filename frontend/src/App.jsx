import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AIPeerPage from './pages/AIPeerPage';
import ReportPage from './pages/ReportPage';
import SignInPage from './pages/SignInPage';
import Navbar from './pages/Navbar';
import DashboardPage     from './pages/DashboardPage';
import SessionDetailPage from './pages/SessionDetailPage';
import { useSessionStore } from './store/sessionStore';
import './index.css';

function App() {
  const { isAuthenticated } = useSessionStore();

  return (
    <Router>
      <div className="app-container">
        
        <Navbar />

        <main className="content">
          <Routes>
            <Route path="/"element={isAuthenticated ? (<Navigate to="/dashboard" replace />) : (<UploadPage />)}/>
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/.upload" element={<Navigate to="/upload" replace />} />
            <Route path="/explain" element={<AIPeerPage />} />
            <Route path="/chat" element={<AIPeerPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/dashboard"         element={<DashboardPage />} />
            <Route path="/session/:sessionId" element={<SessionDetailPage />} />
            <Route path="*" element={<Navigate to="/upload" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
