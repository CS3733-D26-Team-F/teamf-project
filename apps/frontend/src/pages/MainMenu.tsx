import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import { StatsDashboard } from "../components/mainmenu/StatsDashboard.tsx";

export function MainMenu() {
            return (
            <>
                <title>
                    Home - Hanover Insurance
                </title>
                <Header />
                <Hero />
                <StatsDashboard />
            </>
        )
}