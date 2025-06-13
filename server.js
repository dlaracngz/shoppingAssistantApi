import express from "express";
import colors from "colors";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import mainRouter from "./routes/mainRoutes.js";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";

import { sequelize, connectDB } from "./config/db.js";

dotenv.config();

console.log("MYSQL_URL:", process.env.MYSQL_URL);

// Veritabanına bağlan
connectDB();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const app = express();

// Middleware'ler
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Geliştirme sırasında frontend'iniz
      "http://192.168.137.1:8080", // Yerel IP üzerinden çalışan frontend (telefon ile test ediyorsanız)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"], // İzin verilen HTTP metodları
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    credentials: true, // Oturum bilgilerini (cookies, authorization header) taşımak için
  })
);

app.use(cookieParser());

// API rotaları
app.use("/api", mainRouter);
app.get("/", (req, res) => {
  return res.status(200).send("<h1>Welcome To Node Server</h1>");
});

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

sequelize
  .sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `🚀 Server Running On PORT ${PORT} on ${NODE_ENV}`.bgMagenta.white
      );
    });
  })
  .catch((error) => {
    console.error("❌ Database Sync Error:", error);
  });
