import { handleApiError } from "./handleApiError.js";
import { api } from "../api.js";

export async function getEmpresas(){
    try {
        const response = await api.get("/empresas");
        return response.data;
    } catch (err) {
        throw handleApiError(err, "Erro ao buscar empresas");
    }
}

export async function getEmpresaImagem(id){
    try {
        const response = await api.get(`/empresas/${id}/imagem`);
         // Verifica se a imagem está no formato esperado
        return response.data;
    } catch (err) {
        throw handleApiError(err, "Erro ao buscar imagem");
    }
}