import '@mantine/core/styles.css';
import { useEffect, useState, useRef, useMemo } from "react";
import * as pdfjs from 'pdfjs-dist';
import { Header } from "../components/Header";
import { AccessDenied } from "../components/AccessDenied.tsx";
import {
    TextInput, Button, Modal, Select, MultiSelect, Group, Text,
    Badge, Stack, Box, Table, Checkbox, ActionIcon,
    Tooltip, SegmentedControl
} from '@mantine/core';
import {
    IconSearch, IconPlus, IconEdit, IconTrash,
    IconDownload, IconFilter, IconLayoutGrid, IconList, IconStar, IconStarFilled,
    IconClock
} from '@tabler/icons-react';
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { DOMAIN } from '../const.ts';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


type ContentForm = {
    id: number;
    name: string;
    file_name: string;
    url: string;
    owner: string;
    persona: string[];
    date_modified: string;
    expiration_date: string;
    content_type: string;
    status: string;
    is_favorite: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
};

type Employee = {
    empid: number;
    username: string;
    persona: string;
};

type StagedFile = {
    id: string;
    file: File;
    name: string;
    owner: string;
    persona: string[];
    content_type: string;
    status: string;
    date_modified: string;
    expiration_date: string;
};

const statusColors: Record<string, string> = {
    'In Progress': 'yellow',
    'Internal Review': 'orange',
    'Client Review': 'blue',
    'Approved': 'green',
    'Expired': 'red',
    'Archived': 'gray',
};

const THUMBNAIL_H = 140;
const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

const officeMeta: Record<string, { bg: string; color: string; label: string }> = {
    pdf:  { bg: '#fde8e8', color: '#e53e3e', label: 'PDF'  },
    docx: { bg: '#e8f0fe', color: '#1a73e8', label: 'DOCX' },
    doc:  { bg: '#e8f0fe', color: '#1a73e8', label: 'DOC'  },
    xlsx: { bg: '#e6f4ea', color: '#1e8e3e', label: 'XLSX' },
    xls:  { bg: '#e6f4ea', color: '#1e8e3e', label: 'XLS'  },
    csv:  { bg: '#e6f4ea', color: '#1e8e3e', label: 'CSV'  },
    pptx: { bg: '#fff3e0', color: '#f09300', label: 'PPTX' },
    ppt:  { bg: '#fff3e0', color: '#f09300', label: 'PPT'  },
};

function getExt(url: string) {
    return url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}

function getFileType(url: string) {
    return getExt(url).toUpperCase() || 'Unknown';
}

function OfficePlaceholder({ ext }: { ext: string }) {
    const info = officeMeta[ext] ?? { bg: '#f5f5f5', color: '#888', label: ext.toUpperCase() || 'FILE' };
    return (
        <div style={{
            width: '100%', height: THUMBNAIL_H, background: info.bg,
            borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, userSelect: 'none',
            overflow: 'hidden', position: 'relative',
        }}>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '12px 16px', gap: 5, opacity: 0.22,
            }}>
                {[90, 70, 85, 60, 75, 55].map((w, i) => (
                    <div key={i} style={{ height: 4, width: `${w}%`, background: info.color, borderRadius: 2 }} />
                ))}
            </div>
            <div style={{
                background: info.color, color: 'white', fontWeight: 800,
                fontSize: 13, letterSpacing: 1.5, padding: '4px 12px',
                borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.18)', zIndex: 1,
            }}>{info.label}</div>
        </div>
    );
}

