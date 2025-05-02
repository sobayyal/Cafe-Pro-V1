import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { pool } from '../server/db.js'; // Import your pool

const app = express();
const PgStore = pgSession(session);

app.use(
  session({
    store: new PgStore({
      pool: pool, // Use the existing pool
      createTableIfMissing: true
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
