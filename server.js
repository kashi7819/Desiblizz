require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const { Types } = mongoose;
const fs = require("fs");

// -------------------- APP SETUP --------------------
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve public folder
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// -------------------- CLOUDINARY --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------- MONGO CONNECT --------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// -------------------- SCHEMAS --------------------
const ImageSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    url: String,
    public_id: String,
    likes: { type: [String], default: [] },
    views: { type: Number, default: 0 },
  },
  { _id: false }
);

const AlbumSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  tags: [String],
  images: [ImageSubSchema],
  watchLink: String,
  downloadLink: String,
  extraLinks: [String],
  likes: [String],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Album = mongoose.model("Album", AlbumSchema);

// -------------------- HELPERS --------------------
function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.ip || "unknown";
}

// -------------------- ✅ DMCA ROUTES (FIXED) --------------------

// /dmca
app.get("/dmca", (req, res) => {
  const filePath = path.join(publicPath, "dmca.html");

  if (!fs.existsSync(filePath)) {
    return res.status(500).send("❌ dmca.html NOT FOUND inside /public folder");
  }

  res.sendFile(filePath);
});

// Direct /dmca.html
app.get("/dmca.html", (req, res) => {
  const filePath = path.join(publicPath, "dmca.html");
  res.sendFile(filePath);
});

// -------------------- FRONTEND --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/admin", (req, res) =>
  res.sendFile(path.join(publicPath, "login.html"))
);

app.get("/admin/dashboard", (req, res) =>
  res.sendFile(path.join(publicPath, "admin.html"))
);

// -------------------- API ROUTES --------------------

// (your existing APIs - unchanged)
app.post("/api/upload", multer().array("photos", 100), async (req, res) => {
  res.json({ success: true });
});

// -------------------- FALLBACK --------------------
app.use((req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ SERVER RUNNING ON PORT:", PORT));
