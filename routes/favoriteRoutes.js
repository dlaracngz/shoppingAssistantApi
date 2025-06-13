import express from "express";
import {
  addFavorite,
  getFavorite,
  getFavoriteById,
  updateFavorite,
  deleteFavorite,
  getFavoriteData,
} from "../controllers/favoriteController.js";
import { isAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("", isAuth, addFavorite);
router.get("/get", getFavorite);
router.get("/getFavData", isAuth, getFavoriteData);
router.get("/:id", getFavoriteById);
router.put("/:id", updateFavorite);
router.delete("/:id", deleteFavorite);

export default router;
