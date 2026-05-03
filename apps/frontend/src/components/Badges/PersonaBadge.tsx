import {Group, Badge} from "@mantine/core";
import {useTranslation} from "react-i18next";
import {personaMap} from "../ManageEmployees/personas.tsx";

interface PersonaBadgesProps {
    personas: string[];
}

export function PersonaBadges({ personas }: PersonaBadgesProps) {
    const {t} = useTranslation();
    if (!Array.isArray(personas) || personas.length === 0) {
        return null;
    }

    return (
        <Group gap={4}>
            {personas.map(p => (
                <Badge
                    key={p}
                    variant="light"
                    color={
                        p === 'Underwriter' ? 'var(--color-underwriter)' :
                        p === 'Business Analyst' ?'var(--color-businessAnalyst)' :
                        p === 'Actuarial Analyst' ? 'var(--color-actuarialAnalyst)' :
                        p === 'EXL Operations' ? 'var(--color-exlOperations)' :
                        'var(color-neutral-red)'}
                    size="sm"
                >
                    {t (personaMap[p] ?? p)}
                </Badge>
            ))}
        </Group>
    );
}