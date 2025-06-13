import express from "express";
import {
  registerController,
  loginController,
  logoutController,
  getAdminById,
  updatePasswordController,
  updateProfileController,
  updateAdmin,
  deleteAdmin,
  getAdmins,
  updateProfilePicController,
  getAdminProfileController,
} from "../controllers/adminController.js";
import {
  isAdminAuth,
  checkAdminAuth,
  validateAdmin,
  validateUpdateAdmin,
  validatePasswordAdmin,
  validateProfileUpdateAdmin,
} from "../middlewares/adminMiddleware.js";
import { singleAdminUpload } from "../middlewares/multer.js";

const router = express.Router();

// Kullanıcı kaydı validasyonlu
router.post("/register", singleAdminUpload, validateAdmin, registerController);
router.get("/get", getAdmins);
router.put(
  "/profile-update",
  isAdminAuth,
  singleAdminUpload,
  validateProfileUpdateAdmin,
  updateProfileController
);
router.put(
  "/updateAdmin/:id",
  singleAdminUpload,
  validateUpdateAdmin,
  updateAdmin
);
router.delete("/deleteAdmin/:id", deleteAdmin);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/getAdminId/:id", getAdminById);
router.put(
  "/update-password",
  isAdminAuth,
  validatePasswordAdmin,
  updatePasswordController
);
router.get("/profile", isAdminAuth, getAdminProfileController);
router.put(
  "/update-picture",
  isAdminAuth,
  singleAdminUpload,
  updateProfilePicController
);

export default router;