function PdfThumbnail({ url }: { url: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loadingTask = pdfjs.getDocument({ url, withCredentials: false });
                const pdf = await loadingTask.promise;
                if (cancelled) return;
                const page = await pdf.getPage(1);
                if (cancelled) return;
                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({ scale: 1 });
                const containerW = canvas.parentElement?.offsetWidth ?? 200;
                const scale = Math.max(containerW / viewport.width, 0.4);
                const scaled = page.getViewport({ scale });
                canvas.width = scaled.width;
                canvas.height = scaled.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                await page.render({ canvasContext: ctx, viewport: scaled }).promise;
                if (!cancelled) setStatus('done');
            } catch {
                if (!cancelled) setStatus('error');
            }
        })();
        return () => { cancelled = true; };
    }, [url]);

    if (status === 'error') return <OfficePlaceholder ext="pdf" />;

    return (
        <div style={{
            width: '100%', height: THUMBNAIL_H,
            borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(0,0,0,0.07)',
            overflow: 'hidden', background: '#f8f8f8',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        }}>
            {status === 'loading' && (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <style>{`@keyframes _pdfspin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ width: 22, height: 22, border: '3px solid #ddd', borderTopColor: '#e53e3e', borderRadius: '50%', animation: '_pdfspin 0.8s linear infinite' }} />
                </div>
            )}
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: status === 'done' ? 'block' : 'none' }} />
        </div>
    );
}

function DocThumbnail({ url }: { url: string }) {
    const ext = getExt(url);
    if (ext === 'pdf') return <PdfThumbnail url={url} />;
    if (imageExts.has(ext)) {
        return (
            <div style={{ width: '100%', height: THUMBNAIL_H, borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', background: '#f0f0f0' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                     onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
        );
    }
    return <OfficePlaceholder ext={ext} />;
}

interface SortThProps {
    field: keyof ContentForm;
    label: string;
    onToggle: (f: keyof ContentForm) => void;
    currentField: keyof ContentForm | null;
    currentDir: 'asc' | 'desc';
}

function SortTh({ field, label, onToggle, currentField, currentDir }: SortThProps) {
    return (
        <Table.Th onClick={() => onToggle(field)} style={{ cursor: 'pointer' }}>
            {label}{currentField === field ? (currentDir === 'asc' ? ' ↑' : ' ↓') : ''}
        </Table.Th>
    );
}

interface TableHeadProps {
    onSort: (f: keyof ContentForm) => void;
    currentField: keyof ContentForm | null;
    currentDir: 'asc' | 'desc';
    onSelectAll: () => void;
    allChecked: boolean;
    indeterminate: boolean;
}

function TableHead({ onSort, currentField, currentDir, onSelectAll, allChecked, indeterminate }: TableHeadProps) {
    return (
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={40}><Checkbox checked={allChecked} indeterminate={indeterminate} onChange={onSelectAll} /></Table.Th>
                <SortTh field="name" label="Document Name" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="file_name" label="Document Type" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="persona" label="Persona" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="owner" label="Owner" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="content_type" label="Content Type" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="status" label="Status" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="date_modified" label="Date Modified" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="expiration_date" label="Expiration" onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
        </Table.Thead>
    );
}

interface RowCallbacks {
    persona: string | null;
    onView: (url: string, label: string, id: number) => void;
    onFavorite: (doc: ContentForm) => void;
    onDownload: (url: string, name: string) => void;
    onEdit: (doc: ContentForm) => void;
    onDelete: (id: number) => void;
}

interface DocRowProps extends RowCallbacks {
    doc: ContentForm;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

function DocRow({ doc, isSelected, persona, onSelect, onView, onFavorite, onDownload, onEdit, onDelete }: DocRowProps) {
    const canModify = persona === 'Admin' || doc.persona.includes(persona ?? '');
    return (
        <Table.Tr style={{ cursor: 'pointer' }} onClick={() => onView(doc.url, doc.name, doc.id)}>
            <Table.Td onClick={e => e.stopPropagation()}><Checkbox checked={isSelected} onChange={() => onSelect(doc.id)} /></Table.Td>
            <Table.Td fw={500}>{doc.name}</Table.Td>
            <Table.Td>{getFileType(doc.url)}</Table.Td>
            <Table.Td>
                {doc.persona.map(p => (
                    <Badge key={p} variant="light" color={p === 'Underwriter' ? 'teal' : 'blue'} size="xs">{p}</Badge>
                ))}
            </Table.Td>
            <Table.Td>{doc.owner}</Table.Td>
            <Table.Td>{doc.content_type}</Table.Td>
            <Table.Td><Badge color={statusColors[doc.status] ?? 'gray'} variant="light">{doc.status}</Badge></Table.Td>
            <Table.Td>{doc.date_modified?.split('T')[0]}</Table.Td>
            <Table.Td>{doc.expiration_date?.split('T')[0]}</Table.Td>
            <Table.Td onClick={e => e.stopPropagation()}>
                <Group gap="xs">
                    <Tooltip label={doc.is_favorite ? 'Unfavorite' : 'Favorite'}>
                        <ActionIcon variant="subtle" color="yellow" onClick={() => onFavorite(doc)}>
                            {doc.is_favorite ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Download">
                        <ActionIcon variant="subtle" onClick={() => onDownload(doc.url, doc.name)}><IconDownload size={16} /></ActionIcon>
                    </Tooltip>
                    {canModify && (
                        <Tooltip label="Edit">
                            <ActionIcon variant="subtle" onClick={() => onEdit(doc)}><IconEdit size={16} /></ActionIcon>
                        </Tooltip>
                    )}
                    {canModify && (
                        <Tooltip label="Delete">
                            <ActionIcon variant="subtle" color="red" onClick={() => onDelete(doc.id)}><IconTrash size={16} /></ActionIcon>
                        </Tooltip>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}

interface DocCardProps extends RowCallbacks {
    doc: ContentForm;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

function DocCard({ doc, isSelected, persona, onSelect, onView, onFavorite, onDownload, onEdit, onDelete }: DocCardProps) {
    const canModify = persona === 'Admin' || doc.persona.includes(persona ?? '');
    return (
        <div
            style={{
                position: 'relative', background: 'white', borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)', cursor: 'pointer',
                transition: 'box-shadow 0.15s', overflow: 'hidden',
                border: isSelected ? '2px solid var(--color-fresh-sky, #3b82f6)' : '2px solid transparent',
            }}
            onClick={() => onView(doc.url, doc.name, doc.id)}
        >
            <DocThumbnail url={doc.url} />

            <div style={{ position: 'absolute', top: 8, left: 8 }} onClick={e => e.stopPropagation()}>
                <Checkbox checked={isSelected} onChange={() => onSelect(doc.id)} />
            </div>
            <div style={{ position: 'absolute', top: 6, right: 6 }} onClick={e => e.stopPropagation()}>
                <ActionIcon variant="filled" color={doc.is_favorite ? 'yellow' : 'gray'} size="sm" onClick={() => onFavorite(doc)}>
                    {doc.is_favorite ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                </ActionIcon>
            </div>

            <div style={{ padding: '10px 12px 8px' }}>
                <Text fw={700} size="sm" mb={2} style={{ color: 'var(--color-yale-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                </Text>
                <Text size="xs" c="dimmed" mb={4}>{doc.owner}</Text>
                <Group gap={4} mb={4}>
                    {doc.persona.map(p => (
                        <Badge key={p} variant="light" color={p === 'Underwriter' ? 'teal' : 'blue'} size="xs">{p}</Badge>
                    ))}
                    <Badge color={statusColors[doc.status] ?? 'gray'} variant="light" size="xs">{doc.status}</Badge>
                    <Badge variant="outline" size="xs">{getFileType(doc.url)}</Badge>
                </Group>
                <Group mt={6} gap="xs" onClick={e => e.stopPropagation()}>
                    <ActionIcon variant="subtle" size="sm" onClick={() => onDownload(doc.url, doc.name)}><IconDownload size={14} /></ActionIcon>
                    {canModify && <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(doc)}><IconEdit size={14} /></ActionIcon>}
                    {canModify && <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(doc.id)}><IconTrash size={14} /></ActionIcon>}
                </Group>
            </div>
        </div>
    );
}

export function Documents() {
    const persona = localStorage.getItem('persona');
    const username = localStorage.getItem('username');
    const today = new Date().toISOString().split('T')[0];

    const [documents, setDocuments] = useState<ContentForm[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const [selectedFavIds, setSelectedFavIds] = useState<number[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [filterPersona, setFilterPersona] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterOwner, setFilterOwner] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);

    const activeFilterCount = filterPersona.length + filterStatus.length + filterType.length + filterOwner.length;

    const [sortField, setSortField] = useState<keyof ContentForm | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [favSortField, setFavSortField] = useState<keyof ContentForm | null>(null);
    const [favSortDir, setFavSortDir] = useState<'asc' | 'desc'>('asc');

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerLabel, setViewerLabel] = useState('');

    // ── Recently viewed ──────────────────────────────────────────────────────
    const [recentIds, setRecentIds] = useState<number[]>(() => {
        try { return JSON.parse(localStorage.getItem('recentlyViewed') ?? '[]'); }
        catch { return []; }
    });

    function recordView(id: number) {
        setRecentIds(prev => {
            const updated = [id, ...prev.filter(i => i !== id)].slice(0, 8);
            localStorage.setItem('recentlyViewed', JSON.stringify(updated));
            return updated;
        });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const [addOpen, setAddOpen] = useState(false);
    const [addData, setAddData] = useState({
        name: '', owner: persona === 'Admin' ? '' : username ?? '',
        persona: persona !== 'Admin' ? [persona ?? ''] : [],
        date_modified: today, expiration_date: '', content_type: '', status: ''
    });
    const [bulkOpen, setBulkOpen] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

    function handleBulkFileSelect(files: File[]) {
        const newStaged: StagedFile[] = files.map(f => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            name: f.name,
            owner: persona === 'Admin' ? '' : username ?? '',
            persona: persona !== 'Admin' ? [persona ?? ''] : [],
            content_type: '',
            status: '',
            date_modified: today,
            expiration_date: ''
        }));
        setStagedFiles(prev => [...prev, ...newStaged]);
    }

    function updateStagedFile<K extends keyof StagedFile>(id: string, field: K, value: StagedFile[K]) {
        setStagedFiles(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    }

    function removeStagedFile(id: string) {
        setStagedFiles(prev => prev.filter(item => item.id !== id));
    }

    const [addFile, setAddFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editData, setEditData] = useState({
        name: '', owner: '', persona: [] as string[],
        date_modified: today, expiration_date: '', content_type: '', status: ''
    });
    const [editFile, setEditFile] = useState<File | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

    const [trashOpen, setTrashOpen] = useState(false);
    const [trashDocs, setTrashDocs] = useState<ContentForm[]>([]);
    const [trashSearch, setTrashSearch] = useState('');
    const [trashPersonaFilter, setTrashPersonaFilter] = useState('');
    const [trashSelected, setTrashSelected] = useState<number[]>([]);

    const filteredTrash = trashDocs.filter(doc => {
        const matchSearch = !trashSearch || doc.name.toLowerCase().includes(trashSearch.toLowerCase()) || doc.owner.toLowerCase().includes(trashSearch.toLowerCase());
        const matchPersona = !trashPersonaFilter || doc.persona.includes(trashPersonaFilter);
        return matchSearch && matchPersona;
    });

    async function loadTrash() {
        const res = await fetch(`${DOMAIN}/contentforms/trash`);
        const data = await res.json();
        setTrashDocs(data);
    }

    async function restoreDoc(id: number) {
        if (!window.confirm('Are you sure you want to restore?')) return;
        await fetch(`${DOMAIN}/contentforms/${id}/restore`, { method: 'PATCH' });
        loadTrash();
        loadDocuments();
    }

    async function permanentDelete(id: number) {
        if (!window.confirm('Permanently delete this document? This cannot be undone.')) return;
        await fetch(`${DOMAIN}/contentforms/${id}/permanent`, { method: 'DELETE' });
        loadTrash();
    }

    function loadDocuments() {
        fetch(`${DOMAIN}/contentforms`)
            .then(res => res.json())
            .then(data => {
                const flat: ContentForm[] = Array.isArray(data) ? data :
                    [...(data.Underwriter ?? []), ...(data.BusinessAnalyst ?? [])];
                setDocuments(flat);
            });
    }

    function toggleSort(field: keyof ContentForm) {
        if (sortField === field) {
            if (sortDir === 'asc') setSortDir('desc'); else { setSortField(null); setSortDir('asc'); }
        } else { setSortField(field); setSortDir('asc'); }
    }

    function toggleFavSort(field: keyof ContentForm) {
        if (favSortField === field) {
            if (favSortDir === 'asc') setFavSortDir('desc'); else { setFavSortField(null); setFavSortDir('asc'); }
        } else { setFavSortField(field); setFavSortDir('asc'); }
    }

    useEffect(() => {
        // Auto-expire documents on page load
        fetch(`${DOMAIN}/contentforms/autoexpire`, { method: 'PATCH' })
            .catch(() => {}); // silently ignore if endpoint doesn't exist yet
        loadDocuments();
        fetch(`${DOMAIN}/employees`)
            .then(res => res.json())
            .then((data: Employee[]) => setEmployees(data));
    }, []);

    const filtered = useMemo(() => {
        let result = [...documents];
        if (search) result = result.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.owner.toLowerCase().includes(search.toLowerCase()));
        if (filterPersona.length > 0) result = result.filter(d => d.persona.some(p => filterPersona.includes(p)));
        if (filterStatus.length > 0) result = result.filter(d => filterStatus.includes(d.status));
        if (filterType.length > 0) result = result.filter(d => filterType.map(t => t.toLowerCase()).includes(getExt(d.url)));
        if (filterOwner.length > 0) result = result.filter(d => filterOwner.includes(d.owner));

        if (sortField) {
            result.sort((a, b) => {
                let aVal = String(a[sortField] ?? '');
                let bVal = String(b[sortField] ?? '');
                if (sortField === 'file_name') { aVal = getFileType(a.url); bVal = getFileType(b.url); }
                const cmp = aVal.localeCompare(bVal);
                return sortDir === 'asc' ? cmp : -cmp;
            });
        } else {
            result.sort((a, b) => {
                const aMatch = a.persona.includes(persona ?? '') ? 0 : 1;
                const bMatch = b.persona.includes(persona ?? '') ? 0 : 1;
                if (aMatch !== bMatch) return aMatch - bMatch;
                if (a.persona.join() !== b.persona.join()) return a.persona.join().localeCompare(b.persona.join());
                return a.name.localeCompare(b.name);
            });
        }

        return result; // We return the result instead of calling setFiltered
    }, [search, filterPersona, filterStatus, filterType, filterOwner, documents, sortField, sortDir, persona]);

    const sortedFavorites = (() => {
        const favs = filtered.filter(d => d.is_favorite);
        if (!favSortField) return favs;
        return [...favs].sort((a, b) => {
            let aVal = String(a[favSortField] ?? '');
            let bVal = String(b[favSortField] ?? '');
            if (favSortField === 'file_name') { aVal = getFileType(a.url); bVal = getFileType(b.url); }
            const cmp = aVal.localeCompare(bVal);
            return favSortDir === 'asc' ? cmp : -cmp;
        });
    })();

    const nonFavorites = filtered.filter(d => !d.is_favorite);
    const allSelected = selectedIds.length === nonFavorites.length && nonFavorites.length > 0;
    const allFavSelected = selectedFavIds.length === sortedFavorites.length && sortedFavorites.length > 0;
    const anySelected = selectedIds.length > 0 || selectedFavIds.length > 0;
    const selectedCount = selectedIds.length + selectedFavIds.length;
    const selectedHasFavorites = [...selectedIds, ...selectedFavIds].some(id => documents.find(d => d.id === id)?.is_favorite);
    const selectedHasNonFavorites = [...selectedIds, ...selectedFavIds].some(id => documents.find(d => d.id === id && !d.is_favorite));

    async function handleAdd() {
        if (!addFile) { alert('Please upload a file.'); return; }
        if (!addData.name || !addData.owner || !addData.persona || !addData.date_modified || !addData.expiration_date || !addData.content_type || !addData.status) {
            alert('Please fill in all fields.'); return;
        }
        const formPayload = new FormData();
        formPayload.append('filename', addData.name);
        formPayload.append('ownerUsername', addData.owner);
        formPayload.append('persona', JSON.stringify(addData.persona));
        formPayload.append('date_modified', addData.date_modified);
        formPayload.append('expiration_date', addData.expiration_date);
        formPayload.append('content_type', addData.content_type);
        formPayload.append('status', addData.status);
        formPayload.append('file', addFile);
        await fetch(`${DOMAIN}/contentforms`, { method: 'POST', body: formPayload });
        setAddOpen(false); setAddFile(null);
        setAddData({ name: '', owner: persona === 'Admin' ? '' : username ?? '', persona: persona !== 'Admin' ? [persona ?? ''] : [], date_modified: today, expiration_date: '', content_type: '', status: '' });
        loadDocuments();
    }

    async function handleBulkAdd() {
        if (stagedFiles.length === 0) { alert('Please upload at least one file.'); return; }
        const missingData = stagedFiles.some(sf => !sf.owner || !sf.persona || !sf.date_modified || !sf.content_type || !sf.status);
        if (missingData) { alert('Please fill in all dropdowns and dates for every file.'); return; }
        for (const sf of stagedFiles) {
            const formPayload = new FormData();
            formPayload.append('filename', sf.name);
            formPayload.append('ownerUsername', sf.owner);
            formPayload.append('persona', JSON.stringify(sf.persona));
            formPayload.append('date_modified', sf.date_modified);
            formPayload.append('expiration_date', sf.expiration_date);
            formPayload.append('content_type', sf.content_type);
            formPayload.append('status', sf.status);
            formPayload.append('file', sf.file);
            await fetch(`${DOMAIN}/contentforms`, { method: 'POST', body: formPayload });
        }
        setBulkOpen(false); setStagedFiles([]); loadDocuments();
    }

    function openEdit(doc: ContentForm) {
        fetch(`${DOMAIN}/contentforms/${doc.id}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) })
            .then(res => {
                if (res.status === 423) { res.json().then((data: {error: string}) => alert(data.error)); return; }
                setEditId(doc.id);
                setEditData({
                    name: doc.name, owner: doc.owner,
                    persona: Array.isArray(doc.persona) ? doc.persona : [doc.persona],
                    date_modified: today, expiration_date: doc.expiration_date?.split('T')[0] ?? '',
                    content_type: doc.content_type, status: doc.status
                });
                setEditOpen(true);
            });
    }

    async function handleEdit() {
        if (!editId) return;
        if (editFile) {
            const formPayload = new FormData();
            formPayload.append('filename', editData.name);
            formPayload.append('ownerUsername', editData.owner);
            formPayload.append('persona', JSON.stringify(editData.persona));
            formPayload.append('date_modified', editData.date_modified);
            formPayload.append('expiration_date', editData.expiration_date);
            formPayload.append('content_type', editData.content_type);
            formPayload.append('status', editData.status);
            formPayload.append('file', editFile);
            await fetch(`${DOMAIN}/contentforms/${editId}`, { method: 'PUT', body: formPayload });
        } else {
            await fetch(`${DOMAIN}/contentforms/${editId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData)
            });
        }
        await fetch(`${DOMAIN}/contentforms/${editId}/checkin`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
        });
        setEditFile(null); setConfirmSaveOpen(false); setEditOpen(false); loadDocuments();
    }

    function closeEdit() {
        if (editId) fetch(`${DOMAIN}/contentforms/${editId}/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
        setEditOpen(false);
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`${DOMAIN}/contentforms/${deleteId}/softdelete`, { method: 'PATCH' });
        setDeleteOpen(false);
        setSelectedIds(prev => prev.filter(id => id !== deleteId));
        setSelectedFavIds(prev => prev.filter(id => id !== deleteId));
        loadDocuments();
    }

    async function toggleFavorite(doc: ContentForm) {
        await fetch(`${DOMAIN}/contentforms/${doc.id}/favorite`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_favorite: !doc.is_favorite }) });
        loadDocuments();
    }

    async function unfavoriteSelected() {
        const ids = [...selectedFavIds, ...selectedIds];
        await Promise.all(ids.map(id => {
            const doc = documents.find(d => d.id === id && d.is_favorite);
            if (!doc) return Promise.resolve();
            return fetch(`${DOMAIN}/contentforms/${id}/favorite`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_favorite: false }) });
        }));
        setSelectedFavIds([]); setSelectedIds([]); loadDocuments();
    }

    async function favoriteSelected() {
        const ids = [...selectedFavIds, ...selectedIds];
        await Promise.all(ids.map(id => {
            const doc = documents.find(d => d.id === id && !d.is_favorite);
            if (!doc) return Promise.resolve();
            return fetch(`${DOMAIN}/contentforms/${id}/favorite`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_favorite: true }) 
            });
        }));
        setSelectedFavIds([]); setSelectedIds([]); loadDocuments();
    }

    function toggleSelect(id: number) { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }
    function toggleFavSelect(id: number) { setSelectedFavIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }

    async function downloadFile(url: string, name: string) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = name;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); window.URL.revokeObjectURL(blobUrl);
        } catch {
            const a = document.createElement('a');
            a.href = url; a.download = name; a.target = '_blank';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
    }

    function openViewer(url: string, label: string, id: number) {
        recordView(id);
        setViewerUrl(url);
        setViewerLabel(label);
    }

    const allowedAccess = persona === 'Admin' || persona === 'Underwriter' || persona === 'Business Analyst';
    if (!allowedAccess) return <AccessDenied />;

    const rowCallbacks: RowCallbacks = {
        persona,
        onView: openViewer,
        onFavorite: toggleFavorite,
        onDownload: downloadFile,
        onEdit: openEdit,
        onDelete: (id: number) => { setDeleteId(id); setDeleteOpen(true); },
    };

    // Recently viewed docs resolved from current document list
    const recentDocs = recentIds
        .map(id => documents.find(d => d.id === id))
        .filter(Boolean) as ContentForm[];

    return (
        <>
            <Header />
            <style>{`#header-bar, .rdv-header-bar { display: none !important; }`}</style>

            <Box p="md">
                <Text fw={700} size="xl" mb="md" style={{ color: 'var(--color-yale-blue)' }}>
                    {persona === 'Admin' ? 'All Documents' : persona === 'Underwriter' ? 'Core Commercial Underwriter Resources' : 'Business Analyst Resources'}
                </Text>

                <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
                    <Group gap="sm">
                        {(persona === 'Admin' || persona === 'Underwriter' || persona === 'Business Analyst') && (
                            <>
                                <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)} style={{ background: 'var(--color-fresh-sky)' }}>
                                    Add Document
                                </Button>
                                <Button variant="default" leftSection={<IconPlus size={16} />} onClick={() => setBulkOpen(true)}>
                                    Bulk Upload
                                </Button>
                            </>
                        )}
                        <Button variant={activeFilterCount > 0 ? 'filled' : 'outline'} color={activeFilterCount > 0 ? 'blue' : undefined} leftSection={<IconFilter size={16} />} onClick={() => setFilterOpen(true)}>
                            Filter by{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                        </Button>
                        {persona === 'Admin' && (
                            <Button leftSection={<IconTrash size={16} />} color="red" variant="outline" onClick={() => { loadTrash(); setTrashOpen(true); }}>
                                Trash
                            </Button>
                        )}
                    </Group>
                    <Group gap="sm">
                        <TextInput placeholder="Search for document..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.target.value)} w={250} />
                        <SegmentedControl value={viewMode} onChange={val => setViewMode(val as 'grid' | 'list')}
                                          data={[
                                              { label: <Group gap={4}><IconLayoutGrid size={16} /><span>Grid</span></Group>, value: 'grid' },
                                              { label: <Group gap={4}><IconList size={16} /><span>List</span></Group>, value: 'list' },
                                          ]}
                        />
                    </Group>
                </Group>

                {activeFilterCount > 0 && (
                    <Group mb="sm" gap="xs">
                        {filterPersona.map(v => <Badge key={v} variant="filled" color="blue" style={{ cursor: 'pointer' }} onClick={() => setFilterPersona(p => p.filter(x => x !== v))}>Persona: {v} ×</Badge>)}
                        {filterStatus.map(v => <Badge key={v} variant="filled" color={statusColors[v] ?? 'gray'} style={{ cursor: 'pointer' }} onClick={() => setFilterStatus(p => p.filter(x => x !== v))}>Status: {v} ×</Badge>)}
                        {filterType.map(v => <Badge key={v} variant="filled" color="violet" style={{ cursor: 'pointer' }} onClick={() => setFilterType(p => p.filter(x => x !== v))}>Type: {v} ×</Badge>)}
                        {filterOwner.map(v => <Badge key={v} variant="filled" color="teal" style={{ cursor: 'pointer' }} onClick={() => setFilterOwner(p => p.filter(x => x !== v))}>Owner: {v} ×</Badge>)}
                        <Badge variant="outline" style={{ cursor: 'pointer' }} onClick={() => { setFilterPersona([]); setFilterStatus([]); setFilterType([]); setFilterOwner([]); }}>Clear all</Badge>
                    </Group>
                )}

                {/* ── Recently Viewed ─────────────────────────────────────── */}
                {recentDocs.length > 0 && (
                    <Box mb="lg">
                        <Group gap={6} mb="xs">
                            <IconClock size={14} color="gray" />
                            <Text fw={700} size="sm" c="dimmed">Recently Viewed</Text>
                        </Group>
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                            {recentDocs.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => openViewer(doc.url, doc.name, doc.id)}
                                    style={{
                                        minWidth: 160, maxWidth: 160, background: 'white', borderRadius: 8,
                                        padding: '10px 12px', cursor: 'pointer', flexShrink: 0,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid #eee'
                                    }}
                                >
                                    <Text fw={600} size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-yale-blue)' }}>
                                        {doc.name}
                                    </Text>
                                    <Text size="xs" c="dimmed">{getFileType(doc.url)}</Text>
                                    <Group gap={4} mt={4}>
                                        {doc.persona.slice(0, 1).map(p => (
                                            <Badge key={p} size="xs" variant="light" color={p === 'Underwriter' ? 'teal' : 'blue'}>{p}</Badge>
                                        ))}
                                    </Group>
                                </div>
                            ))}
                        </div>
                    </Box>
                )}
                {/* ─────────────────────────────────────────────────────────── */}

                {/* list view */}
                {viewMode === 'list' && (
                    <Stack gap="lg">
                        {sortedFavorites.length > 0 && (
                            <Box>
                                <Text fw={700} size="sm" c="yellow" mb="xs">Favorites</Text>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                    <TableHead onSort={toggleFavSort} currentField={favSortField} currentDir={favSortDir}
                                               onSelectAll={() => allFavSelected ? setSelectedFavIds([]) : setSelectedFavIds(sortedFavorites.map(d => d.id))}
                                               allChecked={allFavSelected} indeterminate={selectedFavIds.length > 0 && !allFavSelected} />
                                    <Table.Tbody>
                                        {sortedFavorites.map(doc => <DocRow key={doc.id} doc={doc} isSelected={selectedFavIds.includes(doc.id)} onSelect={toggleFavSelect} {...rowCallbacks} />)}
                                    </Table.Tbody>
                                </Table>
                            </Box>
                        )}
                        <Box>
                            <Text fw={700} size="sm" c="dimmed" mb="xs">All Documents</Text>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                                <TableHead onSort={toggleSort} currentField={sortField} currentDir={sortDir}
                                           onSelectAll={() => allSelected ? setSelectedIds([]) : setSelectedIds(nonFavorites.map(d => d.id))}
                                           allChecked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected} />
                                <Table.Tbody>
                                    {nonFavorites.map(doc => <DocRow key={doc.id} doc={doc} isSelected={selectedIds.includes(doc.id)} onSelect={toggleSelect} {...rowCallbacks} />)}
                                </Table.Tbody>
                            </Table>
                        </Box>
                    </Stack>
                )}

                {/* grid view */}
                {viewMode === 'grid' && (
                    <Stack gap="lg">
                        {sortedFavorites.length > 0 && (
                            <Box>
                                <Group justify="space-between" mb="sm">
                                    <Text fw={700} c="yellow">Favorites</Text>
                                    <Checkbox label="Select all" checked={allFavSelected} indeterminate={selectedFavIds.length > 0 && !allFavSelected}
                                              onChange={() => allFavSelected ? setSelectedFavIds([]) : setSelectedFavIds(sortedFavorites.map(d => d.id))} />
                                </Group>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 16 }}>
                                    {sortedFavorites.map(doc => <DocCard key={doc.id} doc={doc} isSelected={selectedFavIds.includes(doc.id)} onSelect={toggleFavSelect} {...rowCallbacks} />)}
                                </div>
                            </Box>
                        )}
                        <Box>
                            <Group justify="space-between" mb="sm">
                                <Text fw={700} c="dimmed">All Documents</Text>
                                <Checkbox label="Select all" checked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected}
                                          onChange={() => allSelected ? setSelectedIds([]) : setSelectedIds(nonFavorites.map(d => d.id))} />
                            </Group>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 16 }}>
                                {nonFavorites.map(doc => <DocCard key={doc.id} doc={doc} isSelected={selectedIds.includes(doc.id)} onSelect={toggleSelect} {...rowCallbacks} />)}
                            </div>
                        </Box>
                    </Stack>
                )}

                {/* bulk action bar */}
                {anySelected && (
                    <Box style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'var(--color-yale-blue)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text c="white">{selectedCount} selected</Text>
                        <Group gap="sm">
                            <Button variant="white" onClick={() => { setSelectedIds([]); setSelectedFavIds([]); }}>Deselect All</Button>
                            <Button variant="white" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    const doc = documents.find(d => d.id === id);
                                    if (doc) { await downloadFile(doc.url, doc.name); await new Promise(resolve => setTimeout(resolve, 500)); }
                                }
                            }}>Download Selected</Button>
                            {selectedHasNonFavorites && <Button variant="white" onClick={favoriteSelected}>★ Favorite All</Button>}
                            {selectedHasFavorites && <Button variant="white" onClick={unfavoriteSelected}>☆ Unfavorite All</Button>}
                            <Button color="red" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                if (!window.confirm(`Delete ${ids.length} documents?`)) return;
                                await Promise.all(ids.map(id => fetch(`${DOMAIN}/contentforms/${id}/softdelete`, { method: 'PATCH' })));
                                setSelectedIds([]); setSelectedFavIds([]); loadDocuments();
                            }}>Delete Selected</Button>
                        </Group>
                    </Box>
                )}
            </Box>

            {/* doc viewer */}
            {viewerUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 1000 }} onClick={() => setViewerUrl(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-4/5 flex flex-col overflow-hidden" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-2 border-b">
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-yale-blue)' }}>{viewerLabel}</h2>
                            <button onClick={() => setViewerUrl(null)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <DocViewer documents={[{ uri: viewerUrl, fileName: viewerLabel }]} pluginRenderers={DocViewerRenderers} style={{ height: '100%', minHeight: '600px' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* filter modal */}
            <Modal opened={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Documents">
                <Stack>
                    <MultiSelect label="Persona" placeholder="All personas" value={filterPersona} onChange={setFilterPersona} data={['Underwriter', 'Business Analyst']} clearable />
                    <MultiSelect label="Status" placeholder="All statuses" value={filterStatus} onChange={setFilterStatus} data={['In Progress', 'Internal Review', 'Client Review', 'Approved', 'Expired', 'Archived']} clearable />
                    <MultiSelect label="File Type" placeholder="All types" value={filterType} onChange={setFilterType} data={['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv']} clearable />
                    <MultiSelect label="Owner" placeholder="All owners" value={filterOwner} onChange={setFilterOwner} data={[...new Set(documents.map(d => d.owner))]} clearable />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => { setFilterPersona([]); setFilterStatus([]); setFilterType([]); setFilterOwner([]); }}>Clear All</Button>
                        <Button onClick={() => setFilterOpen(false)}>Apply</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* trash modal */}
            <Modal opened={trashOpen} onClose={() => { setTrashOpen(false); setTrashSearch(''); setTrashSelected([]); }} title="Trash — Deleted Documents" size="xl">
                <Stack gap="sm">
                    <Group gap="sm">
                        <TextInput placeholder="Search by name or owner..." leftSection={<IconSearch size={16} />} value={trashSearch} onChange={e => setTrashSearch(e.target.value)} style={{ flex: 1 }} />
                        <Select placeholder="Filter by persona" clearable value={trashPersonaFilter} onChange={val => setTrashPersonaFilter(val ?? '')} data={['Underwriter', 'Business Analyst']} w={180} />
                    </Group>
                    {filteredTrash.length > 0 && (
                        <Group justify="space-between">
                            <Checkbox
                                label={`Select all (${filteredTrash.length})`}
                                checked={trashSelected.length === filteredTrash.length && filteredTrash.length > 0}
                                indeterminate={trashSelected.length > 0 && trashSelected.length < filteredTrash.length}
                                onChange={() => trashSelected.length === filteredTrash.length ? setTrashSelected([]) : setTrashSelected(filteredTrash.map(d => d.id))}
                            />
                            {trashSelected.length > 0 && (
                                <Group gap="xs">
                                    <Text size="sm" c="dimmed">{trashSelected.length} selected</Text>
                                    <Button size="xs" variant="outline" color="green" onClick={async () => {
                                        await Promise.all(trashSelected.map(id => fetch(`${DOMAIN}/contentforms/${id}/restore`, { method: 'PATCH' })));
                                        setTrashSelected([]); loadTrash(); loadDocuments();
                                    }}>Restore Selected</Button>
                                    <Button size="xs" color="red" onClick={async () => {
                                        if (!window.confirm(`Permanently delete ${trashSelected.length} documents?`)) return;
                                        await Promise.all(trashSelected.map(id => fetch(`${DOMAIN}/contentforms/${id}/permanent`, { method: 'DELETE' })));
                                        setTrashSelected([]); loadTrash();
                                    }}>Delete Selected</Button>
                                </Group>
                            )}
                        </Group>
                    )}
                    {filteredTrash.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">No deleted documents.</Text>
                    ) : (
                        <Stack gap="xs">
                            {filteredTrash.map(doc => (
                                <Box key={doc.id} p="sm" style={{
                                    border: trashSelected.includes(doc.id) ? '1.5px solid var(--color-fresh-sky, #3b82f6)' : '1px solid #eee',
                                    borderRadius: 8, background: trashSelected.includes(doc.id) ? '#f0f7ff' : 'white'
                                }}>
                                    <Group justify="space-between" align="flex-start">
                                        <Group gap="sm" align="flex-start">
                                            <Checkbox mt={2} checked={trashSelected.includes(doc.id)}
                                                      onChange={() => setTrashSelected(prev => prev.includes(doc.id) ? prev.filter(i => i !== doc.id) : [...prev, doc.id])} />
                                            <div>
                                                <Text fw={600}>{doc.name}</Text>
                                                <Text size="xs" c="dimmed">
                                                    Owner: {doc.owner} · Deleted: {doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString() : 'Unknown'}
                                                </Text>
                                                <Group gap={4} mt={4}>
                                                    {doc.persona.map(p => (
                                                        <Badge key={p} variant="light" color={p === 'Underwriter' ? 'teal' : 'blue'} size="xs">{p}</Badge>
                                                    ))}
                                                    <Badge color={statusColors[doc.status] ?? 'gray'} variant="light" size="xs">{doc.status}</Badge>
                                                    <Badge variant="outline" size="xs">{getFileType(doc.url)}</Badge>
                                                </Group>
                                            </div>
                                        </Group>
                                        <Group gap="xs">
                                            <Tooltip label="Preview document">
                                                <ActionIcon variant="subtle" onClick={() => { setViewerUrl(doc.url); setViewerLabel(doc.name); }}>
                                                    <IconSearch size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Button size="xs" variant="outline" color="green" onClick={() => restoreDoc(doc.id)}>Restore</Button>
                                            <Button size="xs" color="red" onClick={() => permanentDelete(doc.id)}>Delete Permanently</Button>
                                        </Group>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Modal>

            {/* add modal */}
            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add New Document" size="lg">
                <Stack>
                    <Text fw={600}>Document Details</Text>
                    <TextInput label="Name of Document" value={addData.name} onChange={e => setAddData({...addData, name: e.target.value})} />
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Upload File</Text>
                        <input ref={fileInputRef} type="file" onChange={e => setAddFile(e.target.files?.[0] ?? null)} />
                    </Box>
                    {persona === 'Admin'
                        ? <Select label="Name of Content Owner" value={addData.owner} onChange={val => setAddData({...addData, owner: val ?? ''})} data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)} />
                        : <TextInput label="Name of Content Owner" value={addData.owner} readOnly />}
                    <MultiSelect label="Job Position" value={addData.persona} onChange={val => setAddData({...addData, persona: val})} data={['Underwriter', 'Business Analyst']} disabled={persona !== 'Admin'} />
                    <Text fw={600} mt="sm">Lifecycle & Attributes</Text>
                    <Group grow>
                        <Select label="Content Type" value={addData.content_type} onChange={val => setAddData({...addData, content_type: val ?? ''})} data={['Reference', 'Workflow']} />
                        <Select label="Document Status" value={addData.status} onChange={val => setAddData({...addData, status: val ?? ''})} data={['In Progress', 'Internal Review', 'Client Review', 'Approved', 'Expired', 'Archived']} />
                    </Group>
                    <Group grow>
                        <TextInput label="Last Modified Date" type="date" value={addData.date_modified} onChange={e => setAddData({...addData, date_modified: e.target.value})} />
                        <TextInput label="Expiration Date" type="date" value={addData.expiration_date} onChange={e => setAddData({...addData, expiration_date: e.target.value})} />
                    </Group>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setAddOpen(false)}>✕ Cancel Changes</Button>
                        <Button onClick={handleAdd} style={{ background: 'var(--color-fresh-sky)' }}>+ Submit Document</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* edit modal */}
            <Modal opened={editOpen} onClose={closeEdit} title="Edit Document Details" size="lg">
                <Stack>
                    <Text fw={600}>Document Details</Text>
                    <TextInput label="Name of Document" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Update File (Optional)</Text>
                        <input type="file" onChange={e => setEditFile(e.target.files?.[0] ?? null)} />
                        <Text size="xs" c="dimmed" mt={2}>Leave blank if you are only changing document details.</Text>
                    </Box>
                    {persona === 'Admin'
                        ? <Select label="Name of Content Owner" value={editData.owner} onChange={val => setEditData({...editData, owner: val ?? ''})} data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)} />
                        : <TextInput label="Name of Content Owner" value={editData.owner} readOnly />}
                    <MultiSelect label="Job Position" value={editData.persona} onChange={val => setEditData({...editData, persona: val})} data={['Underwriter', 'Business Analyst']} disabled={persona !== 'Admin'} />
                    <Text fw={600} mt="sm">Lifecycle & Attributes</Text>
                    <Group grow>
                        <Select label="Content Type" value={editData.content_type} onChange={val => setEditData({...editData, content_type: val ?? ''})} data={['Reference', 'Workflow']} />
                        <Select label="Document Status" value={editData.status} onChange={val => setEditData({...editData, status: val ?? ''})} data={['In Progress', 'Internal Review', 'Client Review', 'Approved', 'Expired', 'Archived']} />
                    </Group>
                    <Group grow>
                        <TextInput label="Last Modified Date" type="date" value={editData.date_modified} onChange={e => setEditData({...editData, date_modified: e.target.value})} />
                        <TextInput label="Expiration Date" type="date" value={editData.expiration_date} onChange={e => setEditData({...editData, expiration_date: e.target.value})} />
                    </Group>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeEdit}>✕ Cancel Changes</Button>
                        <Button onClick={() => setConfirmSaveOpen(true)} style={{ background: 'var(--color-fresh-sky)' }}>✓ Save Changes</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} title="Confirm Changes" centered>
                <Text size="sm" mb="md">Are you sure you want to save these changes?</Text>
                <Group justify="flex-end">
                    <Button variant="outline" onClick={() => setConfirmSaveOpen(false)}>Cancel</Button>
                    <Button onClick={handleEdit} style={{ background: 'var(--color-fresh-sky)' }}>Confirm</Button>
                </Group>
            </Modal>

            <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete form?" centered>
                <Text size="sm" mb="md">Are you sure you want to <strong>delete</strong> this file?</Text>
                <Group justify="flex-end">
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button color="blue" onClick={handleDelete}>Confirm</Button>
                </Group>
            </Modal>

            {/* bulk upload modal */}
            <Modal opened={bulkOpen} onClose={() => { setBulkOpen(false); setStagedFiles([]); }} title="Bulk Upload" size="1200px">
                <Stack>
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Add Files</Text>
                        <input type="file" multiple onChange={e => { handleBulkFileSelect(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
                    </Box>
                    {stagedFiles.length > 0 && (
                        <Box style={{ overflowX: 'auto' }}>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th w={200}>File Name</Table.Th>
                                        <Table.Th w={150}>Owner</Table.Th>
                                        <Table.Th w={150}>Persona</Table.Th>
                                        <Table.Th w={150}>Content Type</Table.Th>
                                        <Table.Th w={150}>Status</Table.Th>
                                        <Table.Th w={150}>Dates</Table.Th>
                                        <Table.Th w={50}></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {stagedFiles.map(staged => (
                                        <Table.Tr key={staged.id}>
                                            <Table.Td><TextInput value={staged.name} onChange={e => updateStagedFile(staged.id, 'name', e.target.value)} /></Table.Td>
                                            <Table.Td>
                                                {persona === 'Admin'
                                                    ? <Select data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)} value={staged.owner} onChange={val => updateStagedFile(staged.id, 'owner', val ?? '')} />
                                                    : <TextInput value={staged.owner} readOnly />}
                                            </Table.Td>
                                            <Table.Td><MultiSelect data={['Underwriter', 'Business Analyst']} value={staged.persona} onChange={val => updateStagedFile(staged.id, 'persona', val)} disabled={persona !== 'Admin'} /></Table.Td>
                                            <Table.Td><Select data={['Reference', 'Workflow']} value={staged.content_type} onChange={val => updateStagedFile(staged.id, 'content_type', val ?? '')} /></Table.Td>
                                            <Table.Td><Select data={['In Progress', 'Internal Review', 'Client Review', 'Approved', 'Expired', 'Archived']} value={staged.status} onChange={val => updateStagedFile(staged.id, 'status', val ?? '')} /></Table.Td>
                                            <Table.Td>
                                                <Stack gap={4}>
                                                    <TextInput type="date" label="Modified" size="xs" value={staged.date_modified} onChange={e => updateStagedFile(staged.id, 'date_modified', e.target.value)} />
                                                    <TextInput type="date" label="Expires" size="xs" value={staged.expiration_date} onChange={e => updateStagedFile(staged.id, 'expiration_date', e.target.value)} />
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td><ActionIcon color="red" onClick={() => removeStagedFile(staged.id)}><IconTrash size={16} /></ActionIcon></Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Box>
                    )}
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => { setBulkOpen(false); setStagedFiles([]); }}>✕ Cancel</Button>
                        <Button onClick={handleBulkAdd} style={{ background: 'var(--color-fresh-sky)' }} disabled={stagedFiles.length === 0}>
                            + Submit {stagedFiles.length > 0 ? stagedFiles.length : ''} Documents
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
