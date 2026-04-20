import express from 'express';
import morgan from 'morgan';
import cors from 'cors';



import employeeRoutes from './routes/employees.js';
import contentRoutes from './routes/contentforms.js';
import loginRoutes from './routes/login.js';

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5175", "https://cs3733.lunarflame.dev"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/', employeeRoutes);
app.use('/', contentRoutes);
app.use('/', loginRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});



export default app;
