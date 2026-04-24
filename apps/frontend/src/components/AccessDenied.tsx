import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import {useTranslation} from "react-i18next";

export function AccessDenied() {
    const {t} = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            navigate(-1);
        }, 1500);

        return () => window.clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="flex items-center justify-center h-screen">
                <h1 className="text-3xl font-bold text-red-500">{t('access_denied')}</h1>
            </div>
        </div>
    );
}