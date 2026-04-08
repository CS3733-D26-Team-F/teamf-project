import { Link } from "react-router-dom";
import hanoverLogo from "../../../public/main_icons/hanoverlogo.png";

export function LoginHeader() {
    return (
        <header className="login-header">
            <Link to="/">
                <img src={hanoverLogo} id="logo" alt="Hanover Insurance Logo" />
            </Link>
        </header>
    );
}