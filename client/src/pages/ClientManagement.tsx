import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Client } from '../types';
import api from '../api/api';
import toast from 'react-hot-toast';

const ClientManagement = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });

    const loadClients = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<Client[]>('/clients');
            setClients(data);
        } catch {
            console.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const openCreate = () => {
        setEditingClient(null);
        setForm({ name: '', description: '' });
        setShowModal(true);
    };

    const openEdit = (client: Client) => {
        setEditingClient(client);
        setForm({ name: client.name, description: client.description });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient._id}`, form);
                toast.success('Client updated');
            } else {
                await api.post('/clients', form);
                toast.success('Client created');
            }
            setShowModal(false);
            loadClients();
            // Trigger sidebar refresh
            window.dispatchEvent(new Event('clientChanged'));
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to save client');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this client and ALL its data (emails, knowledge base, config)? This cannot be undone.')) return;
        try {
            await api.delete(`/clients/${id}`);
            toast.success('Client deleted');
            loadClients();
            window.dispatchEvent(new Event('clientChanged'));
        } catch {
            toast.error('Failed to delete client');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <div className="page-header page-header-actions">
                <div>
                    <h1>Client Management</h1>
                    <p>Manage your clients — each with its own knowledge base and settings</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={16} />
                    New Client
                </button>
            </div>

            {clients.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Plus size={40} />
                        <h3>No clients yet</h3>
                        <p>Create your first client to get started</p>
                    </div>
                </div>
            ) : (
                <div className="clients-grid">
                    {clients.map((client) => (
                        <div key={client._id} className="client-card">
                            <div className="client-card-header">
                                <h3>{client.name}</h3>
                                <span className={`badge ${client.isActive ? 'badge-sent' : 'badge-pending'}`}>
                                    {client.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p>{client.description || 'No description'}</p>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                Created {new Date(client.createdAt).toLocaleDateString()}
                            </div>
                            <div className="client-card-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(client)}>
                                    <Edit2 size={12} /> Edit
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(client._id)}>
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingClient ? 'Edit Client' : 'Create Client'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Client Name *</label>
                                <input
                                    className="form-input"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Acme Corporation"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-textarea"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description of this client..."
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingClient ? 'Save Changes' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagement;
