import { Header } from "../components/Header";
import { Hero } from "../components/mainmenu/Hero.tsx";
import {useTranslation} from "react-i18next";

export function MainMenu() {
    const {t} = useTranslation();
            return (
            <>
                <title>
                    {t('page_title_home')}
                </title>
                <Header />
                <Hero />
            </>
        )
}