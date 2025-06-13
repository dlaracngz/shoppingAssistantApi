import express from "express";
import {
  add_productMarket,
  get_productMarket,
  get_productMarketById,
  update_productMarket,
  delete_productMarket,
  //getMarketsByProductId,
  getAdminMarketProducts,
  getAdminMarketProductsNew,
  getProductMarketData,
  getFilteredProducts,
  getProductsByCategory,
  getProductMarketBySearch,
  getDiscountedProducts,
  getLowStockProducts,
} from "../controllers/productmarketController.js";
import {
  authenticateAdmin,
  validateProductMarket,
  validateUpdateProductMarket,
} from "../middlewares/productmarketMiddleware.js";
import { isAdminAuth } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.post("", validateProductMarket, add_productMarket);

router.get("/get", get_productMarket);

router.get("/getBySearch", getProductMarketBySearch);

router.get("/get-product", isAdminAuth, getAdminMarketProductsNew);

router.get("/productMarketData", getProductMarketData);

//İndirimde olan ürünleri listelemek için
router.get("/discountProducts", getDiscountedProducts);

// Stoğu 10 dan az kalan ürünleri listelemek için
router.get("/getLowStockProducts", getLowStockProducts);

//marka veya kategoriye göre filtreleme
router.get("/filter", getFilteredProducts);

router.get("/:id", get_productMarketById);

router.put("/:id", validateUpdateProductMarket, update_productMarket);

router.delete("/:id", delete_productMarket);

// router.get("/getmarket/:id", getMarketsByProductId);

router.get("/get-product-market/:id", getAdminMarketProducts);

router.get("/by-category/:categoryId", getProductsByCategory);

export default router;
