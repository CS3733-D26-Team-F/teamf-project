import '@mantine/core/styles.css';
import {useEffect, useState, useRef, useMemo} from "react";
import * as pdfjs from 'pdfjs-dist';
import {Header} from "../components/Header";
import {AccessDenied} from "../components/AccessDenied.tsx";
import {
    TextInput, Button, Modal, Select, MultiSelect, Group, Text,
    Badge, Stack, Box, Table, Checkbox, ActionIcon,
    Tooltip, SegmentedControl, Accordion
} from '@mantine/core';
import {
    IconSearch, IconTrash,
    IconFilter, IconClock, IconWindowMaximize
} from '@tabler/icons-react';
import {IconLayoutBottombar} from "@tabler/icons-react"
import DocViewer, {DocViewerRenderers} from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import {DOMAIN} from '../const.ts';
import {ViewToggle} from "../components/content/ViewToggle.tsx"
import {PageTitle} from "../components/Title.tsx"
import {PersonaBadges} from "../components/Badges/PersonaBadge.tsx";
import {StatusBadge} from "../components/Badges/StatusBadge.tsx"
import {FileTypeBadge} from "../components/Badges/FileTypeBadge.tsx";
import {checkOutBadges} from "../components/Badges/checkOutBadge.tsx";
import {ConfirmModal} from "../components/content/ConfirmModal"
import {useApi} from "../../src/components/api.ts";
import type {
    RowCallbacks
    , StagedFile, ContentForm, Employee, Metatag
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

export function Documents() {
    const roles = allPersonas

    const api = useApi();
    const username = localStorage.getItem('username');
    const today = new Date().toISOString().split('T')[0];

    // Auth0 Persona State
    const [persona, setPersona] = useState<string | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const [documents, setDocuments] = useState<ContentForm[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [createdTags, setCreatedTags] = useState<Metatag[]>([]);

    const [selectedFavIds, setSelectedFavIds] = useState<number[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [filterPersona, setFilterPersona] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterOwner, setFilterOwner] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterCheckout, setFilterCheckout] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);

    const activeFilterCount = filterPersona.length + filterStatus.length + filterType.length + filterOwner.length + filterTags.length + filterCheckout.length;

    const [sortField, setSortField] = useState<keyof ContentForm | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [favSortField, setFavSortField] = useState<keyof ContentForm | null>(null);
    const [favSortDir, setFavSortDir] = useState<'asc' | 'desc'>('asc');

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerLabel, setViewerLabel] = useState('');
    const [inlineDropdownId, setInlineDropdownId] = useState<number | null>(null);
    const [dropdownViewMode, setDropdownViewMode] = useState<'dropdown' | 'popup'>('dropdown');

    const toggleDropdown = (id: number) => {
        console.log('toggleExpand called:', id);
        setInlineDropdownId(prev => prev === id ? null : id);
    };


    // translator
    const {t} = useTranslation();

    // Explicit Checkout/in set up
    const [checkedOutMap, setCheckedOutMap] = useState<Record<number, string>>({});

    // Checkout/Checkin explicit + filter

    const checkOutHandle = async (id: number) => {
        const username = localStorage.getItem('username');
        const res = await api(`${DOMAIN}/contentforms/${id}/checkout`, {
            method: "POST",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username})
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

    // ─────────────────────────────────────────────────────────────────────────

    const [addOpen, setAddOpen] = useState(false);
    const [addData, setAddData] = useState({
        name: '',
        owner: persona === 'Admin' ? '' : username ?? '',
        persona: persona !== 'Admin' ? [persona ?? ''] : [],
        date_modified: today,
        expiration_date: '',
        content_type: '',
        status: '',
        jointagscontent: []
    });
    const [bulkOpen, setBulkOpen] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [addError, setAddError] = useState<string>('');
    const [editError, setEditError] = useState<string>('');

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
            date_modified: today,
            expiration_date: ''
        }));
        setStagedFiles(prev => [...prev, ...newStaged]);
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
            date_modified: today,
            expiration_date: ''
        }]);
    }

    const [addFile, setAddFile] = useState<File | null>(null);
    const [addUrl, setAddUrl] = useState<string>('');
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editData, setEditData] = useState({
        name: '',
        owner: '',
        persona: [] as string[],
        date_modified: today,
        expiration_date: '',
        content_type: '',
        status: '',
        jointagscontent: []
    });
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editUrl, setEditUrl] = useState<string>('');
    const [editUploadMode, setEditUploadMode] = useState<'file' | 'url'>('file');

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

    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

    const [advancedTagsOpen, setAdvancedTagsOpen] = useState(false);

    // Fetch Auth0 Persona
    useEffect(() => {
        api(`${DOMAIN}/api/auth/me`
        )
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
        // Auto-expire documents on page load
        api(
            `${DOMAIN}/contentforms/autoexpire`
            , {method: 'PATCH'})
            .catch(() => {
            }); // silently ignore if endpoint doesn't exist yet
        loadDocuments();
        api(
            `${DOMAIN}/employees`)
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

    // checkall
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
        setTrashDocs(data);
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

    function loadDocuments() {
        api(`${DOMAIN}/contentforms`)
            .then(res => res.json())
            .then(data => {
                const flat: ContentForm[] = Array.isArray(data) ? data :
                    [...(data.Underwriter ?? []), ...(data.BusinessAnalyst ?? []), ...(data.ActuarialAnalyst ?? []), ...(data.EXLOperations ?? [])];

                //Also load docuemnt tags
                for (const doc of flat) {
                    api(`${DOMAIN}/grabformtags/${doc.name}`)
                        .then(res => res.json())
                        .then(tagData => {
                            //const tags = tagData.data;
                            if (tagData.data.length > 0) {
                                //Tags are id and tag_name, we only want name
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

    //To display tags in multi select they have to be a list of strings
    //So take the list of tags with id and name and get just the name
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
        () => [...new Set(documents.map(d => getFileType(d.url)))].sort(),
        [documents]
    );

    const filtered = useMemo(() => {
        let result = documents.filter(d => d.status !== 'Expired' && d.status !== 'Archived');
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
    }, [search, filterPersona, filterStatus, filterType, filterOwner, filterCheckout, documents, sortField, sortDir, persona, filterTags, checkedOutMap]);

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

    const allSelected = selectedIds.length === nonFavorites.length && nonFavorites.length > 0;
    const allFavSelected = selectedFavIds.length === sortedFavorites.length && sortedFavorites.length > 0;
    const anySelected = selectedIds.length > 0 || selectedFavIds.length > 0;
    const selectedCount = selectedIds.length + selectedFavIds.length;
    const selectedHasFavorites = [...selectedIds, ...selectedFavIds].some(id => favoritedIds.has(id));
    const selectedHasNonFavorites = [...selectedIds, ...selectedFavIds].some(id => documents.find(d => d.id === id && !favoritedIds.has(d.id)));

    async function handleAdd() {
        const formPayload = new FormData();
        formPayload.append('filename', addData.name);
        formPayload.append('ownerUsername', addData.owner);
        formPayload.append('persona', JSON.stringify(addData.persona));
        formPayload.append('date_modified', addData.date_modified);
        formPayload.append('expiration_date', addData.expiration_date);
        formPayload.append('review_date', "");
        formPayload.append('content_type', addData.content_type);
        formPayload.append('status', addData.status);

        if (addFile) {
            formPayload.append('file', addFile);
        } else {
            formPayload.append('url', normalizeUrl(addUrl));
        }
        try {
            await api(`${DOMAIN}/contentforms`, {method: 'POST', body: formPayload});
            setAddOpen(false);
            setAddFile(null);
            setAddUrl('');
            //add any tags to the file before closing add
            if (addData.jointagscontent.length > 0) {
                //get Document id for the just created doc
                const flat = await api(`${DOMAIN}/contentforms`)
                    .then(res => res.json())
                    .then(data => {
                        const newFlat: ContentForm[] = Array.isArray(data) ? data :
                            [...(data.Underwriter ?? []), ...(data.BusinessAnalyst ?? []), ...(data.ActuarialAnalyst ?? []), ...(data.EXLOperations ?? [])];
                        return newFlat;
                    });
                let docID = 0;
                for (const doc of flat) {
                    if (doc.name === addData.name) {
                        docID = doc.id;
                    }
                }
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
                        body: JSON.stringify({id: docID, metid: tagID})
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
                jointagscontent: []
            });
            loadDocuments();
        } catch (err: any) {
            console.log('err.status:', err.status);
            console.log('err.message:', err.message);
            console.log('err.body:', err.body);
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
            alert('Please upload at least one file or URL.');
            return;
        }

        const missingData = stagedFiles.some(sf => !sf.name || !sf.owner || !sf.persona || !sf.date_modified || !sf.content_type || !sf.status || !sf.expiration_date || !sf.review_date);
        if (missingData) {
            alert('Please fill in all fields for every entry.');
            return;
        }

        for (const sf of stagedFiles) {
            try {
                const formPayload = new FormData();
                formPayload.append('filename', sf.name);
                formPayload.append('ownerUsername', sf.owner);
                formPayload.append('persona', JSON.stringify(sf.persona));
                formPayload.append('date_modified', sf.date_modified);
                formPayload.append('expiration_date', sf.expiration_date);
                formPayload.append('review_date', sf.review_date);
                formPayload.append('status', sf.status);
                formPayload.append('content_type', sf.content_type);

                if (sf.uploadType === 'file' && sf.file) {
                    formPayload.append('file', sf.file);
                } else {
                    formPayload.append('url', normalizeUrl(sf.url));
                }

                await api(`${DOMAIN}/contentforms`, { method: 'POST', body: formPayload });
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
        loadDocuments();
    }

    async function handleSaveClick() {
        const expiration = new Date(editData.expiration_date);
        const review = new Date(editData.review_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if ((expiration < today && editData.status !== 'Expired') || (expiration > today && editData.status === 'Expired') || (review < today)) {
            return;
        }

        setConfirmSaveOpen(true);
    }

    function openEdit(doc: ContentForm) {
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
                    date_modified: today,
                    expiration_date: doc.expiration_date?.split('T')[0] ?? '',
                    content_type: doc.content_type,
                    status: doc.status,
                    jointagscontent: doc.jointagscontent
                });
                setEditOpen(true);
            });
    }

    async function handleEdit() {
        if (!editId) return;
        try {
            if (editFile) {
                const formPayload = new FormData();
                formPayload.append('name', editData.name);
                formPayload.append('ownerUsername', editData.owner);
                formPayload.append('persona', JSON.stringify(editData.persona));
                formPayload.append('date_modified', editData.date_modified);
                formPayload.append('expiration_date', editData.expiration_date);
                formPayload.append('review_date', "");
                formPayload.append('content_type', editData.content_type);
                formPayload.append('status', editData.status);
                formPayload.append('file', editFile);
                await api(`${DOMAIN}/contentforms/${editId}`, {method: 'PUT', body: formPayload});
            } else if (editUploadMode === 'url' && editUrl) {
                await api(`${DOMAIN}/contentforms/${editId}`, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({...editData, url: normalizeUrl(editUrl)})
                });
            } else {
                await api(`${DOMAIN}/contentforms/${editId}`, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(editData)
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

        //get Document id for what we are editing
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
                            //Tags are id and tag_name, we only want name
                            for (const tag of tagData.data) {
                                docTags.push(tag.tag_name)
                            }
                        }

                    });
            }
        }
        //make sure jointagscontent is not undefined
        const toEdit: string[] = (editData.jointagscontent ?? []);

        //sets are faster
        const wantedTags = new Set(toEdit)
        const currentTags = new Set(docTags);

        //Find what tags to remove
        const tagsToRemove = docTags.filter(tag => !wantedTags.has(tag));
        //Find what tags to add
        const tagsToAdd = toEdit.filter(tag => !currentTags.has(tag));

        //add needed tags
        for (const tagToAdd of tagsToAdd) {
            let tagID = 0;
            for (const tag of createdTags) {
                if (tag.tag_name === tagToAdd) {
                    tagID = tag.metid;
                }
            }
            await api(`${DOMAIN}/assigntag`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: docID, metid: tagID})
            });
        }

        //remove needed tags
        for (const tagToRemove of tagsToRemove) {
            let tagID = 0;
            for (const tag of createdTags) {
                if (tag.tag_name === tagToRemove) {
                    tagID = tag.metid;
                }
            }
            await api(`${DOMAIN}/unassigntag`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: docID, metid: tagID})
            });
        }

        //Check file back in
        await api(`${DOMAIN}/contentforms/${editId}/checkin`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username})
        });
        setEditFile(null);
        setConfirmSaveOpen(false);
        setEditOpen(false);
        setEditError('');
        loadDocuments();
    }


    function closeEdit() {
        if (editId) api(`${DOMAIN}/contentforms/${editId}/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username})
        });
        setEditOpen(false);
        setEditUrl('');
        setEditUploadMode('file');
        setEditError('');
        if (editId) api(`${DOMAIN}/contentforms/${editId}/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username})
        });
        setEditOpen(false);
        setEditUrl('');
        setEditUploadMode('file');
        setEditError('');
    }

    function closeEdit() {
        if (editId) api(`${DOMAIN}/contentforms/${editId}/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username})
        });
        setEditOpen(false);
        setEditUrl('');
        setEditUploadMode('file');
    }

    async function handleDelete() {
        if (!deleteId) return;
        await api(`${DOMAIN}/contentforms/${deleteId}/softdelete`, {method: 'PATCH'});
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
            body: JSON.stringify({username, formname: doc.name})
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
        // If it's explicitly a web URL or pickRenderer says to open externally, open in new tab
        if (isUrl || !pickRenderer(url)) {
            recordView(id);
            window.open(url, '_blank');
            return;
        }
        // Otherwise, open in modal viewer (has an inline renderer)
        recordView(id);
        setViewerUrl(url);
        setViewerLabel(label);
    }

    const rowCallbacks: RowCallbacks = {
        persona,
        onView: openViewer,
        onFavorite: toggleFavorite,
        onDownload: downloadFile,
        onEdit: openEdit,
        onDelete: (id: number) => {
            setDeleteId(id);
            setDeleteOpen(true);
        },
        isFavorited: (id: number) => favoritedIds.has(id),
    };

    const recentDocs = recentIds
        .map(id => documents.find(d => d.id === id))
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

    function contentTable(documentsToDisplay: ContentForm[]) {
        return (
            <Box>
                <Table highlightOnHover withTableBorder withColumnBorders>
                    <TableHead onSort={toggleSort} currentField={sortField} currentDir={sortDir}
                               onSelectAll={() => allSelected ? setSelectedIds([]) : setSelectedIds(nonFavorites.map(d => d.id))}
                               allChecked={allSelected}
                               indeterminate={selectedIds.length > 0 && !allSelected}/>
                    <Table.Tbody>
                        {documentsToDisplay.map(doc => <DocRow key={doc.id} doc={doc}
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


                                                               {...rowCallbacks} />)}
                    </Table.Tbody>
                </Table>
            </Box>
        )
    }

    function personaAccordion(givenPersona: string) {
        const existingDocuments = nonFavorites.filter(doc => doc.persona.some(p => givenPersona.includes(p)))
        if (existingDocuments.length == 0) {
            return (
                <>
                </>
            );
        }
        return (
            <>
                <Accordion.Item value={givenPersona} key={givenPersona}>
                    <Accordion.Control aria-label={givenPersona}>
                        <Text fw={700} size="sm" c="dimmed" mb="xs">{t(`${givenPersona} Documents`)}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        {contentTable(existingDocuments)}
                    </Accordion.Panel>
                </Accordion.Item>
            </>
        );
    }

    const favoriteAccordion = (
        <>
            {sortedFavorites.length > 0 && !(filterCheckout.includes('checked out') && filterCheckout.includes('available')) && (
                <Accordion.Item value={"favorites"} key={"favorites"}>
                    <Accordion.Control aria-label={"favorites"}>
                        <Text fw={700} size="sm" c="yellow" mb="xs">{t('favorites')}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Box>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                                <TableHead onSort={toggleFavSort} currentField={favSortField}
                                           currentDir={favSortDir}
                                           onSelectAll={() => allFavSelected ? setSelectedFavIds([]) : setSelectedFavIds(sortedFavorites.map(d => d.id))}
                                           allChecked={allFavSelected}
                                           indeterminate={selectedFavIds.length > 0 && !allFavSelected}/>
                                <Table.Tbody>
                                    {sortedFavorites.map(doc => <DocRow key={doc.id} doc={doc}
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
                                                                        {...rowCallbacks} />)}
                                </Table.Tbody>
                            </Table>
                        </Box>
                    </Accordion.Panel>
                </Accordion.Item>
            )}
        </>
    )

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
                                            <IconWindowMaximize size={16}/>
                                            <span>Dropdown</span>
                                        </Group>
                                    ),
                                    value: 'dropdown'
                                },
                                {
                                    label: (
                                        <Group gap={4} wrap="nowrap" justify="center">
                                            <IconLayoutBottombar size={16}/>
                                            <span>Popup</span>
                                        </Group>
                                    ),
                                    value: 'popup',
                                },
                            ]}
                        />
                    </Group>
                </Group>
                <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
                    <Group gap="sm">
                        {persona !== null && (
                            <>
                                <FilledButton leftSection="plus" onClick={() => setAddOpen(true)}>
                                    {t('add_doc')}
                                </FilledButton>
                                <FilledButton leftSection="plus" onClick={() => setBulkOpen(true)}>
                                    {t('bulk_doc')}
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
                            status={v}
                            filter
                            onRemove={() => setFilterStatus(p => p.filter(x => x !== v))}
                        />)}
                        {filterType.map(v => <Badge key={v} variant="filled" color="violet"
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => setFilterType(p => p.filter(x => x !== v))}>{t('type')}: {v} ×</Badge>)}
                        {filterOwner.map(v => <Badge key={v} variant="filled" color="teal"
                                                     style={{cursor: 'pointer'}}
                                                     onClick={() => setFilterOwner(p => p.filter(x => x !== v))}>Owner: {v} ×</Badge>)}
                        {filterTags.map(v => <Badge key={v} variant="filled" color="cyan"
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => setFilterOwner(p => p.filter(x => x !== v))}>{t('owner')}: {v} ×</Badge>)}
                        {filterCheckout.map(v => <Badge key={v} variant="filled" color="indigo"
                                                        style={{cursor: 'pointer'}}
                                                        onClick={() => setFilterCheckout(p => p.filter(x => x !== v))}> {t('checkout_status')}: {v === 'checked out' ? t('checked_out') : t('available')} ×
                        </Badge>)}
                        <Badge variant="outline" style={{cursor: 'pointer'}} onClick={() => {
                            setFilterPersona([]);
                            setFilterStatus([]);
                            setFilterType([]);
                            setFilterOwner([]);
                            setFilterCheckout([]);
                            setFilterTags([]);
                        }}>Clear all</Badge>
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
                {/* ─────────────────────────────────────────────────────────── */}

                {/* list view */}
                {viewMode === 'list' && (
                    <Stack gap="lg">
                        {!search ?
                            <Accordion multiple defaultValue={["favorites", persona]}>
                                {favoriteAccordion}
                                {[persona, ...allPersonas.filter(p => p != persona)].map(p => personaAccordion(p))}
                            </Accordion>
                            :
                            <>
                                <Text fw={700} size="sm" c="dimmed" mb="xs">{t("all_doc")}</Text>
                                {contentTable(filtered)}
                            </>
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
                            }}>D{t('deselect_all')}</Button>
                            <Button className="invert-hover" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    const doc = documents.find(d => d.id === id);
                                    if (doc) {
                                        await downloadFile(doc.url, doc.name);
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                    }
                                }
                            }}>{t('download_all')}</Button>
                            <Button className="invert-hover" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    await checkOutHandle(id);
                                }
                            }}> {t('checkout_selected')}</Button>
                            <Button className="invert-hover" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                for (const id of ids) {
                                    await checkInHandle(id)
                                }
                                ;
                            }}> {t('checkin_selected')} </Button>
                            {selectedHasNonFavorites &&
                                <Button className="invert-hover" onClick={favoriteSelected}>★ Favorite All</Button>}
                            {selectedHasFavorites &&
                                <Button className="invert-hover" onClick={unfavoriteSelected}>☆ Unfavorite
                                    All</Button>}
                            <Button className="invert-hover-red" onClick={async () => {
                                const ids = [...selectedIds, ...selectedFavIds];
                                if (!window.confirm(`Delete ${ids.length} documents?`)) return;
                                await Promise.all(ids.map(id => api(`${DOMAIN}/contentforms/${id}/softdelete`, {method: 'PATCH'})));
                                setSelectedIds([]);
                                setSelectedFavIds([]);
                                loadDocuments();
                            }}>Delete Selected</Button>
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

            {/* filter modal */}
            <Modal opened={filterOpen} onClose={() => setFilterOpen(false)} title={t('filter_documents')}>
                <Stack>
                    <MultiSelect label={t('persona')} placeholder={t('all_persona')} value={filterPersona}
                                 onChange={setFilterPersona} data={roles} clearable/>
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
                                 data={[{
                                     value: 'available',
                                     label: t('available')
                                 }, {value: 'checked out', label: t('checked_out')},]}
                                 clearable/>
                    <MultiSelect label="Content Tags" placeholder="Any Tags" value={filterTags}
                                 onChange={setFilterTags} data={getArrayTags()}
                                 clearable/>
                    <Group justify="flex-end">
                        <Button className="invert-hover-outline" onClick={() => {
                            setFilterPersona([]);
                            setFilterStatus([]);
                            setFilterType([]);
                            setFilterOwner([]);
                            setFilterCheckout([]);
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
                    {filteredTrash.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">No deleted documents.</Text>
                    ) : (
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
                                                    Owner: {doc.owner} ·
                                                    Deleted: {doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString() : 'Unknown'}
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
                                                    onClick={() => permanentDelete(doc.id)}>Delete
                                                Permanently</Button>
                                        </Group>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
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
                                 data={roles.filter((role) => role !== 'Admin')}
                                 disabled={persona !== 'Admin'}/>
                    <Group preventGrowOverflow={false}>
                        <MultiSelect w="75%" label="Tags" value={addData.jointagscontent}
                                     onChange={val => setAddData({...addData, jointagscontent: (val ?? [])})}
                                     data={getArrayTags()}/>
                        <Button className="invert-hover" style={{width: '20%', padding: '0 0px'}}
                                onClick={() => setAdvancedTagsOpen(true)}> Advanced Tags </Button>
                    </Group>
                    <Text fw={600} mt="sm">{t('life_cycle')}</Text>
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
                    <Group justify="flex-end" mt="md">
                        {addError && (
                            <ErrorMessage message={addError}/>
                        )}
                        <Button className="invert-hover-outline" onClick={() => {
                            setAddOpen(false);
                            setAddError('');
                        }}>✕ Cancel Changes</Button>
                        <Button onClick={handleAdd} className="invert-hover">+ Submit Document</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* edit modal */}
            <Modal opened={editOpen} onClose={closeEdit} title={t('edit_doc')} size="lg">
                <Stack>
                    <Text fw={600}>{t('document_details')}</Text>
                    <TextInput label="Name of Document" value={editData.name}
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
                                <Text size="xs" c="dimmed" mt={2}> {t('edit_message')}</Text>
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
                        {editError && (
                            <ErrorMessage message={editError}/>
                        )}
                        <Button className="invert-hover-outline" onClick={closeEdit}>✕ Cancel Changes</Button>
                        <Button onClick={handleSaveClick} className="invert-hover">✓ Save Changes</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Advanced tag management (create and delete) tags modal */}
            <Modal opened={advancedTagsOpen} onClose={() => setAdvancedTagsOpen(false)}
                   title="Advanced Tag Management"
                   size="lg">
                <Stack>
                    <ManageTags allTags={getArrayTags()}/>
                    <Group justify="flex-end" mt="md">
                        <Button className="invert-hover-outline" onClick={() => {
                            setAdvancedTagsOpen(false);
                            loadTags();
                        }}> Done </Button>
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

            {/* bulk upload modal */}
            <Modal opened={bulkOpen} onClose={() => { setBulkOpen(false); setStagedFiles([]);
            }} title={t('bulk_doc')} size="1200px">
                <Stack>
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Add Files or URLs</Text>
                        <Group>
                            <input
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                id="bulk-file-input"
                                onChange={e => { handleBulkFileSelect(Array.from(e.target.files ?? [])); e.target.value = ''; }}
                            />
                            <Button variant="outline" size="xs" onClick={() => document.getElementById('bulk-file-input')?.click()}>+ Add Files</Button>
                            <Button variant="outline" size="xs" onClick={addStagedUrl}>+ Add URL</Button>
                        </Group>
                    </Box>
                    {stagedFiles.length > 0 && (
                        <Box style={{ overflowX: 'auto' }}>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th w={200}>File Name / URL</Table.Th>
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
                                            <Table.Td>
                                                {staged.uploadType === 'url'
                                                    ? <Stack gap={4}>
                                                        <TextInput placeholder="Document name" value={staged.name} onChange={e => updateStagedFile(staged.id, 'name', e.target.value)} />
                                                        <TextInput placeholder="https://example.com" value={staged.url} onChange={e => updateStagedFile(staged.id, 'url', e.target.value)} />
                                                    </Stack>
                                                    : <TextInput value={staged.name} onChange={e => updateStagedFile(staged.id, 'name', e.target.value)} />
                                                }
                                            </Table.Td>
                                            <Table.Td>
                                                {persona === 'Admin'
                                                    ? <Select data={employees.filter(e => e.persona !== 'Admin').map(e => e.username)} value={staged.owner} onChange={val => updateStagedFile(staged.id, 'owner', val ?? '')} />
                                                    : <TextInput value={staged.owner} readOnly />}
                                            </Table.Td>
                                            <Table.Td>
                                                <MultiSelect data={roles} value={staged.persona} onChange={val => updateStagedFile(staged.id, 'persona', val)} disabled={persona !== 'Admin'} />
                                            </Table.Td>
                                            <Table.Td>
                                                <Select data={['Reference', 'Workflow']} value={staged.content_type} onChange={val => updateStagedFile(staged.id, 'content_type', val ?? '')} />
                                            </Table.Td>
                                            <Table.Td>
                                                <Select data={['In Progress', 'Internal Review', 'Client Review', 'Approved', 'Expired', 'Archived']} value={staged.status} onChange={val => updateStagedFile(staged.id, 'status', val ?? '')} />
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
                                                <ActionIcon color="var(--color-neutral-red)" onClick={() => removeStagedFile(staged.id)}><IconTrash size={16} /></ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Box>
                    )}
                    <Group justify="flex-end" mt="md">
                        <Button className="invert-hover-outline" onClick={() => { setBulkOpen(false);setAddError(''); setStagedFiles([]); }}>✕ {t('cancel')}</Button>
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