import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spotlight, type SpotlightActionData } from '@mantine/spotlight';
import '@mantine/spotlight/styles.css';
import {
    IconHome, IconFileText, IconArchive,
    IconUsers, IconBrightnessUp, IconBell, IconUserCircle,
    IconSearch, IconLoader, IconMicrophone, IconTrash, IconUpload, IconFilePlus, IconInfoCircle, IconUsersGroup, IconDatabase
} from '@tabler/icons-react';
import { Text, Group, Badge, Box, ActionIcon } from '@mantine/core';
import { useApi } from '../components/api';
import { DOMAIN } from '../const';
import DocViewer, { DocViewerRenderers } from '@iamjariwala/react-doc-viewer';
import '@iamjariwala/react-doc-viewer/dist/index.css';
import { pickRenderer, getExt } from '../components/content/Functions';

// TYPES
type SearchResult = {
    contentformId: number;
    docName: string;
    docUrl: string;
    snippet: { before: string; match: string; after: string };
    similarity: number;
};

// CUSTOM SNIPPET RENDERER
function SnippetPreview({ snippet }: { snippet: SearchResult['snippet']; query: string }) {
    if (!snippet.match && !snippet.before) return null;

    return (
        <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
            {snippet.before}
            {snippet.match && (
                <Text span fw={700} c="blue.7" style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 2, padding: '0 2px' }}>
                    {snippet.match}
                </Text>
            )}
            {snippet.after}
        </Text>
    );
}

