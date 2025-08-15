import { api } from "../api.js";

export async function getEmpresas(){
    try {
        const response = await api.get("/empresas");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar empresas:", error);
        throw error;
    }
}

export async function getEmpresaImagem(id){
    try {
        const response = await api.get(`/empresas/${id}/imagem`);
        console.log("Imagem da empresa recebida:", response.data);
         // Verifica se a imagem está no formato esperado
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar imagem:", error);
        throw error;
    }
}