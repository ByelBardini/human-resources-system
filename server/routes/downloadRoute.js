import fs from "fs";
import path from "path";
import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = express.Router();
const uploadRoot = path.join(process.cwd(), "uploads");

router.get("/download", verificaToken, asyncHandler((req, res) => {
  const rel = String(req.query.path || "");
  const full = path.join(
    process.cwd(),
    rel.startsWith("/") ? rel.slice(1) : rel
  );

  if (!full.startsWith(uploadRoot) || !fs.existsSync(full)) {
    return res.status(404).end();
  }

  res.download(full, path.basename(full));
}));

export default router;
