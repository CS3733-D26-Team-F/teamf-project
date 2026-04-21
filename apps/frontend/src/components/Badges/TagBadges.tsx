import {Group, Badge} from "@mantine/core";

interface TagBadgesProps {
    tags: string[];
}

export function TagBadges({ tags }: TagBadgesProps) {
    if (tags != null) {
        return (
            <Group gap={4}>
                {tags.map(p => (
                    <Badge
                        key={p}
                        variant="light"
                        color={'var(--color-fresh-sky)'}
                        size="sm"
                    >
                        {p}
                    </Badge>
                ))}
            </Group>
        );
    }
    else {
        return (
            <></>
        );
    }
}