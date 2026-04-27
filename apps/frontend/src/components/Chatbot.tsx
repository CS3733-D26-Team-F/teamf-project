import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import {
    Affix, Drawer, Stack, Textarea, Paper, Text, ScrollArea,
    Group, ActionIcon, Loader, Anchor, Button, Badge, Modal,
    Divider, Tooltip, ThemeIcon, Box, RingProgress, Avatar
} from '@mantine/core';
import {
    IconSend, IconTrash, IconPaperclip, IconX, IconMicrophone,
    IconSquare, IconStar, IconDownload, IconEdit, IconUser,
    IconFileText, IconAlertTriangle, IconCheck,
    IconChartPie, IconRefresh
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DOMAIN } from '../const';
import DocViewer, { DocViewerRenderers } from '@iamjariwala/react-doc-viewer';
import '@iamjariwala/react-doc-viewer/dist/index.css';
import { pickRenderer, getExt } from '../components/content/Functions';
import avatar from '../../public/HanoverAILogoInverse.jpg';

type DocResult = {
    id: number;
    name: string;
    url: string;
    status: string;
    owner: string;
    content_type: string;
    persona: string[];
    is_favorite: boolean;
    expiration_date?: string;
};

type EmpResult = {
    empid: number;
    first_name: string;
    last_name: string;
    username: string;
    persona: string;
    pfp_URL?: string;
};

type DocStats = {
    total: number;
    active: number;
    expired: number;
    favorites: number;
    byStatus: Record<string, number>;
    byPersona: Record<string, number>;
    byContentType: Record<string, number>;
};

const STATUS_COLORS: Record<string, string> = {
    'In Progress': 'blue',
    'Internal Review': 'yellow',
    'Client Review': 'orange',
    'Approved': 'green',
    'Expired': 'red',
    'Archived': 'gray'
};

const PERSONA_COLORS: Record<string, string> = {
    'Underwriter': 'teal',
    'Business Analyst': 'violet',
    'Admin': 'red'
};

function DocumentCard({ doc, onView }: { doc: DocResult; onView: (url: string, name: string) => void }) {
    const isExpired = doc.expiration_date && new Date(doc.expiration_date) < new Date();
    return (
        <Paper
            p="sm"
            radius="md"
            withBorder
            style={{
                borderLeft: `3px solid var(--mantine-color-${STATUS_COLORS[doc.status] || 'gray'}-5)`,
                opacity: isExpired ? 0.75 : 1
            }}
        >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm" truncate>{doc.name}</Text>
                    <Text size="xs" c="dimmed" mb={4}>
                        Owner: @{doc.owner}
                        {isExpired && <span style={{ color: 'red', marginLeft: 6 }}>⚠ Expired</span>}
                    </Text>
                    <Group gap={4}>
                        <Badge size="xs" color={STATUS_COLORS[doc.status] || 'gray'} variant="light">{doc.status}</Badge>
                        <Badge size="xs" color="gray" variant="outline">{doc.content_type}</Badge>
                        {doc.persona?.map(p => (
                            <Badge key={p} size="xs" color={PERSONA_COLORS[p] || 'blue'} variant="dot">{p}</Badge>
                        ))}
                    </Group>
                </Box>
                <Group gap={4} wrap="nowrap">
                    <Tooltip label="Preview" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            onClick={() => onView(doc.url, doc.name)}
                        >
                            <IconFileText size={14} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Download" withArrow>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            component="a"
                            href={doc.url}
                            download
                        >
                            <IconDownload size={14} />
                        </ActionIcon>
                    </Tooltip>
                    {doc.is_favorite && (
                        <Tooltip label="Favorited" withArrow>
                            <ThemeIcon size="sm" variant="subtle" color="yellow">
                                <IconStar size={12} fill="currentColor" />
                            </ThemeIcon>
                        </Tooltip>
                    )}
                </Group>
            </Group>
        </Paper>
    );
}

