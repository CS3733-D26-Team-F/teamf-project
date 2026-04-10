import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconCoin,
    IconDiscount2,
    IconReceipt2,
    IconUserPlus,
} from '@tabler/icons-react';
import { Group, Paper, SimpleGrid, Text } from '@mantine/core';
import classes from './StatsGrid.module.css';
import {useEffect, useState} from "react";

const icons = {
    user: IconUserPlus,
    discount: IconDiscount2,
    receipt: IconReceipt2,
    coin: IconCoin,
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

    useEffect(() => {
        //current date
        //const currentDate: Date = new Date();
        //1 month ago
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        //get some data from database to calculate with
        const getStatsData= async () => {
            const myPersona = localStorage.getItem('persona');

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
            for (let i = 0; i < fileData.length; i++) {
                const fileDate = new Date(fileData[i].date_modified);
                //proof that date >= <= works if you want to check logs
                //console.log("Modified: "+fileDate+"\n Month:"+monthAgo+"\n Now:"+currentDate+"\n "+(monthAgo>=currentDate));
                if (await fileData[i].persona === myPersona) {
                    if (fileDate>=monthAgo) {
                        myPersonaFilesModifiedLastMonth.push(fileData[i]);
                    }
                    myPersonaFiles.push(fileData[i]);
                }
            }
            //Save the results to usable constants
            setNumFiles(myPersonaFiles.length);
            setUpdatedFiles(myPersonaFilesModifiedLastMonth.length);

        };
        getStatsData();
    }, []);

    const data = [
        { title: 'Revenue', icon: 'receipt', value: '13,456', diff: 34 },
        { title: 'Profit', icon: 'coin', value: '4,145', diff: -13 },
        { title: 'Coupons usage', icon: 'discount', value: '745', diff: 18 },
        { title: 'New customers', icon: 'user', value: '188', diff: -30 },
    ] as const;

    const stats = data.map((stat) => {
        const Icon = icons[stat.icon];
        const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;

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
                    <Text c={stat.diff > 0 ? 'teal' : 'red'} fz="sm" fw={500} className={classes.diff}>
                        <span>{stat.diff}%</span>
                        <DiffIcon size={16} stroke={1.5} />
                    </Text>
                </Group>

                <Text fz="xs" c="dimmed" mt={7}>
                    Compared to previous month
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