import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import employeeRoutes from './routes/employees.js';
import contentRoutes from './routes/contentforms.js';
import loginRoutes from './routes/login.js';
import chatRoutes from './routes/chat.js';

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5175", "https://cs3733.lunarflame.dev"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));


app.get ('/health', (req, res) => {
    res.status(200);
})

app.use('/', employeeRoutes);
app.use('/', chatRoutes);
app.use('/', contentRoutes);
app.use('/', loginRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;
