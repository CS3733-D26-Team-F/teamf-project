import { TemplatePage } from './pages/TemplatePage';
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

export default function App() {
    return (
        // Each Route should be a page from src/pages
        <BrowserRouter>

            <Routes>
                <Route path="/" element={<Header />}/>
                <Route path="/template" element={<TemplatePage />}/>
            </Routes>
        </BrowserRouter>
    );
}
