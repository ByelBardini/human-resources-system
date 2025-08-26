import { login, logout } from "./../controllers/authController.js";
import express from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = express.Router();

router.post("/login", asyncHandler(login));
router.get("/logout", asyncHandler(logout));

export default router;
