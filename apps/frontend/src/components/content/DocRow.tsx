import type {ContentForm, RowCallbacks} from "../interfaces/DocumentsInterfaces.tsx";
import {getFileType} from "./Functions.tsx";
import React from 'react';
import {ActionIcon, Badge, Box, Checkbox, Group, Table, Tooltip, Menu} from "@mantine/core";
import {PersonaBadges} from "../Badges/PersonaBadge.tsx";
import {StatusBadge} from "../Badges/StatusBadge.tsx";
import {TagBadges} from "../Badges/TagBadges.tsx";
import {
    IconDownload,
    IconEdit,
    IconExternalLink,
    IconLockOpen,
    IconStar,
    IconStarFilled,
    IconTrash,
    IconLock,
    IconFolder
    ,IconDotsVertical
} from "@tabler/icons-react";
import {useTranslation} from "react-i18next";

interface DocRowProps extends RowCallbacks {
    doc: ContentForm;
    isSelected: boolean;
    onSelect: (id: number) => void;
    currentUsername: string;
    isCheckedOut: boolean;
    checkedOutBy: string | null;
    onCheckOut: (id: number) => void;
    onCheckIn: (id: number) => void;
    isDropped: boolean;
    onDrop: (id: number) => void;
    dropdownViewMode: 'dropdown' | 'popup';
}

function TxtDropdown({url}: { url: string }) {
    const [text, setText] = React.useState<string>(' Loading... ');

    React.useEffect(() => {
        fetch(url)
            .then(res => res.text())
            .then(setText)
            .catch(() => setText(' Unable to load file'));
    }, [url]);

    return (
        <pre style={{whiteSpace: "nowrap", wordBreak: 'break-word', maxHeight: "400px", overflowY: "auto"}}>
            {text}
        </pre>
    );
}

