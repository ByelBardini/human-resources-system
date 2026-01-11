import multer from "multer";

function fileFilter(_req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  cb(
    ok ? null : new Error("Tipo de arquivo inválido (use JPG, PNG ou WEBP)"),
    ok
  );
}

// Usando memoryStorage para ter acesso direto ao buffer para salvar em BLOB
const storage = multer.memoryStorage();

const uploadLogoEmpresa = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export default uploadLogoEmpresa;
