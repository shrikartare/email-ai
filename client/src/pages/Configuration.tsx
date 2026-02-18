import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Config } from '../types';
import api from '../api/api';
import toast from 'react-hot-toast';

const Configuration = () => {
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<Config>('/config');
            setConfig(data);
        } catch {
            console.error('Failed to load config');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
        const handler = () => loadConfig();
        window.addEventListener('clientChanged', handler);
        return () => window.removeEventListener('clientChanged', handler);
    }, []);

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await api.put('/config', config);
            toast.success('Configuration saved');
        } catch {
            toast.error('Failed to save config');
        } finally {
            setSaving(false);
        }
    };

    const update = (field: keyof Config, value: string | number | boolean) => {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    };

    if (loading) return <LoadingSpinner />;
    if (!config) return <div className="empty-state"><h3>No configuration found</h3></div>;

    return (
        <div>
            <div className="page-header page-header-actions">
                <div>
                    <h1>Configuration</h1>
                    <p>Email server settings and AI configuration for this client</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Email Filter */}
            <div className="card section">
                <h3 className="section-title">Email Filter</h3>
                <div className="form-group">
                    <label>Filter incoming emails by</label>
                    <select className="form-select" value={config.emailFilter} onChange={(e) => update('emailFilter', e.target.value)}>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                        <option value="all">All Emails</option>
                    </select>
                </div>
            </div>

            {/* IMAP Settings */}
            <div className="card section">
                <h3 className="section-title">IMAP Settings (Incoming Mail)</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>IMAP Host</label>
                        <input className="form-input" value={config.imapHost} onChange={(e) => update('imapHost', e.target.value)} placeholder="imap.gmail.com" />
                    </div>
                    <div className="form-group">
                        <label>IMAP Port</label>
                        <input className="form-input" type="number" value={config.imapPort} onChange={(e) => update('imapPort', Number(e.target.value))} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Username / Email</label>
                        <input className="form-input" value={config.imapUser} onChange={(e) => update('imapUser', e.target.value)} placeholder="user@gmail.com" />
                    </div>
                    <div className="form-group">
                        <label>Password / App Password</label>
                        <input className="form-input" type="password" value={config.imapPassword} onChange={(e) => update('imapPassword', e.target.value)} placeholder="••••••••" />
                    </div>
                </div>
                <div className="toggle-wrapper">
                    <div className={`toggle ${config.imapTls ? 'active' : ''}`} onClick={() => update('imapTls', !config.imapTls)} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Use TLS</span>
                </div>
            </div>

            {/* SMTP Settings */}
            <div className="card section">
                <h3 className="section-title">SMTP Settings (Outgoing Mail)</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>SMTP Host</label>
                        <input className="form-input" value={config.smtpHost} onChange={(e) => update('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="form-group">
                        <label>SMTP Port</label>
                        <input className="form-input" type="number" value={config.smtpPort} onChange={(e) => update('smtpPort', Number(e.target.value))} />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Username / Email</label>
                        <input className="form-input" value={config.smtpUser} onChange={(e) => update('smtpUser', e.target.value)} placeholder="user@gmail.com" />
                    </div>
                    <div className="form-group">
                        <label>Password / App Password</label>
                        <input className="form-input" type="password" value={config.smtpPassword} onChange={(e) => update('smtpPassword', e.target.value)} placeholder="••••••••" />
                    </div>
                </div>
            </div>

            {/* Polling & Auto-Processing */}
            <div className="card section">
                <h3 className="section-title">Polling & Auto-Processing</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    When enabled, the server automatically checks for new emails and processes them with AI.
                    On first activation, only the current timestamp is recorded — existing emails are not fetched.
                </p>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div className="toggle-wrapper">
                        <div className={`toggle ${config.pollingEnabled ? 'active' : ''}`} onClick={() => update('pollingEnabled', !config.pollingEnabled)} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enable Polling</span>
                    </div>
                    <div className="toggle-wrapper">
                        <div className={`toggle ${config.autoProcessEnabled ? 'active' : ''}`} onClick={() => update('autoProcessEnabled', !config.autoProcessEnabled)} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto-process with AI</span>
                    </div>
                </div>
                {config.pollingEnabled && (
                    <div className="form-group" style={{ marginTop: 16, maxWidth: 200 }}>
                        <label>Polling Interval (minutes)</label>
                        <input
                            className="form-input"
                            type="number"
                            min={1}
                            max={60}
                            value={config.pollingIntervalMinutes}
                            onChange={(e) => update('pollingIntervalMinutes', Number(e.target.value))}
                        />
                    </div>
                )}
                {config.lastFetchedAt && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                        Last fetched: {new Date(config.lastFetchedAt).toLocaleString()}
                    </p>
                )}
            </div>

            {/* LLM Settings */}
            <div className="card section">
                <h3 className="section-title">LLM Settings</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>OpenAI API Key</label>
                        <input className="form-input" type="password" value={config.openaiApiKey} onChange={(e) => update('openaiApiKey', e.target.value)} placeholder="sk-..." />
                    </div>
                    <div className="form-group">
                        <label>Model</label>
                        <select className="form-select" value={config.llmModel} onChange={(e) => update('llmModel', e.target.value)}>
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Accuracy Threshold (%)</label>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Emails below this accuracy will be automatically escalated
                    </p>
                    <div className="slider-group">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.accuracyThreshold}
                            onChange={(e) => update('accuracyThreshold', Number(e.target.value))}
                        />
                        <span className="slider-value">{config.accuracyThreshold}%</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                    <div className="toggle-wrapper">
                        <div className={`toggle ${config.autoEscalateBelowThreshold ? 'active' : ''}`} onClick={() => update('autoEscalateBelowThreshold', !config.autoEscalateBelowThreshold)} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto-escalate below threshold</span>
                    </div>
                    <div className="toggle-wrapper">
                        <div className={`toggle ${config.autoSendAboveThreshold ? 'active' : ''}`} onClick={() => update('autoSendAboveThreshold', !config.autoSendAboveThreshold)} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Auto-send above threshold</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
