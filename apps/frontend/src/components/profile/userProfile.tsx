import { Header } from "../Header";
export function UserProfile() {
    return(
        <>
            <Header />
            <div className='profile-page'>
                <h1>User Profile</h1>
                <p>Welcome to your profile page! Here you can view and edit your personal information, manage your account settings, and access your activity history.</p>
                <p>Feel free to explore the various sections of your profile to customize your experience and stay updated with your interactions on our platform.</p>
            </div>
        </>
    );
}
