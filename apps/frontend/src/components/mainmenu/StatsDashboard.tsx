import {
    IconFile,
    IconClock,
    IconUserPlus,
    IconArrowDownRight,
} from '@tabler/icons-react';
import { Group, Paper, SimpleGrid, Text, RingProgress } from '@mantine/core';
import classes from './StatsGrid.module.css';
import { useEffect, useState} from "react";
import { useApi } from "../api.ts";
import { DOMAIN } from '../../const';

const icons = {
    user: IconUserPlus,
    clock: IconClock,
    file: IconFile,
    up: IconArrowDownRight,
    down: IconArrowDownRight
};


export function StatsDashboard() {

    const [numFiles, setNumFiles] = useState(0);
    //Number of files for my persona
    const [filesByPersona, setFilesByPersona] = useState({});
    //Of those files # updated last month
    const [updatedFiles, setUpdatedFiles] = useState(0);
    //number files that are owned by user logged in
    const [myOwnedFiles, setMyOwnedFiles] = useState(0);
    //number files that are expiring soon
    const [expiringSoon, setExpiringSoon] = useState(0);
    //number of files of each Documents type
    const[filesByContentType, setFilesByContentType] = useState({});
    //number of files of each status type
    const[filesByStatus, setFilesByStatus] = useState({});

    const api = useApi();

    useEffect(() => {

        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        //get some data from database to calculate with
        const getStatsData= async () => {
            const myPersona = localStorage.getItem('persona');
            if (!myPersona) return;
            const myEmpid = Number(localStorage.getItem('empid'));

            let fileData = []
            //Might need to restrict this to the specified persona later /persona/Underwriter
            //I was thinking an admin might want to know total number of files, rather then just those that match the persona
            const res = await api(`${DOMAIN}/contentforms`);
            fileData = await res.json();

            const myPersonaFiles = [];
            const myPersonaFilesModifiedLastMonth = [];
            const isAdmin = myPersona?.toLowerCase() === "admin";
            for (let i = 0; i < fileData.length; i++) {
                const fileDate = new Date(fileData[i].date_modified);

                const matchesPersona =
                    isAdmin ||
                    fileData[i].persona
                        .map((p:string) => p.toLowerCase())
                        .includes(myPersona.toLowerCase());

                if (matchesPersona) {
                    if (fileDate >= monthAgo) {
                        myPersonaFilesModifiedLastMonth.push(fileData[i]);
                    }
                    myPersonaFiles.push(fileData[i]);
                }
            }

            setNumFiles(myPersonaFiles.length);
            setUpdatedFiles(myPersonaFilesModifiedLastMonth.length);

            //persona specific files
            const personaCount: Record<string, number> = {};

            myPersonaFiles.forEach(f => {
                f.persona.forEach((p:string) => {
                    personaCount[p] = (personaCount[p] || 0) + 1;
                });
            });

            setFilesByPersona(personaCount);

            //expiring files
            const now = new Date();
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(now.getMonth() + 1);
            const expiringWithinNextMonth = myPersonaFiles.filter(f => {
                const exp = new Date(f.expiration_date);
                return exp >= now && exp <= oneMonthLater;
            });
            setExpiringSoon(expiringWithinNextMonth.length);
            //my owned files
            const myFiles = myPersonaFiles.filter(f=> f.empid === myEmpid);
            setMyOwnedFiles(myFiles.length);
            //Documents types
            const contentTypeCount: Record<string, number> ={};
            myPersonaFiles.forEach(f=>{
                const type = f.content_type;
                contentTypeCount[type] = (contentTypeCount[type] || 0) + 1;
            })
            setFilesByContentType(contentTypeCount);

            const statusCount: Record<string, number> = {};

            myPersonaFiles.forEach(f => {
                const status = f.status; // <-- make sure this matches your backend field
                statusCount[status] = (statusCount[status] || 0) + 1;
            });

            setFilesByStatus(statusCount);
            console.log("statusCount:", statusCount);
        };
        getStatsData();
    }, []);

    //persona ring
    const personaRingSections = Object.entries(filesByPersona as Record<string, number>).map(([persona, count], index) => ({
        persona,
        count,
        value: numFiles > 0 ? (count / numFiles) * 100 : 0,
        color: ['var(--sapphire)', 'var(--fresh-sky)'][index % 2],
        tooltip: `${persona}: ${count} files`
    }));

    //Documents ring types
    const ringSections = Object.entries(filesByContentType as Record<string, number>).map(([type, count], index) => ({
        type,
        count,
        value: numFiles > 0 ? (count / numFiles) * 100 : 0,
        color: ['var(--yale-blue)', 'var(--fresh-sky)'][index % 2],
        tooltip: `${type}: ${count} files`
    }));

    const statusRingSections = Object.entries(filesByStatus as Record<string, number>).map(([status, count], index) => ({
        status,
        count,
        value: numFiles > 0 ? (count / numFiles) * 100 : 0,
        color: ['var(--pale-sky', 'var(--fresh-sky)', 'var(--yale-blue)', 'var(--sapphire)', 'var(--neutral-red)', 'var(--light-gray)'][index % 6],
        tooltip: `${status}: ${count} files`
    }));

    const data = [
        {
            title: 'Updated within the last month',
            icon: 'clock',
            value: updatedFiles.toString(),
            progress: numFiles > 0 ? (updatedFiles / numFiles) * 100 : 0,
            color: 'blue',
        },
        {
            title: 'My Files',
            icon: 'file',
            value: myOwnedFiles.toString(),
            progress: numFiles > 0 ? (myOwnedFiles / numFiles) * 100 : 0,
            color: 'var(--fresh-sky-light)'
        },
        {
            title: 'Persona Files Expiring Soon',
            icon: 'clock',
            value: expiringSoon.toString(),
            progress: numFiles > 0 ? (expiringSoon / numFiles) * 100 : 0,
            color: 'var(--neutral-red)'
        }
    ] as const;


    const stats = data.map((stat) => {
        const Icon = icons[stat.icon];

        return (
            <Paper withBorder p="md" radius="md" key={stat.title}>
                <Group justify="space-between">
                    <Text size="xs" c="dimmed" className={classes.title}>
                        {stat.title}
                    </Text>
                    <Icon className={classes.icon} size={22} stroke={1.5} />
                </Group>
                <Group justify="space-between" align="center" mt={20}>
                    <div>
                        <Text className={classes.value}>{stat.value}</Text>
                        <Text fz="sm" c="dimmed">
                            files
                        </Text>
                    </div>

                    <RingProgress
                        size={55}
                        thickness={6}
                        sections={[{ value: stat.progress, color: stat.color }]}
                    />


                </Group>
            </Paper>
        );
    });
    return (
        <div className={classes.root}>
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
                <Paper withBorder p="md" radius="md" style={{ height: '100%' }}>
                    <Text size="xs" c="dimmed" fw='bold'>
                        MY PERSONA FILES
                    </Text>

                    <Group align="flex-start" justify="center" mt="md" gap="xl">
                        <RingProgress
                            size={55}
                            thickness={6}
                            sections={personaRingSections}
                        />

                        <div>
                            {personaRingSections.map((section, index) => (
                                <Group key={index} gap="xs" mb={4}>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 4,
                                            backgroundColor: section.color
                                        }}
                                    />
                                    <Text size="sm">
                                        {section.persona} — {section.count} files
                                    </Text>
                                </Group>
                            ))}
                        </div>
                    </Group>
                </Paper>
                {stats}</SimpleGrid>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="xl">
                <Paper withBorder p="md" radius="md"  style={{ height: '100%'}} >
                    <Text fw={700} size="lg" mb="md">
                        Content Types
                    </Text>
                    <Group align="flex-start" justify="center" mt="md">
                        <RingProgress
                            size={220}
                            thickness={20}
                            sections={ringSections}
                        />
                        <div>
                            {ringSections.map((section, index) => (
                                <Group key={index} gap="xs" mb={4}>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 4,
                                            backgroundColor: section.color
                                        }}
                                    />
                                    <Text size="sm">
                                        {section.type} — {section.count} files
                                    </Text>
                                </Group>
                            ))}
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md" style={{ height: '100%' }} >
                    <Text fw={700} size="lg" mb="md">
                        Document Statuses
                    </Text>
                    <Group align="flex-start" justify="center" mt="md" gap="xl">
                        <RingProgress
                            size={220}
                            thickness={20}
                            sections={statusRingSections}
                        />
                        <div>
                            {statusRingSections.map((section, index) => (
                                <Group key={index} gap="xs" mb={4}>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 4,
                                            backgroundColor: section.color
                                        }}
                                    />
                                    <Text size="sm">
                                        {section.status} — {section.count} files
                                    </Text>
                                </Group>
                            ))}
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>
        </div>
    );
}
