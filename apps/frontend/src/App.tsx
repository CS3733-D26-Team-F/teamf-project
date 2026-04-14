
import {Documents} from './pages/Documents';
import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import {MantineProvider} from "@mantine/core";
import {Auth0Provider} from "@auth0/auth0-react";
// import { ProtectedRoute } from './components/ProtectedRoute';



export default function App() {
    return (
        <Auth0Provider
            domain= {import.meta.env.VITE_AUTH0_DOMAIN}
            clientId= {import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin + '/',
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                scope: "openid profile email read:profile read:data read:api"
            }}
        >
            <MantineProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<MainMenu/>}/>
                        <Route path="/menu" element={<MainMenu />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/manageemployees" element={<ManageEmployeesForm />} />
                    </Routes>
                </BrowserRouter>
            </MantineProvider>
        </Auth0Provider>
    );
}
