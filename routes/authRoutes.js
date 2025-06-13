import express from "express";
import {
  loginController,
  getUserProfileController,
  logoutController,
  updateProfileController,
  updatePasswordController,
  updateProfilePicController,
} from "../controllers/authController.js";
import {
  isAuth,
  checkAuth,
  validateUpdateUser,
  validateProfileUpdateUser,
  validateUser,
  validatePasswordUser,
  validatePic,
  verifyToken,
} from "../middlewares/authMiddleware.js";
import { singleUpload } from "../middlewares/multer.js";
import JWT from "jsonwebtoken";

const router = express.Router();

router.post("/login", loginController);
router.get("/profile", isAuth, getUserProfileController);
router.get("/logout", logoutController);
router.get("/verifyToken", verifyToken);
router.put(
  "/profile-update",
  isAuth,
  validateProfileUpdateUser,
  updateProfileController
);
router.put(
  "/update-password",
  isAuth,
  validatePasswordUser,
  updatePasswordController
);
router.put(
  "/update-picture",
  isAuth,
  singleUpload,
  validatePic,
  updateProfilePicController
);

export default router;
