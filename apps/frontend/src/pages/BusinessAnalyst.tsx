import { Header } from "../components/Header"
import { AccessDenied } from "../components/AccessDenied.tsx"
import { TitleDemo } from "../components/businessanalyst/title"
import { LinksDemo} from "../components/businessanalyst/links.tsx";

export function BusinessAnalyst() {

    const allowedAccess = localStorage.getItem('persona') === 'Admin' || localStorage.getItem('persona') === 'Business Analyst';
    if (allowedAccess) {
        return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <TitleDemo />
            <LinksDemo />
        </div>
    
    ); } else {
        return <AccessDenied />;
    }
    
}