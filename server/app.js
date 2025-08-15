import cors from "cors";
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

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET_KEY_USER,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1 * 1000 * 60 * 24,
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
    },
  })
);

app.use("/", authRoutes);
app.use("/", usuarioRoutes);
app.use("/", empresaRoutes);
app.use("/", setorRoutes);
app.use("/", funcionarioRoutes);
app.use("/", cargoRoutes);

export default app;