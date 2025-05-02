import express from 'express';
import bodyParser from 'express';
import session from 'express-session';
import passport from 'passport';
import { registerRoutes } from '../server/routes.js';
import { storage } from '../server/storage.js';

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "cafe-management-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Register routes
registerRoutes(app);

// Export the Express API
export default app;
