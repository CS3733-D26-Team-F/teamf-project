import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import { SettingsModal } from '../components/SettingsModal';
import { Profile } from "./Profile.tsx";
import { usePersona } from "../hooks/usePersona";

export function Header() {
    const personaHook = usePersona();

    const isAdmin = personaHook === 'Admin';
    const isUnderwriter = personaHook === 'Underwriter';
    const isBusinessAnalyst = personaHook === 'Business Analyst';

    return (
        <header className="main-header">
            <div className="logo">
                <Link to="/">
                    <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                </Link>
            </div>
            <nav className="menu-links">
                <Link to="/menu">Home</Link>
                {(isAdmin || isBusinessAnalyst || isUnderwriter) &&
                    (<Link to="/managecontent">Manage Content</Link>)}
                {isAdmin && <Link to="/manageemployees">Employees</Link>}
                {(isAdmin || isBusinessAnalyst || isUnderwriter) && (
                    <Link to="/documents">Documents</Link>
                    )}
                {(isAdmin || isUnderwriter || isBusinessAnalyst) && (
                    <Link to="/archive">Archive</Link>
                )}
                <Profile />
                <SettingsModal />

                

            </nav>
        </header>
    );
}


