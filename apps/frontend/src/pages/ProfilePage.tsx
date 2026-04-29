import { Header } from "../components/Header";
import { PageTitle } from '../components/Title.tsx';
import { ProfileComponent } from "../components/ProfilePage/ImageCard.tsx";

export function ProfilePage() {
    return (
        <>
            <Header />
            <PageTitle title="User Profile" />
            <ProfileComponent />
        </>
    )
}