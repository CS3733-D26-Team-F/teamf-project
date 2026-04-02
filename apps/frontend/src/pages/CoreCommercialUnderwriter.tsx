import { Header } from "../components/Header"
import {
    TitleDemo
} from "../components/underwriter/title"
import {
    LinksDemo
} from "../components/underwriter/links.tsx";

export function CoreCommercialUnderwriter() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <TitleDemo />
            <LinksDemo />
        </div>
    );
}