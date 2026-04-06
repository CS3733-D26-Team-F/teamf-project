import { Link } from 'react-router-dom'
import hanoverLogo from '../../public/main_icons/hanoverlogo.png';
import {useEffect, useState} from "react";

export function Header() {
    const [theme, setTheme] = useState('default');
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);
    return (
        <header className="menu">
            <div className="logo">
                <Link to="/">
                    <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                </Link>
            </div>
            <nav className="menu-links">
                <a><Link to="/">Home</Link></a>
                <Link to="/managecontent">Manage Content</Link>
                <Link to="/manageemployees">Employees</Link>
                <Link to="/businessanalyst">Business Analyst</Link>
                <Link to="/corecommercialunderwriter">Core Commercial Underwriter</Link>
                <button onClick={() => setTheme("default")}>Default Theme</button>
                <button onClick={() => setTheme("high-visibility")}>Other Theme</button>
            </nav>
        </header>
    );
}
