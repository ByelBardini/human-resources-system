import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";
import logger from "../../utils/logger.js";

export async function registrarBatida(fotoFile) {
  try {
    const fd = new FormData();
    if (fotoFile) {
      fd.append("foto", fotoFile);
    }
    const response = await api.post("/ponto/registrar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao registrar batida:");
  }
}

export async function getPontoHoje() {
  try {
    const response = await api.get("/ponto/hoje");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar ponto do dia:");
  }
}

export async function getBatidasDia(data) {
  try {
    const response = await api.get("/ponto/batidas", {
      params: { data },
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar batidas do dia:");
  }
}

export async function getBancoHoras() {
  try {
    const response = await api.get("/ponto/banco-horas");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar banco de horas:");
  }
}

export async function adicionarBatida(
  data_hora,
  tipo,
  observacao,
  para_usuario_id,
  fotoFile
) {
  try {
    const fd = new FormData();
    fd.append("data_hora", data_hora);
    fd.append("tipo", tipo);
    fd.append("observacao", observacao);
    if (para_usuario_id) {
      fd.append("para_usuario_id", para_usuario_id);
    }
    if (fotoFile) {
      fd.append("foto", fotoFile);
    }
    const response = await api.post("/ponto/adicionar-batida", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao adicionar batida:");
  }
}

// Funções de Gestão (para aprovadores)

export async function alterarHorarioBatida(batidaId, dataHora) {
  try {
    const response = await api.put(
      `/ponto/gestao/batida/${batidaId}/alterar-horario`,
      { data_hora: dataHora },
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao alterar horário da batida:");
  }
}

export async function getGestaoEmpresas() {
  try {
    const response = await api.get("/ponto/gestao/empresas");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar empresas:");
  }
}

export async function getGestaoFuncionarios(empresa_id = null) {
  try {
    const params = {};
    if (empresa_id) {
      params.empresa_id = empresa_id;
    }
    const response = await api.get("/ponto/gestao/funcionarios", { params });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionários:");
  }
}

export async function getHistoricoFuncionario(id, mes, ano) {
  try {
    const response = await api.get(
      `/ponto/gestao/funcionario/${id}/historico`,
      {
        params: { mes, ano },
      }
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar histórico do funcionário:");
  }
}

export async function getFuncionariosDesligados(empresa_id = null) {
  try {
    const params = {};
    if (empresa_id) {
      params.empresa_id = empresa_id;
    }
    const response = await api.get("/ponto/gestao/funcionarios-desligados", {
      params,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar funcionários desligados:");
  }
}

export async function getHistoricoFuncionarioDesligado(id, mes, ano) {
  try {
    const response = await api.get(
      `/ponto/gestao/funcionario-desligado/${id}/historico`,
      {
        params: { mes, ano },
      }
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar histórico do funcionário desligado:");
  }
}

export async function getPendentes() {
  try {
    const response = await api.get("/ponto/gestao/pendentes");
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao buscar pendências:");
  }
}

export async function aprovarBatida(id) {
  try {
    const response = await api.put(`/ponto/gestao/batida/${id}/aprovar`);
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao aprovar batida:");
  }
}

export async function reprovarBatida(id, motivo) {
  try {
    const response = await api.put(`/ponto/gestao/batida/${id}/reprovar`, {
      motivo,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao reprovar batida:");
  }
}

export async function invalidarBatida(id, motivo) {
  try {
    const response = await api.put(`/ponto/gestao/batida/${id}/invalidar`, {
      motivo,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao invalidar batida:");
  }
}

export async function fecharBancoHoras(funcionarioId, observacao) {
  try {
    const response = await api.post(
      `/ponto/gestao/funcionario/${funcionarioId}/fechar-banco`,
      { observacao }
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao fechar banco de horas:");
  }
}

export async function recalcularBancoHoras(funcionarioId) {
  try {
    const response = await api.post(
      `/ponto/gestao/funcionario/${funcionarioId}/recalcular-banco`
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao recalcular banco de horas:");
  }
}

export async function aprovarBatidasDia(funcionarioId, data) {
  try {
    const response = await api.post(
      `/ponto/gestao/funcionario/${funcionarioId}/aprovar-batidas-dia`,
      { data }
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao aprovar batidas do dia:");
  }
}

export async function recalcularDia(funcionarioId, data) {
  try {
    const response = await api.post(
      `/ponto/gestao/funcionario/${funcionarioId}/recalcular-dia`,
      { data }
    );
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao recalcular dia:");
  }
}

// Adicionar batida para outro usuário (aprovadores)
export async function adicionarBatidaParaUsuario(
  data_hora,
  tipo,
  observacao,
  para_usuario_id
) {
  try {
    const response = await api.post("/ponto/adicionar-batida", {
      data_hora,
      tipo,
      observacao,
      para_usuario_id,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao adicionar batida:");
  }
}

// Exportar ponto para Excel
export async function exportarPontoExcel(funcionarioId, mes, ano) {
  try {
    // Usar fetch diretamente para ter controle total sobre os headers
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const url = `${baseURL}/ponto/gestao/funcionario/${funcionarioId}/exportar?mes=${mes}&ano=${ano}`;
    
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao exportar: ${response.status}`);
    }
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get("content-disposition") || 
                                response.headers.get("Content-Disposition");
    
    let filename = `ponto_${ano}_${String(mes).padStart(2, "0")}_funcionario.xlsx`;
    
    if (contentDisposition) {
      // Tentar extrair o nome do arquivo do header
      // Pode vir como: filename="ponto_2024_01_joao.xlsx" ou filename*=UTF-8''ponto_2024_01_joao.xlsx
      
      // Primeiro tentar filename* (UTF-8 encoded) - formato preferido
      let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      
      if (filenameMatch && filenameMatch[1]) {
        try {
          filename = decodeURIComponent(filenameMatch[1]);
        } catch (e) {
          logger.error("Erro ao decodificar UTF-8:", e);
          filename = filenameMatch[1];
        }
      } else {
        // Tentar filename normal (com ou sem aspas)
        filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim();
        }
      }
    }
    
    // Converter resposta para blob
    const blob = await response.blob();
    
    // Criar link para download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    
    return { success: true };
  } catch (err) {
    throw handleApiError(err, "Erro ao exportar ponto:");
  }
}

// Exportar todos os pontos de todas as empresas em ZIP
export async function exportarTodosPontosZip(mes, ano) {
  try {
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const url = `${baseURL}/ponto/gestao/exportar-todos?mes=${mes}&ano=${ano}`;
    
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao exportar: ${response.status}`);
    }
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get("content-disposition") || 
                                response.headers.get("Content-Disposition");
    
    let filename = `pontos_todas_empresas_${ano}_${String(mes).padStart(2, "0")}.zip`;
    
    if (contentDisposition) {
      let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      
      if (filenameMatch && filenameMatch[1]) {
        try {
          filename = decodeURIComponent(filenameMatch[1]);
        } catch (e) {
          logger.error("Erro ao decodificar UTF-8:", e);
          filename = filenameMatch[1];
        }
      } else {
        filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim();
        }
      }
    }
    
    // Converter resposta para blob
    const blob = await response.blob();
    
    // Criar link para download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    
    return { success: true };
  } catch (err) {
    throw handleApiError(err, "Erro ao exportar todos os pontos:");
  }
}