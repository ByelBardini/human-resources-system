/**
 * Utilitário para buscar feriados da API BrasilAPI
 * https://brasilapi.com.br/api/feriados/v1/{ano}
 */

/**
 * Busca feriados nacionais de um determinado ano
 * @param {number} ano - Ano para buscar os feriados
 * @returns {Promise<Array>} Array de feriados
 */
export async function buscarFeriadosNacionais(ano) {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar feriados: ${response.status} ${response.statusText}`);
    }

    const feriados = await response.json();
    
    // Filtrar apenas feriados nacionais e mapear para o formato do banco
    return feriados
      .filter(feriado => feriado.type === 'national')
      .map(feriado => ({
        feriado_data: feriado.date,
        feriado_nome: feriado.name,
        feriado_tipo: 'nacional',
        feriado_empresa_id: null,
        feriado_ativo: 1,
      }));
  } catch (error) {
    console.error(`Erro ao buscar feriados do ano ${ano}:`, error);
    throw error;
  }
}

/**
 * Busca feriados nacionais para múltiplos anos
 * @param {Array<number>} anos - Array de anos para buscar
 * @returns {Promise<Array>} Array de todos os feriados
 */
export async function buscarFeriadosMultiplosAnos(anos) {
  const todosFeriados = [];
  
  for (const ano of anos) {
    try {
      const feriados = await buscarFeriadosNacionais(ano);
      todosFeriados.push(...feriados);
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Erro ao buscar feriados do ano ${ano}:`, error);
      // Continue mesmo se um ano falhar
    }
  }
  
  return todosFeriados;
}
