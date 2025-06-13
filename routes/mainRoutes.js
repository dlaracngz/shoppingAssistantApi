import express from "express";
import testRoutes from "../routes/testRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import brandRoutes from "../routes/brandRoutes.js";
import marketRoutes from "../routes/marketRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import favoriteRotes from "../routes/favoriteRoutes.js";
import cartRoutes from "../routes/cartRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import productmarketRoutes from "../routes/productmarketRoutes.js";
import imageRoutes from "../routes/imagesRoutes.js";

const router = express.Router();

router.use("/test", testRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/markets", marketRoutes);
router.use("/products", productRoutes);
router.use("/favorite", favoriteRotes);
router.use("/cart", cartRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/productMarket", productmarketRoutes);
router.use("/images", imageRoutes);

export default router;
