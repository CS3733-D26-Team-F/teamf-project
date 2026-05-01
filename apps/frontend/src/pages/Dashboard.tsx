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
import {useTranslation} from "react-i18next";
import { Transactions } from "../components/mainmenu/Transactions.tsx"
import { DocStatusWidget } from "../components/statistics/DocStatusWidget.tsx";


const DEFAULT_LAYOUTS = {
    "Admin": ['docstats', 'stats', 'todo'],
    "Underwriter": ['docstats', 'todo', 'calendar'],
    "Business Analyst": ['stats', 'todo', 'docstats', 'calendar'],
    "Actuarial Analyst": ['charts', 'transactions', 'stats'],
    "EXL Operations": ['transactions', 'charts', 'calendar', 'stats']
};

export function Dashboard() {
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const api = useApi();
    const persona = localStorage.getItem('persona') as keyof typeof DEFAULT_LAYOUTS | null;
    const name = localStorage.getItem('username');
    const { user } = useAuth0();
    const {t} = useTranslation();

    const ALL_WIDGETS = {
        todo: { labelKey: t('todo_list'), component: <ToDoList /> },
        stats: { labelKey: t('stats_grid'), component: <StatsDashboard /> },
        areachart: { labelKey: t('area_chart'), component: <AreaChart /> },
        heatmap: { labelKey: t('heat_map'), component: <HeatMap /> },
        calendar: { labelKey: t('calendar'), component: <Calendar /> },
        charts: { labelKey: t('charts'), component: <ChartGrid /> },
        transactions: { labelKey: t('transactions'), component: <Transactions /> },
        docstats: { labelKey: t('document_status'), component: <DocStatusWidget /> },
    };

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
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: name,
                        widgets: activeWidgets
                    })
                });
            }

            if (newLayout.length > 0) {
                await api(`${DOMAIN}/addWidgets`, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
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
                    {t('welcome')}, {localStorage.getItem('first_name')}</h1>
                <p>{t('dashboard_subtitle')}</p>
            </div>
            <EditButton
                activeWidgets={activeWidgets}
                onSave={handleSaveLayout}
                allWidgets={ALL_WIDGETS}
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
