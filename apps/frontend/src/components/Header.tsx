import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import { Profile } from "./Profile.tsx";
import { usePersona } from "../hooks/usePersona";
import { ActionIcon, Container, Group, Text } from '@mantine/core';
import classes from "../FooterLinks.module.css";
import {useTranslation} from "react-i18next";

export function Header() {
    const personaHook = usePersona();
    const {t} = useTranslation();

    const isAdmin = personaHook === 'Admin';
    const isUnderwriter = personaHook === 'Underwriter';
    const isBusinessAnalyst = personaHook === 'Business Analyst';
    const isActuarialAnalyst = personaHook === 'Actuarial Analyst';
    const isEXLOperations = personaHook === 'EXL Operations';

    return (
        <>
            <header className="main-header">
                <div className="logo">
                    <Link to="/">
                        <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                    </Link>
                </div>
                  <nav className="menu-links">
                     <Link to="/menu">{t('home')}</Link>
                      {isAdmin && <Link to="/manageemployees">{t('employees')}</Link>}
                      {(isAdmin || isBusinessAnalyst || isUnderwriter || isActuarialAnalyst || isEXLOperations) && (
                          <Link to="/documents">{t('documents')}</Link>
                          )}
                    {(isAdmin || isUnderwriter || isBusinessAnalyst || isActuarialAnalyst || isEXLOperations) && (
                          <Link to="/archive">{t('archive')}</Link>
                )}
                <Profile />
              </nav>
            </header>
            <header>
                <Text size="sm" c="white" ta="center">
                    {t('disclaimer')}
                </Text>
            </header>
        </>
    );
}


