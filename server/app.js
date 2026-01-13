import cors from "cors";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import empresaRoutes from "./routes/empresaRoutes.js";
import setorRoutes from "./routes/setorRoutes.js";
import funcionarioRoutes from "./routes/funcionarioRoutes.js";
import cargoRoutes from "./routes/cargoRoutes.js";
import descricaoRoutes from "./routes/descricaoRoutes.js";
import notificacaoRoutes from "./routes/notificacaoRoutes.js";
import downloadRoute from "./routes/downloadRoute.js";
import cargoUsuarioRoutes from "./routes/cargoUsuarioRoutes.js";
import permissaoRoutes from "./routes/permissaoRoutes.js";
import pontoRoutes from "./routes/pontoRoutes.js";
import justificativaRoutes from "./routes/justificativaRoutes.js";
import relatorioRoutes from "./routes/relatorioRoutes.js";
import perfilJornadaRoutes from "./routes/perfilJornadaRoutes.js";
import feriadoRoutes from "./routes/feriadoRoutes.js";
import { ApiError } from "./middlewares/ApiError.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/", authRoutes);
app.use("/", usuarioRoutes);
app.use("/", empresaRoutes);
app.use("/", setorRoutes);
app.use("/", funcionarioRoutes);
app.use("/", cargoRoutes);
app.use("/", descricaoRoutes);
app.use("/", notificacaoRoutes);
app.use("/", downloadRoute);
app.use("/", cargoUsuarioRoutes);
app.use("/", permissaoRoutes);
app.use("/", pontoRoutes);
app.use("/", justificativaRoutes);
app.use("/", relatorioRoutes);
app.use("/", perfilJornadaRoutes);
app.use("/", feriadoRoutes);

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details || null,
    });
  }

  console.error(err);

  res.status(500).json({
    status: 500,
    code: "ERR_INTERNAL",
    message: "Erro interno do servidor",
  });
});

export default app;
