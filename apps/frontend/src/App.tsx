
import { BusinessAnalyst } from './pages/BusinessAnalyst';
import { CoreCommercialUnderwriter} from "./pages/CoreCommercialUnderwriter.tsx";
import { ManageContentForm} from "./pages/ManageContentForm.tsx";
import { ManageEmployeesForm} from "./pages/ManageEmployeesForm.tsx";
import { Login } from "./pages/Login";
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
// import { ProtectedRoute } from './components/ProtectedRoute';



export default function App() {
    return (
        // Each Route should be a page from src/pages
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
                <Route path="/" element={<Login/>}/>
                <Route path="/menu" element={<MainMenu />} />
                <Route path="/businessanalyst" element={<BusinessAnalyst />} />
                <Route path="/corecommercialunderwriter" element={<CoreCommercialUnderwriter />} />
                <Route path="/managecontent" element={<ManageContentForm />} />
                <Route path="/manageemployees" element={<ManageEmployeesForm />} />
            </Routes>
        </BrowserRouter>
    );
}
