
import { BusinessAnalyst } from './pages/BusinessAnalyst';
import { CoreCommercialUnderwriter} from "./pages/CoreCommercialUnderwriter.tsx";
import { ManageContentForm} from "./pages/ManageContentForm.tsx";
import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { Login } from "./pages/Login";
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import {MantineProvider} from "@mantine/core";
// import { ProtectedRoute } from './components/ProtectedRoute';



export default function App() {
    return (
        // Each Route should be a page from src/pages
    <MantineProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login/>}/>
                <Route path="/menu" element={<MainMenu />} />
                <Route path="/businessanalyst" element={<BusinessAnalyst />} />
                <Route path="/corecommercialunderwriter" element={<CoreCommercialUnderwriter />} />
                <Route path="/managecontent" element={<ManageContentForm />} />
                <Route path="/manageemployees" element={<ManageEmployeesForm />} />
            </Routes>
        </BrowserRouter>
    </MantineProvider>
    );
}
