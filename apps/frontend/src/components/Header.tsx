import { Link } from 'react-router-dom'
import hanoverLogo from '../assets/hanoverlogo.png';

export function Header() {
    return (
        <header className="menu">
            <div className="logo">
                <Link to="/">
                    <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
                </Link>
            </div>
            <nav className="menu-links">
                <Link to="/">Home</Link>
                <Link to="/managecontent">Manage Content</Link>
                <Link to="/manageemployees">Employees</Link>
                <Link to="/businessanalyst">Business Analyst</Link>
                <Link to="/corecommercialunderwriter">Core Commercial Underwriter</Link>
            </nav>
        </header>
    );
}
