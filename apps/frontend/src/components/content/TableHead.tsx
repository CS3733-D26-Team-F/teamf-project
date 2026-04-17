import type {ContentForm} from "../interfaces/DocumentsInterfaces.tsx";
import {Checkbox, Group, Table} from "@mantine/core";
import {IconArrowsSort} from "@tabler/icons-react";

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
    return (
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={40}><Checkbox checked={allChecked} indeterminate={indeterminate} onChange={onSelectAll} /></Table.Th>
                <SortTh field="name" label="Document Name" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="file_name" label="Document Type" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="persona" label="Persona" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="owner" label="Owner" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="content_type" label="Content Type" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="status" label="Status" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="date_modified" label="Date Modified" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <SortTh field="expiration_date" label="Expiration" icon={<IconArrowsSort stroke={1} size={16}/>} onToggle={onSort} currentField={currentField} currentDir={currentDir} />
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
        </Table.Thead>
    );
}