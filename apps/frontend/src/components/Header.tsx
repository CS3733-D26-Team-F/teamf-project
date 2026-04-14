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

    const isAdmin = persona === 'admin';
    const isUnderwriter = persona === 'underwriter';
    const isBusinessAnalyst = persona === 'business analyst';

    return (
        <header className="main-header">
            <div className="logo">
                <Link to="/">
                    <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                </Link>
            </div>
            <nav className="menu-links">
                <Link to="/menu">Home</Link>
                <Link to="/managecontent">Manage Content</Link>
                {isAdmin && <Link to="/manageemployees">Employees</Link>}
                {(isAdmin || isBusinessAnalyst) && (
                    <Link to="/businessanalyst">Business Analyst</Link>
                )}
                {(isAdmin || isUnderwriter) && (

                    <Link to="/corecommercialunderwriter">Core Commercial Underwriter</Link>
                )}
                <Profile />
                <ThemeToggle />
            </nav>
        </header>
    );
}


