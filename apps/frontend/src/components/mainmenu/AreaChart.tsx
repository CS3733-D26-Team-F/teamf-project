import { AreaChart as MantineAreaChart } from '@mantine/charts';
import { useEffect, useState } from "react";
import { DOMAIN } from "../../const.ts";
import { useApi } from "../api.ts";
import {Paper, Text} from '@mantine/core';

export function AreaChart() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [numFiles, setNumFiles] = useState(0);
    const api = useApi();

    useEffect(() => {
        const getStatsData = async () => {
            const myPersona = localStorage.getItem('persona');
            const myEmpid = Number(localStorage.getItem('empid'));
            if (!myPersona || !myEmpid) return;

            const res = await api(`${DOMAIN}/contentforms`);
            const fileData = await res.json();

            const myOwnedFilesList = fileData.filter((file: any) =>
                Number(file.empid) === myEmpid
            );

            const lastSevenDays: Record<string, any> = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateString = d.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'numeric',
                    day: 'numeric'
                });
                lastSevenDays[dateString] = { date: dateString, Updated: 0 };
            }

            myOwnedFilesList.forEach((file: any) => {
                const fileDate = new Date(file.date_modified);
                const dateKey = fileDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'numeric',
                    day: 'numeric'
                });

                if (lastSevenDays[dateKey]) {
                    lastSevenDays[dateKey].Updated += 1;
                }
            });

            setChartData(Object.values(lastSevenDays));
            setNumFiles(myOwnedFilesList.length);
        };

        getStatsData();
    }, []);

    return (
        <div
            style={{
                height: '70vh',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
                <Paper withBorder p="md" radius="md" style={{ height: '100%', width:'90%' }}>
                    <Text fw={700} size="lg" mb="md">
                        My Updated Files
                    </Text>
                        <MantineAreaChart
                            h={400}
                            data={chartData}
                            dataKey="date"
                            series={[{ name: 'Updated', color: 'blue.6', label: 'Files Updated' }]}
                            curveType="monotone"
                            tickLine="y"
                            gridAxis="xy"
                        />
                </Paper>
        </div>
    );
}
