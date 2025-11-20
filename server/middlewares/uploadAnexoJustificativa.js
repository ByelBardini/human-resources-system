import fs from "fs";
import path from "path";
import multer from "multer";

const uploadRoot = path.join(process.cwd(), "uploads");
const arquivosDir = path.join(uploadRoot, "justificativas");

fs.mkdirSync(arquivosDir, { recursive: true });

function makeFilename(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const baseFromBody = String(req.body?.nome || "justificativa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  cb(null, `${Date.now()}-${baseFromBody}${ext}`);
}

function fileFilter(_req, file, cb) {
  const ok = ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype);
  cb(
    ok ? null : new Error("Tipo de arquivo inválido (use JPG, PNG ou PDF)"),
    ok
  );
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, arquivosDir),
  filename: makeFilename,
});

const uploadAnexoJustificativa = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadAnexoJustificativa;

