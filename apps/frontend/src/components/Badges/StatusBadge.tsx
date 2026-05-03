import {Badge} from "@mantine/core";
import {useTranslation} from "react-i18next";

interface StatusBadgesProps {
    status: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    filter?: boolean;
    onRemove?: () => void;
}

const statusColors: Record<string, string> = {
    'In Progress': 'var(--color-sapphire)',
    'Internal Review': 'var(--color-yale-blue)',
    'Client Review': 'blue',
    'Approved': 'var(--color-fresh-sky)',
    'Expired': 'var(--color-neutral-red)',
    'Archived': 'gray',
};

export function StatusBadge(props: StatusBadgesProps) {
    const color = statusColors[props.status] ?? 'gray';
    const {t} = useTranslation();

    function translateStatus() {
        let statusTranslation = props.status
        if (statusTranslation == "In Progress") {
            statusTranslation = t('in_progress')
        } else if (statusTranslation == "Internal Review") {
            statusTranslation = t('internal_review')
        } else if (statusTranslation == "Client Review") {
            statusTranslation = t('client_review')
        } else if (statusTranslation == "Approved") {
            statusTranslation = t('approved')
        }
        return statusTranslation;
    }

    if (props.filter) {
        return (
            <Badge
                color={color}
                variant="light"
                size={props.size}
                style={{ cursor: 'pointer' }}
                onClick={props.onRemove}
            >
                {t("status")}: {translateStatus()} ×
            </Badge>
        );
    }

    return (
        <Badge color={color} variant="light" size={props.size}>
            {translateStatus()}
        </Badge>
    );
}
