import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spotlight, type SpotlightActionData } from '@mantine/spotlight';
import '@mantine/spotlight/styles.css';
import {
    IconHome, IconFileText, IconArchive,
    IconUsers, IconBrightnessUp, IconBell, IconUserCircle,
    IconSearch, IconLoader,
} from '@tabler/icons-react';
import { Text, Group, Badge, Box, Highlight } from '@mantine/core';
import { useApi } from '../components/api';
import { DOMAIN } from '../const';


// TYPES
type SearchResult = {
    contentformId: number;
    docName: string;
    docUrl: string;
    snippet: { before: string; match: string; after: string };
    similarity: number;
};

// CUSTOM SNIPPET RENDERER
function SnippetPreview({ snippet, query }: { snippet: SearchResult['snippet']; query: string }) {
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
        }, 400); // 400ms debounce

        setDebounceTimer(timer);

        return () => clearTimeout(timer);
    }, [query]);

    // navigation actions
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
            id: 'profile',
            label: 'Profile',
            description: 'View Profile',
            onClick: () => navigate('/profilePage'),
            leftSection: <IconUserCircle size={20} stroke={1.5} />,
            group: 'Navigation'
        },
        ...(persona === 'Admin' ? [{
            id: 'employees',
            label: 'Manage Employees',
            description: 'Add, edit, or remove staff accounts',
            onClick: () => navigate('/manageemployees'),
            leftSection: <IconUsers size={20} stroke={1.5} />,
            group: 'Navigation'
        }] : [])
    ];

    // Document content search results
    const docActions: SpotlightActionData[] = searchResults.map(r => ({
        id: `doc-${r.contentformId}-${r.docName}`,
        label: r.docName,
        description: `${Math.round(r.similarity * 100)}% match`,
        onClick: () => window.open(r.docUrl, '_blank'),
        leftSection: <IconFileText size={20} stroke={1.5} color="var(--mantine-color-blue-5)" />,
        group: 'Document Contents',
        children: (
            <Box>
                <Group justify="space-between" wrap="nowrap">
                    <Text size="sm" fw={500} truncate>{r.docName}</Text>
                    <Badge size="xs" color="blue" variant="light">
                        {Math.round(r.similarity * 100)}% match
                    </Badge>
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
        <Spotlight
            actions={allActions}
            nothingFound={
                query.length >= 3 && !searching
                    ? 'No matching documents or pages found.'
                    : 'Type at least 3 characters to search document contents...'
            }
            highlightQuery
            onQueryChange={setQuery}
            searchProps={{
                placeholder: 'Jump to page or search document contents...',
                leftSection: <IconSearch size={20} stroke={1.5} />,
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
    );
}