import { Grid, Stack } from '@mantine/core';
import { AreaChart } from './AreaChart.tsx';
import { HeatMap } from './HeatMap.tsx';
import { ToDoList } from './ToDoList.tsx';

export function ChartGrid() {
    return (
        <div style={{ width: '100%', padding: '16px' }}>
            <Grid m={10}>
                <Grid.Col span={{ base: 12, sm: 7 }}>
                    <AreaChart />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 5 }}>
                    <Stack gap="md">
                        <HeatMap />
                        <ToDoList />
                    </Stack>
                </Grid.Col>
            </Grid>
        </div>
    );
}
