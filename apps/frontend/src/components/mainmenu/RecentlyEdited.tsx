import { useEffect, useState } from 'react';
import { DOMAIN } from '../../const';
import { useApi } from "../api.ts";
import dayjs from "dayjs";
import {Group, Text, Paper} from "@mantine/core";
import {IconClock} from "@tabler/icons-react";
import {getFileType} from "../content/Functions.tsx";
import {FileTypeBadge} from "../Badges/FileTypeBadge.tsx";
import {PersonaBadges} from "../Badges/PersonaBadge.tsx";

type myFile = {
    id: number;
    name: string;
    url: string;
    persona: string[];
    empid: number;
    date_modified: string;
    content_type: string;
    status: string;
};
export function RecentlyEdited(){
    const [files, setFiles] = useState<myFile[]>([]);
    const api = useApi();

    useEffect(() => {
        const load = async () => {
            const myEmpid = Number(localStorage.getItem("empid"));
            if (!myEmpid) return;

            const res = await api(`${DOMAIN}/contentforms`);
            const data:myFile[] = await res.json();

            const myFiles = data.filter(f => f.empid === myEmpid);

            const sorted = [...myFiles]
                .sort((a, b) => new Date(b.date_modified).getTime() - new Date(a.date_modified).getTime())
                .slice(0, 5);

            setFiles(sorted);
        };

        load();
    }, [api]);

    return (
        <>
            {files.length > 0 && (
                <Paper
                    withBorder
                    radius="md"
                    p="md"
                    style={{
                        width: "50%",
                        marginLeft: "auto",
                        marginRight: 20,
                        marginTop: 20
                    }}
                >
                    <Group gap={6} mb="xs">
                        <IconClock size={14} color="gray" />
                        <Text fw={700} size="sm" c="dimmed">Recently Edited</Text>
                    </Group>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {files.map(doc => (
                            <Paper
                                withBorder
                                radius="md"
                                p="md"
                                key={doc.id}
                                onClick={() => window.open(doc.url, "_blank")}
                                style={{ cursor: "pointer" }}
                            >
                                <Group justify="space-between">
                                    <Text fw={600} size="sm">{doc.name}</Text>
                                    <Text size="sm" c="dimmed">
                                        {dayjs(doc.date_modified).format("MMM D, YYYY")}
                                    </Text>
                                </Group>

                                <Group mt="xs">
                                    <FileTypeBadge fileType={getFileType(doc.url)} size="sm" />
                                    <PersonaBadges personas={doc.persona} />
                                </Group>
                            </Paper>
                        ))}
                    </div>
                </Paper>
            )}
        </>
    );

}