function EmployeeCard({ emp }: { emp: EmpResult }) {
    return (
        <Paper p="sm" radius="md" withBorder>
            <Group gap="sm">
                <ThemeIcon
                    size="lg"
                    radius="xl"
                    color={PERSONA_COLORS[emp.persona] || 'blue'}
                    variant="light"
                >
                    <IconUser size={16} />
                </ThemeIcon>
                <Box>
                    <Text fw={600} size="sm">{emp.first_name} {emp.last_name}</Text>
                    <Text size="xs" c="dimmed">@{emp.username}</Text>
                </Box>
                <Badge size="xs" color={PERSONA_COLORS[emp.persona] || 'blue'} variant="light" ml="auto">
                    {emp.persona}
                </Badge>
            </Group>
        </Paper>
    );
}

function StatsChart({ stats }: { stats: DocStats }) {
    const statusEntries = Object.entries(stats.byStatus);
    const total = stats.total || 1;

    const ringData = statusEntries.map(([label, value]) => ({
        value: Math.round((value / total) * 100),
        color: `var(--mantine-color-${STATUS_COLORS[label] || 'gray'}-5)`,
        tooltip: `${label}: ${value}`
    }));

    return (
        <Paper p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="sm" c="dimmed">Document Library Overview</Text>

            <Group justify="center" mb="sm">
                <RingProgress
                    size={120}
                    thickness={14}
                    sections={ringData.length > 0 ? ringData : [{ value: 100, color: 'gray' }]}
                    label={
                        <Text ta="center" size="xs" fw={700}>
                            {stats.total}<br />
                            <Text size="xs" c="dimmed" span>total</Text>
                        </Text>
                    }
                />
                <Stack gap={4}>
                    <Group gap={6}>
                        <Box w={10} h={10} style={{ background: 'var(--mantine-color-green-5)', borderRadius: 2 }} />
                        <Text size="xs">Active: {stats.active}</Text>
                    </Group>
                    <Group gap={6}>
                        <Box w={10} h={10} style={{ background: 'var(--mantine-color-red-5)', borderRadius: 2 }} />
                        <Text size="xs">Expired: {stats.expired}</Text>
                    </Group>
                    <Group gap={6}>
                        <Box w={10} h={10} style={{ background: 'var(--mantine-color-yellow-5)', borderRadius: 2 }} />
                        <Text size="xs">Favorited: {stats.favorites}</Text>
                    </Group>
                    {Object.entries(stats.byPersona).map(([p, count]) => (
                        <Group key={p} gap={6}>
                            <Box w={10} h={10} style={{ background: `var(--mantine-color-${PERSONA_COLORS[p] || 'blue'}-5)`, borderRadius: 2 }} />
                            <Text size="xs">{p}: {count}</Text>
                        </Group>
                    ))}
                </Stack>
            </Group>

            <Divider mb="sm" />
            <Text size="xs" c="dimmed" fw={600} mb={4}>By Status</Text>
            <Stack gap={3}>
                {statusEntries.map(([label, count]) => (
                    <Group key={label} justify="space-between">
                        <Group gap={6}>
                            <Box w={8} h={8} style={{ background: `var(--mantine-color-${STATUS_COLORS[label] || 'gray'}-5)`, borderRadius: 2 }} />
                            <Text size="xs">{label}</Text>
                        </Group>
                        <Text size="xs" fw={600}>{count}</Text>
                    </Group>
                ))}
            </Stack>
        </Paper>
    );
}

