
import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import {MantineProvider} from "@mantine/core";
import {Auth0Provider} from "@auth0/auth0-react";
// import { ProtectedRoute } from './components/ProtectedRoute';



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
        >
            <MantineProvider>
            <BrowserRouter>

            {/*<Routes>*/}
            {/*    <Route path="/" element={<Login/>}/>*/}
            {/*    <Route path="/menu" element={<ProtectedRoute><MainMenu /></ProtectedRoute>} />*/}
            {/*    <Route path="/businessanalyst" element={<ProtectedRoute><BusinessAnalyst /></ProtectedRoute>} />*/}
            {/*    <Route path="/corecommercialunderwriter" element={<ProtectedRoute><CoreCommercialUnderwriter /></ProtectedRoute>} />*/}
            {/*    <Route path="/managecontent" element={<ProtectedRoute><ManageContentForm /></ProtectedRoute>} />*/}
            {/*    <Route path="/manageemployees" element={<ProtectedRoute><ManageEmployeesForm /></ProtectedRoute>} />*/}
            {/*</Routes>*/}
            <Routes>
                <Route path="/" element={<MainMenu />}/>
                <Route path="/menu" element={<MainMenu />} />
                <Route path="/businessanalyst" element={<BusinessAnalyst />} />
                <Route path="/corecommercialunderwriter" element={<CoreCommercialUnderwriter />} />
                <Route path="/managecontent" element={<ManageContentForm />} />
                <Route path="/manageemployees" element={<ManageEmployeesForm />} />
            </Routes>
        </BrowserRouter>
        </MantineProvider>
</Auth0Provider>
    );
}
