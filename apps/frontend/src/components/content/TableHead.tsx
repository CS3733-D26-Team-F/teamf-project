import type {ContentForm} from "../interfaces/DocumentsInterfaces.tsx";
import {Checkbox, Group, Table} from "@mantine/core";
import {IconArrowsSort} from "@tabler/icons-react";
import {useTranslation} from "react-i18next";

interface SortThProps {
    field: keyof ContentForm;
    label: string;
    icon: React.ReactNode;
    onToggle: (f: keyof ContentForm) => void;
    currentField: keyof ContentForm | null;
    currentDir: 'asc' | 'desc';
}

interface TableHeadProps {
    onSort: (f: keyof ContentForm) => void;
    currentField: keyof ContentForm | null;
    currentDir: 'asc' | 'desc';
    onSelectAll: () => void;
    allChecked: boolean;
    indeterminate: boolean;
}


function SortTh({ field, label, icon, onToggle, currentField, currentDir }: SortThProps) {
    return (
        <Table.Th onClick={() => onToggle(field)} style={{ cursor: 'pointer' }}>
            <Group gap={4} wrap="nowrap" align="center" style={{ flexDirection: 'row' }}>
                <span>{label}</span>
                <span>{currentField === field ? (currentDir === 'asc' ? '↑' : '↓') : icon}</span>
            </Group>
        </Table.Th>
    );
}

export function TableHead({ onSort, currentField, currentDir, onSelectAll, allChecked, indeterminate }: TableHeadProps) {
    const {t} = useTranslation();
    return (
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={40}><Checkbox checked={allChecked} indeterminate={indeterminate} onChange={onSelectAll} /></Table.Th>
                <SortTh field="name" label= {t('doc_name')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="file_name" label={t('document_type')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="persona" label={t('persona')}icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="owner" label={t('owner')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="folder" label="Folder" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="content_type" label={t('content_type')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="status" label={t('status')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="jointagscontent" label={t('doc_tag')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="date_modified" label={t('date_modified')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="expiration_date" label={t('expiration')} icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <Table.Th>{t('actions')} </Table.Th>
            </Table.Tr>
        </Table.Thead>
    );
}