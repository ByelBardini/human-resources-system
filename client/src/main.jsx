import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

import { AvisoProvider } from "./context/AvisoContext.jsx";
import "./style.css";

// Componente de loading para o Suspense
function PageLoader() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <p className="text-white/60 text-sm font-medium">Carregando...</p>
      </div>
    </div>
  );
}

// Login carrega imediatamente (página inicial)
import Login from "./pages/Login.jsx";

// Lazy loading das outras páginas (carregam sob demanda)
const Home = lazy(() => import("./pages/Home.jsx"));
const Empresa = lazy(() => import("./pages/Empresa.jsx"));
const Usuario = lazy(() => import("./pages/Usuario.jsx"));
const CargosUsuarios = lazy(() => import("./pages/CargosUsuarios.jsx"));
const Ponto = lazy(() => import("./pages/Ponto.jsx"));
const Justificativa = lazy(() => import("./pages/Justificativa.jsx"));
const RelatorioMensal = lazy(() => import("./pages/RelatorioMensal.jsx"));
const PerfisJornada = lazy(() => import("./pages/PerfisJornada.jsx"));
const GerenciarPontos = lazy(() => import("./pages/GerenciarPontos.jsx"));
const GerenciarEmpresas = lazy(() => import("./pages/GerenciarEmpresas.jsx"));
const GerenciarFeriados = lazy(() => import("./pages/GerenciarFeriados.jsx"));
const GerenciarFerias = lazy(() => import("./pages/GerenciarFerias.jsx"));
const EmitirRelatorios = lazy(() => import("./pages/EmitirRelatorios.jsx"));
const CalculadoraHoras = lazy(() => import("./pages/CalculadoraHoras.jsx"));

// Layout wrapper que fornece o contexto do Aviso para todas as rotas
function RootLayout() {
  return (
    <AvisoProvider>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
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
      {
        path: "/gerenciar-ferias",
        element: <GerenciarFerias />,
      },
      {
        path: "/emitir-relatorios",
        element: <EmitirRelatorios />,
      },
      {
        path: "/calculadora-horas",
        element: <CalculadoraHoras />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
