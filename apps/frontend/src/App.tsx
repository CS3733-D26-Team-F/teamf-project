import { BusinessAnalyst } from './pages/BusinessAnalyst';
import { CoreCommercialUnderwriter} from "./pages/CoreCommercialUnderwriter.tsx";
import { ManageContentForm} from "./pages/ManageContentForm.tsx";
import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { Login } from './pages/Login.tsx';

export default function App() {
    return (
        // Each Route should be a page from src/pages
        <BrowserRouter>

            <Routes>
                <Route path="/" element={<MainMenu/>}/>
                <Route path="/login" element={<Login />}/>
                <Route path="/businessanalyst" element={<BusinessAnalyst/>}/>
                <Route path="/corecommercialunderwriter" element={<CoreCommercialUnderwriter/>}/>
                <Route path="/managecontent" element={<ManageContentForm/>}/>
                <Route path="/manageemployees" element={<ManageEmployeesForm/>}/>
            </Routes>
        </BrowserRouter>
    );
}
