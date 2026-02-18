import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Mail, MailOpen } from 'lucide-react';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Email, EmailListResponse } from '../types';
import api from '../api/api';
import toast from 'react-hot-toast';

const Inbox = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [readFilter, setReadFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const loadEmails = async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { page, limit: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (readFilter) params.isRead = readFilter;

            const { data } = await api.get<EmailListResponse>('/emails', { params });
            setEmails(data.emails);
            setTotalPages(data.totalPages);
        } catch {
            console.error('Failed to load emails');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmails();
        const handler = () => loadEmails();
        window.addEventListener('clientChanged', handler);
        return () => window.removeEventListener('clientChanged', handler);
    }, [page, statusFilter, readFilter]);

    const handleFetch = async () => {
        setFetching(true);
        try {
            const { data } = await api.post('/emails/fetch');
            toast.success(`${data.count} new emails fetched`);
            loadEmails();
        } catch {
            toast.error('Failed to fetch emails');
        } finally {
            setFetching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadEmails();
    };

    return (
        <div>
            <div className="page-header page-header-actions">
                <div>
                    <h1>Inbox</h1>
                    <p>Manage and process incoming emails</p>
                </div>
                <button className="btn btn-primary" onClick={handleFetch} disabled={fetching}>
                    <RefreshCw size={16} className={fetching ? 'spinning' : ''} />
                    {fetching ? 'Fetching...' : 'Fetch Emails'}
                </button>
            </div>

            <div className="filter-bar">
                <form onSubmit={handleSearch} className="search-wrapper">
                    <Search size={16} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search emails..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <div className="filter-group">
                    <button className={`filter-btn ${readFilter === '' ? 'active' : ''}`} onClick={() => { setReadFilter(''); setPage(1); }}>All</button>
                    <button className={`filter-btn ${readFilter === 'false' ? 'active' : ''}`} onClick={() => { setReadFilter('false'); setPage(1); }}>Unread</button>
                    <button className={`filter-btn ${readFilter === 'true' ? 'active' : ''}`} onClick={() => { setReadFilter('true'); setPage(1); }}>Read</button>
                </div>

                <div className="filter-group">
                    <button className={`filter-btn ${statusFilter === '' ? 'active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1); }}>All</button>
                    <button className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => { setStatusFilter('pending'); setPage(1); }}>Pending</button>
                    <button className={`filter-btn ${statusFilter === 'drafted' ? 'active' : ''}`} onClick={() => { setStatusFilter('drafted'); setPage(1); }}>Drafted</button>
                    <button className={`filter-btn ${statusFilter === 'sent' ? 'active' : ''}`} onClick={() => { setStatusFilter('sent'); setPage(1); }}>Sent</button>
                    <button className={`filter-btn ${statusFilter === 'escalated' ? 'active' : ''}`} onClick={() => { setStatusFilter('escalated'); setPage(1); }}>Escalated</button>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <LoadingSpinner />
                ) : emails.length === 0 ? (
                    <div className="empty-state">
                        <Mail size={40} />
                        <h3>No emails found</h3>
                        <p>Click "Fetch Emails" to pull emails from your mail server</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: 30 }}></th>
                                        <th>From</th>
                                        <th>Subject</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Accuracy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emails.map((email) => (
                                        <tr
                                            key={email._id}
                                            onClick={() => navigate(`/inbox/${email._id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                {email.isRead ? (
                                                    <MailOpen size={16} style={{ color: 'var(--text-muted)' }} />
                                                ) : (
                                                    <Mail size={16} style={{ color: 'var(--accent-blue)' }} />
                                                )}
                                            </td>
                                            <td style={{ fontWeight: email.isRead ? 400 : 600 }}>{email.from}</td>
                                            <td style={{ fontWeight: email.isRead ? 400 : 600 }}>{email.subject}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                {new Date(email.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td><Badge status={email.status} /></td>
                                            <td>
                                                {email.accuracy > 0 ? (
                                                    <span style={{
                                                        color: email.accuracy >= 80 ? 'var(--accent-green)' : email.accuracy >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)',
                                                        fontWeight: 600
                                                    }}>
                                                        {email.accuracy}%
                                                    </span>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                                <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Inbox;
