import { Header } from "../components/Header"
import {
    TitleDemo
} from "../components/underwriter/title"
import {
    LinksDemo
} from "../components/underwriter/links.tsx";
import { AccessDenied } from "../components/AccessDenied.tsx"

export function CoreCommercialUnderwriter() {
    const allowedAccess = localStorage.getItem('persona') === 'Admin' || localStorage.getItem('persona') === 'Underwriter';
    if (allowedAccess){
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