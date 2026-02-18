import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import EmailDetail from './pages/EmailDetail';
import KnowledgeBase from './pages/KnowledgeBase';
import Configuration from './pages/Configuration';
import EscalationQueue from './pages/EscalationQueue';
import ClientManagement from './pages/ClientManagement';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/inbox/:id" element={<EmailDetail />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/config" element={<Configuration />} />
            <Route path="/escalations" element={<EscalationQueue />} />
            <Route path="/clients" element={<ClientManagement />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
