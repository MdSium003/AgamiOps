const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
// AI: Gemini
let GoogleGenerativeAI;
try { ({ GoogleGenerativeAI } = require('@google/generative-ai')); } catch {}

// Optional OAuth strategies
let GoogleStrategy;
try { ({ Strategy: GoogleStrategy } = require('passport-google-oauth20')); } catch {}

const app = express();
const PORT = process.env.PORT || 5050;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';
// Support multiple comma-separated origins
const allowedOrigins = String(FRONTEND_ORIGIN).split(',').map(o => o.trim()).filter(Boolean);
const frontUrl = (p = '') => {
  const pathPart = String(p || '').replace(/^\//, '');
  try { return new URL(pathPart ? pathPart : '', FRONTEND_ORIGIN).toString(); } catch { return (FRONTEND_ORIGIN.replace(/\/$/, '')) + (pathPart ? '/' + pathPart : ''); }
};

// CORS and JSON
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow same-origin/no-origin (e.g., curl, mobile apps)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (NODE_ENV !== 'production') {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images statically (kept for convenience)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email verification functions
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const sendVerificationEmail = async (email, token) => {
  const baseUrl = FRONTEND_ORIGIN.endsWith('/') ? FRONTEND_ORIGIN.slice(0, -1) : FRONTEND_ORIGIN;
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your AgamiOps: Marking the future Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a7c59;">Welcome to AgamiOps: Marking the future!</h2>
        <p>Thank you for registering with AgamiOps: Marking the future. Please verify your email address to complete your account setup.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4a7c59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account with AgamiOps: Marking the future, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      company TEXT,
      role TEXT,
      profile_completed BOOLEAN NOT NULL DEFAULT false,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      verification_token TEXT,
      verification_expires TIMESTAMPTZ,
      google_id TEXT UNIQUE,
      github_id TEXT UNIQUE,
      linkedin_id TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shares (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL,
      name TEXT,
      model JSONB,
      tasks JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Ensure new columns exist if table pre-dates these fields
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id TEXT');

  // Plans table for finalized models and checklist state
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_plans (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      model_json JSONB NOT NULL,
      tasks_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  
  // Collaborators table for collaboration requests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id SERIAL PRIMARY KEY,
      share_id INTEGER NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  

  // Business model generations table for storing previous generations
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_model_generations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      idea TEXT NOT NULL,
      models JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `);
  // Inventory table for storing user inventory data
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      file_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
ensureSchema().catch(err => console.error('Schema error', err));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Passport
passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [String(email).toLowerCase()]);
    const user = rows[0];
    if (!user || !user.password_hash) return done(null, false, { message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return done(null, false, { message: 'Invalid credentials' });
    return done(null, { id: user.id, email: user.email, name: user.name, email_verified: !!user.email_verified, profile_completed: !!user.profile_completed });
  } catch (e) {
    return done(e);
  }
}));

// Conditionally configure Google OAuth if env provided
const hasGoogle = !!(GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
if (hasGoogle) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5050/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = (profile.emails && profile.emails[0]?.value) ? profile.emails[0].value.toLowerCase() : null;
      const name = profile.displayName || null;

      // Upsert user with name from Google
      let user;
      const byGoogle = await pool.query('SELECT id, email, name, profile_completed FROM users WHERE google_id=$1', [googleId]);
      if (byGoogle.rowCount > 0) {
        user = byGoogle.rows[0];
        // Update name if empty
        if (!user.name && name) {
          await pool.query('UPDATE users SET name=$1 WHERE id=$2', [name, user.id]);
          user.name = name;
        }
      } else if (email) {
        const byEmail = await pool.query('SELECT id, email, name, profile_completed FROM users WHERE email=$1', [email]);
        if (byEmail.rowCount > 0) {
          const existing = byEmail.rows[0];
          await pool.query('UPDATE users SET google_id=$1, name=COALESCE(name,$2) WHERE id=$3', [googleId, name, existing.id]);
          user = { ...existing, name: existing.name || name };
        } else {
          const inserted = await pool.query('INSERT INTO users (email, name, google_id) VALUES ($1,$2,$3) RETURNING id, email, name, profile_completed', [email, name, googleId]);
          user = inserted.rows[0];
        }
      } else {
        const inserted = await pool.query('INSERT INTO users (name, google_id) VALUES ($1,$2) RETURNING id, email, name, profile_completed', [name, googleId]);
        user = inserted.rows[0];
      }
      return done(null, { id: user.id, email: user.email, name: user.name });
    } catch (e) {
      return done(e);
    }
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT id, email, name FROM users WHERE id=$1', [id]);
    done(null, rows[0] || false);
  } catch (e) {
    done(e);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    let hash = null;
    if (password && String(password).length >= 6) {
      hash = await bcrypt.hash(String(password), 10);
    }
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name, profile_completed, email_verified, verification_token, verification_expires) VALUES ($1,COALESCE($2, NULL),$3,$4,$5,$6,$7) RETURNING id, email, name',
      [String(email).toLowerCase(), hash, name || null, false, false, verificationToken, verificationExpires]
    );
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);
    if (!emailSent) {
      console.error('Failed to send verification email to:', email);
      // Don't fail registration if email sending fails, just log it
    }
    
    res.status(201).json({ 
      ...rows[0], 
      message: 'Registration successful. Please check your email to verify your account.',
      emailSent 
    });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Unauthorized' });
    
    // Check if email is verified
    if (user.email_verified === false) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for a verification email.',
        needsVerification: true 
      });
    }
    
    req.logIn(user, async (err2) => {
      if (err2) return next(err2);
      const { rows } = await pool.query('SELECT profile_completed FROM users WHERE id=$1', [user.id]);
      const profileCompleted = rows[0]?.profile_completed === true;
      return res.json({ user, profileCompleted });
    });
  })(req, res, next);
});

app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ ok: true });
  });
});

// Email verification endpoint
app.get('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const { rows } = await pool.query(
      'SELECT id, email, verification_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = rows[0];
    const now = new Date();

    if (user.verification_expires < now) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Mark email as verified and clear verification token
    await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ 
      success: true, 
      message: 'Email verified successfully! You can now log in.',
      redirectUrl: '/login'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Resend verification email endpoint
app.post('/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const { rows } = await pool.query(
      'SELECT id, email_verified, verification_token, verification_expires FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const user = rows[0];
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if token is still valid (not expired)
    const now = new Date();
    if (user.verification_token && user.verification_expires && user.verification_expires > now) {
      return res.status(400).json({ error: 'Verification email already sent. Please check your inbox or wait before requesting another.' });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await pool.query(
      'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully!' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Share a plan (public link storage stub)
app.post('/shares', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id: userId } = req.user;
    const { planId, name, model, tasks } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId required' });
    
    // Check if this plan is already shared by this user
    const { rows: existingRows } = await pool.query(
      'SELECT id FROM shares WHERE user_id = $1 AND plan_id = $2',
      [userId, String(planId)]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'This project is already shared' });
    }
    
    // Ensure JSON payloads are valid JSON
    let modelJson = null;
    let tasksJson = null;
    try { if (model !== undefined) modelJson = JSON.stringify(model); } catch {}
    try { if (tasks !== undefined) tasksJson = JSON.stringify(tasks); } catch {}
    const { rows } = await pool.query(
      'INSERT INTO shares (user_id, plan_id, name, model, tasks) VALUES ($1,$2,$3,COALESCE($4::jsonb, NULL),COALESCE($5::jsonb, NULL)) RETURNING id, created_at',
      [userId, String(planId), name || null, modelJson, tasksJson]
    );
    const shareId = rows[0].id;
    res.status(201).json({ id: shareId, url: `/share/${shareId}` });
  } catch (e) {
    console.error('Share error', e);
    const msg = e?.message?.includes('relation') ? 'Database not initialized for shares' : 'Failed to create share';
    res.status(500).json({ error: msg });
  }
});

app.get('/shares', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, plan_id, name, (model->>\'description\') as description, user_id, created_at FROM shares ORDER BY created_at DESC LIMIT 100');
    res.json({ shares: rows });
  } catch (e) {
    console.error('Shares list error', e);
    res.status(500).json({ error: 'Failed to load shares' });
  }
});

app.get('/share/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT id, user_id, plan_id, name, model, tasks, created_at FROM shares WHERE id=$1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Share read error', e);
    res.status(500).json({ error: 'Failed to load share' });
  }
});

// Collaboration endpoints
app.post('/collaborate', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { share_id, message } = req.body;
    if (!share_id) return res.status(400).json({ error: 'Share ID required' });
    
    // Check if share exists and get owner info
    const { rows: shareRows } = await pool.query('SELECT id, user_id FROM shares WHERE id=$1', [share_id]);
    if (shareRows.length === 0) return res.status(404).json({ error: 'Share not found' });
    
    // Prevent self-collaboration
    if (shareRows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot collaborate on your own project' });
    }
    
    // Check if user already requested collaboration
    const { rows: existingRows } = await pool.query(
      'SELECT id FROM collaborators WHERE share_id=$1 AND user_id=$2', 
      [share_id, req.user.id]
    );
    if (existingRows.length > 0) return res.status(400).json({ error: 'Already requested collaboration' });
    
    const { rows } = await pool.query(
      'INSERT INTO collaborators (share_id, user_id, message) VALUES ($1, $2, $3) RETURNING id',
      [share_id, req.user.id, message || '']
    );
    res.json({ success: true, id: rows[0].id });
  } catch (e) {
    console.error('Collaboration request error', e);
    res.status(500).json({ error: 'Failed to request collaboration' });
  }
});

app.get('/collaborators/:share_id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { share_id } = req.params;
    
    // Check if user owns the share
    const { rows: shareRows } = await pool.query('SELECT user_id FROM shares WHERE id=$1', [share_id]);
    if (shareRows.length === 0) return res.status(404).json({ error: 'Share not found' });
    if (shareRows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    
    const { rows } = await pool.query(`
      SELECT c.id, c.message, c.status, c.created_at, u.name, u.email, u.company
      FROM collaborators c
      JOIN users u ON c.user_id = u.id
      WHERE c.share_id = $1
      ORDER BY c.created_at DESC
    `, [share_id]);
    
    res.json({ collaborators: rows });
  } catch (e) {
    console.error('Collaborators list error', e);
    res.status(500).json({ error: 'Failed to load collaborators' });
  }
});

app.get('/auth/me', async (req, res) => {
  if (!req.user) return res.json({ user: null, profileCompleted: false });
  const { rows } = await pool.query('SELECT id, email, name, company, role, profile_completed FROM users WHERE id=$1', [req.user.id]);
  const u = rows[0];
  res.json({ user: u ? { id: u.id, email: u.email, name: u.name, company: u.company, role: u.role } : null, profileCompleted: !!u?.profile_completed });
});

app.post('/auth/complete-profile', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, company, role, password } = req.body || {};
    const updates = { name: name || null, company: company || null, role: role || null };
    let hash = null;
    if (password && String(password).length >= 6) {
      hash = await bcrypt.hash(String(password), 10);
    }
    const { rows } = await pool.query(
      `UPDATE users
       SET name=COALESCE($1,name), company=$2, role=$3,
           password_hash=COALESCE($4, password_hash),
           profile_completed=true
       WHERE id=$5
       RETURNING id, email, name, company, role, profile_completed`,
      [updates.name, updates.company, updates.role, hash, req.user.id]
    );
    res.json({ user: rows[0], profileCompleted: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});

// Google OAuth routes
if (hasGoogle) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: frontUrl('/login') }), async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT profile_completed FROM users WHERE id=$1', [req.user.id]);
      const profileCompleted = rows[0]?.profile_completed === true;
      res.redirect(profileCompleted ? frontUrl('/') : frontUrl('/onboarding'));
    } catch (e) {
      res.redirect(frontUrl('/login'));
    }
  });
} else {
  app.get('/auth/google', (req, res) => res.status(501).json({ error: 'Google OAuth not configured' }));
  app.get('/auth/google/callback', (req, res) => res.status(501).json({ error: 'Google OAuth not configured' }));
}

// Minimal root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is ready' });
});

// Plans CRUD (requires auth)
app.get('/plans', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { rows } = await pool.query('SELECT id, name, model_json as model, tasks_json as tasks, created_at, updated_at FROM user_plans WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ plans: rows });
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

app.get('/plans/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { rows } = await pool.query('SELECT id, name, model_json as model, tasks_json as tasks, created_at, updated_at FROM user_plans WHERE user_id=$1 AND id=$2', [req.user.id, id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

app.post('/plans', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id, name, model, tasks } = req.body || {};
    if (!id || !model) return res.status(400).json({ error: 'id and model are required' });
    const planName = name || model.name || 'Plan';
    await pool.query(
      `INSERT INTO user_plans (id, user_id, name, model_json, tasks_json)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, model_json=EXCLUDED.model_json, tasks_json=EXCLUDED.tasks_json, updated_at=NOW()`,
      [id, req.user.id, planName, JSON.stringify(model), tasks ? JSON.stringify(tasks) : null]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'Failed to save plan' });
  }
});

app.patch('/plans/:id/tasks', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { tasks } = req.body || {};
    if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks must be array' });
    const { rowCount } = await pool.query('UPDATE user_plans SET tasks_json=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3', [JSON.stringify(tasks), id, req.user.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'Failed to update tasks' });
  }
});

app.delete('/plans/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM user_plans WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// Inventory endpoints
app.get('/inventory', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { rows } = await pool.query(
      'SELECT id, data, file_name, created_at, updated_at FROM inventory WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    // Flatten all inventory data into a single array with source file info
    const allInventoryData = [];
    rows.forEach(row => {
      const data = Array.isArray(row.data) ? row.data : [];
      data.forEach((item, index) => {
        allInventoryData.push({
          id: `${row.id}_${index}`,
          ...item,
          _source_file: row.file_name,
          _source_id: row.id,
          _created_at: row.created_at
        });
      });
    });
    
    res.json({ inventory: allInventoryData });
  } catch (e) {
    console.error('Inventory fetch error', e);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/inventory', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { data, fileName } = req.body || {};
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data must be a non-empty array' });
    }
    
    const { rows } = await pool.query(
      'INSERT INTO inventory (user_id, data, file_name) VALUES ($1, $2, $3) RETURNING id, created_at',
      [req.user.id, JSON.stringify(data), fileName || 'uploaded_file']
    );
    
    res.status(201).json({ 
      success: true, 
      id: rows[0].id, 
      count: data.length,
      created_at: rows[0].created_at
    });
  } catch (e) {
    console.error('Inventory upload error', e);
    res.status(500).json({ error: 'Failed to upload inventory data' });
  }
});

app.put('/inventory/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const updateData = req.body || {};
    
    // Extract the source file ID from the composite ID
    const sourceId = id.split('_')[0];
    
    // Get the current inventory record
    const { rows: currentRows } = await pool.query(
      'SELECT data FROM inventory WHERE id=$1 AND user_id=$2',
      [sourceId, req.user.id]
    );
    
    if (currentRows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const currentData = currentRows[0].data;
    const itemIndex = parseInt(id.split('_')[1]);
    
    if (!Array.isArray(currentData) || itemIndex >= currentData.length) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Update the specific item in the array
    const updatedData = [...currentData];
    updatedData[itemIndex] = { ...updatedData[itemIndex], ...updateData };
    
    await pool.query(
      'UPDATE inventory SET data=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
      [JSON.stringify(updatedData), sourceId, req.user.id]
    );
    
    res.json({ success: true });
  } catch (e) {
    console.error('Inventory update error', e);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

app.delete('/inventory/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    
    // Extract the source file ID from the composite ID
    const sourceId = id.split('_')[0];
    
    // Get the current inventory record
    const { rows: currentRows } = await pool.query(
      'SELECT data FROM inventory WHERE id=$1 AND user_id=$2',
      [sourceId, req.user.id]
    );
    
    if (currentRows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const currentData = currentRows[0].data;
    const itemIndex = parseInt(id.split('_')[1]);
    
    if (!Array.isArray(currentData) || itemIndex >= currentData.length) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    // Remove the specific item from the array
    const updatedData = currentData.filter((_, index) => index !== itemIndex);
    
    if (updatedData.length === 0) {
      // If no items left, delete the entire record
      await pool.query(
        'DELETE FROM inventory WHERE id=$1 AND user_id=$2',
        [sourceId, req.user.id]
      );
    } else {
      // Update with remaining items
      await pool.query(
        'UPDATE inventory SET data=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
        [JSON.stringify(updatedData), sourceId, req.user.id]
      );
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error('Inventory delete error', e);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Analyze product image (basic placeholder with optional AI)
app.post('/inventory/analyze-image', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { imageData, fileName } = req.body || {};
    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'imageData (base64 data URL) required' });
    }

    // Persist image to uploads for reference
    const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image data' });
    const mime = match[1];
    const b64 = match[2];
    const buf = Buffer.from(b64, 'base64');
    const safeName = (fileName && String(fileName).replace(/[^a-zA-Z0-9_.-]/g, '')) || `upload_${Date.now()}.png`;
    const outPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(outPath, buf);

    // Optional AI vision (fallback to heuristic)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_TOKEN;
    let aiModel = null;
    if (apiKey && GoogleGenerativeAI) {
      try {
        const client = new GoogleGenerativeAI(apiKey);
        aiModel = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      } catch {}
    }

    let analysis = null;
    if (aiModel) {
      try {
        // Use a text prompt referring to the image (note: real vision models require image parts; this is a simplified flow).
        const prompt = `You are a vision QA assistant. Given a product photo, estimate: (1) the count of visible items, (2) a short quality assessment Good/Acceptable/Poor with one reason, (3) the most likely product type (e.g., phone, dress, shoes, bottle, laptop, toy). Return only JSON: { "estimatedCount": number, "quality": "Good|Acceptable|Poor", "productType": string, "note": string }.`;
        const result = await aiModel.generateContent(`${prompt}\nNote: If unsure, give your best estimate.`);
        const text = result.response?.text?.() || '';
        const jsonLike = String(text).trim().replace(/^```json\n?|\n?```$/g, '');
        try { analysis = JSON.parse(jsonLike); } catch {}
      } catch {}
    }

    if (!analysis || typeof analysis !== 'object') {
      // Heuristic placeholder
      analysis = {
        estimatedCount: 1,
        quality: 'Good',
        productType: 'Unknown',
        note: 'Vision model unavailable; defaulting to heuristic.'
      };
    }

    res.json({
      file: `/uploads/${safeName}`,
      estimatedCount: Math.max(0, parseInt(analysis.estimatedCount) || 1),
      quality: ['Good','Acceptable','Poor'].includes(String(analysis.quality)) ? String(analysis.quality) : 'Good',
      productType: String(analysis.productType || 'Unknown'),
      note: String(analysis.note || '')
    });
  } catch (e) {
    console.error('Image analysis error', e);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// AI route: Analyze inventory data
app.post('/ai/inventory-analysis', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_TOKEN;

    const { inventoryData } = req.body || {};
    if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
      return res.status(400).json({ error: 'inventoryData must be a non-empty array' });
    }

    let aiModel = null;
    if (apiKey && GoogleGenerativeAI) {
      const client = new GoogleGenerativeAI(apiKey);
      aiModel = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    }

    // Analyze the inventory data structure
    const sampleItem = inventoryData[0];
    const columns = Object.keys(sampleItem);
    
    // Create a summary of the data for AI analysis
    const dataSummary = {
      totalItems: inventoryData.length,
      columns: columns,
      sampleData: inventoryData.slice(0, 5), // First 5 items for context
      dataTypes: columns.reduce((acc, col) => {
        const values = inventoryData.slice(0, 10).map(item => item[col]).filter(v => v !== null && v !== undefined && v !== '');
        acc[col] = {
          type: typeof values[0],
          sampleValues: values.slice(0, 3),
          hasNumeric: values.some(v => !isNaN(parseFloat(v)) && isFinite(v))
        };
        return acc;
      }, {})
    };

    const system = `You are an expert inventory management and supply-chain AI analyst. Analyze the provided inventory data and generate comprehensive insights, recommendations, predictions, AND a supply chain optimization plan.

Return ONLY a valid JSON object with this exact structure:
{
  "summary": {
    "totalItems": number,
    "totalValue": number,
    "lowStockCount": number,
    "overstockCount": number,
    "categories": array of strings
  },
  "suggestions": [
    {
      "type": "restock|reduce|optimal|warning|info",
      "title": "string",
      "description": "string", 
      "impact": "string"
    }
  ],
  "topPerformers": [
    {
      "name": "string",
      "value": number,
      "reason": "string"
    }
  ],
  "attentionItems": [
    {
      "name": "string",
      "issue": "string",
      "action": "string"
    }
  ],
  "predictions": [
    {
      "timeframe": "string",
      "description": "string",
      "confidence": number
    }
  ],
  "charts": {
    "stockDistribution": {
      "labels": ["Low Stock", "Optimal", "Overstock"],
      "datasets": [{"data": [number, number, number], "backgroundColor": ["#ef4444", "#10b981", "#f59e0b"]}]
    },
    "valueDistribution": {
      "labels": array of strings,
      "datasets": [{"label": "Value", "data": array of numbers, "backgroundColor": "#7c3aed"}]
    },
    "salesPrediction": {
      "labels": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"],
      "datasets": [{"label": "Predicted Sales", "data": array of numbers, "borderColor": "#7c3aed", "backgroundColor": "rgba(124, 58, 237, 0.1)"}]
    },
    "categoryAnalysis": {
      "labels": array of strings,
      "datasets": [{"label": "Items", "data": array of numbers, "backgroundColor": "#10b981"}]
    }
  },
  "supplyChain": {
    "summary": "string",
    "suppliers": [
      {
        "name": "string",
        "location": "City, Country",
        "distanceKm": number,
        "leadTimeDays": number,
        "reliabilityScore": number,
        "notes": "string",
        "routeLink": "https://...",
        "mapEmbedUrl": "https://..."  
      }
    ],
    "recommendations": [
      {
        "title": "string",
        "description": "string",
        "impact": "Cost | Speed | Reliability | Risk"
      }
    ]
  }
}

Guidelines:
- Identify columns that likely contain quantity/stock information (look for words like "quantity", "stock", "amount", "qty", "count")
- Identify columns that likely contain price/value information (look for words like "price", "cost", "value", "amount")
- Identify columns that likely contain product names/categories
- Make realistic assumptions about stock levels (low < 10, optimal 10-50, overstock > 50)
- Generate practical, actionable recommendations
- Create realistic chart data based on the actual inventory
- Focus on business value and actionable insights`;

    const prompt = `${system}\n\nInventory Data Summary:\n${JSON.stringify(dataSummary, null, 2)}`;
    let analysis = null;
    if (aiModel) {
      try {
        const result = await aiModel.generateContent(prompt);
        const text = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonLike = String(text).trim().replace(/^```json\n?|\n?```$/g, '');
        try { analysis = JSON.parse(jsonLike); }
        catch {
          const match = jsonLike.match(/\{[\s\S]*\}/);
          analysis = match ? JSON.parse(match[0]) : null;
        }
      } catch (e) {
        // Fall through to heuristic fallback
      }
    }

    if (!analysis || typeof analysis !== 'object') {
      // Heuristic fallback: compute simple metrics locally
      const items = inventoryData
      const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0
      const lower = (s) => String(s || '').toLowerCase()
      const qtyKey = Object.keys(items[0] || {}).find(k => /(qty|quantity|stock|count|units?)/i.test(k))
      const priceKey = Object.keys(items[0] || {}).find(k => /(price|cost|value|amount)/i.test(k))
      const nameKey = Object.keys(items[0] || {}).find(k => /(name|sku|product|item)/i.test(k))
      const catKey = Object.keys(items[0] || {}).find(k => /(cat|category|type)/i.test(k))

      let low=0,opt=0,over=0,totalValue=0
      const categoryAgg = {}
      for (const it of items) {
        const q = toNum(it?.[qtyKey])
        const p = toNum(it?.[priceKey])
        totalValue += q * p
        if (q < 10) low++; else if (q > 50) over++; else opt++
        const c = String(it?.[catKey] || 'Uncategorized')
        categoryAgg[c] = (categoryAgg[c] || 0) + 1
      }
      const categories = Object.keys(categoryAgg)
      analysis = {
        summary: {
          totalItems: items.length,
          totalValue,
          lowStockCount: low,
          overstockCount: over,
          categories
        },
        suggestions: [
          { type: 'restock', title: 'Restock low inventory', description: `There are ${low} items below threshold (10).`, impact: 'Avoid stockouts' },
          { type: 'reduce', title: 'Reduce overstock', description: `${over} items exceed optimal levels (>50).`, impact: 'Free up cashflow' },
        ],
        topPerformers: [],
        attentionItems: [],
        predictions: [
          { timeframe: 'Next 3 months', description: 'Stable demand expected with slight growth', confidence: 70 }
        ],
        charts: {
          stockDistribution: { labels: ['Low Stock','Optimal','Overstock'], datasets: [{ data: [low,opt,over], backgroundColor: ['#ef4444','#10b981','#f59e0b'] }] },
          valueDistribution: { labels: categories.slice(0,5), datasets: [{ label: 'Value', data: categories.slice(0,5).map(c => categoryAgg[c]*50), backgroundColor: '#7c3aed' }] },
          salesPrediction: { labels: ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6'], datasets: [{ label: 'Predicted Sales', data: [1000,1050,1100,1150,1200,1250], borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)' }] },
          categoryAnalysis: { labels: categories.slice(0,6), datasets: [{ label: 'Items', data: categories.slice(0,6).map(c => categoryAgg[c]), backgroundColor: '#10b981' }] }
        },
        supplyChain: {
          summary: 'Fallback supply-chain: prioritize nearer regional hubs and reduce lead times.',
          suppliers: [
            { name: 'Regional Hub A', location: 'Nearest City', distanceKm: 300, leadTimeDays: 3, reliabilityScore: 85 },
            { name: 'Regional Hub B', location: 'Secondary City', distanceKm: 800, leadTimeDays: 5, reliabilityScore: 80 }
          ],
          recommendations: [
            { title: 'Dual-source critical SKUs', description: 'Reduce risk by onboarding a backup supplier for critical items.', impact: 'Reliability' },
            { title: 'Consolidate shipments', description: 'Batch orders to reduce logistics cost per unit.', impact: 'Cost' }
          ]
        }
      }
    }

    // Validate and sanitize the response
    const sanitizedAnalysis = {
      summary: {
        totalItems: Math.max(0, parseInt(analysis.summary?.totalItems) || inventoryData.length),
        totalValue: Math.max(0, parseFloat(analysis.summary?.totalValue) || 0),
        lowStockCount: Math.max(0, parseInt(analysis.summary?.lowStockCount) || 0),
        overstockCount: Math.max(0, parseInt(analysis.summary?.overstockCount) || 0),
        categories: Array.isArray(analysis.summary?.categories) ? analysis.summary.categories.slice(0, 10) : []
      },
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 10).map(s => ({
        type: ['restock', 'reduce', 'optimal', 'warning', 'info'].includes(s.type) ? s.type : 'info',
        title: String(s.title || 'Suggestion'),
        description: String(s.description || ''),
        impact: String(s.impact || '')
      })) : [],
      topPerformers: Array.isArray(analysis.topPerformers) ? analysis.topPerformers.slice(0, 5).map(p => ({
        name: String(p.name || 'Item'),
        value: Math.max(0, parseFloat(p.value) || 0),
        reason: String(p.reason || 'High performance')
      })) : [],
      attentionItems: Array.isArray(analysis.attentionItems) ? analysis.attentionItems.slice(0, 5).map(a => ({
        name: String(a.name || 'Item'),
        issue: String(a.issue || 'Needs attention'),
        action: String(a.action || 'Review required')
      })) : [],
      predictions: Array.isArray(analysis.predictions) ? analysis.predictions.slice(0, 5).map(p => ({
        timeframe: String(p.timeframe || 'Future'),
        description: String(p.description || 'Prediction'),
        confidence: Math.min(100, Math.max(0, parseInt(p.confidence) || 75))
      })) : [],
      charts: {
        stockDistribution: {
          labels: ['Low Stock', 'Optimal', 'Overstock'],
          datasets: [{
            data: [
              Math.max(0, parseInt(analysis.charts?.stockDistribution?.datasets?.[0]?.data?.[0]) || 0),
              Math.max(0, parseInt(analysis.charts?.stockDistribution?.datasets?.[0]?.data?.[1]) || 0),
              Math.max(0, parseInt(analysis.charts?.stockDistribution?.datasets?.[0]?.data?.[2]) || 0)
            ],
            backgroundColor: ['#ef4444', '#10b981', '#f59e0b']
          }]
        },
        valueDistribution: {
          labels: Array.isArray(analysis.charts?.valueDistribution?.labels) ? 
            analysis.charts.valueDistribution.labels.slice(0, 8) : 
            ['Category 1', 'Category 2', 'Category 3'],
          datasets: [{
            label: 'Value',
            data: Array.isArray(analysis.charts?.valueDistribution?.datasets?.[0]?.data) ?
              analysis.charts.valueDistribution.datasets[0].data.slice(0, 8).map(d => Math.max(0, parseFloat(d) || 0)) :
              [1000, 2000, 1500],
            backgroundColor: '#7c3aed'
          }]
        },
        salesPrediction: {
          labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
          datasets: [{
            label: 'Predicted Sales',
            data: Array.isArray(analysis.charts?.salesPrediction?.datasets?.[0]?.data) ?
              analysis.charts.salesPrediction.datasets[0].data.slice(0, 6).map(d => Math.max(0, parseFloat(d) || 0)) :
              [1000, 1200, 1100, 1300, 1400, 1500],
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true
          }]
        },
        categoryAnalysis: {
          labels: Array.isArray(analysis.charts?.categoryAnalysis?.labels) ?
            analysis.charts.categoryAnalysis.labels.slice(0, 6) :
            ['Category A', 'Category B', 'Category C'],
          datasets: [{
            label: 'Items',
            data: Array.isArray(analysis.charts?.categoryAnalysis?.datasets?.[0]?.data) ?
              analysis.charts.categoryAnalysis.datasets[0].data.slice(0, 6).map(d => Math.max(0, parseInt(d) || 0)) :
              [10, 15, 8],
            backgroundColor: '#10b981'
          }]
        }
      },
      supplyChain: {
        summary: String(analysis.supplyChain?.summary || 'Optimized sourcing and routing suggestions based on proximity and reliability.'),
        suppliers: Array.isArray(analysis.supplyChain?.suppliers) ? analysis.supplyChain.suppliers.slice(0, 5).map(s => ({
          name: String(s.name || 'Supplier'),
          location: String(s.location || 'Unknown'),
          distanceKm: Math.max(0, parseFloat(s.distanceKm) || 0),
          leadTimeDays: Math.max(0, parseInt(s.leadTimeDays) || 0),
          reliabilityScore: Math.min(100, Math.max(0, parseInt(s.reliabilityScore) || 75)),
          notes: String(s.notes || ''),
          routeLink: String(s.routeLink || ''),
          mapEmbedUrl: String(s.mapEmbedUrl || '')
        })) : [],
        recommendations: Array.isArray(analysis.supplyChain?.recommendations) ? analysis.supplyChain.recommendations.slice(0, 5).map(r => ({
          title: String(r.title || 'Improve Supply Chain'),
          description: String(r.description || ''),
          impact: String(r.impact || 'Cost')
        })) : []
      }
    };

    res.json(sanitizedAnalysis);
  } catch (e) {
    console.error('AI inventory analysis error', e);
    res.status(500).json({ error: 'AI inventory analysis failed' });
  }
});

// AI route: Generate a plan-specific checklist
app.post('/ai/plan-checklist', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_TOKEN;
    if (!apiKey || !GoogleGenerativeAI) {
      return res.status(501).json({ error: 'Gemini not configured on server' });
    }

    const { model } = req.body || {};
    if (!model || !model.name) {
      return res.status(400).json({ error: 'model is required' });
    }

    const client = new GoogleGenerativeAI(apiKey);
    const aiModel = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const system = `You are an operator coach. Create a practical 8-14 item startup execution checklist tailored to the provided business model.
The checklist MUST be strictly sequential like a journey: each task depends on the previous being completed. Order the items from first to last.
Return ONLY a JSON array (no prose). Each item must have: title, details, category (one of: Planning, Product, Marketing, Sales, Ops, Finance, Legal), and suggestedOwner (short role).`;

    const brief = {
      name: String(model.name || ''),
      description: String(model.description || ''),
      targetCustomer: String(model.targetCustomer || ''),
      valueProp: String(model.valueProp || ''),
      pricing: String(model.pricing || ''),
      revenueStreams: String(model.revenueStreams || ''),
      keyActivities: String(model.keyActivities || ''),
      marketingPlan: String(model.marketingPlan || ''),
      operations: String(model.operations || ''),
      risks: String(model.risks || ''),
      financialAssumptions: String(model.financialAssumptions || '')
    };

    const prompt = `${system}\n\nBusiness Model:\n${JSON.stringify(brief, null, 2)}`;
    const result = await aiModel.generateContent(prompt);
    const text = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonLike = String(text).trim().replace(/^```json\n?|\n?```$/g, '');
    let data;
    try { data = JSON.parse(jsonLike); }
    catch {
      const match = jsonLike.match(/\[[\s\S]*\]/);
      data = match ? JSON.parse(match[0]) : null;
    }
    if (!Array.isArray(data)) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const now = Date.now();
    const tasks = data.slice(0, 20).map((t, i) => ({
      id: `${now}_${i}`,
      title: String(t.title || `Task ${i + 1}`),
      details: String(t.details || ''),
      category: String(t.category || 'Planning'),
      suggestedOwner: String(t.suggestedOwner || 'Founder'),
      done: false
    }));

    res.json({ tasks });
  } catch (e) {
    console.error('AI checklist error', e);
    res.status(500).json({ error: 'AI checklist generation failed' });
  }
});

// AI route: Generate 2-3 business model options from an idea/brief
app.post('/ai/business-models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_TOKEN;
    if (!apiKey || !GoogleGenerativeAI) {
      return res.status(501).json({ error: 'Gemini not configured on server' });
    }

    const { idea, count, location } = req.body || {};
    const trimmed = String(idea || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'idea is required' });
    const num = Math.min(Math.max(parseInt(count || 3, 10) || 3, 2), 3);
    const locationText = String(location || '').trim();

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const system = `You are a startup consultant. Generate ${num} distinct business model options for the given idea.
Return ONLY a valid JSON array. No prose. Each item must be an object with these fields:
name, description, targetCustomer, valueProp, pricing, revenueStreams, startupCosts, keyActivities, risks, marketingPlan, operations,
financialAssumptions, projections.
- financialAssumptions: a one-sentence summary of core numeric assumptions.
- projections: an object with three scenarios (base, best, worst). Each scenario is an object with arrays for the next 12 months:
  months: ["M1","M2",...,"M12"],
  revenue: [number...],
  costs: [number...],
  customers: [number...].
Consider the location context when generating business models, including local market conditions, regulations, competition, and opportunities.`;

    const locationContext = locationText ? `\nLocation: ${locationText}` : '';
    const prompt = `${system}\n\nIdea: ${trimmed}${locationContext}`;
    const result = await model.generateContent(prompt);
    const text = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response (in case fenced)
    const jsonLike = String(text).trim().replace(/^```json\n?|\n?```$/g, '');
    let data;
    try { data = JSON.parse(jsonLike); } catch {
      // attempt to find first [ ... ] block
      const match = jsonLike.match(/\[[\s\S]*\]/);
      data = match ? JSON.parse(match[0]) : null;
    }
    if (!Array.isArray(data)) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }
    // Ensure at most num items and sanitize fields
    const models = data.slice(0, num).map((m, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: String(m.name || `Option ${idx + 1}`),
      description: String(m.description || ''),
      targetCustomer: String(m.targetCustomer || ''),
      valueProp: String(m.valueProp || ''),
      pricing: String(m.pricing || ''),
      revenueStreams: String(m.revenueStreams || ''),
      startupCosts: String(m.startupCosts || ''),
      keyActivities: String(m.keyActivities || ''),
      risks: String(m.risks || ''),
      marketingPlan: String(m.marketingPlan || ''),
      operations: String(m.operations || ''),
      financialAssumptions: String(m.financialAssumptions || ''),
      projections: (function() {
        const scenarios = ['base','best','worst'];
        const p = m.projections || {};
        const normalizeScenario = (s) => {
          const sc = (p && p[s]) || {};
          const months = Array.isArray(sc.months) ? sc.months.slice(0,12) : Array.from({ length: 12 }, (_, i) => `M${i+1}`);
          const toArr = (arr, len) => Array.isArray(arr) ? arr.slice(0, len).map(n => Number(n) || 0) : Array(len).fill(0);
          const revenue = toArr(sc.revenue, months.length);
          const costs = toArr(sc.costs, months.length);
          const customers = toArr(sc.customers, months.length);
          return { months, revenue, costs, customers };
        };
        const out = {};
        scenarios.forEach(s => { out[s] = normalizeScenario(s); });
        return out;
      })()
    }));

    // Save to database if user is authenticated
    if (req.user) {
      try {
        const ideaWithLocation = locationText ? `${trimmed} (Location: ${locationText})` : trimmed;
        await pool.query(
          'INSERT INTO business_model_generations (user_id, idea, models) VALUES ($1, $2, $3)',
          [req.user.id, ideaWithLocation, JSON.stringify(models)]
        );
      } catch (dbError) {
        console.error('Failed to save generation to database:', dbError);
        // Don't fail the request if database save fails
      }
    }

    res.json({ models });
  } catch (e) {
    console.error('AI generation error', e);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// Get user's previous business model generations
app.get('/ai/business-models/previous', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { rows } = await pool.query(
      'SELECT id, idea, models, created_at FROM business_model_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    
    const generations = rows.map(row => ({
      id: row.id,
      idea: row.idea,
      models: row.models,
      createdAt: row.created_at
    }));
    
    res.json({ generations });
  } catch (e) {
    console.error('Failed to fetch previous generations:', e);
    res.status(500).json({ error: 'Failed to fetch previous generations' });
  }
});

// Delete a specific generation
app.delete('/ai/business-models/previous/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM business_model_generations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Generation not found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error('Failed to delete generation:', e);
    res.status(500).json({ error: 'Failed to delete generation' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
