import {Group, Badge} from "@mantine/core";

interface checkOutBadgesProps {
    isChecked: string[];
}


export function checkOutBadges({isChecked}: checkOutBadgesProps) {
    return (
        <Group gap={3}>
            {isChecked.map(p => (
                <Badge
                    key={p}
                    variant="light"
                    color={
                            p === 'Available' ? 'var(--color-fresh-sky)' :
                                p === 'CheckedOut' ? 'var(--color-fresh-sky)' :
                                    'var(color-neutral-purple)'}
                    size="sm"
                >
                    {p}
                </Badge>
            ))}
        </Group>
    );
}