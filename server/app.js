import cors from "cors";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import empresaRoutes from "./routes/empresaRoutes.js";
import setorRoutes from "./routes/setorRoutes.js";
import funcionarioRoutes from "./routes/funcionarioRoutes.js";
import cargoRoutes from "./routes/cargoRoutes.js";
import descricaoRoutes from "./routes/descricaoRoutes.js";
import notificacaoRoutes from "./routes/notificacaoRoutes.js";
import downloadRoute from "./routes/downloadRoute.js";

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = ["http://localhost:5173", "tauri://localhost"];

app.use(express.json());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Origin não permitido pelo CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET_KEY_USER,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
    },
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

export default app;
