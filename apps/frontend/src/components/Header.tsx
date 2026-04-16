import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import { Profile } from "./Profile.tsx";
import { usePersona } from "../hooks/usePersona";
import { ActionIcon, Container, Group, Text } from '@mantine/core';
import classes from "../FooterLinks.module.css";

export function Header() {
    const personaHook = usePersona();

    const isAdmin = personaHook === 'Admin';
    const isUnderwriter = personaHook === 'Underwriter';
    const isBusinessAnalyst = personaHook === 'Business Analyst';

    return (
        <>
            <header>
                <Text size="sm" c="white" ta="center">
                    This website has been created for WPI’s CS 3733 Software
                    Engineering as a class project and is not in use by Hanover Insurance.
                </Text>
            </header>
            <header className="main-header">
                <div className="logo">
                    <Link to="/">
                        <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                    </Link>
                </div>
                <nav className="menu-links">
                    <Link to="/menu">Home</Link>
                    {isAdmin && <Link to="/manageemployees">Employees</Link>}
                    {(isAdmin || isBusinessAnalyst || isUnderwriter) && (
                        <Link to="/documents">Documents</Link>
                        )}
                    {(isAdmin || isUnderwriter || isBusinessAnalyst) && (
                        <Link to="/archive">Archive</Link>
                    )}
                    <Profile />
                </nav>
            </header>
        </>
    );
}


