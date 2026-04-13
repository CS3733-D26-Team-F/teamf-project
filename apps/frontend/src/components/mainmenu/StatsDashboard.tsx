import {
    IconFile,
    IconClock,
    IconUserPlus,
} from '@tabler/icons-react';
import { Group, Paper, SimpleGrid, Text } from '@mantine/core';
import classes from './StatsGrid.module.css';
import {useEffect, useState} from "react";

const icons = {
    user: IconUserPlus,
    clock: IconClock,
    file: IconFile,
};

//Moved to after stats are defined so it can include them
/*
const data = [
    { title: 'Revenue', icon: 'receipt', value: '13,456', diff: 34 },
    { title: 'Profit', icon: 'coin', value: '4,145', diff: -13 },
    { title: 'Coupons usage', icon: 'discount', value: '745', diff: 18 },
    { title: 'New customers', icon: 'user', value: '188', diff: -30 },
] as const;
*/

export function StatsDashboard() {
    //calculate some stats to show

    //Number of files for my persona
    const [numFiles, setNumFiles] = useState(0);
    //Of those files # updated last month
    const [updatedFiles, setUpdatedFiles] = useState(0);
    //number files that are owned by user logged in
    const [myOwnedFiles, setMyOwnedFiles] = useState(0);
    //number files that are expiring soon
    const [expiringSoon, setExpiringSoon] = useState(0);
    //number of files of each type
    const [filesByContentType, setFilesByContentType] = useState({});

    console.log(numFiles);
    console.log(updatedFiles);

    useEffect(() => {
        //current date
        //const currentDate: Date = new Date();
        //1 month ago
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        //get some data from database to calculate with
        const getStatsData= async () => {
            const myPersona = localStorage.getItem('persona');
            const myEmpid = Number(localStorage.getItem('empid'));

            let fileData = []
            //Might need to restrict this to the specified persona later /persona/Underwriter
            //I was thinking an admin might want to know total number of files, rather then just those that match the persona
            const res = await fetch(`http://localhost:3000/contentforms`);
            fileData = await res.json();

            //currently just number of files that match myPersona
            //Split up more as we get a better idea of what to display
            //Alternatively if we don't want to display more this can be optimized
            const myPersonaFiles = [];
            const myPersonaFilesModifiedLastMonth = [];
            const isAdmin = myPersona?.toLowerCase() === "admin";
            for (let i = 0; i < fileData.length; i++) {
                const fileDate = new Date(fileData[i].date_modified);
                console.log("content type:", fileData[i].content_type);
                const matchesPersona =
                    isAdmin ||
                    fileData[i].persona
                        .map(p => p.toLowerCase())
                        .includes(myPersona.toLowerCase());

                if (matchesPersona) {
                    if (fileDate >= monthAgo) {
                        myPersonaFilesModifiedLastMonth.push(fileData[i]);
                    }
                    myPersonaFiles.push(fileData[i]);
                }
            }
            //Save the results to usable constants
            setNumFiles(myPersonaFiles.length);
            setUpdatedFiles(myPersonaFilesModifiedLastMonth.length);
            setUpdatedFiles(myPersonaFilesModifiedLastMonth.length);

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
            console.log("localStorage owner:", myEmpid);
            const myFiles = myPersonaFiles.filter(f=> f.empid === myEmpid);
            setMyOwnedFiles(myFiles.length);
            //////STOPPPED HERE
            const contentTypeCount = {};
            myFiles.forEach(f=>{

                const type = f.content_type;
                contentTypeCount[type] = (contentTypeCount[type] || 0) + 1;
            });
            console.log("contentTypeCounts:", contentTypeCount);
            setFilesByContentType(contentTypeCount);

        };
        getStatsData();
    }, []);

    const contentTypeStats = Object.entries(filesByContentType).map(([type, count]) => ({
        title: `${type} Files`,
        icon: 'receipt',
        value: count.toString(),
        diff: 0
    }));

    const data = [
        { title: 'My Persona Files', icon: 'file', value: numFiles.toString() },
        { title: 'Updated within the last month', icon: 'clock', value: updatedFiles.toString() },
        { title: 'My Files', icon: 'file', value: myOwnedFiles.toString() },
        { title: 'Expiring Soon', icon: 'clock', value: expiringSoon.toString() },
        ...contentTypeStats
    ] as const;

    const stats = data.map((stat) => {
        const Icon = icons[stat.icon];
        //const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

        return (
            <Paper withBorder p="md" radius="md" key={stat.title}>
                <Group justify="space-between">
                    <Text size="xs" c="dimmed" className={classes.title}>
                        {stat.title}
                    </Text>
                    <Icon className={classes.icon} size={22} stroke={1.5} />
                </Group>

                <Group align="flex-end" gap="xs" mt={25}>
                    <Text className={classes.value}>{stat.value}</Text>
                    {/*<Text c={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={classes.diff}>
                        <span>{stat.diff}%</span>
                        <DiffIcon size={16} stroke={1.5} />
                    </Text>*/}
                </Group>

                <Text fz="sm" c="dimmed" mt={7}>
                    files
                </Text>
            </Paper>
        );
    });
    return (
        <div className={classes.root}>
            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>{stats}</SimpleGrid>
        </div>
    );
}
