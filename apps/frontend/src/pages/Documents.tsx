import '@mantine/core/styles.css';
import {useEffect, useState, useRef, useMemo, Fragment} from "react";
import * as pdfjs from 'pdfjs-dist';
import {Header} from "../components/Header";
import {AccessDenied} from "../components/AccessDenied.tsx";
import {
    TextInput, Button, Modal, Select, MultiSelect, Group, Text,
    Badge, Stack, Box, Table, Checkbox, ActionIcon, Menu,
    Tooltip, SegmentedControl, Pagination, Accordion
} from '@mantine/core';
import {IconFolder, IconDotsVertical, IconChevronDown, IconChevronRight, IconSearch, IconTrash, IconFilter, IconClock, IconWindowMaximize} from '@tabler/icons-react';
import {IconLayoutBottombar} from "@tabler/icons-react"
import DocViewer, {DocViewerRenderers} from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import {DOMAIN} from '../const.ts';
import {ViewToggle} from "../components/content/ViewToggle.tsx"
import {PageTitle} from "../components/Title.tsx"
import {PersonaBadges} from "../components/Badges/PersonaBadge.tsx";
import {StatusBadge} from "../components/Badges/StatusBadge.tsx"
import {FileTypeBadge} from "../components/Badges/FileTypeBadge.tsx";
import {ConfirmModal} from "../components/content/ConfirmModal"
import {useApi} from "../../src/components/api.ts";
import type {
    RowCallbacks,
    StagedFile, ContentForm, Employee,
    Folder, Metatag
} from "../components/interfaces/DocumentsInterfaces.tsx"
import { getExt, getFileType, normalizeUrl, pickRenderer } from "../components/content/Functions.tsx";
import { DocCard } from "../components/content/DocCard.tsx";
import { TableHead } from "../components/content/TableHead.tsx";
import { DocRow } from "../components/content/DocRow.tsx";
import { FilledButton } from '../components/Buttons/FilledButton.tsx';
import {allPersonas} from "../components/ManageEmployees/personas.tsx";
import {Error as ErrorMessage} from "../components/content/Error.tsx"
import {ManageTags} from "../components/content/ManageTags.tsx";
import {useTranslation} from "react-i18next";


pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UPLOAD_DOMAIN = import.meta.env.DEV ? '' : DOMAIN;

type DocumentFormData = {
    name: string;
    owner: string;
    persona: string[];
    date_modified: string;
    expiration_date: string;
    content_type: string;
    status: string;
    username: string;
    folder: string;
    jointagscontent: string[];
};

type PageMap = {
    Underwriter: number;
    'Business Analyst': number;
    'Actuarial Analyst': number;
    'EXL Operations': number;
    All: number;
};

type PageKey = keyof PageMap;

