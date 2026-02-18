import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, ToggleLeft, ToggleRight, FileText, BookOpen } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import type { KnowledgeDoc } from '../types';
import api from '../api/api';
import toast from 'react-hot-toast';

const KnowledgeBase = () => {
    const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showTextUpload, setShowTextUpload] = useState(false);
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<KnowledgeDoc[]>('/knowledge');
            setDocs(data);
        } catch {
            console.error('Failed to load docs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocs();
        const handler = () => loadDocs();
        window.addEventListener('clientChanged', handler);
        return () => window.removeEventListener('clientChanged', handler);
    }, []);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            await api.post('/knowledge', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Document uploaded');
            loadDocs();
        } catch {
            toast.error('Failed to upload');
        } finally {
            setUploading(false);
        }
    };

    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textContent.trim()) return;
        setUploading(true);
        try {
            await api.post('/knowledge', { title: textTitle || 'Untitled', content: textContent });
            toast.success('Document added');
            setTextTitle('');
            setTextContent('');
            setShowTextUpload(false);
            loadDocs();
        } catch {
            toast.error('Failed to add document');
        } finally {
            setUploading(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await api.patch(`/knowledge/${id}/toggle`);
            loadDocs();
        } catch {
            toast.error('Failed to toggle');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this document?')) return;
        try {
            await api.delete(`/knowledge/${id}`);
            toast.success('Document deleted');
            loadDocs();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    return (
        <div>
            <div className="page-header page-header-actions">
                <div>
                    <h1>Knowledge Base</h1>
                    <p>Manage documents used as context for AI responses</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowTextUpload(!showTextUpload)}>
                        <FileText size={16} />
                        Add Text
                    </button>
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} />
                        Upload File
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                }}
            />

            {/* Drop zone */}
            <div
                className={`file-upload ${dragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ marginBottom: 20 }}
            >
                <Upload size={32} />
                <p><span>Click to upload</span> or drag and drop</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Supports .txt, .md, .csv, .json files
                </p>
            </div>

            {/* Text upload form */}
            {showTextUpload && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 className="section-title">Add Text Document</h3>
                    <form onSubmit={handleTextSubmit}>
                        <div className="form-group">
                            <label>Title</label>
                            <input className="form-input" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="Document title" />
                        </div>
                        <div className="form-group">
                            <label>Content</label>
                            <textarea className="form-textarea" value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Paste your knowledge content here..." rows={8} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" className="btn btn-primary" disabled={uploading}>
                                {uploading ? 'Adding...' : 'Add Document'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowTextUpload(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Documents list */}
            <div className="card">
                {loading ? (
                    <LoadingSpinner />
                ) : docs.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={40} />
                        <h3>No documents yet</h3>
                        <p>Upload documents to build your knowledge base</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Uploaded</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((doc) => (
                                    <tr key={doc._id}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileText size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                                                {doc.title}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{doc.fileType}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggle(doc._id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                {doc.isActive ? (
                                                    <><ToggleRight size={20} style={{ color: 'var(--accent-green)' }} /> <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>Active</span></>
                                                ) : (
                                                    <><ToggleLeft size={20} style={{ color: 'var(--text-muted)' }} /> <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inactive</span></>
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            <button className="btn-icon" onClick={() => handleDelete(doc._id)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
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

export default KnowledgeBase;
