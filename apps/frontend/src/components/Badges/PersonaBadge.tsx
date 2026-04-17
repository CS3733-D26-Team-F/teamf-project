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
                    color={
                        p === 'Underwriter' ? 'var(--color-sapphire)' :
                        p === 'Business Analyst' ?'var(--color-fresh-sky)' :
                        p === 'Actuarial Analyst' ? 'var(--color-sapphire-light)' :
                        p === 'EXL Operations' ? 'var(--color-fresh-sky-light)' :
                        'var(color-neutral-red)'}
                    size="sm"
                >
                    {p}
                </Badge>
            ))}
        </Group>
    );
}