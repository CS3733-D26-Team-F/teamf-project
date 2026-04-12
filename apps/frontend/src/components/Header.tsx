import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import ThemeToggle from "./ThemeToggle.tsx";
import { Profile } from "./Profile.tsx";

export function Header() {
    const [persona, setPersona] = useState<string | null>(() =>
        localStorage.getItem('persona')
    );

    useEffect(() => {
        const handleStorage = () => {
            setPersona(localStorage.getItem('persona'));
        }

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        const handleStorage = () => {
            setPersona(localStorage.getItem('persona'));
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const isAdmin = persona === 'Admin';
    const isUnderwriter = persona === 'Underwriter';
    const isBusinessAnalyst = persona === 'Business Analyst';
    const isGuest = persona === 'Guest';

    if (isAdmin || isUnderwriter || isBusinessAnalyst) {
        return (
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
                    <ThemeToggle />
                    {!isGuest && <Profile />}
                    
                </nav>
            </header>
        );
    }

    else {
        return (
            <header className="main-header">
                <div className="logo">
                    <Link to="/">
                        <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                    </Link>
                </div>
                <nav className="menu-links">
                    <Link to="/menu">Home</Link>
                </nav>
                </header>
                
            );
        }
}


