import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { MainMenu } from './pages/MainMenu';
import { ProfilePage } from './pages/ProfilePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import {Auth0Provider} from "@auth0/auth0-react";
import {Documents} from "./pages/Documents";
// import { ProtectedRoute } from './components/ProtectedRoute';
import {MantineProvider} from "@mantine/core";
import { Archive } from './pages/Archive';

export default function App() {
    return (
        // Each Route should be a page from src/pages
        <Auth0Provider
            domain= {import.meta.env.VITE_AUTH0_DOMAIN}
            clientId= {import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin + '/',
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                scope: "openid profile email read:profile read:data read:api"
            }}
            useRefreshTokens = {true}
            cacheLocation = "localstorage"
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainMenu />}/>
                    <Route path="/menu" element={<MainMenu />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/manageemployees" element={<ManageEmployeesForm />} />
                    <Route path="/archive" element={<Archive />}/>
                    <Route path="/profilePage" element={<ProfilePage />}/>
                </Routes>
            </BrowserRouter>
</Auth0Provider>
    );
}
