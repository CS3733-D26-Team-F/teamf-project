import type {ContentForm, RowCallbacks} from "../interfaces/DocumentsInterfaces.tsx";
import {getFileType} from "./Functions.tsx";
import {ActionIcon, Checkbox, Group, Table, Tooltip} from "@mantine/core";
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
} from "@tabler/icons-react";

interface DocRowProps extends RowCallbacks {
    doc: ContentForm;
    isSelected: boolean;
    onSelect: (id: number) => void;
    currentUsername: string;
    isCheckedOut: boolean;
    checkedOutBy: string | null;
    onCheckOut: (id: number) => void;
    onCheckIn: (id: number) => void;
}

export function DocRow({
                           doc,
                           isSelected,
                           persona,
                           onSelect,
                           onView,
                           onFavorite,
                           isFavorited,
                           onDownload,
                           onEdit,
                           onDelete,
                           isCheckedOut,
                           checkedOutBy,
                           currentUsername,
                           onCheckOut,
                           onCheckIn
                       }: DocRowProps) {

    const isAdmin = persona === 'Admin';
    const canModify = isAdmin || doc.persona.includes(persona ?? '');
    const isUrl = getFileType(doc.url) === 'Link';

    const isSelfCheckout = isCheckedOut && checkedOutBy === currentUsername;
    const isSomeoneCheckout = isCheckedOut && checkedOutBy !== currentUsername;

    const isLockedForUser = isSomeoneCheckout && !isAdmin;

    const canEdit = canModify && (isSelfCheckout || (isAdmin && !isCheckedOut));

    return (
        <Table.Tr style={{
            cursor: 'pointer',
            backgroundColor: isLockedForUser ? 'var(--mantine-color-gray-1)' : undefined,
        }} onClick={() => onView(doc.url, doc.name, doc.id, isUrl)}>
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
            <Table.Td>{doc.content_type}</Table.Td>
            <Table.Td><StatusBadge status={doc.status} size="sm" filter={false} /> </Table.Td>
            <Table.Td><TagBadges tags={doc.jointagscontent}/> </Table.Td>
            <Table.Td>{doc.date_modified?.split('T')[0]}</Table.Td>
            <Table.Td>{doc.review_date?.split('T')[0]}</Table.Td>
            <Table.Td>{doc.expiration_date?.split('T')[0]}</Table.Td>
            <Table.Td onClick={e => e.stopPropagation()}>
                <Group gap="xs">
                    {isLockedForUser ? (
                        <Tooltip label={`This document is checked out by ${checkedOutBy}`}>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                style={{ cursor: 'default' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <IconLock size={16}/>
                            </ActionIcon>
                        </Tooltip>
                    ) : (
                        <>
                            <Tooltip label={isFavorited(doc.id) ? 'Unfavorite' : 'Favorite'}>
                                <ActionIcon variant="subtle" color="yellow" onClick={() => onFavorite(doc)}>
                                    {isFavorited(doc.id) ? <IconStarFilled size={16}/> : <IconStar size={16}/>}
                                </ActionIcon>
                            </Tooltip>

                            <Tooltip label={isUrl ? "Open URL" : "Download"}>
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

                            {canModify && (
                                <Tooltip label={canEdit ? "Edit" : (isAdmin && isSomeoneCheckout ? "Force check-in first to edit" : "Check out to edit")}>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => canEdit && onEdit(doc)}
                                        color={canEdit ? undefined : "gray"}
                                        style={{ opacity: canEdit ? 1 : 0.4, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                    >
                                        <IconEdit size={16}/>
                                    </ActionIcon>
                                </Tooltip>
                            )}

                            {canModify && (
                                <Tooltip label={
                                    isSelfCheckout ? 'Click to checkin' :
                                        (isSomeoneCheckout && isAdmin) ? `Force check-in (Checked out by ${checkedOutBy})` :
                                            'Checkout'
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
                                <Tooltip label={canEdit ? "Delete" : (isAdmin && isSomeoneCheckout ? "Force check-in first to delete" : "Check out to delete")}>
                                    <ActionIcon
                                        variant="subtle"
                                        color={canEdit ? "var(--color-neutral-red)" : "gray"}
                                        onClick={() => canEdit && onDelete(doc.id)}
                                        style={{ opacity: canEdit ? 1 : 0.4, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                    >
                                        <IconTrash size={16}/>
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}