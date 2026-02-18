import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Send, Eye } from 'lucide-react';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Email, EmailListResponse } from '../types';
import api from '../api/api';
import toast from 'react-hot-toast';

const EscalationQueue = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadEscalated = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<EmailListResponse>('/emails', {
                params: { status: 'escalated', limit: 50 }
            });
            setEmails(data.emails);
        } catch {
            console.error('Failed to load escalated emails');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEscalated();
        const handler = () => loadEscalated();
        window.addEventListener('clientChanged', handler);
        return () => window.removeEventListener('clientChanged', handler);
    }, []);

    const handleSend = async (emailId: string) => {
        try {
            await api.post(`/emails/${emailId}/send`);
            toast.success('Response sent');
            loadEscalated();
        } catch {
            toast.error('Failed to send');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Escalation Queue</h1>
                <p>Emails that need human review and intervention</p>
            </div>

            <div className="card">
                {loading ? (
                    <LoadingSpinner />
                ) : emails.length === 0 ? (
                    <div className="empty-state">
                        <AlertTriangle size={40} />
                        <h3>No escalated emails</h3>
                        <p>Emails with low accuracy scores will appear here</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>From</th>
                                    <th>Subject</th>
                                    <th>Accuracy</th>
                                    <th>Reason</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emails.map((email) => (
                                    <tr key={email._id}>
                                        <td style={{ fontWeight: 500 }}>{email.from}</td>
                                        <td>{email.subject}</td>
                                        <td>
                                            <span style={{
                                                color: email.accuracy >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                                                fontWeight: 600
                                            }}>
                                                {email.accuracy > 0 ? `${email.accuracy}%` : '—'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {email.escalationReason || '—'}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            {new Date(email.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/inbox/${email._id}`)}>
                                                    <Eye size={12} /> View
                                                </button>
                                                {email.draftResponse && (
                                                    <button className="btn btn-success btn-sm" onClick={() => handleSend(email._id)}>
                                                        <Send size={12} /> Send
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EscalationQueue;
