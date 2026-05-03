import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';

// Keep feature routes separate so each domain owns its own endpoints.
import employeeRoutes from './routes/employees.js';
import contentRoutes from './routes/contentforms.js';
import loginRoutes from './routes/login.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import searchRouter from './routes/search.js';

const app = express();
const port = process.env.PORT || 3001;

const distPath = path.resolve("../frontend/dist");
const staticPath = path.join(distPath);

// Allow the frontend and deployed app to call this backend API.
// credentials: true supports auth flows that rely on cookies or sessions.
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5175", "https://cs3733.lunarflame.dev", "https://i4.cs3733.lunarflame.dev"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));

// Parse incoming JSON request bodies for API routes.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend build output.
app.use(express.static(staticPath));

// Log requests in a readable format during development.
app.use(morgan('dev'));

// Mount the feature routers at the root path.
// Each router handles its own route definitions internally.
app.use(searchRouter);
app.use('/', employeeRoutes);
app.use('/', chatRoutes);
app.use('/', notificationRoutes);
app.use('/', loginRoutes);  // loginRoutes before contentRoutes!
app.use('/', contentRoutes);

app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// Start the server on the configured port.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;
