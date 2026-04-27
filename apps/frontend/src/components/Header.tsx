import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import { Profile } from "./Profile.tsx";
import { usePersona } from "../hooks/usePersona";
import { IconBell, IconCircleFilled } from "@tabler/icons-react";
import { Chatbot } from "./Chatbot.tsx";
import { Text } from '@mantine/core';
import {useTranslation} from "react-i18next";
import { useApi } from "./api.ts";
import { DOMAIN } from "../const";
import { useEffect, useState } from "react";

export function Header() {
    const personaHook = usePersona();
    const {t} = useTranslation();
    const api = useApi();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await api(`${DOMAIN}/notifications`);
                if (response.ok) {
                    const data = await response.json();
                    const unread = data.filter((n: { read: boolean }) => !n.read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };
        fetchUnreadCount();
    }, [api]);

    const isAdmin = personaHook === 'Admin';
    const isUnderwriter = personaHook === 'Underwriter';
    const isBusinessAnalyst = personaHook === 'Business Analyst';
    const isActuarialAnalyst = personaHook === 'Actuarial Analyst';
    const isEXLOperations = personaHook === 'EXL Operations';

    const displayCount = unreadCount > 9 ? '9+' : unreadCount;

    return (
        <header className="main-header">
            <div>
                <div className="logo">
                    <Link to="/">
                        <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                    </Link>
                </div>
                    <nav className="menu-links">
                        <Link to="/menu">{t('home')}</Link>
                        {(isAdmin || isBusinessAnalyst || isUnderwriter || isActuarialAnalyst || isEXLOperations) && (
                            <Link to="/dashboard">{t('Dashboard')}</Link>
                        )}
                        {isAdmin && <Link to="/manageemployees">{t('employees')}</Link>}
                        {(isAdmin || isBusinessAnalyst || isUnderwriter || isActuarialAnalyst || isEXLOperations) && (
                            <Link to="/documents">{t('documents')}</Link>
                        )}
                        {(isAdmin || isUnderwriter || isBusinessAnalyst || isActuarialAnalyst || isEXLOperations) && (
                            <Link to="/archive">{t('archive')}</Link>
                        )}
                  <Profile />
                        <Link to="/notifications">
                            <IconBell size={32} />
                            {unreadCount > 0 && (
                                <div style={{ position: 'relative' }}>
                                    <IconCircleFilled
                                        size={28}
                                        style={{
                                            color: 'var(--color-neutral-red)',
                                            position: 'absolute',
                                            top: '-2.5rem',
                                            right: '-0.5rem',
                                        }}
                                    />
                                    <p
                                        style={{
                                            position: 'absolute',
                                            top: '-2.5rem',
                                            right: '-0.5rem',
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: "0.9rem",
                                            margin: 0,
                                        }}
                                    >{displayCount}</p>
                                </div>
                            </Link>
                        </nav>
                    <Chatbot />
                </div>
            <Text size="sm" c="white" ta="center">
                {t('disclaimer')}
            </Text>
        </header>
    );
}


