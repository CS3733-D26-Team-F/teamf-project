import { Header } from "../components/Header";
import { ProfileComponent } from "./profilePage/profileDisplayComponent";

export function ProfilePage() {
    return (
        <>
            <Header />
            <h1>Profile Page</h1>
            <ProfileComponent />
        </>
    )
}