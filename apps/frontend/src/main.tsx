import './i18n.ts';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Footer } from './components/Footer.tsx'
import App from './App.tsx'
import {MantineProvider} from "@mantine/core";

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MantineProvider>
          <App />
          <Footer />
      </MantineProvider>
  </StrictMode>
);
