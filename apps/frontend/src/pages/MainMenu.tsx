import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { StatsDashboard } from "../components/mainmenu/StatsDashboard.tsx";
import {ChartGrid} from "../components/mainmenu/ChartGrid.tsx";

export function MainMenu() {
            return (
            <>
                <title>
                    Home - Hanover Insurance
                </title>
                <Header />
                <Hero />
                <StatsDashboard />
                <ChartGrid />
            </>
        )
}