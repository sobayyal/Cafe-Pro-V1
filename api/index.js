import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json());

// Register all your routes
registerRoutes(app);

export default app;