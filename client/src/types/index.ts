export interface Client {
    _id: string;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

export interface Email {
    _id: string;
    clientId: string;
    messageId: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    htmlBody: string;
    date: string;
    isRead: boolean;
    status: 'pending' | 'processing' | 'drafted' | 'sent' | 'escalated';
    draftResponse: string;
    accuracy: number;
    processedAt: string;
    escalationReason: string;
    createdAt: string;
    updatedAt: string;
}

export interface KnowledgeDoc {
    _id: string;
    clientId: string;
    title: string;
    content: string;
    filename: string;
    fileType: string;
    isActive: boolean;
    uploadedAt: string;
}

export interface Config {
    _id: string;
    clientId: string;
    emailFilter: 'read' | 'unread' | 'all';
    imapHost: string;
    imapPort: number;
    imapUser: string;
    imapPassword: string;
    imapTls: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    accuracyThreshold: number;
    llmModel: string;
    openaiApiKey: string;
    autoSendAboveThreshold: boolean;
    autoEscalateBelowThreshold: boolean;
    pollingEnabled: boolean;
    pollingIntervalMinutes: number;
    autoProcessEnabled: boolean;
    lastFetchedAt: string | null;
}

export interface Action {
    _id: string;
    clientId: string;
    emailId: string | { _id: string; subject: string; from: string };
    type: 'draft' | 'send' | 'escalate' | 'process';
    response: string;
    accuracy: number;
    performedBy: 'ai' | 'human';
    notes: string;
    createdAt: string;
}

export interface DashboardStats {
    total: number;
    pending: number;
    drafted: number;
    sent: number;
    escalated: number;
    avgAccuracy: number;
    recentActions: Action[];
}

export interface EmailListResponse {
    emails: Email[];
    total: number;
    page: number;
    totalPages: number;
}

export interface LLMResult {
    response: string;
    accuracy: number;
    reasoning: string;
    suggestedAction: 'draft' | 'escalate';
}

export interface ProcessEmailResponse {
    email: Email;
    llmResult: LLMResult;
    action: string;
    threshold: number;
}
