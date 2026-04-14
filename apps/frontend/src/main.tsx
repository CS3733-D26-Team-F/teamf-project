import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Footer } from './components/Footer.tsx'
import App from './App.tsx'
import {MantineProvider} from "@mantine/core";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MantineProvider>
          <App />
          <Footer />
      </MantineProvider>
  </StrictMode>
)



