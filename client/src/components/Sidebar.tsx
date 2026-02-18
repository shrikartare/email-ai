import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Inbox,
    BookOpen,
    Settings,
    AlertTriangle,
    Users,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Client } from '../types';
import api from '../api/api';

const Sidebar = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [activeClientId, setActiveClientId] = useState<string>(
        localStorage.getItem('activeClientId') || ''
    );

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const { data } = await api.get<Client[]>('/clients');
            setClients(data);
            if (!activeClientId && data.length > 0) {
                switchClient(data[0]._id);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
        }
    };

    const switchClient = (id: string) => {
        setActiveClientId(id);
        localStorage.setItem('activeClientId', id);
        window.dispatchEvent(new Event('clientChanged'));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Zap size={22} />
                    <span>EmailAI</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/inbox" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Inbox size={18} />
                    <span>Inbox</span>
                </NavLink>
                <NavLink to="/knowledge" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <BookOpen size={18} />
                    <span>Knowledge Base</span>
                </NavLink>
                <NavLink to="/escalations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <AlertTriangle size={18} />
                    <span>Escalations</span>
                </NavLink>
                <div className="nav-separator" />
                <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Users size={18} />
                    <span>Clients</span>
                </NavLink>
                <NavLink to="/config" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Settings size={18} />
                    <span>Configuration</span>
                </NavLink>
            </nav>

            <div className="client-switcher">
                <label>Active Client</label>
                <select
                    value={activeClientId}
                    onChange={(e) => switchClient(e.target.value)}
                >
                    {clients.length === 0 && <option value="">No clients</option>}
                    {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
        </aside>
    );
};

export default Sidebar;
