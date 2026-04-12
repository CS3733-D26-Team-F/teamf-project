
import {Documents} from './pages/Documents';
import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { Login } from "./pages/Login";
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import {MantineProvider} from "@mantine/core";
import { UserProfile } from './components/profile/userProfile.tsx';
// import { ProtectedRoute } from './components/ProtectedRoute';



export default function App() {
    localStorage.clear(); //to force a clear
    return (
        // Each Route should be a page from src/pages
    <MantineProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login/>}/>
                <Route path="/menu" element={<MainMenu />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/manageemployees" element={<ManageEmployeesForm />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/settings" element={<div>Settings Page</div>} />
                
            </Routes>
        </BrowserRouter>
    </MantineProvider>
    );
}
