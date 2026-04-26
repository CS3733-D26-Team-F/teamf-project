import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { ProfileComponent } from "./profilePage/profileDisplayComponent";

export function ProfilePage() {
    return (
        <>
            <Header />
            <PageTitle title="User Profiles" />
            <ProfileComponent />
        </>
    )
}