import { TemplatePage } from './pages/TemplatePage';
import { MainMenu } from './components/MainMenu'
import { Hero } from './components/Hero'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

export default function App() {
    return (
        // Each Route should be a page from src/pages
        <BrowserRouter>
            <MainMenu />
            <Routes>
                <Route path="/" element={<Hero />}/>
                <Route path="/template" element={<TemplatePage />}/>
            </Routes>
        </BrowserRouter>
    );
}
