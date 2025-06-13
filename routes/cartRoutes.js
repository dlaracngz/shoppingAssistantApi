import express from "express";
import {
  addCart,
  getCart,
  getCartById,
  getCartData,
  updateCart,
  deleteCart,
  getCartDataAdmin,
} from "../controllers/cartController.js";
import { isAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("", isAuth, addCart);
router.get("/get", getCart);
router.get("/getCartData", isAuth, getCartData);
router.get("/getCartDataAdmin", getCartDataAdmin);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);
router.get("/:id", getCartById);

export default router;
