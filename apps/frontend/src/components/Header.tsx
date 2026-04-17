import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import { Profile } from "./Profile.tsx";
import { usePersona } from "../hooks/usePersona";

export function Header() {
    const personaHook = usePersona();

    const isAdmin = personaHook === 'Admin';
    const isUnderwriter = personaHook === 'Underwriter';
    const isBusinessAnalyst = personaHook === 'Business Analyst';
    const isActuarialAnalyst = personaHook === 'Actuarial Analyst';
    const isEXLOperations = personaHook === 'EXL Operations';

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
                {(isAdmin || isBusinessAnalyst || isUnderwriter || isActuarialAnalyst || isEXLOperations) && (
                    <Link to="/documents">Documents</Link>
                    )}
                {(isAdmin || isUnderwriter || isBusinessAnalyst || isActuarialAnalyst || isEXLOperations) && (
                    <Link to="/archive">Archive</Link>
                )}
                <Profile />
            </nav>
        </header>
    );
}


