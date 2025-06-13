import express from "express";
import {
  getLatestImage,
  uploadProductImage,
} from "../controllers/imagesController.js"; // Controller'ı doğru şekilde içe aktarın
import { isAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Fotoğraf yüklemek için POST route
router.post("/upload", isAuth, uploadProductImage);
router.get("/latest-image", getLatestImage);

export default router;
