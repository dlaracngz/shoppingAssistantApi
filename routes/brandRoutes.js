import express from "express";
import {
  addBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";
import {
  validateBrand,
  validateUpdateBrand,
} from "../middlewares/brandMiddleware.js";
import { singleBrandUpload } from "../middlewares/multer.js";

const router = express.Router();

// Yeni marka eklerken validasyon middleware'ini kullanıyoruz
router.post("", singleBrandUpload, validateBrand, addBrand);

// Tüm markaları almak için herhangi bir validasyon gerekmiyor
router.get("", getBrands);

router.get("/:id", getBrandById);

router.put("/:id", singleBrandUpload, validateUpdateBrand, updateBrand);

router.delete("/:id", deleteBrand);

export default router;
