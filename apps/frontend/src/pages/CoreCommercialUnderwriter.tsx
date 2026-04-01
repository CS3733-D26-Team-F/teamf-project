import { Header } from "../components/Header"
import {
    TitleDemo
} from "../components/underwriter/title"
import {
    LinksDemo
} from "../components/underwriter/links.tsx";

export function CoreCommercialUnderwriter() {
    return (
        <>
            <Header />
            <TitleDemo />
            <LinksDemo />
        </>
    );
}