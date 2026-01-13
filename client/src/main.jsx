import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

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
import GerenciarEmpresas from "./pages/GerenciarEmpresas.jsx";
import GerenciarFeriados from "./pages/GerenciarFeriados.jsx";
import { AvisoProvider } from "./context/AvisoContext.jsx";

import "./style.css";

// Layout wrapper que fornece o contexto do Aviso para todas as rotas
function RootLayout() {
  return (
    <AvisoProvider>
      <Outlet />
    </AvisoProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
      {
        path: "/gerenciar-empresas",
        element: <GerenciarEmpresas />,
      },
      {
        path: "/gerenciar-feriados",
        element: <GerenciarFeriados />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
