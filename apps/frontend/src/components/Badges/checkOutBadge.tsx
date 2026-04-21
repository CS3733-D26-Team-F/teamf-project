import {Group, Badge} from "@mantine/core";

interface checkOutBadgesProps {
    isChecked: string[];
}


export function checkOutBadges({isChecked}: checkOutBadgesProps) {
    return (
        <Group gap={2}>
            {isChecked.map(p => (
                <Badge
                    key={p}
                    variant="light"
                    color={
                            p === 'available' ? 'var(--color-fresh-sky)' :
                                p === 'checked_out' ? 'var(--color-fresh-sky)' :
                                    'var(color-neutral-purple)'}
                    size="sm"
                >
                    {p}
                </Badge>
            ))}
        </Group>
    );
}