import { Link } from 'react-router-dom'

export function Header() {
    return (
            <nav className="menu">
                <Link to="/">Home</Link> | {" "}
                <Link to="/template">Template</Link> | {" "}
                <Link to="/link2"> Link 2</Link> | {" "}
                <Link to="/link3"> Link 3</Link>
            </nav>
    );
}