// MAIN COMPONENT
export function CommandPalette() {
    const navigate = useNavigate();
    const api = useApi();
    const [persona, setPersona] = useState(localStorage.getItem('persona') || 'Guest');
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const [isListening, setIsListening] = useState(false);

    const toggleVoice = () => {
        if (isListening) { setIsListening(false); return; }
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { alert('Voice input is not supported in your browser. Please use Chrome or Edge.'); return; }
        const r = new SR();
        r.continuous = false;
        r.interimResults = true;
        r.lang = 'en-US';
        r.onstart = () => setIsListening(true);
        r.onresult = (e: any) => setQuery(Array.from(e.results).map((x: any) => x[0].transcript).join(''));
        r.onerror = () => setIsListening(false);
        r.onend = () => setIsListening(false);
        r.start();
    };

    const handleReindex = async () => {
        alert('Starting system reindex... This might take a minute.');

        try {
            const res = await api(`${DOMAIN}/api/admin/reindex`, {
                method: 'POST'
            });

            if (!res.ok) {
                throw new Error(`Reindex failed: ${res.statusText}`);
            }

            const data = await res.json();
            alert(`✅ ${data.message}\n\nYou can close this window and continue working while the server processes the documents.`);
        } catch (error) {
            console.error("Failed to reindex:", error);
            alert("❌ Failed to run the reindex process. Check the browser console.");
        }
    };

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerLabel, setViewerLabel] = useState('');

    useEffect(() => {
        const handleStorageChange = () => setPersona(localStorage.getItem('persona') || 'Guest');
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (debounceTimer) clearTimeout(debounceTimer);

        if (!query || query.length < 3 || persona === 'Guest') {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);

        const timer = setTimeout(async () => {
            try {
                const res = await api(`${DOMAIN}/search/semantic?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.results || []);
                }
            } catch (err) {
                console.error('Semantic search error:', err);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);

        setDebounceTimer(timer);

        return () => clearTimeout(timer);
    }, [query]);

    const navActions: SpotlightActionData[] = [
        {
            id: 'home',
            label: 'Home',
            description: 'Return to the main statistics',
            onClick: () => navigate('/'),
            leftSection: <IconHome size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'documents',
            label: 'Documents',
            description: 'View and manage your files',
            onClick: () => navigate('/documents'),
            leftSection: <IconFileText size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'archive',
            label: 'Archive',
            description: 'View expired and archived documents',
            onClick: () => navigate('/archive'),
            leftSection: <IconArchive size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'toggle-theme',
            label: 'Toggle High Visibility Theme',
            description: 'Switch between default and colorblind modes',
            onClick: () => {
                const current = localStorage.getItem('theme');
                const next = current === 'high-visibility' ? 'default' : 'high-visibility';
                localStorage.setItem('theme', next);
                document.documentElement.setAttribute('data-theme', next === 'high-visibility' ? 'high-visibility' : ' ');
                window.dispatchEvent(new Event('storage'));
            },
            leftSection: <IconBrightnessUp size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'notifications',
            label: 'Notifications',
            description: 'View notifications',
            onClick: () => navigate('/notifications'),
            leftSection: <IconBell size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'about',
            label: 'About Us',
            description: 'View About Us',
            onClick: () => navigate('/about'),
            leftSection: <IconUsersGroup size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'credit',
            label: 'Credits',
            description: 'View the Credits page',
            onClick: () => navigate('/credit'),
            leftSection: <IconInfoCircle size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'profile',
            label: 'Profile',
            description: 'View Profile',
            onClick: () => window.dispatchEvent(new CustomEvent('openProfilePopup')),
            leftSection: <IconUserCircle size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        {
            id: 'add-document',
            label: 'Add Document',
            description: 'Upload or link a new document',
            onClick: () => {
                if (window.location.pathname !== '/documents') {
                    navigate('/documents');
                    setTimeout(() => window.dispatchEvent(new CustomEvent('openAddDocumentPopup')), 150);
                } else {
                    window.dispatchEvent(new CustomEvent('openAddDocumentPopup'));
                }
            },
            leftSection: <IconFilePlus size={20} stroke={1.5} />,
            group: 'Actions'
        },
        {
            id: 'bulk-upload',
            label: 'Bulk Upload Documents',
            description: 'Upload multiple documents at once',
            onClick: () => {
                if (window.location.pathname !== '/documents') {
                    navigate('/documents');
                    setTimeout(() => window.dispatchEvent(new CustomEvent('openBulkUploadPopup')), 150);
                } else {
                    window.dispatchEvent(new CustomEvent('openBulkUploadPopup'));
                }
            },
            leftSection: <IconUpload size={20} stroke={1.5} />,
            group: 'Actions'
        },
        ...(persona === 'Admin' ? [
            {
                id: 'employees',
                label: 'Manage Employees',
                description: 'Add, edit, or remove staff accounts',
                onClick: () => navigate('/manageemployees'),
                leftSection: <IconUsers size={20} stroke={1.5} />,
                group: 'Navigation'
            },
            {
                id: 'trash',
                label: 'Trash',
                description: 'View deleted documents and folders',
                onClick: () => {
                    if (window.location.pathname !== '/documents') {
                        navigate('/documents');
                        setTimeout(() => window.dispatchEvent(new CustomEvent('openTrashPopup')), 150);
                    } else {
                        window.dispatchEvent(new CustomEvent('openTrashPopup'));
                    }
                },
                leftSection: <IconTrash size={20} stroke={1.5} />,
                group: 'Navigation'
            },
            {
                id: 'reindex',
                label: 'Reindex System Data',
                description: 'Scan and transcribe new documents and media.',
                onClick: handleReindex,
                leftSection: <IconDatabase size={20} stroke={1.5} />,
                group: 'Actions'
            }
        ] : [])
    ];

    const docActions: SpotlightActionData[] = searchResults.map(r => ({
        id: `doc-${r.contentformId}-${r.docName}`,
        label: r.docName,
        description: r.similarity > 0 ? `${Math.round(r.similarity * 100)}% match` : 'Title Match',
        onClick: () => {
            setViewerUrl(r.docUrl);
            setViewerLabel(r.docName);
        },
        leftSection: <IconFileText size={20} stroke={1.5} color="var(--mantine-color-blue-5)" />,
        group: 'Document Contents',
        children: (
            <Box>
                <Group justify="space-between" wrap="nowrap">
                    <Text size="sm" fw={500} truncate>{r.docName}</Text>
                    <Group gap="xs">
                        {r.similarity > 0 && (
                            <Badge size="xs" color="blue" variant="light">
                                {Math.round(r.similarity * 100)}% match
                            </Badge>
                        )}

                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            title="Find in Documents Page"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/documents?search=${encodeURIComponent(r.docName)}`);
                            }}
                        >
                            <IconSearch size={14} />
                        </ActionIcon>
                    </Group>

                </Group>
                <SnippetPreview snippet={r.snippet} query={query} />
            </Box>
        )
    }));

    const loadingAction: SpotlightActionData[] = searching ? [{
        id: 'searching',
        label: 'Searching document contents...',
        description: 'Looking through indexed documents',
        onClick: () => {},
        leftSection: <IconLoader size={20} stroke={1.5} />,
        group: 'Document Contents',
        disabled: true
    }] : [];

    const allActions = [
        ...navActions,
        ...(query.length >= 3 ? (searching ? loadingAction : docActions) : [])
    ];

    return (
        <>
            <Spotlight
                actions={allActions}
                nothingFound={
                    query.length >= 3 && !searching
                        ? 'No matching documents or pages found.'
                        : 'Type at least 3 characters to search document contents...'
                }
                highlightQuery
                query={query}
                onQueryChange={setQuery}
                searchProps={{
                    placeholder: isListening ? 'Listening...' : 'Jump to page or search document contents...',
                    leftSection: <IconSearch size={20} stroke={1.5} />,
                    rightSectionPointerEvents: 'all',
                    rightSection: (
                        <ActionIcon
                            size="sm"
                            variant={isListening ? 'filled' : 'subtle'}
                            color={isListening ? 'red' : 'gray'}
                            onClick={toggleVoice}
                        >
                            <IconMicrophone size={16} />
                        </ActionIcon>
                    ),
                }}
                shortcut={['mod + K', 'mod + P', '/']}
                filter={(query, actions) => {
                    if (!query) return actions.filter(a => (a as any).group === 'Navigation');

                    const lowerQuery = query.toLowerCase();

                    return actions.filter(rawAction => {
                        const a = rawAction as any;

                        if (a.group === 'Document Contents') return true;

                        const label = a.label ? String(a.label).toLowerCase() : '';
                        const description = a.description ? String(a.description).toLowerCase() : '';

                        return label.includes(lowerQuery) || description.includes(lowerQuery);
                    });
                }}
            />

            {/* Document Viewer Overlay UI */}
            {viewerUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                     style={{zIndex: 10000}} onClick={() => setViewerUrl(null)}>
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
        </>
    );
}