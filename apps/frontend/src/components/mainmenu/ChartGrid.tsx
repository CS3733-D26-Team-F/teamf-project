import {Container, Grid, Paper, Stack} from '@mantine/core';
import { AreaChart } from './AreaChart.tsx';
import { HeatMap } from './HeatMap.tsx'
import { ToDoList } from './ToDoList.tsx';

const PRIMARY_COL_HEIGHT = '600px';

export function ChartGrid() {
    const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;

    return (
        <Container size="xl" my="xl">
            <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 7 }}>
                    <Paper withBorder height={PRIMARY_COL_HEIGHT} style={{ width: '100%', overflow: 'hidden' }}>
                        <AreaChart />
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 5 }}>
                    <Stack gap="md">
                        <Paper withBorder height={SECONDARY_COL_HEIGHT} style={{ overflow: 'hidden' }}>
                            <HeatMap />
                        </Paper>
                        <Paper withBorder height={SECONDARY_COL_HEIGHT} style={{ padding: '2rem' }}>
                            <ToDoList />
                        </Paper>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
}