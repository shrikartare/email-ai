import { useEffect, useState } from 'react';
import { Mail, Clock, FileText, Send, AlertTriangle, Target } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { DashboardStats, Action } from '../types';
import api from '../api/api';

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<DashboardStats>('/dashboard/stats');
            setStats(data);
        } catch {
            console.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        const handler = () => loadStats();
        window.addEventListener('clientChanged', handler);
        return () => window.removeEventListener('clientChanged', handler);
    }, []);

    if (loading) return <LoadingSpinner />;

    const formatDate = (d: string) => {
        return new Date(d).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getActionEmail = (action: Action) => {
        if (typeof action.emailId === 'object') return action.emailId;
        return { subject: 'Unknown', from: '' };
    };

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Overview of your email automation pipeline</p>
            </div>

            <div className="stats-grid">
                <StatsCard icon={<Mail size={20} />} value={stats?.total || 0} label="Total Emails" color="blue" />
                <StatsCard icon={<Clock size={20} />} value={stats?.pending || 0} label="Pending" color="amber" />
                <StatsCard icon={<FileText size={20} />} value={stats?.drafted || 0} label="Drafted" color="purple" />
                <StatsCard icon={<Send size={20} />} value={stats?.sent || 0} label="Sent" color="green" />
                <StatsCard icon={<AlertTriangle size={20} />} value={stats?.escalated || 0} label="Escalated" color="red" />
                <StatsCard icon={<Target size={20} />} value={`${stats?.avgAccuracy || 0}%`} label="Avg Accuracy" color="teal" />
            </div>

            <div className="section">
                <h3 className="section-title">Recent Activity</h3>
                <div className="card">
                    {stats?.recentActions && stats.recentActions.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Action</th>
                                        <th>Email</th>
                                        <th>Accuracy</th>
                                        <th>By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentActions.map((action) => {
                                        const email = getActionEmail(action);
                                        return (
                                            <tr key={action._id}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                    {formatDate(action.createdAt)}
                                                </td>
                                                <td><Badge status={action.type} /></td>
                                                <td>{email.subject}</td>
                                                <td>{action.accuracy > 0 ? `${action.accuracy}%` : '—'}</td>
                                                <td style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    {action.performedBy}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Mail size={40} />
                            <h3>No activity yet</h3>
                            <p>Process some emails to see activity here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
