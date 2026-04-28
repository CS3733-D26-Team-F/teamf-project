import { AreaChart } from '../components/mainmenu/AreaChart.tsx';
import { HeatMap } from '../components/mainmenu/HeatMap.tsx';
import { ToDoList } from '../components/mainmenu/ToDoList.tsx';
import { StatsDashboard } from '../components/mainmenu/StatsDashboard.tsx';
import { Calendar } from "../components/mainmenu/Calendar.tsx";
import { Card } from "@mantine/core";
import { EditButton } from "../components/dashboard/EditButton.tsx";
import { useEffect, useState } from "react";
import { Header } from "../components/Header.tsx";
import { DOMAIN } from "../const.ts";
import { useApi } from "../components/api.ts";

const ALL_WIDGETS = {
    todo: { label: 'To-Do List', component: <ToDoList /> },
    stats: { label: 'Stats Grid', component: <StatsDashboard /> },
    areachart: { label: 'Area Chart', component: <AreaChart /> },
    heatmap: { label: 'Heat Map', component: <HeatMap /> },
    calendar: { label: 'Calendar', component: <Calendar /> },
};

const DEFAULT_LAYOUTS = {
    "Admin": ['stats', 'todo'],
    "Underwriter": ['todo', 'calendar'],
    "Business Analyst": ['stats', 'todo', 'calendar'],
    "Actuarial Analyst": ['stats'],
    "EXL Operations": ['todo', 'calendar', 'stats']
};

export function Dashboard() {
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const api = useApi();
    const persona = localStorage.getItem('persona');
    const name = localStorage.getItem('username');

    useEffect(() => {
        const getDashboard = async () => {
            if (!name) return;

            try {
                const res = await api(`${DOMAIN}/getWidgets?username=${name}`);
                const savedLayout = await res.json();

                if (Array.isArray(savedLayout) && savedLayout.length > 0) {
                    setActiveWidgets(savedLayout);
                } else if (persona && DEFAULT_LAYOUTS[persona]) {
                    setActiveWidgets(DEFAULT_LAYOUTS[persona]);
                }
            } catch (err) {
                console.error("API failed, falling back to defaults:", err);
                if (persona && DEFAULT_LAYOUTS[persona]) {
                    setActiveWidgets(DEFAULT_LAYOUTS[persona]);
                } else {
                    setActiveWidgets(['todo']);
                }
            }
        };
        getDashboard();
    }, [name, persona]);

    const handleSaveLayout = async (newLayout: string[]) => {
        const name = localStorage.getItem('username');

        try {
            if (activeWidgets.length > 0) {
                await api(`${DOMAIN}/removeWidgets`, {
                    method: 'POST',
                    body: JSON.stringify({
                        username: name,
                        widgets: activeWidgets
                    })
                });
            }

            if (newLayout.length > 0) {
                await api(`${DOMAIN}/addWidgets`, {
                    method: 'POST',
                    body: JSON.stringify({
                        username: name,
                        widgets: newLayout
                    })
                });
            }

            setActiveWidgets(newLayout);
            setIsEditing(false);

        } catch (error) {
            console.error("Failed to sync widgets with database", error);
        }
    };

    return (
        <>
            <Header />
            <EditButton
                activeWidgets={activeWidgets}
                onSave={handleSaveLayout}
                allWidgets={ALL_WIDGETS}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
            />

                {activeWidgets.map((key) => {
                    const widget = ALL_WIDGETS[key as keyof typeof ALL_WIDGETS];
                    if (!widget) return null;

                    return (
                            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const updated = activeWidgets.filter(k => k !== key);
                                            handleSaveLayout(updated);
                                        }}
                                        style={{ marginBottom: '10px' }}
                                    >
                                        Remove
                                    </button>
                                )}
                                {widget.component}
                            </Card>
                    );
                })}

        </>
    );
}