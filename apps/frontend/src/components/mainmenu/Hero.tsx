import { useState, useEffect } from "react";
import LoginModal from '../login/LoginModal';
import {useAuth0} from "@auth0/auth0-react";
import {useTranslation} from "react-i18next";

// Preload the hero carousel images from the public folder so the slideshow can rotate smoothly.
const modules = import.meta.glob<{ default : string }>(
    "../../../public/carousel/*.png",
    { eager: true }
);
const images = Object.values(modules).map((mod) => mod.default);

export function Hero() {
    // Track which carousel image should currently be visible.
    const [currentIndex, setCurrentIndex] = useState(0);
    const {t} = useTranslation();

    // Auth state determines whether to show the login prompt or the personalized greeting.
    const { isAuthenticated, user } = useAuth0();

    useEffect(() => {
        // Skip the timer entirely if no hero images are available.
        if (images.length === 0)
            return;

        // Rotate the banner image every 4 seconds.
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return(
        <>
            {
                <main className="main-menu" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    <div className="image-stack">
                        {/* Render every slide; CSS controls which one is visible. */}
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
