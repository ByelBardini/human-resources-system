import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Empresa from "./pages/Empresa.jsx";
import Usuario from "./pages/Usuario.jsx";
import CargosUsuarios from "./pages/CargosUsuarios.jsx";
import Ponto from "./pages/Ponto.jsx";
import Justificativa from "./pages/Justificativa.jsx";
import RelatorioMensal from "./pages/RelatorioMensal.jsx";
import PerfisJornada from "./pages/PerfisJornada.jsx";
import GerenciarPontos from "./pages/GerenciarPontos.jsx";
import { AvisoProvider } from "./context/AvisoContext.jsx";

import "./style.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/empresa",
    element: <Empresa />,
  },
  {
    path: "/usuario",
    element: <Usuario />,
  },
  {
    path: "/cargos-usuarios",
    element: <CargosUsuarios />,
  },
  {
    path: "/ponto",
    element: <Ponto />,
  },
  {
    path: "/justificativa",
    element: <Justificativa />,
  },
  {
    path: "/relatorio-mensal",
    element: <RelatorioMensal />,
  },
  {
    path: "/perfis-jornada",
    element: <PerfisJornada />,
  },
  {
    path: "/gerenciar-pontos",
    element: <GerenciarPontos />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AvisoProvider>
      <RouterProvider router={router} />
    </AvisoProvider>
  </StrictMode>
);
