import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as LocalStrategy } from "passport-local";
import { pool } from '../server/db.js';
import { storage } from '../server/storage.js';

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up database-backed session store
const PgStore = pgSession(session);

// Session configuration with database storage
app.use(
  session({
    store: new PgStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || "cafe-management-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Set up passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure passport to use local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return done(null, false, { message: "Invalid username or password" });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize and deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Authentication routes
app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || "Authentication failed" });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      return res.json({ 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        role: user.role 
      });
    });
  })(req, res, next);
});

// Get current user
app.get("/api/auth/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = req.user;
  res.json({ 
    id: user.id, 
    username: user.username, 
    name: user.name, 
    role: user.role 
  });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// Add other API routes from server/routes.ts
// Note: This is a simplified version - you would need to import 
// and adapt your existing routes from server/routes.ts

// Export the Express API for Vercel serverless function
export default app;
