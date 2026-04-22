import type {ContentForm, RowCallbacks} from "../interfaces/DocumentsInterfaces.tsx";
import {getFileType} from "./Functions.tsx";
import {DocThumbnail} from "./DocThumbnail.tsx";
import {ActionIcon, Badge, Checkbox, Group, Text} from "@mantine/core";
import {IconDownload, IconEdit, IconStar, IconStarFilled, IconTrash} from "@tabler/icons-react";
import {PersonaBadges} from "../Badges/PersonaBadge.tsx";
import {StatusBadge} from "../Badges/StatusBadge.tsx";
import {FileTypeBadge} from "../Badges/FileTypeBadge.tsx";
import {TagBadges} from "../Badges/TagBadges.tsx";

interface DocCardProps extends RowCallbacks {
    doc: ContentForm;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

export function DocCard({ doc, isSelected, persona, onSelect, onView, onFavorite, onDownload, onDelete, onEdit, isFavorited }: DocCardProps) {
    const canModify = persona === 'Admin' || doc.persona.includes(persona ?? '');
    const isUrl = getFileType(doc.url) === 'Link';
    return (
        <div
            style={{
                position: 'relative', background: 'white', borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)', cursor: 'pointer',
                transition: 'box-shadow 0.15s', overflow: 'hidden',
                border: isSelected ? '2px solid var(--color-fresh-sky, #3b82f6)' : '2px solid transparent',
            }}
            onClick={() => onView(doc.url, doc.name, doc.id, isUrl)}
        >
            <DocThumbnail url={doc.url} />

            <div style={{ position: 'absolute', top: 8, left: 8 }} onClick={e => e.stopPropagation()}>
                <Checkbox checked={isSelected} onChange={() => onSelect(doc.id)} />
            </div>
            <div style={{ position: 'absolute', top: 6, right: 6 }} onClick={e => e.stopPropagation()}>
                <ActionIcon variant="filled" color={isFavorited(doc.id) ? 'yellow' : 'gray'} size="sm" onClick={() => onFavorite(doc)}>
                    {isFavorited(doc.id) ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                </ActionIcon>
            </div>

            <div style={{ padding: '10px 12px 8px' }}>
                <Text fw={700} size="sm" mb={2} style={{ color: 'var(--color-yale-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                </Text>
                <Text size="xs" c="dimmed" mb={4}>{doc.owner}</Text>
                <Group gap={4} mb={4}>
                    <PersonaBadges personas={doc.persona} />
                    <StatusBadge status={doc.status} size="xs" filter={false} />
                    <FileTypeBadge fileType={getFileType(doc.url)} size="xs"/>
                    <TagBadges tags={doc.jointagscontent} />
                    {doc.folder && (
                        <Badge variant="outline" color="gray" size="xs">
                            Folder: {doc.folder}
                        </Badge>
                    )}
                </Group>
                <Group mt={6} gap="xs" onClick={e => e.stopPropagation()}>
                    <ActionIcon variant="subtle" size="sm" onClick={() => onDownload(doc.url, doc.name)}><IconDownload size={14} /></ActionIcon>
                    {canModify && <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(doc)}><IconEdit size={14} /></ActionIcon>}
                    {canModify && <ActionIcon variant="subtle" color="var(--color-neutral-red)" size="sm" onClick={() => onDelete(doc.id)}><IconTrash size={14} /></ActionIcon>}
                </Group>
            </div>
        </div>
    );
}