export function Documents() {
    const roles = allPersonas

    const api = useApi();
    const username = localStorage.getItem('username');
    const today = new Date().toISOString().split('T')[0];

    // Auth0 Persona State
    const [persona, setPersona] = useState<string | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const [documents, setDocuments] = useState<ContentForm[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [moveFolderOpen, setMoveFolderOpen] = useState(false);
    const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);
    const [quickFolderName, setQuickFolderName] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const folderMap = useMemo<Record<number, Folder>>(
        () => folders.reduce((acc, folder) => ({...acc, [folder.id]: folder}), {}),
        [folders]
    );

    const selectedFolderPath = useMemo<Folder[]>(() => {
        if (selectedFolderId === null) return [];

        const path: Folder[] = [];
        const visited = new Set<number>();
        let cursor: number | null = selectedFolderId;

        while (cursor !== null) {
            if (visited.has(cursor)) break;
            visited.add(cursor);

            const currentFolder: Folder | undefined = folderMap[cursor];
            if (!currentFolder) break;

            path.unshift(currentFolder);
            cursor = currentFolder.parent_folder_id ?? null;
        }

        return path;
    }, [selectedFolderId, folderMap]);

    useEffect(() => {
        if (selectedFolderPath.length === 0) return;

        setExpandedFolderIds(prev => {
            const next = new Set(prev);
            selectedFolderPath.forEach(folder => next.add(folder.id));
            return Array.from(next);
        });
    }, [selectedFolderPath]);


    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [createdTags, setCreatedTags] = useState<Metatag[]>([]);

    const [selectedFavIds, setSelectedFavIds] = useState<number[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [folderName, setFolderName] = useState<string>('');
    const [folderPersona, setFolderPersona] = useState<string[]>([]);
    const [folderUsers, setFolderUsers] = useState<string[]>([]);
    const [folderModalError, setFolderModalError] = useState('');
    const [editFolderOpen, setEditFolderOpen] = useState(false);
    const [editFolderId, setEditFolderId] = useState<number | null>(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [editFolderPersona, setEditFolderPersona] = useState<string[]>([]);
    const [editFolderUsers, setEditFolderUsers] = useState<string[]>([]);
    const [editFolderParentId, setEditFolderParentId] = useState<string | null>(null);
    const [editFolderError, setEditFolderError] = useState('');
    const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
    const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
    const [duplicateFolderOpen, setDuplicateFolderOpen] = useState(false);
    const [duplicateFolderId, setDuplicateFolderId] = useState<number | null>(null);
    const [expandedFolderIds, setExpandedFolderIds] = useState<number[]>([]);

    const [filterPersona, setFilterPersona] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterOwner, setFilterOwner] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterCheckout, setFilterCheckout] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);

    const activeFilterCount = filterPersona.length + filterStatus.length + filterType.length + filterOwner.length + filterTags.length + filterCheckout.length + (selectedFolderId !== null ? 1 : 0);

    /* //no longer filters visible documents by user's persona, as folders can now control access and some documents may be visible due to being in a shared folder or owned by the user
    function canSeeDocument(doc: ContentForm) {
        const personas = Array.isArray(doc.persona) ? doc.persona : [];
        if (personas.length === 0) {
            return doc.owner === (username ?? '');
        }
        return persona === 'Admin' || doc.owner === (username ?? '') || personas.includes(persona ?? '');
    }
    */
    
    const visibleDocuments = useMemo(
        () => documents,
        [documents, username]
    );
    

    const folderChildrenMap = useMemo<Record<number, Folder[]>>(() => {
        const map: Record<number, Folder[]> = {};
        for (const folder of folders) {
            const parentId = folder.parent_folder_id ?? null;
            if (parentId === null) continue;
            if (!map[parentId]) map[parentId] = [];
            map[parentId].push(folder);
        }

        for (const parentId of Object.keys(map)) {
            map[Number(parentId)].sort((a, b) => a.name.localeCompare(b.name));
        }

        return map;
    }, [folders]);

    const rootFolders = useMemo(
        () => folders.filter(folder => (folder.parent_folder_id ?? null) === null).sort((a, b) => a.name.localeCompare(b.name)),
        [folders]
    );

    const folderParentOptions = useMemo(
        () => [{label: 'Top level', value: 'root'}, ...folders.map(f => ({label: f.name, value: String(f.id)}))],
        [folders]
    );

    const [sortField, setSortField] = useState<keyof ContentForm | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [favSortField, setFavSortField] = useState<keyof ContentForm | null>(null);
    const [favSortDir, setFavSortDir] = useState<'asc' | 'desc'>('asc');
    const [rowsPerPage, setRowsPerPage] = useState<'10'|'25' | '50'>('10');
    const [favoritesPage, setFavoritesPage] = useState(1);
    const [documentsPage, setDocumentsPage] = useState(1);

    const [currentPage, setCurrentPage] = useState<PageMap>({"Underwriter": 1, "Business Analyst": 1, "Actuarial Analyst": 1, "EXL Operations": 1, "All": 1});

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerLabel, setViewerLabel] = useState('');
    const [inlineDropdownId, setInlineDropdownId] = useState<number | null>(null);
    const [dropdownViewMode, setDropdownViewMode] = useState<'dropdown' | 'popup'>('dropdown');

    const personaMap: Record<string, string> = {
        'Underwriter': 'underwriter',
        'Business Analyst': 'bus_ana',
        'Actuarial Analyst': 'act_ana',
        'EXL Operations': 'exl_op',
    };

    const toggleDropdown = (id: number) => {
        setInlineDropdownId(prev => prev === id ? null : id);
    };

    // translator
    const {t} = useTranslation();

    // Explicit Checkout/in set up
    const [checkedOutMap, setCheckedOutMap] = useState<Record<number, string>>({});

    const checkOutHandle = async (id: number) => {
        const username = localStorage.getItem('username');
        const res = await api(`${DOMAIN}/contentforms/${id}/checkout`, {
            method: "POST",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username}),
        });
        if (res.ok) {
            setCheckedOutMap(prev => ({...prev, [id]: username!}));
        } else {
            const data = await res.json();
            alert(data.error);
        }
    };

    const checkInHandle = async (id: number) => {
        const username = localStorage.getItem('username');
        const res = await api(`${DOMAIN}/contentforms/${id}/checkin`, {
            method: "POST",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username})
        });
        if (res.ok) {
            setCheckedOutMap(prev => {
                const updated = {...prev};
                delete updated[id];
                return updated;
            });
        }
    };

    // ── Recently viewed ──────────────────────────────────────────────────────
    const [recentIds, setRecentIds] = useState<number[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('recentlyViewed') ?? '[]');
        } catch {
            return [];
        }
    });

    function recordView(id: number) {
        setRecentIds(prev => {
            const updated = [id, ...prev.filter(i => i !== id)].slice(0, 8);
            localStorage.setItem('recentlyViewed', JSON.stringify(updated));
            return updated;
        });
    }

    function openAddDocumentModal() {
        // Default the Add modal folder to the currently selected folder (if any)
        setAddData(prev => ({
            ...prev,
            folder: selectedFolderId !== null ? String(selectedFolderId) : ''
        }));
        setAddOpen(true);
    }

    function openBulkUploadModal() {
        setBulkOpen(true);
    }

    const [addOpen, setAddOpen] = useState(false);
    const [addData, setAddData] = useState<DocumentFormData>({
        name: '', owner: persona === 'Admin' ? '' : username ?? '',
        persona: persona !== 'Admin' ? [persona ?? ''] : [],
        date_modified: today,
        expiration_date: '',
        content_type: '',
        status: '',
        username: '',
        folder: '',
        jointagscontent: [] as string[]
    });
    const [bulkOpen, setBulkOpen] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [addError, setAddError] = useState<string>('');
    const [editError, setEditError] = useState<string>('');

    const [addFolderOpen, setAddFolderOpen] = useState(false);
    const [advancedTagsOpen, setAdvancedTagsOpen] = useState(false);

    function handleBulkFileSelect(files: File[]) {
        const newStaged: StagedFile[] = files.map(f => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            url: '',
            uploadType: 'file' as const,
            name: f.name,
            owner: persona === 'Admin' ? '' : username ?? '',
            persona: persona !== 'Admin' ? [persona ?? ''] : [],
            content_type: '',
            status: '',
            folder_id: selectedFolderId,
            date_modified: today,
            expiration_date: '',
            jointagscontent: []
        }));
        setStagedFiles(prev => [...prev, ...newStaged]);
    }

    function autoFillFromFirst() {
        if (stagedFiles.length === 0) return;
        const first = stagedFiles[0];
        setStagedFiles(prev => prev.map((sf, i) => i === 0 ? sf : {
            ...sf,
            owner: first.owner,
            persona: first.persona,
            content_type: first.content_type,
            status: first.status,
            date_modified: first.date_modified,
            expiration_date: first.expiration_date,
            jointagscontent: first.jointagscontent,
        }));
    }

    function updateStagedFile<K extends keyof StagedFile>(id: string, field: K, value: StagedFile[K]) {
        setStagedFiles(prev => prev.map(item =>
            item.id === id ? {...item, [field]: value} : item
        ));
    }

    function removeStagedFile(id: string) {
        setStagedFiles(prev => prev.filter(item => item.id !== id));
    }

    function addStagedUrl() {
        setStagedFiles(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            file: null,
            url: '',
            uploadType: 'url' as const,
            name: '',
            owner: persona === 'Admin' ? '' : username ?? '',
            persona: persona !== 'Admin' ? [persona ?? ''] : [],
            content_type: 'URL',
            status: '',
            folder_id: selectedFolderId,
            date_modified: today,
            expiration_date: '',
            jointagscontent: []
        }]);
    }

    const [addFile, setAddFile] = useState<File | null>(null);
    const [addUrl, setAddUrl] = useState<string>('');
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editData, setEditData] = useState<DocumentFormData>({
        name: '',
        owner: '',
        persona: [] as string[],
        date_modified: today,
        expiration_date: '',
        content_type: '',
        username: '',
        status: '',
        folder: '',
        jointagscontent: [] as string[]
    });
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editUrl, setEditUrl] = useState<string>('');
    const [editUploadMode, setEditUploadMode] = useState<'file' | 'url'>('file');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

    const [trashOpen, setTrashOpen] = useState(false);
    const [trashDocs, setTrashDocs] = useState<ContentForm[]>([]);
    const [trashFolders, setTrashFolders] = useState<Folder[]>([]);
    const [trashSearch, setTrashSearch] = useState('');
    const [trashPersonaFilter, setTrashPersonaFilter] = useState('');
    const [trashSelected, setTrashSelected] = useState<number[]>([]);
    const [expandedTrashFolderIds, setExpandedTrashFolderIds] = useState<number[]>([]);

    const filteredTrash = trashDocs.filter(doc => {
        //if (!canSeeDocument(doc)) return false;
        const belongsToTrashedFolder = doc.folder_id !== null && trashFolders.some(folder => folder.id === doc.folder_id);
        if (belongsToTrashedFolder) return false;
        const search = trashSearch.toLowerCase();
        const owner = doc.owner ?? '';
        const personas = doc.persona ?? [];
        const matchSearch = !trashSearch || doc.name.toLowerCase().includes(search) || owner.toLowerCase().includes(search);
        const matchPersona = !trashPersonaFilter || personas.includes(trashPersonaFilter);
        return matchSearch && matchPersona;
    });

    const filteredTrashFolders = trashFolders.filter(folder => {
        const matchSearch = !trashSearch || folder.name.toLowerCase().includes(trashSearch.toLowerCase()) || folder.owner.toLowerCase().includes(trashSearch.toLowerCase());
        const matchPersona = !trashPersonaFilter || (folder.persona ?? []).includes(trashPersonaFilter);
        return matchSearch && matchPersona;
    });

    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

    // Fetch Auth0 Persona
    useEffect(() => {
        api(`${DOMAIN}/api/auth/me`)
            .then(res => {
                if (!res.ok) throw new Error('Not logged in');
                return res.json();
            })
            .then(data => {
                if (data.employee && data.employee.persona) {
                    setPersona(data.employee.persona);
                }
                setIsLoadingUser(false);
            })
            .catch(() => setIsLoadingUser(false));
    }, []);

    useEffect(() => {
        api(`${DOMAIN}/contentforms/autoexpire`, {method: 'PATCH'})
            .catch(() => {});
        loadDocuments();
        loadFolders();
        api(`${DOMAIN}/employees`)
            .then(res => res.json())
            .then((data: Employee[]) => setEmployees(data));
    }, []);

    // Keep Add/Edit forms synced with persona after it loads
    useEffect(() => {
        setAddData(prev => ({
            ...prev,
            owner: persona === 'Admin' ? '' : username ?? '',
            persona: persona !== 'Admin' ? [persona ?? ''] : []
        }));
    }, [persona, username]);

    function getDescendantFolderIds(folderId: number): number[] {
        const collected: number[] = [];
        const stack = [folderId];

        while (stack.length > 0) {
            const current = stack.pop()!;
            const children = folderChildrenMap[current] ?? [];
            for (const child of children) {
                collected.push(child.id);
                stack.push(child.id);
            }
        }

        return collected;
    }

    async function createFolder(name: string, personaList: string[], allowedUsers: string[] = [], parentFolderId: number | null = null) {
        const trimmedName = name.trim();
        if (!trimmedName) return null;

        const existing = folders.some(
            f => (f.parent_folder_id ?? null) === parentFolderId && f.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existing) {
            setFolderModalError('Folder name already exists.');
            return null;
        }

        try {
            const createdFolder = await api(`${DOMAIN}/folders`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: trimmedName, persona: personaList, allowedUsers, parentFolderId})
            }).then(res => res.json()) as Folder;

            setFolders(prev => [createdFolder, ...prev]);
            setFolderModalError('');
            return createdFolder;
        } catch (err: any) {
            setFolderModalError(err?.message ?? 'Could not create folder.');
            return null;
        }
    }

    function openEditFolder(folder: Folder) {
        setEditFolderId(folder.id);
        setEditFolderName(folder.name);
        setEditFolderPersona(folder.persona ?? []);
        setEditFolderUsers(folder.allowed_users ?? []);
        setEditFolderParentId((folder.parent_folder_id ?? null) !== null ? String(folder.parent_folder_id) : 'root');
        setEditFolderError('');
        setEditFolderOpen(true);
    }

    async function updateFolder(id: number, name: string, personaList: string[], allowedUsers: string[], parentFolderId: number | null) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setEditFolderError('Folder name is required.');
            return;
        }

        const existing = folders.some(
            f => f.id !== id && (f.parent_folder_id ?? null) === parentFolderId && f.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existing) {
            setEditFolderError('Folder name already exists.');
            return;
        }

        try {
            const updatedFolder = await api(`${DOMAIN}/folders/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: trimmedName, persona: personaList, allowedUsers, parentFolderId})
            }).then(res => res.json()) as Folder;

            setFolders(prev => prev.map(folder => folder.id === id ? updatedFolder : folder));
            setEditFolderOpen(false);
            setEditFolderError('');
        } catch (err: any) {
            setEditFolderError(err?.message ?? 'Could not update folder.');
        }
    }

    async function assignDocumentsToFolder(ids: number[], folderId: number | null) {
        if (ids.length === 0) return;

        await api(`${DOMAIN}/contentforms/folder/bulk`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ids, folderId})
        });

        // Only check in documents that are actually checked out.
        const moveCheckInIds = ids.filter(id => checkedOutMap[id]);
        if (moveCheckInIds.length > 0) {
            try {
                await Promise.all(moveCheckInIds.map(id => api(`${DOMAIN}/contentforms/${id}/checkin`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username})
                })));
            } catch (e) {
                // ignore checkin failures and continue to refresh
            }
        }

        await Promise.all([loadDocuments(), loadFolders()]);
    }

    async function loadFolders() {
        const fetchedFolders = await api(`${DOMAIN}/folders`).then(res => res.json()) as Folder[];
        setFolders(Array.isArray(fetchedFolders) ? fetchedFolders : []);
    }

    async function deleteFolder(folderId: number) {
        const targetFolderIds = [folderId, ...getDescendantFolderIds(folderId)];
        const containedDocs = documents.filter(d => d.folder_id !== null && targetFolderIds.includes(d.folder_id));
        try {
            await api(`${DOMAIN}/folders/${folderId}`, {method: 'DELETE'});
            setDeleteFolderOpen(false);
            setDeleteFolderId(null);
            setSelectedFavIds(prev => prev.filter(id => !containedDocs.some(doc => doc.id === id)));
            if (selectedFolderId !== null && targetFolderIds.includes(selectedFolderId)) {
                setSelectedFolderId(null);
            }
            loadDocuments();
            loadFolders();
        } catch (err: any) {
            alert(err?.message ?? 'Could not delete folder');
        }
    }

    async function duplicateFolder(folderId: number) {
        try {
            await api(`${DOMAIN}/folders/${folderId}`, {method: 'POST'});
            setDuplicateFolderOpen(false);
            setDuplicateFolderId(null);
            await Promise.all([loadFolders(), loadDocuments()]);
        } catch (err: any) {
            alert(err?.message ?? 'Could not duplicate folder');
        }
    }

    useEffect(() => {
        const loadCheckoutStatus = async () => {
            const res = await api(`${DOMAIN}/contentforms/checkout/all`);
            const data = await res.json();
            const map: Record<number, string> = {};
            data.forEach((item: any) => {
                map[item.id] = item.checkedOutBy;
            });
            setCheckedOutMap(map);
        };
        loadCheckoutStatus();
    }, []);

    useEffect(() => {
        api(`${DOMAIN}/favorites`)
            .then(res => res.json())
            .then((forms: { id: number }[]) => setFavoritedIds(new Set(forms.map(f => f.id))));
    }, []);

    async function loadTrash() {
        const res = await api(`${DOMAIN}/contentforms/trash`);
        const data = await res.json();

        if (Array.isArray(data)) {
            setTrashDocs(data);
            setTrashFolders([]);
            return;
        }

        setTrashDocs(Array.isArray(data.documents) ? data.documents : []);
        setTrashFolders(Array.isArray(data.folders) ? data.folders : []);
    }

    async function restoreDoc(id: number) {
        if (!window.confirm('Are you sure you want to restore?')) return;
        await api(`${DOMAIN}/contentforms/${id}/restore`, {method: 'PATCH'});
        loadTrash();
        loadDocuments();
    }

    async function permanentDelete(id: number) {
        if (!window.confirm('Permanently delete this document? This cannot be undone.')) return;
        await api(`${DOMAIN}/contentforms/${id}/permanent`, {method: 'DELETE'});
        loadTrash();
    }

    async function restoreFolderFromTrash(folderId: number) {
        await api(`${DOMAIN}/folders/${folderId}/restore`, {method: 'PATCH'});
        loadTrash();
        loadFolders();
        loadDocuments();
    }

    async function permanentDeleteFolderFromTrash(folderId: number) {
        if (!window.confirm('Permanently delete this folder and all of its documents?')) return;
        await api(`${DOMAIN}/folders/${folderId}/permanent`, {method: 'DELETE'});
        loadTrash();
        loadFolders();
        loadDocuments();
    }

    function loadDocuments() {
        api(`${DOMAIN}/contentforms`)
            .then(res => res.json())
            .then(data => {
                const flat: ContentForm[] = Array.isArray(data) ? data :
                    [...(data.Underwriter ?? []), ...(data.BusinessAnalyst ?? []), ...(data.ActuarialAnalyst ?? []), ...(data.EXLOperations ?? [])];

                for (const doc of flat) {
                    api(`${DOMAIN}/grabformtags/${doc.name}`)
                        .then(res => res.json())
                        .then(tagData => {
                            if (tagData.data.length > 0) {
                                const tagNames = [];
                                for (const tag of tagData.data) {
                                    tagNames.push(tag.tag_name)
                                }
                                doc.jointagscontent = tagNames
                            }
                        });
                }

                setDocuments(flat);
                loadTags()
            });
    }

    function loadTags() {
        api(`${DOMAIN}/getTags`)
            .then(res => res.json())
            .then(data => {
                setCreatedTags(data.data);
            }).catch(err => console.log("Error was", err));
    }

    function getArrayTags() {
        const tags: string[] = [];
        for (const tag of createdTags) {
            tags.push(tag.tag_name);
        }
        return tags;
    }

    function toggleSort(field: keyof ContentForm) {
        if (sortField === field) {
            if (sortDir === 'asc') setSortDir('desc'); else {
                setSortField(null);
                setSortDir('asc');
            }
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    }

    function toggleFavSort(field: keyof ContentForm) {
        if (favSortField === field) {
            if (favSortDir === 'asc') setFavSortDir('desc'); else {
                setFavSortField(null);
                setFavSortDir('asc');
            }
        } else {
            setFavSortField(field);
            setFavSortDir('asc');
        }
    }

    const fileTypeOptions = useMemo(
        () => [...new Set(visibleDocuments.map(d => getFileType(d.url)))].sort(),
        [visibleDocuments]
    );

    const filtered = useMemo(() => {
        let result = visibleDocuments.filter(d => d.status !== 'Expired' && d.status !== 'Archived');
        if (search) result = result.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.owner.toLowerCase().includes(search.toLowerCase()) ||
            (d.jointagscontent ?? []).some(p => p.toLowerCase().includes(search.toLowerCase())));
        if (filterPersona.length > 0) result = result.filter(d => d.persona.some(p => filterPersona.includes(p)));
        if (filterStatus.length > 0) result = result.filter(d => filterStatus.includes(d.status));
        if (filterType.length > 0) result = result.filter(d => {
            if (filterType.includes('LINK') && getFileType(d.url) === 'LINK') return true;
            return filterType.map(t => t.toLowerCase()).includes(getExt(d.url));
        });
        if (filterOwner.length > 0) result = result.filter(d => filterOwner.includes(d.owner));
        if (selectedFolderId !== null) {
            result = result.filter(d => d.folder_id === selectedFolderId);
        } else {
            result = result.filter(d => d.folder_id === null);
        }
        if (filterCheckout.length > 0) {
            const showCheckout = filterCheckout.includes('checked out');
            const showAvailable = filterCheckout.includes('available');

            if (showCheckout && showAvailable) {
                result = result.sort((a, b) => {
                    const firstChecked = !!checkedOutMap[a.id];
                    const secondChecked = !!checkedOutMap[b.id];
                    if (firstChecked && !secondChecked) return -1;
                    if (!firstChecked && secondChecked) return 1;
                    return 0;
                });
            } else if (showCheckout) {
                result = result.filter(d => !!checkedOutMap[d.id]);
            } else if (showAvailable) {
                result = result.filter(d => !checkedOutMap[d.id]);
            }
        }
        if (filterTags.length > 0) result = result.filter(d => (d.jointagscontent ?? []).some(p => filterTags.includes(p)));

        if (sortField) {
            result.sort((a, b) => {
                let aVal = String(a[sortField] ?? '');
                let bVal = String(b[sortField] ?? '');
                if (sortField === 'file_name') {
                    aVal = getFileType(a.url);
                    bVal = getFileType(b.url);
                }
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

        return result;
    }, [search, filterPersona, filterStatus, filterType, filterOwner, filterCheckout, visibleDocuments, sortField, sortDir, persona, filterTags, checkedOutMap, selectedFolderId]);

    const sortedFavorites = (() => {
        const favs = filtered.filter(d => favoritedIds.has(d.id));
        if (!favSortField) return favs;
        return [...favs].sort((a, b) => {
            let aVal = String(a[favSortField] ?? '');
            let bVal = String(b[favSortField] ?? '');
            if (favSortField === 'file_name') {
                aVal = getFileType(a.url);
                bVal = getFileType(b.url);
            }
            const cmp = aVal.localeCompare(bVal);
            return favSortDir === 'asc' ? cmp : -cmp;
        });
    })();

    const nonFavorites = filtered
        .filter(d => !favoritedIds.has(d.id))
        .sort((a, b) => {
            if (filterCheckout.includes('checked out') && filterCheckout.includes('available')) {
                const aChecked = !!checkedOutMap[a.id];
                const bChecked = !!checkedOutMap[b.id];
                if (aChecked && !bChecked) return -1;
                if (!aChecked && bChecked) return 1;
            }
            return 0;
        });

    const pageSize = Number(rowsPerPage);
    const favoritesPageCount = Math.max(1, Math.ceil(sortedFavorites.length / pageSize));
    const documentsPageCount = Math.max(1, Math.ceil(nonFavorites.length / pageSize));

    const paginatedFavorites = sortedFavorites.slice((favoritesPage - 1) * pageSize, favoritesPage * pageSize);
    const paginatedDocuments = nonFavorites.slice((documentsPage - 1) * pageSize, documentsPage * pageSize);

    useEffect(() => {
        setFavoritesPage(prev => Math.min(prev, favoritesPageCount));
    }, [favoritesPageCount]);

    useEffect(() => {
        setDocumentsPage(prev => Math.min(prev, documentsPageCount));
    }, [documentsPageCount]);

    useEffect(() => {
        setFavoritesPage(1);
        setDocumentsPage(1);
    }, [rowsPerPage, selectedFolderId, search, filterPersona, filterStatus, filterType, filterOwner, filterCheckout, filterTags, sortField, sortDir, favSortField, favSortDir]);

    const folderDocCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        visibleDocuments
            .filter(doc => doc.status !== 'Expired' && doc.status !== 'Archived')
            .forEach(doc => {
                if (doc.folder_id === null) return;
                counts[doc.folder_id] = (counts[doc.folder_id] ?? 0) + 1;
            });
        return counts;
    }, [visibleDocuments]);

    const allSelected = selectedIds.length === paginatedDocuments.length && paginatedDocuments.length > 0;
    const allFavSelected = selectedFavIds.length === paginatedFavorites.length && paginatedFavorites.length > 0;
    const anySelected = selectedIds.length > 0 || selectedFavIds.length > 0;
    const selectedCount = selectedIds.length + selectedFavIds.length;
    const selectedHasFavorites = [...selectedIds, ...selectedFavIds].some(id => favoritedIds.has(id));
    const selectedHasNonFavorites = [...selectedIds, ...selectedFavIds].some(id => documents.find(d => d.id === id && !favoritedIds.has(d.id)));

    async function handleAdd() {
        //double check it is not a duplicate document name before adding
        let duplicateFile = "";
        if (documents.some(doc => {
            if (addData.name === doc.name) {
                duplicateFile = doc.name
            }
            return addData.name === doc.name
        })) {
            setAddError("Error: Duplicate document name")
            //setAddError(`You cannot have a duplicate document name, please rename: ${duplicateFile}`);
            return;
        }

        const formPayload = new FormData();
        formPayload.append('name', addData.name);
        formPayload.append('ownerUsername', addData.owner);
        formPayload.append('persona', JSON.stringify(addData.persona));
        formPayload.append('date_modified', addData.date_modified);
        formPayload.append('expiration_date', addData.expiration_date);
        formPayload.append('content_type', addData.content_type);
        formPayload.append('status', addData.status);
        formPayload.append('username', addData.username);
        if (addData.folder) {
            formPayload.append('folder_id', addData.folder);
        }
        console.log("add data", addData);
        if (addFile) {
            formPayload.append('file', addFile);
        } else {
            formPayload.append('url', normalizeUrl(addUrl));
        }
        try {
            const createdResponse = await api(`${UPLOAD_DOMAIN}/contentforms`, {method: 'POST', body: formPayload});
            const createdPayload = await createdResponse.json() as { data?: ContentForm };
            const createdDocument = createdPayload.data;

            setAddOpen(false);
            setAddFile(null);
            setAddUrl('');

            if (addData.jointagscontent.length > 0 && createdDocument?.id) {
                for (const tagToAdd of addData.jointagscontent) {
                    let tagID = 0;
                    for (const tag of createdTags) {
                        if (tag.tag_name === tagToAdd) {
                            tagID = tag.metid;
                        }
                    }
                    await api(`${DOMAIN}/assigntag`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({id: createdDocument.id, metid: tagID})
                    });
                }
            }

            setAddData({
                name: '',
                owner: persona === 'Admin' ? '' : username ?? '',
                persona: persona !== 'Admin' ? [persona ?? ''] : [],
                date_modified: today,
                expiration_date: '',
                content_type: '',
                status: '',
                username: (localStorage.getItem('username') ?? ""),
                folder: '',
                jointagscontent: []
            });
            loadDocuments();
        } catch (err: any) {
            if (err.status === 409 || err.status === 400 || err.status === 406) {
                setAddError(err.message)
                return;
            } else {
                throw err;
            }
        }
    }


    async function handleBulkAdd() {
        if (stagedFiles.length === 0) {
            setAddError('Please upload at least one file or URL.');
            return;
        }

        const missingData = stagedFiles.some(sf =>
            !sf.name || !sf.owner || sf.persona.length === 0 || !sf.date_modified || !sf.content_type || !sf.status || !sf.expiration_date
        );
        if (missingData) {
            setAddError('Please fill in all fields for every entry.');
            return;
        }

        let duplicateFile = "";
        if (stagedFiles.some(sf => (documents.some(doc => {
            if (sf.name === doc.name) {
                duplicateFile = doc.name
            }
            return sf.name === doc.name
        })))) {
            setAddError(`You cannot have a duplicate document name, please rename: ${duplicateFile}`);
            return;
        }


        for (const sf of stagedFiles) {
            try {
                const formPayload = new FormData();
                formPayload.append('name', sf.name);
                formPayload.append('ownerUsername', sf.owner);
                formPayload.append('persona', JSON.stringify(sf.persona));
                formPayload.append('date_modified', sf.date_modified);
                formPayload.append('expiration_date', sf.expiration_date);
                formPayload.append('content_type', sf.content_type);
                formPayload.append('username', (localStorage.getItem("username")) ?? "")
                formPayload.append('status', sf.status);

                if (sf.folder_id !== null) {
                    formPayload.append('folder_id', String(sf.folder_id));
                }

                if (sf.uploadType === 'file' && sf.file) {
                    formPayload.append('file', sf.file);
                } else {
                    if (!sf.url.trim()) {
                        setAddError(`Missing URL for ${sf.name || 'one of the staged documents'}.`);
                        return;
                    }
                    formPayload.append('url', normalizeUrl(sf.url));
                }

                const createdResponse = await api(`${UPLOAD_DOMAIN}/contentforms`, {method: 'POST', body: formPayload});
                const createdPayload = await createdResponse.json() as { data?: ContentForm };
                const createdDocument = createdPayload.data;

                if (!createdDocument?.id) {
                    throw new Error('Bulk upload did not return the created document id.');
                }

                if (sf.jointagscontent.length > 0) {
                    for (const tagToAdd of sf.jointagscontent) {
                        const tagID = createdTags.find(t => t.tag_name === tagToAdd)?.metid ?? 0;
                        if (!tagID) continue;
                        await api(`${DOMAIN}/assigntag`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({id: createdDocument.id, metid: tagID})
                        });
                    }
                }
            } catch (err: any) {
                if (err.status === 409 || err.status === 400 || err.status === 406) {
                    setAddError(err.message);
                } else {
                    throw err;
                }
                return;
            }
        }

        setBulkOpen(false);
        setStagedFiles([]);
        setAddError('');
        loadDocuments();
    }

    async function handleSaveClick() {
        const expiration = new Date(editData.expiration_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiredStatus = t('expired');

        console.debug('[Documents] Save clicked', {
            editId,
            status: editData.status,
            expiration: editData.expiration_date,
            folder: editData.folder,
            uploadMode: editUploadMode,
            hasFile: Boolean(editFile),
            hasUrl: Boolean(editUrl)
        });

        if ((expiration < today && editData.status !== expiredStatus) || (expiration > today && editData.status === expiredStatus)) {
            console.warn('[Documents] Save blocked by expiration/status validation', {
                status: editData.status,
                expiredStatus,
                expiration: editData.expiration_date
            });
            return;
        }

        console.debug('[Documents] Opening confirm save modal');
        setConfirmSaveOpen(true);
    }

    function openEdit(doc: ContentForm) {
        const isUrlDocument = getFileType(doc.url) === 'Link';

        api(`${DOMAIN}/contentforms/${doc.id}/checkout`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username})
        })
            .then(res => {
                if (res.status === 423) {
                    res.json().then((data: { error: string }) => alert(data.error));
                    return;
                }
                setEditId(doc.id);
                setEditData({
                    name: doc.name,
                    owner: doc.owner,
                    persona: Array.isArray(doc.persona) ? doc.persona : [doc.persona],
                    date_modified: doc.date_modified?.split('T')[0] ?? today,
                    expiration_date: doc.expiration_date?.split('T')[0] ?? '',
                    content_type: doc.content_type,
                    status: doc.status,
                    username: (localStorage.getItem('username') ?? ''),
                    folder: doc.folder_id !== null ? String(doc.folder_id) : '',
                    jointagscontent: doc.jointagscontent
                });
                setEditUploadMode(isUrlDocument ? 'url' : 'file');
                setEditUrl(isUrlDocument ? doc.url : '');
                setEditFile(null);
                setEditOpen(true);
            });
    }

    function closeEdit(skipCheckIn = false) {
        if (editId && !skipCheckIn) {
            api(`${DOMAIN}/contentforms/${editId}/checkin`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username})
            });
        }
        setEditOpen(false);
        setEditId(null);
        setEditFile(null);
        setEditUrl('');
        setEditUploadMode('file');
        setEditError('');
    }

    async function handleEdit() {
        if (!editId) return;
        console.debug('[Documents] Confirmed save starting', {
            editId,
            status: editData.status,
            folder: editData.folder,
            uploadMode: editUploadMode,
            hasFile: Boolean(editFile),
            hasUrl: Boolean(editUrl)
        });
        try {
            const folderIdValue = editData.folder === '' ? '' : String(editData.folder);
            if (editFile) {
                console.debug('[Documents] Saving as file upload', { folderIdValue });
                const formPayload = new FormData();
                formPayload.append('name', editData.name);
                formPayload.append('ownerUsername', editData.owner);
                formPayload.append('persona', JSON.stringify(editData.persona));
                formPayload.append('date_modified', editData.date_modified);
                formPayload.append('expiration_date', editData.expiration_date);
                formPayload.append('content_type', editData.content_type);
                formPayload.append('status', editData.status);
                formPayload.append('file', editFile);
                formPayload.append('username', editData.username);
                formPayload.append('folder_id', folderIdValue);
                await api(`${UPLOAD_DOMAIN}/contentforms/${editId}`, {method: 'PUT', body: formPayload});
            } else if (editUploadMode === 'url' && editUrl) {
                console.debug('[Documents] Saving as URL update', { folderIdValue });
                const payload: any = {...editData, url: normalizeUrl(editUrl)};
                if (typeof payload.folder !== 'undefined') {
                    payload.folder_id = payload.folder === '' ? null : Number(payload.folder);
                    delete payload.folder;
                }
                await api(`${DOMAIN}/contentforms/${editId}`, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            } else {
                console.debug('[Documents] Saving as metadata-only update', { folderIdValue });
                const payload: any = {...editData};
                if (typeof payload.folder !== 'undefined') {
                    payload.folder_id = payload.folder === '' ? null : Number(payload.folder);
                    delete payload.folder;
                }
                await api(`${DOMAIN}/contentforms/${editId}`, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
            }
        } catch (err: any) {
            if (err.status === 409 || err.status === 400 || err.status === 406) {
                setEditError(err.message);
                console.log("error: ", editError)
            } else {
                throw err;
            }
            return;
        }

        //add/remove any tags to the file before closing edit

        // tag logic
        const flat = await api(`${DOMAIN}/contentforms`)
            .then(res => res.json())
            .then(data => {
                const newFlat: ContentForm[] = Array.isArray(data) ? data :
                    [...(data.Underwriter ?? []), ...(data.BusinessAnalyst ?? []), ...(data.ActuarialAnalyst ?? []), ...(data.EXLOperations ?? [])];
                return newFlat;
            });
        let docID = 0;
        const docTags: string[] = [];
        for (const doc of flat) {
            if (doc.name === editData.name) {
                docID = doc.id;
                //Also get what tags it had originally so we know what to remove/add
                await api(`${DOMAIN}/grabformtags/${doc.name}`)
                    .then(res => res.json())
                    .then(tagData => {
                        if (tagData.data.length > 0) {
                            for (const tag of tagData.data) {
                                docTags.push(tag.tag_name);
                            }
                        }

                    });
            }
        }
        //make sure jointagscontent is not undefined
        const toEdit: string[] = (editData.jointagscontent ?? []);

        //sets are faster
        const wantedTags = new Set(toEdit);
        const currentTags = new Set(docTags);

        const tagsToRemove = docTags.filter(tag => !wantedTags.has(tag));
        const tagsToAdd = toEdit.filter(tag => !currentTags.has(tag));

        for (const tagToAdd of tagsToAdd) {
            let tagID = 0;
            for (const tag of createdTags) {
                if (tag.tag_name === tagToAdd) tagID = tag.metid;
            }
            await api(`${DOMAIN}/assigntag`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: docID, metid: tagID})
            });
        }

        for (const tagToRemove of tagsToRemove) {
            let tagID = 0;
            for (const tag of createdTags) {
                if (tag.tag_name === tagToRemove) tagID = tag.metid;
            }
            await api(`${DOMAIN}/unassigntag`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: docID, metid: tagID})
            });
        }

        await api(`${DOMAIN}/contentforms/${editId}/checkin`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username}),
        });

        console.debug('[Documents] Save finished, checked in and reloading documents');

        setEditFile(null);
        setConfirmSaveOpen(false);
        closeEdit(true);
        loadDocuments();
    }
    async function handleDelete() {
        console.log(localStorage.getItem('username'));
        if (!deleteId) return;
        await api(`${DOMAIN}/contentforms/${deleteId}/${localStorage.getItem('username')}/softdelete`, {method: 'PATCH'});
        setDeleteOpen(false);
        setSelectedIds(prev => prev.filter(id => id !== deleteId));
        setSelectedFavIds(prev => prev.filter(id => id !== deleteId));
        loadDocuments();
    }

    async function toggleFavorite(doc: ContentForm) {
        const isFav = favoritedIds.has(doc.id);
        await api(`${DOMAIN}/${isFav ? 'removeFavorite' : 'addFavorite'}`, {
            method: isFav ? 'DELETE' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, formname: doc.name}),
        });
        setFavoritedIds(prev => {
            const next = new Set(prev);
            isFav ? next.delete(doc.id) : next.add(doc.id);
            return next;
        });
    }

    async function unfavoriteSelected() {
        const ids = [...selectedFavIds, ...selectedIds];
        await Promise.all(ids.map(id => {
            const doc = documents.find(d => d.id === id && favoritedIds.has(d.id));
            if (!doc) return Promise.resolve();
            return api(`${DOMAIN}/removeFavorite`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, formname: doc.name})
            });
        }));
        setSelectedFavIds([]);
        setSelectedIds([]);
        setFavoritedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.delete(id));
            return next;
        });
    }

    async function favoriteSelected() {
        const ids = [...selectedFavIds, ...selectedIds];
        await Promise.all(ids.map(id => {
            const doc = documents.find(d => d.id === id && !favoritedIds.has(d.id));
            if (!doc) return Promise.resolve();
            return api(`${DOMAIN}/addFavorite`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, formname: doc.name})
            });
        }));
        setSelectedFavIds([]);
        setSelectedIds([]);
        setFavoritedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    function toggleFavSelect(id: number) {
        setSelectedFavIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    async function downloadFile(url: string, name: string) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    function openViewer(url: string, label: string, id: number, isUrl: boolean) {
        if (isUrl || !pickRenderer(url)) {
            recordView(id);
            window.open(url, '_blank');
            return;
        }
        recordView(id);
        setViewerUrl(url);
        setViewerLabel(label);
    }

    const rowCallbacks: RowCallbacks = {
        persona,
        onView: openViewer,
        onFavorite: toggleFavorite,
        onDownload: downloadFile,
        onFolderClick: (folderId: number | null) => {
            if (folderId === null) return;
            setSelectedFolderId(prev => (prev === folderId ? null : folderId));
        },
        onEdit: openEdit,
        onDelete: (id: number) => {
            setDeleteId(id);
            setDeleteOpen(true);
        },
        onRequestMove: (id: number) => {
            setSelectedIds([id]);
            setSelectedFavIds([]);
            setMoveTargetFolderId(null);
            setQuickFolderName('');
            setMoveFolderOpen(true);
        },
        onRemoveFromFolder: async (id: number) => {
            await assignDocumentsToFolder([id], null);
        },
        isFavorited: (id: number) => favoritedIds.has(id),
    };

    const recentDocs = recentIds
        .map(id => visibleDocuments.find(d => d.id === id))
        .filter(Boolean) as ContentForm[];

    const titleProp = persona === 'Admin' ? t('all_content') :
        persona === 'Underwriter' ? t('underwriter_title') :
            persona === 'Business Analyst' ? t('ba_title') :
                persona === 'Actuarial Analyst' ? t('act_title') :
                    persona === 'EXL Operations' ? t('exl_title') :
                        'Documents';

    if (isLoadingUser) return <div style={{padding: '20px'}}>{t('load_profile')}</div>;

    const allowedAccess = persona === 'Admin' || persona === 'Underwriter' || persona === 'Business Analyst' || persona === 'Actuarial Analyst' || persona === 'EXL Operations';
    if (!allowedAccess) return <AccessDenied/>;


    function contentTable(persona: PageKey, documentsToDisplay: ContentForm[]) {
        const currentPageCount = Math.max(1, Math.ceil(documentsToDisplay.length / pageSize));
        const paginatedDocumentsToDisplay = documentsToDisplay.slice((currentPage[persona] - 1) * pageSize, currentPage[persona] * pageSize);

        return (
            <>
                <Box>
                    <Table highlightOnHover withTableBorder withColumnBorders>
                        <TableHead
                            onSort={toggleSort}
                            currentField={sortField}
                            currentDir={sortDir}
                            onSelectAll={() => allSelected ? setSelectedIds([]) : setSelectedIds(paginatedDocumentsToDisplay.map(d => d.id))}
                            allChecked={allSelected}
                            indeterminate={selectedIds.length > 0 && !allSelected}
                        />
                        <Table.Tbody>
                            {paginatedDocumentsToDisplay.map(doc => (
                                <DocRow
                                    key={doc.id}
                                    doc={doc}
                                    isSelected={selectedIds.includes(doc.id)}
                                    onSelect={toggleSelect}
                                    currentUsername={localStorage.getItem('username') ?? ''}
                                    isCheckedOut={!!checkedOutMap[doc.id]}
                                    checkedOutBy={checkedOutMap[doc.id] ?? null}
                                    onCheckOut={checkOutHandle}
                                    onCheckIn={checkInHandle}
                                    isDropped={inlineDropdownId === doc.id}
                                    onDrop={() => toggleDropdown(doc.id)}
                                    dropdownViewMode={dropdownViewMode}
                                    {...rowCallbacks}
                                />
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>
                <Group justify="space-between" mt="sm">
                    <Text size="sm" c="dimmed">
                        Page {currentPage[persona]} of {currentPageCount}
                    </Text>
                    <Pagination
                        value={currentPage[persona]}
                        onChange={ value => {
                            const tmpDict: PageMap = {...currentPage};
                            tmpDict[persona] = value;
                            setCurrentPage(tmpDict)
                        }}
                        total={currentPageCount}/>
                </Group>
            </>
        );
    }

    function personaAccordion(givenPersona: string) {
        const existingDocuments = nonFavorites.filter(doc => doc.persona.some(p => givenPersona.includes(p)))
        const personaKey = personaMap[givenPersona] ?? givenPersona;
        if (existingDocuments.length == 0) {
            return null;
        }
        return (
            <Accordion.Item value={givenPersona} key={givenPersona}>
                <Accordion.Control aria-label={givenPersona}>
                    <Text fw={700} size="sm" c="dimmed" mb="xs">{t(personaKey)} {t('documents')}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                    {contentTable(givenPersona as PageKey, existingDocuments)}
                </Accordion.Panel>
            </Accordion.Item>
        );
    }

    const favoriteAccordion = sortedFavorites.length > 0 && !(filterCheckout.includes('checked out') && filterCheckout.includes('available')) ? (
        <Accordion.Item value={"favorites"} key={"favorites"}>
            <Accordion.Control aria-label={"favorites"}>
                <Text fw={700} size="sm" c="yellow" mb="xs">{t('favorites')}</Text>
            </Accordion.Control>
            <Accordion.Panel>
                <Box>
                    <Table highlightOnHover withTableBorder withColumnBorders>
                        <TableHead
                            onSort={toggleFavSort}
                            currentField={favSortField}
                            currentDir={favSortDir}
                            onSelectAll={() => allFavSelected ? setSelectedFavIds([]) : setSelectedFavIds(sortedFavorites.map(d => d.id))}
                            allChecked={allFavSelected}
                            indeterminate={selectedFavIds.length > 0 && !allFavSelected}
                        />
                        <Table.Tbody>
                            {sortedFavorites.map(doc => (
                                <DocRow
                                    key={doc.id}
                                    doc={doc}
                                    isSelected={selectedFavIds.includes(doc.id)}
                                    onSelect={toggleFavSelect}
                                    currentUsername={localStorage.getItem('username') ?? ''}
                                    isCheckedOut={!!checkedOutMap[doc.id]}
                                    checkedOutBy={checkedOutMap[doc.id] ?? null}
                                    onCheckOut={checkOutHandle}
                                    onCheckIn={checkInHandle}
                                    isDropped={inlineDropdownId === doc.id}
                                    onDrop={() => toggleDropdown(doc.id)}
                                    dropdownViewMode={dropdownViewMode}
                                    {...rowCallbacks}
                                />
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>
            </Accordion.Panel>
        </Accordion.Item>
    ) : null;

    return (
        <>
            <title>
                {t('doc_title')}
            </title>
            <Header/>
            <style>{`#header-bar, .rdv-header-bar { display: none !important; }`}</style>

            <Box p="md">
                <Group justify="space-between" align="center" w="100%">
                    <PageTitle title={titleProp}/>
                    <Group gap="s">
                        <ViewToggle viewMode={viewMode} setViewMode={setViewMode}/>
                        <SegmentedControl
                            value={dropdownViewMode}
                            onChange={val => setDropdownViewMode(val as 'dropdown' | 'popup')}
                            data={[
                                {
                                    label: (
                                        <Group gap={4} wrap="nowrap" justify="center">
                                            <IconLayoutBottombar size={16}/>
                                            <span>{t('dropdown')}</span>
                                        </Group>
                                    ),
                                    value: 'dropdown'
                                },
                                {
                                    label: (
                                        <Group gap={4} wrap="nowrap" justify="center">
                                            <IconWindowMaximize size={16}/>
                                            <span>{t('viewer')}</span>
                                        </Group>
                                    ),
                                    value: 'popup'
                                },
                            ]}
                        />
                    </Group>
                </Group>

                <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
                    <Group gap="sm">
                        {persona !== null && (
                            <>
                                <FilledButton leftSection="plus" onClick={openAddDocumentModal}>
                                    {t('add_doc')}
                                </FilledButton>

                                <FilledButton leftSection="plus" onClick={openBulkUploadModal}>
                                    {t('bulk_doc')}
                                </FilledButton>

                                <FilledButton leftSection="plus" onClick={() => setAddFolderOpen(true)} className="invert-hover">
                                    {t('add_folder')}
                                </FilledButton>
                            </>
                        )}
                        <FilledButton
                            variant={activeFilterCount > 0 ? 'filled' : 'outline'}
                            leftSection={<IconFilter size={16} />}
                            onClick={() => setFilterOpen(true)}
                        >
                            {t('filter_doc')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                        </FilledButton>
                        {persona === 'Admin' && (
                            <Button leftSection={<IconTrash size={16}/>} className="invert-hover-red"
                                    variant="outline"
                                    onClick={() => {
                                        loadTrash();
                                        setTrashOpen(true);
                                    }}>
                                {t('trash_doc')}
                            </Button>
                        )}
                    </Group>
                    <Group gap="sm">
                        <TextInput placeholder={t('search_doc')} leftSection={<IconSearch size={16}/>}
                                   value={search} onChange={e => setSearch(e.target.value)} w={250}/>
                    </Group>
                </Group>

                {activeFilterCount > 0 && (
                    <Group mb="sm" gap="xs">
                        {filterPersona.map(v => <Badge key={v} variant="filled" color="blue"
                                                       style={{cursor: 'pointer'}}
                                                       onClick={() => setFilterPersona(p => p.filter(x => x !== v))}>{t('persona')}: {v} ×</Badge>)}
                        {filterStatus.map(v => <StatusBadge
                            key={v}
                            status={v}
                            filter
                            onRemove={() => setFilterStatus(p => p.filter(x => x !== v))}
                        />)}
                        {filterType.map(v => <Badge key={v} variant="filled" color="violet"
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => setFilterType(p => p.filter(x => x !== v))}>{t('type')}: {v} ×</Badge>)}
                        {filterOwner.map(v => <Badge key={v} variant="filled" color="teal"
                                                     style={{cursor: 'pointer'}}
                                                     onClick={() => setFilterOwner(p => p.filter(x => x !== v))}>{t('Owner')}: {v} ×</Badge>)}
                        {filterTags.map(v => <Badge key={v} variant="filled" color="cyan"
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => setFilterTags(p => p.filter(x => x !== v))}>{t('Tag')}: {v} ×</Badge>)}
                        {filterCheckout.map(v => <Badge key={v} variant="filled" color="indigo"
                                                        style={{cursor: 'pointer'}}
                                                        onClick={() => setFilterCheckout(p => p.filter(x => x !== v))}>{t('checkout_status')}: {v === 'checked out' ? t('checked_out') : t('available')} ×
                        </Badge>)}
                        {selectedFolderId !== null && (
                            <Badge
                                variant="filled"
                                color="grape"
                                style={{cursor: 'pointer'}}
                                onClick={() => setSelectedFolderId(null)}
                            >
                                Folder: {folderMap[selectedFolderId]?.name ?? 'Unknown'} ×
                            </Badge>
                        )}
                        <Badge variant="outline" style={{cursor: 'pointer'}} onClick={() => {
                            setFilterPersona([]);
                            setFilterStatus([]);
                            setFilterType([]);
                            setFilterOwner([]);
                            setFilterCheckout([]);
                            setFilterTags([]);
                            setSelectedFolderId(null);
                        }}>{t('clear_all')}</Badge>
                    </Group>
                )}

                {selectedFolderId !== null && (
                    <Group mb="sm" gap={4} wrap="wrap">
                        <Button variant="subtle" size="compact-xs" onClick={() => setSelectedFolderId(null)}>
                            Root
                        </Button>
                        {selectedFolderPath.map((folder) => (
                            <Fragment key={`crumb-${folder.id}`}>
                                <Text size="sm" c="dimmed">/</Text>
                                <Button
                                    variant="subtle"
                                    size="compact-xs"
                                    onClick={() => setSelectedFolderId(folder.id)}
                                >
                                    {folder.name}
                                </Button>
                            </Fragment>
                        ))}
                    </Group>
                )}

                {/* ── Recently Viewed ─────────────────────────────────────── */}
                {recentDocs.length > 0 && (
                    <Box mb="lg">
                        <Group gap={6} mb="xs">
                            <IconClock size={14} color="gray"/>
                            <Text fw={700} size="sm" c="dimmed">{t('recent_viewed')}</Text>
                        </Group>
                        <div style={{display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8}}>
                            {recentDocs.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => openViewer(doc.url, doc.name, doc.id, (getFileType(doc.url) === 'Link'))}
                                    style={{
                                        minWidth: 160, maxWidth: 160, background: 'white', borderRadius: 8,
                                        padding: '10px 12px', cursor: 'pointer', flexShrink: 0,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid #eee'
                                    }}
                                >
                                    <Text fw={600} size="sm" style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'var(--color-yale-blue)'
                                    }}>
                                        {doc.name}
                                    </Text>
                                    <FileTypeBadge fileType={getFileType(doc.url)} size="sm"/>
                                    <PersonaBadges personas={doc.persona}/>
                                </div>
                            ))}
                        </div>
                    </Box>
                )}

                {folders.length > 0 && (
                    <Box mb="lg">
                        <Group justify="space-between" mb="xs">
                            <Text fw={700} size="sm" c="dimmed">{t('folders')}</Text>
                            {selectedFolderId !== null && (
                                <Button variant="light" size="xs" onClick={() => setSelectedFolderId(null)}>
                                    {t('show_all_doc')}
                                </Button>
                            )}
                        </Group>
                        <Stack gap={8}>
                            {rootFolders.map((rootFolder) => {
                                const renderFolderNode = (folder: Folder, depth: number) => {
                                    const isActive = selectedFolderId === folder.id;
                                    const canEditFolder = (persona ?? '').toLowerCase() === 'admin' || folder.owner === (username ?? '');
                                    const childFolders = folderChildrenMap[folder.id] ?? [];
                                    const isExpanded = expandedFolderIds.includes(folder.id);

                                    return (
                                        <Box key={folder.id}>
                                            <Box
                                                p="xs"
                                                ml={depth * 12}
                                                onClick={() => setSelectedFolderId(prev => prev === folder.id ? null : folder.id)}
                                                style={{
                                                    border: isActive ? '1px solid #3b82f6' : '1px solid #d7dee8',
                                                    borderRadius: 8,
                                                    background: isActive ? '#eff6ff' : '#f8fafc',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Group gap={6} wrap="nowrap" align="center" justify="space-between">
                                                    <Group gap={6} wrap="nowrap" align="center" style={{minWidth: 0}}>
                                                        {childFolders.length > 0 ? (
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedFolderIds(prev => prev.includes(folder.id)
                                                                        ? prev.filter(id => id !== folder.id)
                                                                        : [...prev, folder.id]);
                                                                }}
                                                            >
                                                                {isExpanded ? <IconChevronDown size={12}/> : <IconChevronRight size={12}/>}
                                                            </ActionIcon>
                                                        ) : (
                                                            <Box w={22}/>
                                                        )}
                                                        <ActionIcon variant={isActive ? 'filled' : 'light'} color={isActive ? 'blue' : 'gray'} size="sm">
                                                            <IconFolder size={14}/>
                                                        </ActionIcon>
                                                        <div style={{minWidth: 0}}>
                                                            <Text fw={700} size="xs" style={{color: 'var(--color-yale-blue)'}}>
                                                                {folder.name}
                                                            </Text>
                                                            <Text size="10px" c="dimmed">
                                                                {folderDocCounts[folder.id] ?? 0} document(s)
                                                            </Text>
                                                        </div>
                                                    </Group>

                                                    {canEditFolder && (
                                                        <Menu shadow="md" width={170} withinPortal>
                                                            <Menu.Target>
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="gray"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    aria-label="Folder actions"
                                                                    size="sm"
                                                                >
                                                                    <IconDotsVertical size={12}/>
                                                                </ActionIcon>
                                                            </Menu.Target>
                                                            <Menu.Dropdown>
                                                                <Menu.Item onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}>
                                                                    {t('edit_folder')}
                                                                </Menu.Item>
                                                                <Menu.Item onClick={(e) => { e.stopPropagation(); setDeleteFolderId(folder.id); setDeleteFolderOpen(true); }}>
                                                                    {t('delete_folder')}
                                                                </Menu.Item>
                                                                <Menu.Item onClick={(e) => { e.stopPropagation(); setDuplicateFolderId(folder.id); setDuplicateFolderOpen(true); }}>
                                                                    {t('duplicate_folder')}
                                                                </Menu.Item>
                                                            </Menu.Dropdown>
                                                        </Menu>
                                                    )}
                                                </Group>
                                            </Box>

                                            {isExpanded && childFolders.length > 0 && (
                                                <Stack gap={8} mt={8}>
                                                    {childFolders.map((child) => renderFolderNode(child, depth + 1))}
                                                </Stack>
                                            )}
                                        </Box>
                                    );
                                };

                                return renderFolderNode(rootFolder, 0);
                            })}
                        </Stack>
                    </Box>
                )}

                {/* list view */}
                {viewMode === 'list' && (
                    <Stack gap="lg">
                        <Group justify="space-between" align="center">
                            <Text size="sm" c="dimmed">
                                {t("showing")} {rowsPerPage}  {t("rows_per_page")}
                            </Text>
                            <Select
                                value={rowsPerPage}
                                onChange={(value) => setRowsPerPage((value as '10'|'25' | '50') ?? '25')}
                                data={[
                                    {label: `10 ${t('rows')}`, value: '10'},
                                    {label: `25 ${t('rows')}`, value: '25'},
                                    {label: `50 ${t('rows')}`, value: '50'}
                                ]}
                                w={140}
                                allowDeselect={false}
                            />
                        </Group>
                        {!search ?
                            <Accordion multiple defaultValue={["favorites", persona]}>
                                {favoriteAccordion}
                                {[persona, ...allPersonas.filter(p => p != persona)].map(p => personaAccordion(p))}
                            </Accordion>
                            :
                            <Accordion multiple defaultValue={["All"]}>
                                <Accordion.Item value="All" key="All">
                                    <Accordion.Control aria-label="All documents">
                                        <Text fw={700} size="sm" c="dimmed" mb="xs">{t("all_doc")}</Text>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        {contentTable("All", filtered)}
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>
                        }
                    </Stack>
                )}

                {/* grid view */}
                {viewMode === 'grid' && (
                    <Stack gap="lg">
                        {sortedFavorites.length > 0 && (
                            <Box>
                                <Group justify="space-between" mb="sm">
                                    <Text fw={700} c="yellow">{t('favorites')}</Text>
                                    <Checkbox label="Select all" checked={allFavSelected}
                                              indeterminate={selectedFavIds.length > 0 && !allFavSelected}
                                              onChange={() => allFavSelected ? setSelectedFavIds([]) : setSelectedFavIds(sortedFavorites.map(d => d.id))}/>
                                </Group>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
                                    gap: 16
                                }}>
                                    {sortedFavorites.map(doc => <DocCard key={doc.id} doc={doc}
                                                                         isSelected={selectedFavIds.includes(doc.id)}
                                                                         onSelect={toggleFavSelect} {...rowCallbacks} />)}
                                </div>
                            </Box>
                        )}
                        <Box>
                            <Group justify="space-between" mb="sm">
                                <Text fw={700} c="dimmed">{t('all_doc')}</Text>
                                <Checkbox label="Select all" checked={allSelected}
                                          indeterminate={selectedIds.length > 0 && !allSelected}
                                          onChange={() => allSelected ? setSelectedIds([]) : setSelectedIds(nonFavorites.map(d => d.id))}/>
                            </Group>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
                                gap: 16
                            }}>
                                {nonFavorites.map(doc => <DocCard key={doc.id} doc={doc}
                                                                  isSelected={selectedIds.includes(doc.id)}
                                                                  onSelect={toggleSelect} {...rowCallbacks} />)}
                            </div>
                        </Box>
                    </Stack>
                )}

                {/* bulk action bar */}
                {anySelected && (
                    <Box style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: 'var(--color-yale-blue)',
                        padding: '12px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text c="white">{selectedCount} {t('selected')}</Text>
                        <Group gap="sm">
                            <Button className="invert-hover" onClick={() => {
                                setSelectedIds([]);
                                setSelectedFavIds([]);
                            }}>{t('deselect_all')}</Button>
                            <Button className="invert-hover" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    const doc = documents.find(d => d.id === id);
                                    if (doc) {
                                        await downloadFile(doc.url, doc.name);
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                    }
                                }
                            }}>{t('download_selected')}</Button>
                            <Button className="invert-hover" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    await checkOutHandle(id);
                                }
                            }}>{t('checkout_selected')}</Button>
                            <Button className="invert-hover" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    await checkInHandle(id);
                                }
                            }}>{t('checkin_selected')}</Button>
                            {selectedHasNonFavorites &&
                                <Button className="invert-hover" onClick={favoriteSelected}>{t('favorite_all')}</Button>}
                            {selectedHasFavorites &&
                                <Button className="invert-hover" onClick={unfavoriteSelected}>{t('unfavorite_all')}</Button>}
                            <Button className="invert-hover" onClick={() => {
                                setMoveTargetFolderId(null);
                                setQuickFolderName('');
                                setMoveFolderOpen(true);
                            }}>{t('move_to_folder')}</Button>
                            <Button className="invert-hover-red" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                if (!window.confirm(`Delete ${ids.length} documents?`)) return;
                                await Promise.all(ids.map(id => api(`${DOMAIN}/contentforms/${id}/${localStorage.getItem('username')}/softdelete`, {method: 'PATCH'})));
                                setSelectedIds([]);
                                setSelectedFavIds([]);
                                loadDocuments();
                            }}>{t('delete_selected')}</Button>
                        </Group>
                    </Box>
                )}
            </Box>

            {/* doc viewer */}
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

            {/* Folder modal */}
            <Modal opened={addFolderOpen} onClose={() => {
                setAddFolderOpen(false);
                setFolderModalError('');
                setFolderUsers([]);
            }} title={t('Create Folder')}>
                <Stack>
                    <TextInput label={t('folder_name')} placeholder={t("folder_place")} value={folderName} onChange={e => setFolderName(e.target.value)} />
                    <MultiSelect label={t('folder_persona')} placeholder={t('folder_persona_place')}value={folderPersona} onChange={setFolderPersona} data={roles} clearable />
                    <MultiSelect
                        label={t('folder_restrict')}
                        placeholder={t("folder_restrict_place")}
                        value={folderUsers}
                        onChange={setFolderUsers}
                        data={[...new Set(employees.map(e => e.username))]}
                        searchable
                        clearable
                    />
                    {folderModalError && <ErrorMessage message={folderModalError} />}
                    <Group justify="flex-end">
                        <Button className="invert-hover" onClick={async () => {
                            const personas = folderPersona.length > 0 ? folderPersona : [persona ?? ''].filter(Boolean);
                            const created = await createFolder(folderName, personas, folderUsers, selectedFolderId);
                            if (created) {
                                setAddFolderOpen(false);
                                setFolderName('');
                                setFolderPersona([]);
                                setFolderUsers([]);
                                setFolderModalError('');
                            }
                        }}>{t('create')}</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={editFolderOpen} onClose={() => {
                setEditFolderOpen(false);
                setEditFolderError('');
                setEditFolderParentId(null);
            }} title="Edit Folder">
                <Stack>
                    <TextInput
                        label="Folder Name"
                        placeholder="Enter folder name"
                        value={editFolderName}
                        onChange={e => setEditFolderName(e.target.value)}
                    />
                    <Select
                        label="Parent Folder"
                        placeholder="Top level"
                        value={editFolderParentId}
                        onChange={setEditFolderParentId}
                        data={folderParentOptions.filter(option => option.value !== String(editFolderId))}
                        searchable
                        clearable
                    />
                    <MultiSelect
                        label="Persona"
                        placeholder="Select personas"
                        value={editFolderPersona}
                        onChange={setEditFolderPersona}
                        data={roles}
                        clearable
                    />
                    <MultiSelect
                        label="Restricted Users"
                        placeholder="Select users who can access this folder"
                        value={editFolderUsers}
                        onChange={setEditFolderUsers}
                        data={[...new Set(employees.map(e => e.username))]}
                        searchable
                        clearable
                    />
                    {editFolderError && <ErrorMessage message={editFolderError} />}
                    <Group justify="flex-end">
                        <Button className="invert-hover-outline" onClick={() => setEditFolderOpen(false)}>Cancel</Button>
                        <Button
                            className="invert-hover"
                            onClick={async () => {
                                if (!editFolderId) return;
                                const selectedParentFolderId = editFolderParentId && editFolderParentId !== 'root'
                                    ? Number(editFolderParentId)
                                    : null;
                                await updateFolder(editFolderId, editFolderName, editFolderPersona, editFolderUsers, selectedParentFolderId);
                            }}
                        >
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={moveFolderOpen} onClose={() => setMoveFolderOpen(false)} title="Move Selected to Folder">
                <Stack>
                    <Select
                        label="Target Folder"
                        placeholder="Choose folder"
                        value={moveTargetFolderId}
                        onChange={setMoveTargetFolderId}
                        data={folders.map(f => ({label: f.name, value: String(f.id)}))}
                        searchable
                        clearable
                    />
                    <Group grow>
                        <TextInput
                            label="Or create folder"
                            placeholder="New folder name"
                            value={quickFolderName}
                            onChange={e => setQuickFolderName(e.target.value)}
                        />
                        <Button mt={24} className="invert-hover-outline" onClick={async () => {
                            const personas = [persona ?? ''].filter(Boolean);
                            const created = await createFolder(quickFolderName, personas, [], null);
                            if (created) {
                                setMoveTargetFolderId(String(created.id));
                                setQuickFolderName('');
                            }
                        }}>Create</Button>
                    </Group>
                    <Group justify="flex-end">
                        <Button className="invert-hover-outline" onClick={() => setMoveFolderOpen(false)}>Cancel</Button>
                        <Button className="invert-hover" onClick={async () => {
                            if (!moveTargetFolderId) return;
                            const ids = [...new Set([...selectedIds, ...selectedFavIds])];
                            await assignDocumentsToFolder(ids, Number(moveTargetFolderId));
                            setMoveFolderOpen(false);
                        }}>Move</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* filter modal */}
            <Modal opened={filterOpen} onClose={() => setFilterOpen(false)} title={t('filter_documents')}>
                <Stack>
                    <MultiSelect label={t('persona')} placeholder={t('all_persona')} value={filterPersona}
                                 onChange={setFilterPersona} data={roles.map ( r => ({ value: r, label: t(personaMap[r] ?? r)}))} clearable/>
                    <MultiSelect label={t('status')} placeholder={t('all_status')} value={filterStatus}
                                 onChange={setFilterStatus}
                                 data={[t('in_progress'), t('internal_review'), t('client_review'), t('expired'), t('archived'), t('approved')]}
                                 clearable/>
                    <MultiSelect label={t('file_type')} placeholder={t('all_type')} value={filterType}
                                 onChange={setFilterType}
                                 data={fileTypeOptions}
                                 clearable/>
                    <MultiSelect label={t('owner')} placeholder={t('all_owner')} value={filterOwner}
                                 onChange={setFilterOwner}
                                 data={[...new Set(documents.map(d => d.owner))]} clearable/>
                    <MultiSelect label={t('checkout_status')} placeholder={t('all_doc')} value={filterCheckout}
                                 onChange={(val) => setFilterCheckout(val)}
                                 data={[{value: 'available', label: t('available')}, {value: 'checked out', label: t('checked_out')}]}
                                 clearable/>
                    <MultiSelect label= {t('content_tags')} placeholder= {t('any_tags')} value={filterTags}
                                 onChange={setFilterTags} data={getArrayTags()}
                                 clearable/>
                    <Group justify="flex-end">
                        <Button className="invert-hover-outline" onClick={() => {
                            setFilterPersona([]);
                            setFilterStatus([]);
                            setFilterType([]);
                            setFilterOwner([]);
                            setFilterCheckout([]);
                            setFilterTags([]);
                            setSelectedFolderId(null);
                        }}>{t('clear_all')}</Button>
                        <Button className="invert-hover" onClick={() => setFilterOpen(false)}>{t('apply')}</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* trash modal */}
            <Modal opened={trashOpen} onClose={() => {
                setTrashOpen(false);
                setTrashSearch('');
                setTrashSelected([]);
                setExpandedTrashFolderIds([]);
            }} title={t('trash_delete')} size="xl">
                <Stack gap="sm">
                    <Group gap="sm">
                        <TextInput placeholder={t('trash_search')} leftSection={<IconSearch size={16}/>}
                                   value={trashSearch} onChange={e => setTrashSearch(e.target.value)}
                                   style={{flex: 1}}/>
                        <Select placeholder={t('trash_filter')} clearable value={trashPersonaFilter}
                                onChange={val => setTrashPersonaFilter(val ?? '')} data={roles} w={180}/>
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
                                    <Button size="xs" variant="outline" color="var(--color-yale-blue)"
                                            onClick={async () => {
                                                await Promise.all(trashSelected.map(id => api(`${DOMAIN}/contentforms/${id}/restore`, {method: 'PATCH'})));
                                                setTrashSelected([]);
                                                loadTrash();
                                                loadDocuments();
                                            }}>Restore Selected</Button>
                                    <Button size="xs" color="red" onClick={async () => {
                                        if (!window.confirm(`Permanently delete ${trashSelected.length} documents?`)) return;
                                        await Promise.all(trashSelected.map(id => api(`${DOMAIN}/contentforms/${id}/permanent`, {method: 'DELETE'})));
                                        setTrashSelected([]);
                                        loadTrash();
                                    }}>Delete Selected</Button>
                                </Group>
                            )}
                        </Group>
                    )}
                    {filteredTrashFolders.length > 0 && (
                        <Box>
                            <Text fw={700} size="sm" c="dimmed" mb="xs">{t('folder_delete')}</Text>
                            <Stack gap="xs">
                                {filteredTrashFolders.map(folder => {
                                    const folderDocs = Array.isArray(folder.documents) ? folder.documents : [];
                                    const expanded = expandedTrashFolderIds.includes(folder.id);
                                    return (
                                        <Box key={`folder-trash-${folder.id}`} p="sm" style={{border: '1px solid #e4e8ef', borderRadius: 8, background: '#f8fafc'}}>
                                            <Group justify="space-between" align="flex-start">
                                                <div>
                                                    <Text fw={600}>{folder.name}</Text>
                                                    <Text size="xs" c="dimmed">
                                                        Owner: {folder.owner} · Deleted: {folder.deleted_at ? new Date(folder.deleted_at).toLocaleDateString() : 'Unknown'}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">{folderDocs.length} deleted document(s)</Text>
                                                </div>
                                                <Group gap="xs">
                                                    <Button size="xs" variant="subtle" onClick={() => {
                                                        setExpandedTrashFolderIds(prev => prev.includes(folder.id)
                                                            ? prev.filter(id => id !== folder.id)
                                                            : [...prev, folder.id]);
                                                    }}>{expanded ? 'Hide contents' : 'Show contents'}</Button>
                                                    <Button size="xs" variant="outline" color="var(--color-yale-blue)"
                                                            onClick={() => restoreFolderFromTrash(folder.id)}>Restore Folder</Button>
                                                    <Button size="xs" color="var(--color-neutral-red)"
                                                            onClick={() => permanentDeleteFolderFromTrash(folder.id)}>Delete Folder Permanently</Button>
                                                </Group>
                                            </Group>
                                            {expanded && (
                                                <Stack gap="xs" mt="sm">
                                                    {folderDocs.length === 0 ? (
                                                        <Text c="dimmed" size="sm">No deleted documents in this folder.</Text>
                                                    ) : folderDocs.map(doc => (
                                                        <Box key={`folder-${folder.id}-doc-${doc.id}`} p="xs" style={{border: '1px solid #e9edf3', borderRadius: 6, background: 'white'}}>
                                                            <Group justify="space-between" align="flex-start">
                                                                <div>
                                                                    <Text fw={600} size="sm">{doc.name}</Text>
                                                                    <Text size="xs" c="dimmed">
                                                                        Owner: {doc.owner} · Deleted: {doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString() : 'Unknown'}
                                                                    </Text>
                                                                </div>
                                                                <Group gap="xs">
                                                                    <Tooltip label="Preview document">
                                                                        <ActionIcon variant="subtle" onClick={() => {
                                                                            setViewerUrl(doc.url);
                                                                            setViewerLabel(doc.name);
                                                                        }}>
                                                                            <IconSearch size={16}/>
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                    <Button size="xs" variant="outline" color="var(--color-yale-blue)"
                                                                            onClick={() => restoreDoc(doc.id)}>Restore</Button>
                                                                    <Button size="xs" color="var(--color-neutral-red)"
                                                                            onClick={() => permanentDelete(doc.id)}>Delete Permanently</Button>
                                                                </Group>
                                                            </Group>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}
                    {filteredTrash.length > 0 && (
                        <Box>
                            <Text fw={700} size="sm" c="dimmed" mb="xs">Deleted standalone documents</Text>
                            <Stack gap="xs">
                                {filteredTrash.map(doc => (
                                    <Box key={doc.id} p="sm" style={{
                                        border: trashSelected.includes(doc.id) ? '1.5px solid var(--color-fresh-sky, #3b82f6)' : '1px solid #eee',
                                        borderRadius: 8,
                                        background: trashSelected.includes(doc.id) ? '#f0f7ff' : 'white'
                                    }}>
                                        <Group justify="space-between" align="flex-start">
                                            <Group gap="sm" align="flex-start">
                                                <Checkbox mt={2} checked={trashSelected.includes(doc.id)}
                                                          onChange={() => setTrashSelected(prev => prev.includes(doc.id) ? prev.filter(i => i !== doc.id) : [...prev, doc.id])}/>
                                                <div>
                                                    <Text fw={600}>{doc.name}</Text>
                                                    <Text size="xs" c="dimmed">
                                                        Owner: {doc.owner} · Deleted: {doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString() : 'Unknown'}
                                                    </Text>
                                                    <Group gap={4} mt={4}>
                                                        <PersonaBadges personas={doc.persona}/>
                                                        <StatusBadge status={doc.status} size="xs" filter={false}/>
                                                        <FileTypeBadge fileType={getFileType(doc.url)} size="xs"/>
                                                    </Group>
                                                </div>
                                            </Group>
                                            <Group gap="xs">
                                                <Tooltip label="Preview document">
                                                    <ActionIcon variant="subtle" onClick={() => {
                                                        setViewerUrl(doc.url);
                                                        setViewerLabel(doc.name);
                                                    }}>
                                                        <IconSearch size={16}/>
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Button size="xs" variant="outline" color="var(--color-yale-blue)"
                                                        onClick={() => restoreDoc(doc.id)}>Restore</Button>
                                                <Button size="xs" color="var(--color-neutral-red)"
                                                        onClick={() => permanentDelete(doc.id)}>Delete Permanently</Button>
                                            </Group>
                                        </Group>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}
                    {filteredTrash.length === 0 && filteredTrashFolders.length === 0 && (
                        <Text c="dimmed" ta="center" py="xl">No deleted documents or folders.</Text>
                    )}
                </Stack>
            </Modal>

            {/* add modal */}
            <Modal opened={addOpen} onClose={() => {
                setAddOpen(false);
                setAddError('');
            }} title={t('add_new_doc')} size="lg">
                <Stack>
                    <Text fw={600}>{t('document_details')}</Text>
                    <TextInput label={t('name_document')} value={addData.name}
                               onChange={e => setAddData({...addData, name: e.target.value})}/>
                    <Box>
                        <SegmentedControl
                            value={uploadMode}
                            onChange={(val) => {
                                setUploadMode(val as 'file' | 'url');
                                setAddFile(null);
                                setAddUrl('');
                            }}
                            data={[{label: t('upload_file'), value: 'file'}, {label: t('enter_url'), value: 'url'}]}
                            mb="sm"
                        />
                        {uploadMode === 'file'
                            ? <Box>
                                <input ref={fileInputRef} type="file"
                                       onChange={e => setAddFile(e.target.files?.[0] ?? null)}/>
                            </Box>
                            : <TextInput label="URL" placeholder="https://example.com" value={addUrl}
                                         onChange={e => setAddUrl(e.target.value)}/>
                        }
                    </Box>
                    {persona === 'Admin'
                        ? <Select label={t('name_owner')} value={addData.owner}
                                  onChange={val => setAddData({...addData, owner: val ?? ''})}
                                  data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)}/>
                        : <TextInput label={t('name_owner')} value={addData.owner} readOnly/>}
                    <MultiSelect label={t('job_position')} value={addData.persona}
                                 onChange={val => setAddData({...addData, persona: val})}
                                 data={roles
                                     .filter((role) => role !== 'Admin')
                                     .map ( r => ({
                                         value: r,
                                         label: t(personaMap[r] ?? r)
                                     }))
                                 }
                                 disabled={persona !== 'Admin'}/>
                    <Text fw={600} mt="sm">{t('life_cycle')}</Text>
                    <Box p="xs" style={{border: '1px solid #d7dee8', borderRadius: 8, background: '#f8fafc'}}>
                        <Text size="xs" c="dimmed">Upload destination</Text>
                        <Text fw={600} size="sm">{(addData.folder && addData.folder !== '') ? (folderMap[Number(addData.folder)]?.name ?? 'Selected folder') : (selectedFolderId !== null ? (folderMap[selectedFolderId]?.name ?? 'Current folder') : 'Root')}</Text>
                    </Box>
                    <Group grow mt="sm">
                        <Select
                            label={t('folder')}
                            placeholder={t('top_level')}
                            value={addData.folder === '' ? 'root' : addData.folder}
                            onChange={val => setAddData({...addData, folder: (val === 'root' ? '' : (val ?? ''))})}
                            data={folderParentOptions}
                            clearable
                        />
                        <Group style={{alignItems: 'flex-end'}}>
                            <TextInput
                                label="Or create folder"
                                placeholder="New folder name"
                                value={quickFolderName}
                                onChange={e => setQuickFolderName(e.target.value)}
                            />
                            <Button mt={20} className="invert-hover-outline" onClick={async () => {
                                const personas = [persona ?? ''].filter(Boolean);
                                const created = await createFolder(quickFolderName, personas, [], null);
                                if (created) {
                                    setAddData(prev => ({...prev, folder: String(created.id)}));
                                    setQuickFolderName('');
                                }
                            }}>{t('create')}</Button>
                        </Group>
                    </Group>
                    <Group grow>
                        <Select label={t('content_type')} value={addData.content_type}
                                onChange={val => setAddData({...addData, content_type: val ?? ''})}
                                data={[t('reference'), t('workflow')]}/>
                        <Select label={t('document_status')} value={addData.status}
                                onChange={val => setAddData({...addData, status: val ?? ''})}
                                data={[t('in_progress'), t('internal_review'), t('client_review'), t('archived'), t('approved')]}/>
                    </Group>
                    <Group grow>
                        <TextInput label={t('last_modified')} type="date" value={addData.date_modified}
                                   onChange={e => setAddData({...addData, date_modified: e.target.value})}/>
                        <TextInput label={t('expiration_date')} type="date" value={addData.expiration_date}
                                   onChange={e => setAddData({...addData, expiration_date: e.target.value})}/>
                    </Group>
                    <Group preventGrowOverflow={false} align="flex-end">
                        <MultiSelect w="75%" label={t('tags')} value={addData.jointagscontent}
                                     onChange={val => setAddData({...addData, jointagscontent: (val ?? [])})}
                                     data={getArrayTags()}
                                     searchable
                                     clearable/>
                        <Button className="invert-hover" style={{width: '20%', padding: '0 0px'}}
                                onClick={() => setAdvancedTagsOpen(true)}> {t('advanced_tags')} </Button>
                    </Group>
                    <Group justify="flex-end" mt="md">
                        {addError && <ErrorMessage message={addError}/>}
                        <Button className="invert-hover-outline" onClick={() => {
                            setAddOpen(false);
                            setAddError('');
                        }}>✕ {t('cancel_changes')}</Button>
                        <Button onClick={handleAdd} className="invert-hover">+ {t('submit_doc')}</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* edit modal */}
            <Modal opened={editOpen} onClose={() => closeEdit()} title={t('edit_doc')} size="lg">
                <Stack>
                    <Text fw={600}>{t('document_details')}</Text>
                    <TextInput label={t("name_document")} value={editData.name}
                               onChange={e => setEditData({...editData, name: e.target.value})}/>
                    <Box>
                        <SegmentedControl
                            value={editUploadMode}
                            onChange={(val) => {
                                setEditUploadMode(val as 'file' | 'url');
                                setEditFile(null);
                                setEditUrl('');
                            }}
                            data={[{label: t('upload_file'), value: 'file'}, {label: t('enter_url'), value: 'url'}]}
                            mb="sm"
                        />
                        {editUploadMode === 'file'
                            ? <Box>
                                <input type="file" style={{display: 'block', marginTop: '8px'}}
                                       onChange={e => setEditFile(e.target.files?.[0] ?? null)}/>
                                <Text size="xs" c="dimmed" mt={2}>{t('edit_message')}</Text>
                            </Box>
                            : <TextInput label="URL" placeholder="https://example.com" value={editUrl}
                                         onChange={e => setEditUrl(e.target.value)}/>
                        }
                    </Box>
                    {persona === 'Admin'
                        ? <Select
                            label={t('content_owner')}
                            value={editData.owner}
                            onChange={val => setEditData({...editData, owner: val ?? ''})}
                            data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)}
                          />
                        : <TextInput
                            label={t('content_owner')}
                            value={editData.owner}
                            readOnly
                          />
                    }
                    <MultiSelect
                        label={t('job_position')}
                        value={editData.persona.filter(p => p !== 'Admin')}
                        onChange={val => setEditData({...editData, persona: val})}
                        data={roles.filter(r => r !== 'Admin')}
                        disabled={persona !== 'Admin'}
                    />
                    <Select
                        label={t('folder')}
                        placeholder="Top level"
                        value={editData.folder === '' ? 'root' : editData.folder}
                        onChange={val => setEditData({...editData, folder: (val === 'root' ? '' : (val ?? ''))})}
                        data={folderParentOptions}
                        clearable
                    />
                    <Group preventGrowOverflow={false}>
                        <MultiSelect
                            w="75%"
                            label="Tags"
                            value={editData.jointagscontent}
                            onChange={val => setEditData({...editData, jointagscontent: (val ?? [])})}
                            data={getArrayTags()}
                        />
                        <Button
                            className="invert-hover"
                            style={{width: '20%', padding: '0 0px'}}
                            onClick={() => setAdvancedTagsOpen(true)}
                        >
                            Advanced Tags
                        </Button>
                    </Group>
                    <Text fw={600} mt="sm">Lifecycle & Attributes</Text>
                    <Group grow>
                        <Select label={t('content_type')} value={editData.content_type}
                                onChange={val => setEditData({...editData, content_type: val ?? ''})}
                                data={[t('reference'), t('workflow')]}/>
                        <Select label={t('document_status')} value={editData.status}
                                onChange={val => setEditData({...editData, status: val ?? ''})}
                                data={[t('in_progress'), t('internal_review'), t('client_review'), t('expired'), t('archived'), t('approved')]}/>
                    </Group>
                    <Group grow>
                        <TextInput label={t('last_modified')} type="date" value={editData.date_modified}
                                   onChange={e => setEditData({...editData, date_modified: e.target.value})}/>
                        <TextInput label={t('expiration_date')} type="date" value={editData.expiration_date}
                                   onChange={e => setEditData({...editData, expiration_date: e.target.value})}/>
                    </Group>
                    <Group justify="flex-end" mt="md">
                        {editError && <ErrorMessage message={editError}/>}
                        <Button className="invert-hover-outline" onClick={() => closeEdit()}>✕ Cancel Changes</Button>
                        <Button onClick={handleSaveClick} className="invert-hover">✓ Save Changes</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Advanced tag management modal */}
            <Modal opened={advancedTagsOpen} onClose={() => setAdvancedTagsOpen(false)}
                   title="Advanced Tag Management"
                   size="lg">
                <Stack>
                    <ManageTags allTags={getArrayTags()}/>
                    <Group justify="flex-end" mt="md">
                        <Button className="invert-hover-outline" onClick={() => {
                            setAdvancedTagsOpen(false);
                            loadTags();
                        }}>Done</Button>
                    </Group>
                </Stack>
            </Modal>

            <ConfirmModal
                opened={confirmSaveOpen}
                onClose={() => setConfirmSaveOpen(false)}
                title={t('confirm_changes')}
                message={<>{t('change_message')}</>}
                onConfirm={handleEdit}
                onCancel={() => setConfirmSaveOpen(false)}
            />

            <ConfirmModal
                opened={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title={t('delete_form')}
                message={<>{t('delete_message')}</>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteOpen(false)}
            />

            <ConfirmModal
                opened={deleteFolderOpen}
                onClose={() => {
                    setDeleteFolderOpen(false);
                    setDeleteFolderId(null);
                }}
                title={t('delete_form')}
                message={<>{t('delete_message_folder')}</>}
                onConfirm={async () => {
                    if (deleteFolderId === null) return;
                    await deleteFolder(deleteFolderId);
                }}
                onCancel={() => {
                    setDeleteFolderOpen(false);
                    setDeleteFolderId(null);
                }}
            />

            <ConfirmModal
                opened={duplicateFolderOpen}
                onClose={() => {
                    setDuplicateFolderOpen(false);
                    setDuplicateFolderId(null);
                }}
                title="Duplicate folder"
                message={<>Create a copy of this folder and its documents?</>}
                onConfirm={async () => {
                    if (duplicateFolderId === null) return;
                    await duplicateFolder(duplicateFolderId);
                }}
                onCancel={() => {
                    setDuplicateFolderOpen(false);
                    setDuplicateFolderId(null);
                }}
            />

            {/* bulk upload modal */}
            <Modal opened={bulkOpen} onClose={() => { setBulkOpen(false); setStagedFiles([]);
            }} title={t('bulk_doc')} size="1200px">
                <Stack>
                    <Box>
                        <Text size="sm" fw={500} mb={4}>{t('bulk_upload')}</Text>
                        <Group>
                            <input
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                id="bulk-file-input"
                                onChange={e => { handleBulkFileSelect(Array.from(e.target.files ?? [])); e.target.value = ''; }}
                            />
                            <Button variant="outline" size="xs" onClick={() => document.getElementById('bulk-file-input')?.click()}>+ {t('bulk_add')}</Button>
                            <Button variant="outline" size="xs" onClick={addStagedUrl}>+ {t('bulk_url')}</Button>
                            <Button variant="filled" size="xs" onClick={autoFillFromFirst}> {t('bulk_autofill')}</Button>
                        </Group>
                    </Box>
                    <Box p="xs" style={{border: '1px solid #d7dee8', borderRadius: 8, background: '#f8fafc'}}>
                        <Text size="xs" c="dimmed">Upload destination</Text>
                        <Text fw={600} size="sm">{selectedFolderId !== null ? (folderMap[selectedFolderId]?.name ?? 'Current folder') : 'Root'}</Text>
                    </Box>
                    {stagedFiles.length > 0 && (
                        <Group align="end" grow>
                            <Text size="sm" c="dimmed">All staged files will upload to the current folder.</Text>
                        </Group>
                    )}
                    {stagedFiles.length > 0 && (
                        <Box style={{ overflowX: 'auto' }}>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th w={200}>File Name / URL</Table.Th>
                                        <Table.Th w={150}>{t('owner')}</Table.Th>
                                        <Table.Th w={150}>{t('persona')}</Table.Th>
                                        <Table.Th w={150}>{t('content_type')}</Table.Th>
                                        <Table.Th w={150}>{t('status')}</Table.Th>
                                        <Table.Th w={240}>{t('tags')}</Table.Th>
                                        <Table.Th w={150}>{t('date')}</Table.Th>
                                        <Table.Th w={50}></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {stagedFiles.map(staged => (
                                        <Table.Tr key={staged.id}>
                                            <Table.Td>
                                                {staged.uploadType === 'url' ? (
                                                    <Stack gap={4}>
                                                        <TextInput
                                                            placeholder="Name"
                                                            value={staged.name}
                                                            onChange={e => updateStagedFile(staged.id, 'name', e.target.value)}
                                                        />
                                                        <TextInput
                                                            placeholder="URL"
                                                            value={staged.url}
                                                            onChange={e => updateStagedFile(staged.id, 'url', e.target.value)}
                                                        />
                                                    </Stack>
                                                ) : (
                                                    <TextInput
                                                        placeholder="File name"
                                                        value={staged.name}
                                                        onChange={e => updateStagedFile(staged.id, 'name', e.target.value)}
                                                    />
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {persona === 'Admin'
                                                    ? <Select data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)} value={staged.owner} onChange={val => updateStagedFile(staged.id, 'owner', val ?? '')} />
                                                    : <TextInput value={staged.owner} readOnly />}
                                            </Table.Td>
                                            <Table.Td><MultiSelect data={roles.filter(role => role !== 'Admin')}
                                                                   value={staged.persona}
                                                                   onChange={val => updateStagedFile(staged.id, 'persona', val)}
                                                                   disabled={persona !== 'Admin'}/></Table.Td>
                                            <Table.Td><Select data={[t('reference'), t('workflow')]}
                                                              value={staged.content_type}
                                                              onChange={val => updateStagedFile(staged.id, 'content_type', val ?? '')}/></Table.Td>
                                            <Table.Td><Select
                                                data={[t('in_progress'), t('internal_review'), t('client_review'), t('archived'), t('checked_out')]}
                                                value={staged.status}
                                                onChange={val => updateStagedFile(staged.id, 'status', val ?? '')}/></Table.Td>
                                            <Table.Td>
                                                <MultiSelect
                                                    data={getArrayTags()}
                                                    value={staged.jointagscontent}
                                                    onChange={val => updateStagedFile(staged.id, 'jointagscontent', val)}
                                                    searchable
                                                    clearable
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={4}>
                                                    <TextInput type="date" label={t('modified')} size="xs"
                                                               value={staged.date_modified}
                                                               onChange={e => updateStagedFile(staged.id, 'date_modified', e.target.value)}/>
                                                    <TextInput type="date" label={t('expires')} size="xs"
                                                               value={staged.expiration_date}
                                                               onChange={e => updateStagedFile(staged.id, 'expiration_date', e.target.value)}/>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <ActionIcon color="var(--color-neutral-red)"
                                                            onClick={() => removeStagedFile(staged.id)}>
                                                    <IconTrash size={16}/>
                                                </ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Box>
                    )}
                    <Group justify="flex-end" mt="md">
                        {addError && (
                            <ErrorMessage message={addError}/>
                        )}
                        <Button className="invert-hover-outline" onClick={() => {
                            setBulkOpen(false);
                            setAddError('');
                            setStagedFiles([]);
                        }}>✕ {t('cancel')}</Button>
                        <Button onClick={handleBulkAdd} className="invert-hover"
                                disabled={stagedFiles.length === 0}>
                            + {t('submit')} {stagedFiles.length > 0 ? stagedFiles.length : ''} {t('files')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}

export default Documents;
