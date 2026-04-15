import {Group, Badge} from "@mantine/core";

interface PersonaBadgesProps {
    personas: string[];
}

export function PersonaBadges({ personas }: PersonaBadgesProps) {
    return (
        <Group gap={4}>
            {personas.map(p => (
                <Badge
                    key={p}
                    variant="light"
                    color={p === 'Underwriter' ? 'var(--color-sapphire)' : 'var(--color-fresh-sky)'}
                    size="sm"
                >
                    {p}
                </Badge>
            ))}
        </Group>
    );
}