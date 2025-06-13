import express from "express";
import {
  registerController,
  updateUser,
  deleteUser,
  getUsers,
  getUserById,
} from "../controllers/userController.js";
import {
  validateUser,
  validateUpdateUser,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", validateUser, registerController);

router.get("/get", getUsers);

router.put("/:id", validateUpdateUser, updateUser);

router.get("/getUserId/:id", getUserById);

router.delete("/:id", deleteUser);

export default router;
