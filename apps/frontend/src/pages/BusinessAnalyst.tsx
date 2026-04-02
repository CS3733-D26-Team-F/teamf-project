import { Header } from "../components/Header"
import { TitleDemo } from "../components/businessanalyst/title"
import { LinksDemo} from "../components/businessanalyst/links.tsx";

export function BusinessAnalyst() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <TitleDemo />
            <LinksDemo />
        </div>
    );
}