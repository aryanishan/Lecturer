import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* ─── MySQL connection pool ─── */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "lecturer",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
});

/* ─── helpers ─── */
const emptyData = () => ({ currentPlaylist: null, savedPlaylists: [], completedVideos: {}, videoProgress: {}, learningLadder: [] });

function sanitizeData(data) {
  const input = data && typeof data === "object" ? data : {};
  return {
    currentPlaylist: input.currentPlaylist || null,
    savedPlaylists: Array.isArray(input.savedPlaylists) ? input.savedPlaylists : [],
    completedVideos: input.completedVideos && typeof input.completedVideos === "object" && !Array.isArray(input.completedVideos) ? input.completedVideos : {},
    favorites: Array.isArray(input.favorites) ? input.favorites.filter(f => typeof f === "string") : [],
    notes: input.notes && typeof input.notes === "object" && !Array.isArray(input.notes) ? input.notes : {},
    videoProgress: input.videoProgress && typeof input.videoProgress === "object" && !Array.isArray(input.videoProgress) ? input.videoProgress : {},
    learningLadder: Array.isArray(input.learningLadder) ? [...new Set(input.learningLadder.filter(id => typeof id === "string"))] : [],
  };
}
function publicUser(user) { return { id: user.id, email: user.email }; }
function createToken(user) { return jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: "7d" }); }
function validateCredentials(email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

async function requireUser(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ message: "Sign in is required." });
  try {
    const payload = jwt.verify(token, jwtSecret);
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [payload.sub]);
    if (rows.length === 0) return response.status(401).json({ message: "Account no longer exists." });
    request.user = rows[0];
    // Parse the JSON data column
    request.user.data = typeof request.user.data === "string" ? JSON.parse(request.user.data) : request.user.data;
    return next();
  } catch { return response.status(401).json({ message: "Your session has expired. Please sign in again." }); }
}

/* ─── Express app ─── */
const app = express();
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "1mb" }));

/* ─── Routes ─── */
app.get("/api/health", (_request, response) => response.json({ ok: true }));

app.post("/api/auth/register", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    const error = validateCredentials(email, password);
    if (error) return response.status(400).json({ message: error });

    // Check if email already exists
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return response.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const data = JSON.stringify(emptyData());
    const [result] = await pool.execute(
      "INSERT INTO users (email, password_hash, data) VALUES (?, ?, ?)",
      [email, passwordHash, data]
    );

    const user = { id: result.insertId, email };
    return response.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return response.status(401).json({ message: "Incorrect email or password." });

    const user = rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) return response.status(401).json({ message: "Incorrect email or password." });

    return response.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

app.get("/api/data", requireUser, (request, response) => response.json(sanitizeData(request.user.data)));

app.put("/api/data", requireUser, async (request, response, next) => {
  try {
    const cleaned = sanitizeData(request.body);
    await pool.execute("UPDATE users SET data = ? WHERE id = ?", [JSON.stringify(cleaned), request.user.id]);
    return response.json(cleaned);
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => { console.error(error); response.status(500).json({ message: "Something went wrong on the server." }); });

/* ─── Start ─── */
async function startServer() {
  if (!jwtSecret || jwtSecret === "replace-this-with-a-long-random-secret") throw new Error("Set a strong JWT_SECRET in backend/.env before starting the API.");

  // Test the database connection
  try {
    await pool.execute("SELECT 1");
    console.log("Connected to MySQL database.");
  } catch (error) {
    throw new Error(`Cannot connect to MySQL: ${error.message}`);
  }

  app.listen(port, () => console.log(`Lecturer API is running at http://localhost:${port}`));
}
startServer().catch((error) => { console.error(`Unable to start the API: ${error.message}`); process.exit(1); });
