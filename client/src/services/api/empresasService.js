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

export async function getTodasEmpresas(){
    try {
        const response = await api.get("/empresas/todas");
        return response.data;
    } catch (err) {
        throw handleApiError(err, "Erro ao buscar todas as empresas");
    }
}

export async function getEmpresaImagem(id){
    try {
        const response = await api.get(`/empresas/${id}/imagem`);
         // Verifica se a imagem está no formato esperado
        return response.data;
    } catch (err) {
        throw handleApiError(err, "Erro ao buscar imagem da empresa");
    }
}

export async function postEmpresa(payload, logoFile) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));

    if (logoFile) {
        fd.append("logo", logoFile);
    }

    const { data } = await api.post("/empresas", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
    });
    return data;
}

export async function putEmpresa(id, payload, logoFile) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));

    if (logoFile) {
        fd.append("logo", logoFile);
    }

    const { data } = await api.put(`/empresas/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
    });
    return data;
}

export async function inativarEmpresa(id) {
    try {
        const response = await api.put(`/empresas/${id}/inativar`);
        return response.data;
    } catch (err) {
        throw handleApiError(err, "Erro ao inativar empresa");
    }
}