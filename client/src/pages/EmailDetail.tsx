import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Send, AlertTriangle, FileText } from 'lucide-react';
import AccuracyGauge from '../components/AccuracyGauge';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Email, ProcessEmailResponse } from '../types';
import api from '../api/api';
import toast from 'react-hot-toast';

const EmailDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [email, setEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [sending, setSending] = useState(false);
    const [editedResponse, setEditedResponse] = useState('');
    const [llmReasoning, setLlmReasoning] = useState('');

    useEffect(() => {
        loadEmail();
    }, [id]);

    const loadEmail = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<Email>(`/emails/${id}`);
            setEmail(data);
            setEditedResponse(data.draftResponse || '');
        } catch {
            toast.error('Failed to load email');
            navigate('/inbox');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const { data } = await api.post<ProcessEmailResponse>(`/emails/${id}/process`);
            setEmail(data.email);
            setEditedResponse(data.email.draftResponse);
            setLlmReasoning(data.llmResult.reasoning);
            toast.success(`Processed — Accuracy: ${data.llmResult.accuracy}%, Action: ${data.action}`);
        } catch {
            toast.error('Processing failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        try {
            await api.post(`/emails/${id}/send`, { response: editedResponse });
            toast.success('Email sent successfully');
            loadEmail();
        } catch {
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const handleEscalate = async () => {
        try {
            await api.post(`/emails/${id}/escalate`, { reason: 'Manually escalated by user' });
            toast.success('Email escalated');
            loadEmail();
        } catch {
            toast.error('Failed to escalate');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!email) return null;

    return (
        <div>
            <div className="page-header page-header-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn-icon" onClick={() => navigate('/inbox')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1>{email.subject}</h1>
                        <p>From: {email.from}</p>
                    </div>
                </div>
                <Badge status={email.status} />
            </div>

            <div className="email-detail-grid">
                {/* Email Body */}
                <div className="card">
                    <div className="email-meta">
                        <div className="email-meta-row">
                            <span className="label">From</span>
                            <span className="value">{email.from}</span>
                        </div>
                        <div className="email-meta-row">
                            <span className="label">To</span>
                            <span className="value">{email.to}</span>
                        </div>
                        <div className="email-meta-row">
                            <span className="label">Date</span>
                            <span className="value">{new Date(email.date).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="email-body-card">{email.body}</div>
                </div>

                {/* Response Panel */}
                <div className="response-panel">
                    {/* Process Button */}
                    {(email.status === 'pending' || email.status === 'processing') && (
                        <div className="card" style={{ textAlign: 'center' }}>
                            <Cpu size={32} style={{ color: 'var(--accent-blue)', marginBottom: 12 }} />
                            <h3 style={{ fontSize: 16, marginBottom: 8 }}>AI Processing</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                Process this email using the knowledge base and LLM
                            </p>
                            <button className="btn btn-primary" onClick={handleProcess} disabled={processing}>
                                <Cpu size={16} />
                                {processing ? 'Processing...' : 'Process with AI'}
                            </button>
                        </div>
                    )}

                    {/* Accuracy Gauge */}
                    {email.accuracy > 0 && (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <AccuracyGauge value={email.accuracy} />
                            {llmReasoning && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                                    {llmReasoning}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Draft Response */}
                    {email.draftResponse && (
                        <div className="card">
                            <h3 className="section-title">
                                <FileText size={16} /> Draft Response
                            </h3>
                            <textarea
                                className="form-textarea"
                                value={editedResponse}
                                onChange={(e) => setEditedResponse(e.target.value)}
                                rows={10}
                                disabled={email.status === 'sent'}
                            />
                            {email.status !== 'sent' && email.status !== 'escalated' && (
                                <div className="response-actions" style={{ marginTop: 12 }}>
                                    <button className="btn btn-success" onClick={handleSend} disabled={sending}>
                                        <Send size={14} />
                                        {sending ? 'Sending...' : 'Send Response'}
                                    </button>
                                    <button className="btn btn-danger" onClick={handleEscalate}>
                                        <AlertTriangle size={14} />
                                        Escalate
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Escalation Notice */}
                    {email.status === 'escalated' && (
                        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <h3 className="section-title" style={{ color: 'var(--accent-red)' }}>
                                <AlertTriangle size={16} /> Escalated
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {email.escalationReason || 'This email has been escalated for human review.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailDetail;
