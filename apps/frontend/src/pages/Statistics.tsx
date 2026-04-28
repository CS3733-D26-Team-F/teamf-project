import { AreaChart } from '../components/mainmenu/AreaChart.tsx';
import { HeatMap } from '../components/mainmenu/HeatMap.tsx';
import { ToDoList } from '../components/mainmenu/ToDoList.tsx';
import { StatsDashboard } from '../components/mainmenu/StatsDashboard.tsx';
import { Calendar } from "../components/mainmenu/Calendar.tsx";
import { ChartGrid } from '../components/mainmenu/ChartGrid';
import { Card } from "@mantine/core";
import { EditButton } from "../components/statistics/EditButton.tsx";
import { useEffect, useState } from "react";
import { Header } from "../components/Header.tsx";
import { DOMAIN } from "../const.ts";
import { useApi } from "../components/api.ts";
import {useAuth0} from "@auth0/auth0-react";
import {t} from "i18next";
import { Transactions } from "../components/mainmenu/Transactions.tsx"
import { DocStatusWidget } from "../components/statistics/DocStatusWidget.tsx";

const ALL_WIDGETS = {
    todo: { label: 'To-Do List', component: <ToDoList /> },
    stats: { label: 'Stats Grid', component: <StatsDashboard /> },
    areachart: { label: 'Area Chart', component: <AreaChart /> },
    heatmap: { label: 'Heat Map', component: <HeatMap /> },
    calendar: { label: 'Calendar', component: <Calendar /> },
    charts: { label: 'Charts', component: <ChartGrid /> },
    transactions: { label: 'Transactions', component: <Transactions /> },
    docstats: { label: 'Document Status', component: <DocStatusWidget /> },
};

const DEFAULT_LAYOUTS = {
    "Admin": ['stats', 'todo'],
    "Underwriter": ['docstats', 'todo', 'calendar'],
    "Business Analyst": ['stats', 'todo', 'docstats', 'calendar'],
    "Actuarial Analyst": ['charts', 'transactions', 'stats'],
    "EXL Operations": ['transactions', 'charts', 'calendar', 'stats']
};

export function Statistics() {
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const api = useApi();
    const persona = localStorage.getItem('persona');
    const name = localStorage.getItem('username');
    const { isAuthenticated, user } = useAuth0();

    useEffect(() => {
        const getStats = async () => {
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
        getStats();
    }, [name]);

    const handleSaveLayout = async (newLayout: string[]) => {

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
                        'Content-Type': 'application/json',
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
            <div className="content"
                 style={{
                     backgroundColor: 'var(--yale-blue)',
                     color: 'white',
                     margin: '1rem',
                     padding: '3rem 2rem',
                     borderRadius: '12px',
                     textAlign: 'center',
                     boxShadow: '0 4px 20px rgba(0,0,0,0.2)'}}>
                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: 'bold',

                }}>
                    {t('welcome')}, {user?.nickname}</h1>
                <p>{t('dashboard_subtitle')}</p>
            </div>
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
                            <Card shadow="sm" radius="md" h="100%" key={key}>
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