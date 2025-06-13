import express from "express";
import {
  addProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductData,
} from "../controllers/productController.js";
import {
  validateProduct,
  validateUpdateProduct,
} from "../middlewares/productMiddleware.js"; // Validasyon middleware'i
import { singleProductUpload } from "../middlewares/multer.js";
/*import { singleProductUploadWithLogging } from "../middlewares/multer.js";*/

const router = express.Router();

// Ürün ekleme işlemi için validasyon middleware'ini kullanıyoruz
router.post(
  "",
  //singleProductUploadWithLogging,
  singleProductUpload,
  validateProduct,
  addProduct
);

// Ürünleri listelemek için herhangi bir validasyon gerekmiyor
router.get("", getProduct);

router.get("/getProductData", getProductData);

router.get("/:id", getProductById);

// Ürün güncelleme işlemi için validasyon middleware'ini kullanıyoruz
router.put("/:id", singleProductUpload, validateUpdateProduct, updateProduct);

// Ürün silme işlemi için validasyon gerekmiyor
router.delete("/:id", deleteProduct);

export default router;
