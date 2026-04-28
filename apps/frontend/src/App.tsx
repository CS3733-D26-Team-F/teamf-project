import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { MainMenu } from './pages/MainMenu';
// import { ProfilePage } from './pages/ProfilePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import {Auth0Provider} from "@auth0/auth0-react";
import Documents from "./pages/Documents";
import { Archive } from './pages/Archive';
import { Notifications } from './pages/Notifications';
import { About} from "./pages/About.tsx";
import {Footer} from "./components/Footer.tsx";
import { Credit } from './pages/Credit.tsx';
import { CommandPalette } from './components/CommandPalette'
import { Dashboard } from './pages/Dashboard';

// Top-level application shell:
// - configures Auth0 once for the whole app
// - wires up client-side routing
// - maps routes to page components
export default function App() {
    return (
        // Auth0Provider makes authentication state and login/logout helpers
        // available to all child components.
        <Auth0Provider
            domain= {import.meta.env.VITE_AUTH0_DOMAIN}
            clientId= {import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                // After Auth0 login, return to the app root.
                redirect_uri: window.location.origin + '/',
                // API audience requested for backend access.
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                // Scopes requested for the user's identity and API access.
                scope: "openid profile email read:profile read:data read:api offline_access"
            }}
            // Persist session across page reloads.
            useRefreshTokens = {true}
            cacheLocation = "localstorage"
        >
            <BrowserRouter>
                <CommandPalette />
                {/* Define the app's main navigation routes. */}
                <Routes>
                    <Route path="/" element={<MainMenu />}/>
                    <Route path="/dashboard" element={<Dashboard />}/>
                    <Route path="/menu" element={<MainMenu />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/manageemployees" element={<ManageEmployeesForm />} />
                    <Route path="/archive" element={<Archive />}/>
                    {/*<Route path="/profilePage" element={<ProfilePage />}/>*/}
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/about" element={<About />}/>
                    <Route path="/credit" element={<Credit />}/>
                </Routes>
                <Footer />
            </BrowserRouter>
        </Auth0Provider>
    );
}
