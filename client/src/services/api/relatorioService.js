import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

const baseURL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
}

async function downloadBlob(url, options = {}, defaultFilename) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw { status: response.status, message: data?.message || `Erro ${response.status}` };
  }
  const contentDisposition = response.headers.get("content-disposition") || response.headers.get("Content-Disposition");
  let filename = defaultFilename;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
      contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
    if (match && match[1]) {
      try {
        filename = decodeURIComponent(match[1].trim());
      } catch {
        filename = match[1].trim();
      }
    }
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
  return { success: true };
}

export async function getRelatorioMensal(mes, ano) {
  try {
    const response = await api.get("/relatorio/mensal", { params: { mes, ano } });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar relatório mensal");
  }
}

export async function getTotaisMensais(mes, ano) {
  try {
    const response = await api.get("/relatorio/totais", { params: { mes, ano } });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar totais mensais");
  }
}

export async function getEmpresasRelatorios() {
  try {
    const response = await api.get("/relatorio/empresas");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar empresas para relatórios");
  }
}

export async function exportarFuncoes(empresaId) {
  try {
    const url = `${baseURL}/relatorio/funcoes/${empresaId}`;
    await downloadBlob(url, { method: "GET" }, "funcoes.xlsx");
    return { success: true };
  } catch (err) {
    throw handleApiError(err, "Erro ao exportar relatório de funções");
  }
}

export async function getCargosRelatorio(empresaId) {
  try {
    const response = await api.get(`/relatorio/cargos/${empresaId}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funções para relatório");
  }
}

export async function getSetoresNiveisRelatorio(empresaId) {
  try {
    const response = await api.get(`/relatorio/setores-niveis/${empresaId}`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar setores e níveis");
  }
}

export async function exportarProjecaoSalarial(empresaId, cargoIds) {
  try {
    const url = `${baseURL}/relatorio/projecao-salarial`;
    await downloadBlob(url, {
      method: "POST",
      body: JSON.stringify({ empresa_id: empresaId, cargo_ids: cargoIds || [] }),
    }, "projecao_salarial.xlsx");
    return { success: true };
  } catch (err) {
    throw handleApiError(err, "Erro ao exportar projeção salarial");
  }
}

export async function getCamposFuncionarios() {
  try {
    const response = await api.get("/relatorio/funcionarios/campos");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar campos do relatório de funcionários");
  }
}

export async function exportarFuncionarios(empresaId, filtros, campos) {
  try {
    const url = `${baseURL}/relatorio/funcionarios`;
    await downloadBlob(url, {
      method: "POST",
      body: JSON.stringify({ empresa_id: empresaId, filtros: filtros || {}, campos: campos || [] }),
    }, "funcionarios.xlsx");
    return { success: true };
  } catch (err) {
    throw handleApiError(err, "Erro ao exportar relatório de funcionários");
  }
}
