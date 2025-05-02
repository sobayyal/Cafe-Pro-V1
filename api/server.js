// api/server.js
import express from 'express';
import bodyParser from 'express';
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
app.use(bodyParser.urlencoded({ extended: false }));

// Set up database-backed session store for serverless environment
const PgStore = pgSession(session);

// Session configuration
app.use(
  session({
    store: new PgStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'session' // Default table name
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

// Passport setup
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

// Define authentication routes
app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || "Authentication failed" });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
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

// Export the Express API
export default app;
