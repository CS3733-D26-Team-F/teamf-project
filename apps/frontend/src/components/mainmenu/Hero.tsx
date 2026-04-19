import { useState, useEffect } from "react";
import LoginModal from '../login/LoginModal';
import {useAuth0} from "@auth0/auth0-react";
import {useTranslation} from "react-i18next";

const modules = import.meta.glob<{ default : string}>(
    "../../../public/carousel/*.png",
    { eager: true }
);
const images = Object.values(modules).map((mod) => mod.default);

export function Hero() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const {t} = useTranslation();

    const { isAuthenticated, user } = useAuth0();

    useEffect(() => {
        if (images.length === 0)
            return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return(
        <>
            {
                <main className="main-menu">
                    <div className="image-stack">
                        {images.map((src, i) => (
                            <img
                                key={src}
                                src={src}
                                alt=""
                                aria-hidden="true"
                                className={`slide ${i === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                        <div className="overlay"/>
                    </div>

                    {isAuthenticated ? (
                        <div className="content">
                            <h1>{t('welcome')}, {user?.nickname}!</h1>
                            <p>{t('dashboard_subtitle')}</p>
                        </div>
                    ) : (
                        <div className="content">
                            <h1>{t('welcome_message')}</h1>
                            <p>{t('welcome_message_subtitle')}</p>
                            <LoginModal />
                        </div>
                    )}
                </main>
            }
        </>
    );
}   
