import express from "express";
import {
  addMarket,
  getMarkets,
  getMarketById,
  updateMarket,
  deleteMarket,
  getAdminMarket,
  getAdminMarketNew,
  getMarketData,
} from "../controllers/marketController.js";
import { singleMarketUpload } from "../middlewares/multer.js";
import {
  validateMarket,
  validateMarketUpdate,
} from "../middlewares/marketMiddleware.js"; // Validasyon middleware'i
import { isAdminAuth } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Yeni market eklerken validasyon middleware'ini kullanıyoruz
router.post("", singleMarketUpload, validateMarket, addMarket);

// Tüm marketleri almak için herhangi bir validasyon gerekmiyor
router.get("", getMarkets);

// Market güncellerken validasyon middleware'ini kullanıyoruz
router.put("/:id", singleMarketUpload, validateMarketUpdate, updateMarket);

// Market silerken validasyon gerekmiyor
router.delete("/:id", deleteMarket);

router.get("/getMarketName/:id", getAdminMarket);

router.get("/getAdminMarket", isAdminAuth, getAdminMarketNew);

router.get("/getAdminData", getMarketData);

// Belirli bir marketi almak için validasyon gerekmiyor
router.get("/:id", getMarketById);

export default router;
