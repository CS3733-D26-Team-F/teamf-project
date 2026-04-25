import { Card, Image, Text } from '@mantine/core';

interface CreditsBadgesProps {
    tool: string;
    description: string;
    url: string;
    logo: string;
}

export function CreditCard({ tool, description, url, logo }: CreditsBadgesProps) {
    return (
        <>
            <Card
                shadow="sm"
                padding="xl"
                component="a"
                href={url}
                target="_blank"
            >
                <Card.Section>
                    <Image
                        src={logo}
                        h={160}
                        w={220}
                        alt="Image Unavailable"
                    />
                </Card.Section>

                <Text fw={500} size="lg" mt="md">
                    {tool}
                </Text>

                <Text mt="xs" c="dimmed" size="sm">
                    {description}
                </Text>
            </Card>
        </>
    )
}