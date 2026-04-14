import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

console.log(import.meta.env.VITE_AUTH0_DOMAIN)
console.log(import.meta.env.VITE_AUTH0_CLIENT_ID)
console.log(import.meta.env.VITE_AUTH0_AUDIENCE)
console.log("Redirect URI:", window.location.origin);

createRoot(document.getElementById('root')!).render(
        <StrictMode>
              <App />
      </StrictMode>
)



