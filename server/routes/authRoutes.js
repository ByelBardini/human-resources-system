import {
  login,
  logout,
} from "./../controllers/authController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";

const router = express.Router();

router.post("/login", asyncHandler(login));
router.get("/logout", asyncHandler(logout));

export default router;
