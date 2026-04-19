import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { StatsDashboard } from "../components/mainmenu/StatsDashboard.tsx";
import {AreaChart} from "../components/mainmenu/AreaChart.tsx";

export function MainMenu() {
            return (
            <>
                <title>
                    t('page_title_home')
                </title>
                <Header />
                <Hero />
                <StatsDashboard />
                <AreaChart/>
            </>
        )
}