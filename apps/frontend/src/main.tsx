import './i18n.ts';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {MantineProvider} from "@mantine/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MantineProvider>
          <App />
      </MantineProvider>
  </StrictMode>
);
