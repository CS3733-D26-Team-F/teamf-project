import {useEffect, useMemo, useState} from 'react';
import {Paper, Loader, Center, Text} from '@mantine/core';
import { Heatmap } from '@mantine/charts';
import dayjs from 'dayjs';
import { useApi } from "../api.ts";
import { DOMAIN } from '../../const';

export function HeatMap() {
    const [HeatmapData, setHeatmapData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const api = useApi();

    //6 month window
    const { startDate, endDate } = useMemo(() => ({
        startDate: dayjs().subtract(6, 'month').toDate(),
        endDate: dayjs().toDate()
    }), []);

    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                const res = await api(`${DOMAIN}/contentforms`);
                const fileData = await res.json();

                const dateCounts: Record<string, number> = {};

                fileData.forEach((file: any) => {
                    const dateStr = dayjs(file.date_modified).format('YYYY-MM-DD');
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                });

                setHeatmapData(dateCounts);
            } catch (error) {
                console.error("Failed to fetch heatmap data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmapData();
    }, []);

    if (loading) {
        return (
            <Paper withBorder p="xl" radius="md">
                <Center><Loader size="sm" /></Center>
            </Paper>
        );
    }
    return (
        <div style={{
            width: '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1rem',
            boxSizing: 'border-box'
        }}>
            <Paper p="md" radius="md" w="100%" >
                <Text fw={700} size="md" mb="md">
                    Activity over the Past 6 months
                </Text>
                <Heatmap
                    data={HeatmapData}
                    startDate={startDate}
                    endDate={endDate}
                    colors={[
                        'var(--pale-sky)',
                        'var(--fresh-sky)',
                        'var(--sapphire)',
                        'var(--yale-blue)',
                    ]}
                    getRectProps={({ value }) =>
                        value === null || value === 0
                            ? { fill: '#D3D3D3' }
                            : {}
                    }
                    rectSize={16}
                    withTooltip
                    withMonthLabels
                    getTooltipLabel={({ date, value }) =>
                        `${dayjs(date).format('DD MMM, YYYY')} – ${value === null || value === 0 ? 'No contributions' : `${value} contribution${value > 1 ? 's' : ''}`}`
                    }/>
            </Paper>
        </div>
    );
}