export function DocRow({
                           doc,
                           isSelected,
                           persona,
                           onSelect,
                           onView,
                           onFavorite,
                           onFolderClick,
                           isFavorited,
                           onDownload,
                        onEdit,
                        onDelete,
                        onRequestMove,
                        onRemoveFromFolder,
                           isCheckedOut,
                           checkedOutBy,
                           currentUsername,
                           onCheckOut,
                           onCheckIn,
                           isDropped,
                           onDrop,
                           dropdownViewMode

                       }: DocRowProps) {

    const {t} = useTranslation();
    const isAdmin = persona === 'Admin';
    const canModify = isAdmin || doc.persona.includes(persona ?? '');
    const isUrl = getFileType(doc.url) === 'Link';

    const normalizedCurrentUsername = (currentUsername ?? '').trim().toLowerCase();
    const normalizedCheckedOutBy = (checkedOutBy ?? '').trim().toLowerCase();

    const isSelfCheckout = isCheckedOut && normalizedCheckedOutBy !== '' && normalizedCheckedOutBy === normalizedCurrentUsername;
    const isSomeoneCheckout = isCheckedOut && normalizedCheckedOutBy !== '' && normalizedCheckedOutBy !== normalizedCurrentUsername;

    const isLockedForUser = isSomeoneCheckout && !isAdmin;
    const canEdit = canModify && (isSelfCheckout || (isAdmin && !isCheckedOut));

    return (
        <>
            <Table.Tr
                style={{
                    cursor: 'pointer',
                    opacity: isSomeoneCheckout ? 0.7 : 1,
                    backgroundColor: isLockedForUser ? 'var(--mantine-color-gray-1)' : undefined,
                }}
                onClick={() => {
                    if (dropdownViewMode === 'dropdown') {
                        if (isUrl || getFileType(doc.url).toLowerCase() === 'link') {
                            window.open(doc.url, '_blank');
                        } else {
                            onDrop(doc.id);
                        }
                    } else {
                        onView(doc.url, doc.name, doc.id, isUrl);
                    }
                }}
            >
                <Table.Td onClick={e => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onSelect(doc.id)}
                        disabled={isLockedForUser}
                    />
                </Table.Td>
                <Table.Td fw={500}>{doc.name}</Table.Td>
                <Table.Td>{getFileType(doc.url)}</Table.Td>
                <Table.Td>
                    <PersonaBadges personas={doc.persona}/>
                </Table.Td>
                <Table.Td>{doc.owner}</Table.Td>
                <Table.Td onClick={e => e.stopPropagation()}>
                    {doc.folder_id !== null ? (
                        <Badge
                            variant="light"
                            color="grape"
                            style={{cursor: 'pointer'}}
                            leftSection={<IconFolder size={12}/>}
                            onClick={() => onFolderClick(doc.folder_id)}
                        >
                            {doc.folder || 'Folder'}
                        </Badge>
                    ) : (
                        '-'
                    )}
                </Table.Td>
                <Table.Td>{doc.content_type}</Table.Td>
                <Table.Td><StatusBadge status={doc.status} size="sm" filter={false}/> </Table.Td>
                <Table.Td><TagBadges tags={doc.jointagscontent}/> </Table.Td>
                <Table.Td>{doc.date_modified?.split('T')[0]}</Table.Td>
                <Table.Td>{doc.expiration_date?.split('T')[0]}</Table.Td>
                <Table.Td onClick={e => e.stopPropagation()}>
                    <Group gap="xs">
                        {isLockedForUser ? (
                            <Tooltip label={`${t('checkout_message')} ${checkedOutBy}`}>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    style={{cursor: 'default'}}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <IconLock size={16}/>
                                </ActionIcon>
                            </Tooltip>
                        ) : (
                            <>
                                <Tooltip label={isFavorited(doc.id) ? t('unfavorite') : t('favorite')}>
                                    <ActionIcon variant="subtle" color="yellow" onClick={() => onFavorite(doc)}>
                                        {isFavorited(doc.id) ? <IconStarFilled size={16}/> : <IconStar size={16}/>}
                                    </ActionIcon>
                                </Tooltip>

                                <Tooltip label={isUrl ? t('open_url') : t('download')}>
                                    {isUrl ? (
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => window.open(doc.url, '_blank')}
                                        >
                                            <IconExternalLink size={16}/>
                                        </ActionIcon>
                                    ) : (
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => onDownload(doc.url, doc.name)}
                                        >
                                            <IconDownload size={16}/>
                                        </ActionIcon>
                                    )}
                                </Tooltip>

                                {doc.folder_id !== null && (
                                    <Tooltip label={`Open folder: ${doc.folder || 'Folder'}`}>
                                        <ActionIcon
                                            variant="subtle"
                                            color="indigo"
                                            onClick={e => {
                                                e.stopPropagation();
                                                onFolderClick(doc.folder_id);
                                            }}
                                        >
                                            <IconFolder size={16}/>
                                        </ActionIcon>
                                    </Tooltip>
                                )}

                                {canModify && (
                                    <Tooltip
                                        label={canEdit ? t('edit') : (isAdmin && isSomeoneCheckout ? t('force_checkin_long')  : t('force_checkout'))}>
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => canEdit && onEdit(doc)}
                                            color={canEdit ? undefined : "gray"}
                                            style={{
                                                opacity: canEdit ? 1 : 0.4,
                                                cursor: canEdit ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            <IconEdit size={16}/>
                                        </ActionIcon>
                                    </Tooltip>
                                )}

                                {canModify && (
                                    <Tooltip label={
                                        isSelfCheckout
                                            ? t('click_to_checkin')
                                            : (isSomeoneCheckout && isAdmin)
                                                ? `Force check-in (Checked out by ${checkedOutBy})`
                                                : t('checkout')
                                    }>
                                        <ActionIcon
                                            variant="subtle"
                                            color={isSomeoneCheckout && isAdmin ? "red" : "blue"}
                                            onClick={() => (isSelfCheckout || (isSomeoneCheckout && isAdmin)) ? onCheckIn(doc.id) : onCheckOut(doc.id)}
                                        >
                                            {isSelfCheckout ? <IconLockOpen size={16}/> : <IconLock size={16}/>} 
                                        </ActionIcon>
                                    </Tooltip>
                                )}

                                {canModify && (
                                    <Tooltip
                                        label={canEdit ? t('delete') : (isAdmin && isSomeoneCheckout ? t('force_checkin_delete') : t('checkout_delete'))}>
                                        <ActionIcon
                                            variant="subtle"
                                            color={canEdit ? "var(--color-neutral-red)" : "gray"}
                                            onClick={() => canEdit && onDelete(doc.id)}
                                            style={{
                                                opacity: canEdit ? 1 : 0.4,
                                                cursor: canEdit ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            <IconTrash size={16}/>
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </>
                        )}
                                {/* 3-dots menu for move actions */}
                                <Menu withinPortal>
                                    <Tooltip label={t('relocate')}>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" onClick={e => e.stopPropagation()}>
                                            <IconDotsVertical size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    </Tooltip>
                                    <Menu.Dropdown>
                                        <Menu.Item onClick={(e) => { e.stopPropagation(); onRequestMove && onRequestMove(doc.id); }}>
                                            {t('move_to_folder')}
                                        </Menu.Item>
                                        {doc.folder_id !== null && (
                                            <Menu.Item onClick={(e) => { e.stopPropagation(); onRemoveFromFolder && onRemoveFromFolder(doc.id); }}>
                                                {t('remove_from_folder')}
                                            </Menu.Item>
                                        )}
                                    </Menu.Dropdown>
                                </Menu>
                    </Group>
                </Table.Td>
            </Table.Tr>

            {dropdownViewMode === 'dropdown' && isDropped && (
                <Table.Tr>
                    <Table.Td colSpan={12}>
                        <Box p="md">
                            {getFileType(doc.url).toLowerCase() === 'pdf' && (
                                <iframe src={doc.url} width="100%" height="600px" style={{border: 'none'}}/>
                            )}
                            {['png', 'jpg', 'jpeg'].includes(getFileType(doc.url).toLowerCase()) && (
                                <img src={doc.url} alt={doc.name} style={{maxWidth: '100%'}}/>
                            )}
                            {getFileType(doc.url).toLowerCase() === 'txt' && (
                                <TxtDropdown url={doc.url}/>
                            )}
                            {['mp4'].includes(getFileType(doc.url).toLowerCase()) && (
                                <video src={doc.url} controls width="100%"/>
                            )}
                            {['mp3'].includes(getFileType(doc.url).toLowerCase()) && (
                                <audio src={doc.url} controls/>
                            )}
                            {['doc', 'docx', 'xls', 'xlsx', 'pptx'].includes(getFileType(doc.url).toLowerCase()) && (
                                <Box>
                                    <Group justify="space-between" mb="xs" p="xs"
                                           style={{background: 'var(--color-light-gray)', borderRadius: 4}}>
                                        <Group gap="xs">
                                            <Tooltip label="Download">
                                                <ActionIcon variant="subtle"
                                                            onClick={() => window.open(doc.url, '_blank')}>
                                                    <IconDownload size={16}/>
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Open in new tab">
                                                <ActionIcon variant="subtle"
                                                            onClick={() => window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc.url)}`, '_blank')}>
                                                    <IconExternalLink size={16}/>
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                    <iframe
                                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(doc.url)}`}
                                        width="100%"
                                        height="600px"
                                        style={{border: 'none'}}/>
                                </Box>
                            )}
                        </Box>
                    </Table.Td>
                </Table.Tr>
            )}
        </>
    );
}
