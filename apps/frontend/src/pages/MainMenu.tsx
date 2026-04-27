import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { StatsDashboard } from "../components/mainmenu/StatsDashboard.tsx";
import {ChartGrid} from "../components/mainmenu/ChartGrid.tsx";
import {useTranslation} from "react-i18next";
import { Calendar } from "../components/mainmenu/Calendar.tsx";
import { Transactions } from "../components/mainmenu/Transactions.tsx"

export function MainMenu() {
    const {t} = useTranslation();
            return (
            <>
                <title>
                    {t('page_title_home')}
                </title>
                <Header />
                <Hero />
                <br/>
                <Calendar />
                <Transactions />
                <StatsDashboard />
                <ChartGrid />
            </>
        )
}