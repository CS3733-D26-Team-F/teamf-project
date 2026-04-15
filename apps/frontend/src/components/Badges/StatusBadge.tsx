import {Badge} from "@mantine/core";

interface StatusBadgesProps {
    status: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    filter?: boolean;
    onRemove?: () => void;
}

const statusColors: Record<string, string> = {
    'In Progress': 'var(--color-sapphire',
    'Internal Review': 'var(--color-yale-blue)',
    'Client Review': 'blue',
    'Approved': 'var(--color-fresh-sky)',
    'Expired': 'var(--color-neutral-red)',
    'Archived': 'gray',
};

export function StatusBadge(props: StatusBadgesProps) {
    const color = statusColors[props.status] ?? 'gray';

    if (props.filter) {
        return (
            <Badge
                color={color}
                variant="light"
                size={props.size}
                style={{ cursor: 'pointer' }}
                onClick={props.onRemove}
            >
                Status: {props.status} ×
            </Badge>
        );
    }

    return (
        <Badge color={color} variant="light" size={props.size}>
            {props.status}
        </Badge>
    );
}