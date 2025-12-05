import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function registrarBatida() {
  try {
    const response = await api.post("/ponto/registrar");
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

export async function adicionarBatida(data_hora, tipo, observacao) {
  try {
    const response = await api.post("/ponto/adicionar-batida", {
      data_hora,
      tipo,
      observacao,
    });
    return response.data;
  } catch (err) {
    throw handleApiError(err, "Erro ao adicionar batida:");
  }
}

// Funções de Gestão (para aprovadores)

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
    const response = await api.get(
      `/ponto/gestao/funcionario/${funcionarioId}/exportar`,
      {
        params: { mes, ano },
        responseType: "blob",
      }
    );
    
    // Criar link para download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    
    // Extrair nome do arquivo do header ou usar padrão
    const contentDisposition = response.headers["content-disposition"];
    let filename = `Ponto_${mes}_${ano}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/"/g, "").trim();
      }
    }
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (err) {
    throw handleApiError(err, "Erro ao exportar ponto:");
  }
}
