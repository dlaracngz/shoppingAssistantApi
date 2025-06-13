import express from "express";
import {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import {
  validateCategory,
  validateCategoryUpdate,
} from "../middlewares/categoryMiddleware.js"; // Validasyon middleware'i
import { singleCategoryUpload } from "../middlewares/multer.js";

const router = express.Router();

// Yeni kategori eklerken validasyon middleware'ini kullanıyoruz
router.post("", singleCategoryUpload, validateCategory, addCategory);

// Tüm kategorileri almak için herhangi bir validasyon gerekmiyor
router.get("", getCategories);

// Belirli bir kategoriyi almak için validasyon gerekmiyor
router.get("/:id", getCategoryById);

// Kategori güncellerken validasyon middleware'ini kullanıyoruz
router.put(
  "/:id",
  singleCategoryUpload,
  validateCategoryUpdate,
  updateCategory
);

// Kategori silerken validasyon gerekmiyor
router.delete("/:id", deleteCategory);

export default router;