function ConfirmationCard({ output, onConfirm, onCancel }: {
    output: any;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    console.log('ConfirmationCard output', JSON.stringify(output, null, 2));
    const isDelete = output.action === 'delete_employee';

    return (
        <Paper
            p="md"
            radius="md"
            mt="xs"
            style={{
                border: `1px solid var(--mantine-color-${isDelete ? 'red' : 'blue'}-3)`,
                background: `var(--mantine-color-${isDelete ? 'red' : 'blue'}-0)`
            }}
        >
            <Group gap="xs" mb="sm">
                <ThemeIcon size="sm" color={isDelete ? 'red' : 'blue'} variant="light" radius="xl">
                    <IconAlertTriangle size={12} />
                </ThemeIcon>
                <Text size="xs" fw={700} c={isDelete ? 'red.8' : 'blue.8'}>
                    {isDelete ? 'Confirm Employee Deletion' : 'Confirm New Employee'}
                </Text>
            </Group>

            <Stack gap={4} mb="sm">
                {output.employeeDetails && (
                    <>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed">Name</Text>
                            <Text size="xs" fw={600}>{output.employeeDetails.first_name} {output.employeeDetails.last_name}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed">Username</Text>
                            <Text size="xs" fw={600}>@{output.employeeDetails.username}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed">Role</Text>
                            <Badge size="xs" color={PERSONA_COLORS[output.employeeDetails.persona] || 'blue'} variant="light">
                                {output.employeeDetails.persona}
                            </Badge>
                        </Group>
                        {output.employeeDetails.password && (
                            <Group justify="space-between">
                                <Text size="xs" c="dimmed">Password</Text>
                                <Text size="xs" fw={600} style={{ fontFamily: 'monospace' }}>
                                    {output.employeeDetails.password}
                                </Text>
                            </Group>
                        )}
                    </>
                )}
            </Stack>

            <Text size="xs" c="dimmed" mb="sm">
                {isDelete
                    ? 'This will permanently delete this employee from both the portal and Auth0. This action cannot be undone.'
                    : 'This will create a new employee account in the portal and Auth0.'}
            </Text>

            <Group gap="xs" justify="flex-end">
                <Button size="xs" variant="subtle" color="gray" onClick={onCancel}>
                    Cancel
                </Button>
                <Button size="xs" color={isDelete ? 'red' : 'blue'} onClick={onConfirm}>
                    {isDelete ? 'Delete Employee' : 'Create Employee'}
                </Button>
            </Group>
        </Paper>
    );
}

function ToolResultRenderer({ part, onView, onSendMessage }: {
    part: any;
    onView: (url: string, name: string) => void ;
    onSendMessage: (text: string) => void;
}) {
    const output = part.output;
    if (!output || part.state !== 'output-available') return null;
    if (!output.success && output.type !== 'checkout_list') return null;

    switch (output.type) {
        case 'pending_confirmation':
            return (
                <ConfirmationCard
                    output={output}
                    onConfirm={() => onSendMessage('Yes, confirmed. Please proceed.')}
                    onCancel={() => onSendMessage('Cancel. Do not proceed.')}
                />
            );
        case 'document_list':
        case 'checkout_list':
            return (
                <Stack gap={6} mt="xs">
                    {(output.documents || []).map((doc: DocResult) => (
                        <DocumentCard key={doc.id} doc={doc} onView={onView} />
                    ))}
                    {output.count === 0 && (
                        <Text size="xs" c="dimmed" fs="italic">No documents found.</Text>
                    )}
                </Stack>
            );

        case 'employee_list':
            return (
                <Stack gap={6} mt="xs">
                    {(output.employees || []).map((emp: EmpResult) => (
                        <EmployeeCard key={emp.empid} emp={emp} />
                    ))}
                </Stack>
            );

        case 'document_stats':
            return <StatsChart stats={output.stats} />;

        case 'document_added':
        case 'employee_added':
        case 'document_edited':
        case 'document_restored':
        case 'document_checked_out':
        case 'document_checked_in':
        case 'document_favorited':
            return (
                <Paper p="xs" radius="md" mt="xs" style={{ background: 'var(--mantine-color-green-0)', border: '1px solid var(--mantine-color-green-3)' }}>
                    <Group gap="xs">
                        <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                            <IconCheck size={12} />
                        </ThemeIcon>
                        <Text size="xs" c="green.8" fw={500}>{output.message}</Text>
                    </Group>
                </Paper>
            );

        case 'portal_summary':
            return (
                <Paper p="md" radius="md" withBorder mt="xs">
                    <Text fw={600} size="sm" mb="sm" c="dimmed">Portal Activity Summary</Text>
                    <Stack gap={4}>
                        <Group justify="space-between"><Text size="xs">Total Documents</Text><Text size="xs" fw={700}>{output.summary.documents.total}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="green.7">Active</Text><Text size="xs" fw={700} c="green.7">{output.summary.documents.active}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="red.7">Expired</Text><Text size="xs" fw={700} c="red.7">{output.summary.documents.expired}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="gray.6">Archived</Text><Text size="xs" fw={700} c="gray.6">{output.summary.documents.archived}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="orange.7">In Trash</Text><Text size="xs" fw={700} c="orange.7">{output.summary.documents.inTrash}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="yellow.7">Favorited</Text><Text size="xs" fw={700} c="yellow.7">{output.summary.documents.favorited}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="blue.7">Checked Out</Text><Text size="xs" fw={700} c="blue.7">{output.summary.documents.checkedOut}</Text></Group>
                        <Group justify="space-between"><Text size="xs" c="orange.6">Expiring (30d)</Text><Text size="xs" fw={700} c="orange.6">{output.summary.documents.expiringSoon}</Text></Group>
                        <Divider my={4} />
                        <Group justify="space-between"><Text size="xs">Total Employees</Text><Text size="xs" fw={700}>{output.summary.employees.total}</Text></Group>
                    </Stack>
                </Paper>
            );

        case 'document_deleted':
        case 'employee_deleted':
            return (
                <Paper p="xs" radius="md" mt="xs" style={{ background: 'var(--mantine-color-orange-0)', border: '1px solid var(--mantine-color-orange-3)' }}>
                    <Group gap="xs">
                        <ThemeIcon size="sm" color="orange" variant="light" radius="xl">
                            <IconTrash size={12} />
                        </ThemeIcon>
                        <Text size="xs" c="orange.8" fw={500}>{output.message}</Text>
                    </Group>
                </Paper>
            );

        default:
            return null;
    }
}

function toolLoadingLabel(toolName: string): string {
    const labels: Record<string, string> = {
        'getEmployeeList': 'Searching employee records...',
        'addEmployee': 'Creating employee account...',
        'deleteEmployee': 'Processing deletion...',
        'searchDocuments': 'Searching document library...',
        'addDocument': 'Creating document record...',
        'editDocument': 'Updating document...',
        'deleteDocument': 'Moving document to Trash...',
        'favoriteDocument': 'Updating favorites...',
        'getCheckedOutDocuments': 'Checking document status...',
        'getDocumentStats': 'Generating statistics...',
        'getArchivedDocuments': 'Fetching archived documents...',
        'getExpiringDocuments': 'Checking expiration dates...',
        'restoreDocument': 'Restoring document...',
        'checkoutDocument': 'Checking out document...',
        'checkinDocument': 'Checking in document...',
        'summarizePortalActivity': 'Generating portal summary...',
        'changeTheme': 'Applying theme...',
    };
    return labels[toolName] || 'Processing...';
}

export function Chatbot() {
    const [dbUsername, setDbUsername] = useState(localStorage.getItem('username') || '');
    const [displayName, setDisplayName] = useState(
        localStorage.getItem('first_name') || localStorage.getItem('username') || 'User'
    );
    const [opened, setOpened] = useState(false);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [initialGreeting, setInitialGreeting] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
        open: false, message: '', onConfirm: () => {}
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerLabel, setViewerLabel] = useState('');

    const handleView = (url: string, name: string) => {
        setViewerUrl(url);
        setViewerLabel(name);
    };

    useEffect(() => {
        if (!dbUsername) {
            setInitialGreeting('Welcome to the Hanover Insurance Portal. Please log in to access assistant features.');
            return;
        }
        const greetings = [
            `Good day, ${displayName}. How may I assist you?`,
            `Welcome back, ${displayName}. What can I help you with today?`,
            `Hello, ${displayName}. I'm ready to assist with your documents or team queries.`,
            `${displayName}, how can the Hanover AI Assistant help you today?`,
            `Good to see you, ${displayName}. What would you like to work on?`,
            `How can I help you with your documents today, ${displayName}?`,
            `What are we diving into today, ${displayName}?`,
            `Hello ${displayName}! How can I assist you right now?`,
            `Ready to tackle some documents, ${displayName}?`,
            `Welcome back, ${displayName}! What's on the agenda?`,
            `Hi ${displayName}, what can I help you find today?`,
            `Greetings ${displayName}! Need some help navigating the portal?`,
            `Hello ${displayName}. Point me to the documents you need!`,
            `Hey ${displayName}, let's get some work done. What do you need?`,
            `Welcome ${displayName}. How can I make your workflow easier today?`,
            `Ready when you are, ${displayName}. What are we looking for?`,
            `Hey ${displayName}! Got a question about your files?`,
            `Good to see you, ${displayName}. What's on your mind?`,
            `Hi ${displayName}. Point the way and I'll help you navigate!`,
            `${displayName} returns! Got a question I can help you with?`,
        ];
        setInitialGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, [displayName, dbUsername]);

    const savedHistory = (): UIMessage[] => {
        try {
            const s = sessionStorage.getItem('chatHistory');
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    };

    const { messages, setMessages, sendMessage, status, error, stop } = useChat({
        transport: new DefaultChatTransport({
            api: `${DOMAIN}/api/chat`,
            body: { username: dbUsername, displayName }
        }),
        messages: savedHistory(),
        onError: (err) => console.error('Chat error:', err),
        onFinish: () => {
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 100);
        }
    });

    useEffect(() => {
        for (const m of messages) {
            for (const part of (m.parts as any[]) ?? []) {
                if (part.type === 'tool-changeTheme' && part.state === 'output-available' && part.output?.themeChange) {
                    const newTheme = part.output.themeChange;
                    localStorage.setItem('theme', newTheme);
                    document.documentElement.setAttribute('data-theme', newTheme === 'high-visibility' ? 'high-visibility' : ' ');
                    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
                }
            }
        }
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0) {
            const clean = messages.filter(m => {
                if (m.role === 'user') return true;
                if (m.role === 'assistant') {
                    const parts = m.parts as any[];
                    if (!parts?.length) return false;
                    return !parts.some(p => p.type === 'tool-invocation' && p.toolInvocation?.state !== 'result');
                }
                return false;
            });
            sessionStorage.setItem('chatHistory', JSON.stringify(clean));
        }
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            const freshUser = localStorage.getItem('username') || '';
            const freshName = localStorage.getItem('first_name') || freshUser || 'User';
            if (freshUser !== dbUsername) {
                setDbUsername(freshUser);
                setDisplayName(freshName);
                setMessages([]);
                sessionStorage.removeItem('chatHistory');
            }
        }, 500);
        return () => clearInterval(interval);
    }, [dbUsername, setMessages]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // Voice input
    const toggleVoice = () => {
        if (isListening) { setIsListening(false); return; }
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { alert('Voice input is not supported in your browser. Please use Chrome or Edge.'); return; }
        const r = new SR();
        r.continuous = false;
        r.interimResults = true;
        r.lang = 'en-US';
        r.onstart = () => setIsListening(true);
        r.onresult = (e: any) => setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(''));
        r.onerror = () => setIsListening(false);
        r.onend = () => setIsListening(false);
        r.start();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || status === 'submitted' || status === 'streaming') return;

        let messageText = input.trim();

        if (attachedFile) {
            const formPayload = new FormData();
            formPayload.append('file', attachedFile);
            formPayload.append('ownerUsername', dbUsername);
            try {
                const res = await fetch(`${DOMAIN}/api/chat/upload`, { method: 'POST', body: formPayload });
                const data = await res.json();
                if (data.url) messageText += ` (File already uploaded — use this URL: ${data.url})`;
            } catch (err) {
                console.error('File upload failed:', err);
            }
            setAttachedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }

        sendMessage({ text: messageText });
        setInput('');
    };

    const clearHistory = () => {
        setMessages([]);
        sessionStorage.removeItem('chatHistory');
    };

    const quickActions = useMemo(() => {
        const base = [
            { label: 'My Documents', query: `Show me all documents owned by ${dbUsername}` },
            { label: 'Portal Summary', query: 'Give me a portal activity summary' },
            { label: 'Expiring Soon', query: 'What documents are expiring in the next 30 days?' },
            { label: 'Checked Out', query: 'Which documents are currently checked out?' },
        ];
        if (localStorage.getItem('persona') === 'Admin') {
            base.push({ label: 'All Employees', query: 'List all employees' });
            base.push({ label: 'Archived Docs', query: 'Show me all archived and expired documents' });
        }
        return base;
    }, [dbUsername]);

    return (
        <>
            {/* Floating Button */}
            <Affix position={{ bottom: 24, right: 24 }}>
                <Tooltip label="Hanover AI Assistant" position="left" withArrow>
                    <Avatar
                        src={avatar}
                        size={65}
                        radius="xl"
                        onClick={() => setOpened(true)}
                        style={{
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            border: '0px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer'
                        }}
                    />
                </Tooltip>
            </Affix>

            {/* Confirm Modal */}
            <Modal
                opened={confirmModal.open}
                onClose={() => setConfirmModal(s => ({ ...s, open: false }))}
                title={
                    <Group gap="xs">
                        <IconAlertTriangle size={18} color="orange" />
                        <Text fw={700}>Confirm Action</Text>
                    </Group>
                }
                size="sm"
                centered
            >
                <Text size="sm" mb="lg">{confirmModal.message}</Text>
                <Group justify="flex-end" gap="sm">
                    <Button variant="subtle" color="gray" onClick={() => setConfirmModal(s => ({ ...s, open: false }))}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={() => { confirmModal.onConfirm(); setConfirmModal(s => ({ ...s, open: false })); }}>
                        Confirm
                    </Button>
                </Group>
            </Modal>

            {/* Document Viewer */}
            {viewerUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                     style={{zIndex: 1000}} onClick={() => setViewerUrl(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-4/5 flex flex-col overflow-hidden"
                         style={{height: '80vh'}} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-2 border-b">
                            <h2 className="text-lg font-bold"
                                style={{color: 'var(--color-yale-blue)'}}>{viewerLabel}</h2>
                            <button onClick={() => setViewerUrl(null)}
                                    className="text-gray-500 hover:text-gray-800 text-xl font-bold">✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {pickRenderer(viewerUrl ?? '') === 'docviewer' && (
                                <DocViewer documents={[{uri: viewerUrl, fileName: viewerLabel}]}
                                           pluginRenderers={DocViewerRenderers}
                                           style={{height: '100%', minHeight: '600px'}}/>
                            )}
                            {pickRenderer(viewerUrl ?? '') === 'player' && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',
                                    backgroundColor: '#000',
                                    padding: '20px'
                                }}>
                                    {['MP3', 'M4A', 'WAV', 'OGG'].includes(getExt(viewerUrl ?? '').toUpperCase()) ? (
                                        <audio controls style={{width: '100%', maxWidth: '600px'}}>
                                            <source src={viewerUrl}/>
                                            Your browser does not support the audio element.
                                        </audio>
                                    ) : (
                                        <video controls style={{
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                        }}>
                                            <source src={viewerUrl}/>
                                            Your browser does not support the video element.
                                        </video>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Drawer */}
            <Drawer
                opened={opened}
                onClose={() => setOpened(false)}
                title={
                    <Group gap="sm">
                        <Avatar src={avatar} size="md" radius="xl" />
                        <Box>
                            <Text fw={700} size="sm" lh={1.2}>Hanover AI Assistant</Text>
                            <Text size="xs" c="dimmed" lh={1.2}>Powered by Mistral</Text>
                        </Box>
                        <Group gap={4} ml="auto">
                            <Tooltip label="Clear conversation" withArrow>
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={clearHistory}>
                                    <IconRefresh size={14} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                }
                position="right"
                size="md"
                styles={{
                    header: { borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 12 },
                    body: { padding: 0 }
                }}
            >
                <Stack h="calc(100vh - 80px)" gap={0}>
                    {/* Messages */}
                    <ScrollArea flex={1} p="md" type="auto" viewportRef={scrollRef}>
                        <Stack gap="md">
                            {/* Greeting */}
                            {messages.length === 0 && (
                                <>
                                    <Paper p="md" radius="md" style={{ background: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-2)' }}>
                                        <Group gap="sm" mb="xs">
                                            <Avatar src={avatar} size="md" radius="xl" />
                                            <Text size="xs" fw={600} c="dimmed">Hanover AI Assistant</Text>
                                        </Group>
                                        <Text size="sm">{initialGreeting}</Text>
                                    </Paper>

                                    {dbUsername && (
                                        <Box>
                                            <Text size="xs" c="dimmed" mb="xs" fw={500}>QUICK ACTIONS</Text>
                                            <Group gap="xs">
                                                {quickActions.map((a, i) => (
                                                    <Button
                                                        key={i}
                                                        size="xs"
                                                        variant="light"
                                                        color="blue"
                                                        onClick={() => sendMessage({ text: a.query })}
                                                        disabled={status === 'submitted' || status === 'streaming'}
                                                    >
                                                        {a.label}
                                                    </Button>
                                                ))}
                                            </Group>
                                        </Box>
                                    )}
                                </>
                            )}

                            {/* Messages */}
                            {messages.map(m => (
                                <Box key={m.id}>
                                    {m.role === 'user' ? (
                                        /* User message */
                                        <Group justify="flex-end">
                                            <Box style={{ maxWidth: '80%' }}>
                                                <Text size="xs" c="dimmed" ta="right" mb={4} fw={500}>{displayName}</Text>
                                                <Paper
                                                    p="sm"
                                                    radius="md"
                                                    style={{
                                                        background: 'var(--color-yale-blue, #1b4965)',
                                                        color: 'white'
                                                    }}
                                                >
                                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {(m.parts as any[])?.find(p => p.type === 'text')?.text || ''}
                                                    </Text>
                                                </Paper>
                                            </Box>
                                        </Group>
                                    ) : (
                                        /* Assistant message */
                                        <Group justify="flex-start" align="flex-start" gap="xs">
                                            <Avatar src={avatar} size="md" radius="xl" />
                                            <Box style={{ maxWidth: '88%', flex: 1 }}>
                                                <Text size="xs" c="dimmed" mb={4} fw={500}>Hanover AI</Text>

                                                {/* Text parts */}
                                                {(m.parts as any[])
                                                    ?.filter(p => p.type === 'text' && p.text?.trim())
                                                    .map((part, i) => (
                                                        <Paper key={i} p="sm" radius="md" mb="xs" style={{ background: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-2)' }}>
                                                            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={{
                                                                        a: ({ node, ...props }) => {
                                                                            void node;
                                                                            return <Anchor {...props} size="sm" target="_blank" fw={500} underline="hover" />;
                                                                        },
                                                                        p: ({ children }) => <Text size="sm" mb="xs">{children}</Text>,
                                                                        strong: ({ children }) => <Text span fw={700} size="sm">{children}</Text>,
                                                                        li: ({ children }) => <Text size="sm" component="li">{children}</Text>
                                                                    }}
                                                                >
                                                                    {part.text}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </Paper>
                                                    ))}

                                                {/* Tool parts */}
                                                {(m.parts as any[])?.filter(p => p.type?.startsWith('tool-')).map((part, i) => {
                                                    const toolName = part.type?.replace('tool-', '');
                                                    const isLoading = part.state === 'input-streaming' || part.state === 'input-available';

                                                    if (isLoading) {
                                                        return (
                                                            <Group key={i} gap="xs" mb="xs" p="sm"
                                                                   style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 8, border: '1px solid var(--mantine-color-gray-2)' }}>
                                                                <Loader size="xs" type="dots" color="blue" />
                                                                <Text size="xs" c="dimmed" fs="italic">
                                                                    {toolLoadingLabel(toolName)}
                                                                </Text>
                                                            </Group>
                                                        );
                                                    }

                                                    if (part.state === 'output-available') {
                                                        return <ToolResultRenderer key={i} part={part} onView={handleView} onSendMessage={(text) => { sendMessage({ text }); }} />;
                                                    }

                                                    return null;
                                                })}
                                            </Box>
                                        </Group>
                                    )}
                                </Box>
                            ))}

                            {/* Thinking indicator */}
                            {status === 'submitted' && (
                                <Group justify="flex-start" align="center" gap="xs">
                                    <Avatar src={avatar} size="md" radius="xl" />
                                    <Paper p="sm" radius="md" style={{ background: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-2)' }}>
                                        <Group gap="xs">
                                            <Loader size="xs" type="dots" />
                                            <Text size="xs" c="dimmed">Analyzing your request...</Text>
                                        </Group>
                                    </Paper>
                                </Group>
                            )}

                            {/* Error state */}
                            {error && (
                                <Paper p="sm" radius="md" style={{ background: 'var(--mantine-color-red-0)', border: '1px solid var(--mantine-color-red-3)' }}>
                                    <Group gap="xs">
                                        <IconAlertTriangle size={14} color="red" />
                                        <Text size="xs" c="red.7">
                                            Service temporarily unavailable. Please try again in a moment.
                                        </Text>
                                    </Group>
                                </Paper>
                            )}
                        </Stack>
                    </ScrollArea>

                    <Divider />

                    {/* Input Area */}
                    <Box p="md">
                        {attachedFile && (
                            <Group gap="xs" mb="xs" p="xs"
                                   style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 8, border: '1px solid var(--mantine-color-blue-2)' }}>
                                <IconPaperclip size={14} color="blue" />
                                <Text size="xs" c="blue.7" style={{ flex: 1 }} truncate>{attachedFile.name}</Text>
                                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => {
                                    setAttachedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}>
                                    <IconX size={10} />
                                </ActionIcon>
                            </Group>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
                        />

                            <Textarea
                                placeholder={
                                    !dbUsername ? 'Please log in to use the assistant.' :
                                        isListening ? 'Listening...' :
                                            'Ask about documents, employees, or portal navigation...'
                                }
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={!dbUsername || status === 'submitted' || status === 'streaming'}
                                size="sm"
                                radius="md"
                                autosize
                                minRows={1}
                                maxRows={4}
                                leftSection={
                                    <Tooltip label="Attach file" withArrow>
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color="gray"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!dbUsername || status === 'submitted' || status === 'streaming'}
                                        >
                                            <IconPaperclip size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                }
                                rightSectionWidth={72}
                                rightSection={
                                    <Group gap={2} mr={2} wrap="nowrap">
                                        <Tooltip label={isListening ? 'Stop listening' : 'Voice input'} withArrow>
                                            <ActionIcon
                                                size="sm"
                                                variant={isListening ? 'filled' : 'subtle'}
                                                color={isListening ? 'red' : 'gray'}
                                                onClick={toggleVoice}
                                                disabled={!dbUsername || status === 'submitted' || status === 'streaming'}
                                            >
                                                <IconMicrophone size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                        {status === 'submitted' || status === 'streaming' ? (
                                            <Tooltip label="Stop generating" withArrow>
                                                <ActionIcon size="sm" color="red" variant="filled" onClick={stop}>
                                                    <IconSquare size={12} fill="currentColor" />
                                                </ActionIcon>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip label="Send (Enter)" withArrow>
                                                <ActionIcon
                                                    size="sm"
                                                    color="blue"
                                                    variant="filled"
                                                    disabled={!input.trim() || !dbUsername}
                                                    onClick={handleSubmit}
                                                >
                                                    <IconSend size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (input.trim() && dbUsername && status !== 'submitted' && status !== 'streaming') {
                                            handleSubmit(e as any);
                                        }
                                    }
                                    // Shift+Enter falls through naturally and adds a newline
                                }}
                            />

                        <Text size="xs" c="dimmed" ta="center" mt={6}>
                            Hanover Insurance — Internal Portal Assistant
                        </Text>
                    </Box>
                </Stack>
            </Drawer>
        </>
    );
}