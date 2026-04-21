import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { StatsDashboard } from "../components/mainmenu/StatsDashboard.tsx";
import {AreaChart} from "../components/mainmenu/AreaChart.tsx";
import { Calendar } from "../components/mainmenu/Calendar.tsx";

export function MainMenu() {
            return (
            <>
                <title>
                    Home - Hanover Insurance
                </title>
                <Header />
                <Hero />
                <br/>
                <Calendar />
                <StatsDashboard />
                <AreaChart/>
            </>
        )
}