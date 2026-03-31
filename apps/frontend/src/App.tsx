import { TemplatePage } from './pages/TemplatePage';
import { MainMenu } from './pages/MainMenu';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'


export default function App() {
    return (
        // Each Route should be a page from src/pages
        <BrowserRouter>

            <Routes>
                <Route path="/" element={<MainMenu/>}/>
                <Route path="/template" element={<TemplatePage />}/>
            </Routes>
        </BrowserRouter>
    );
}
