import { login } from "./../controllers/authController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import express from "express";

const router = express.Router();

router.post("/login", asyncHandler(login));

export default router;
