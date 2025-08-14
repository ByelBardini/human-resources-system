import { Setor } from "../models/index.js";

export async function getSetoresPorEmpresa(req, res){
    const { usuario_id } = req.session.user;
    if (!usuario_id) {
        return res
        .status(401)
        .json({ error: "Necessário estar logado para realizar operações." });
    }

    const id = req.params.id;
    if (!id){
        return res
        .status(400)
        .json({ error: "Necessário id da empresa a ser buscada" });
    }
    
    try {
        const setores = await Setor.findAll({
            where: { setor_empresa_id: id },
        });
    
        return res.status(200).json(setores);
    } catch (err) {
        console.error("Erro ao buscar setores:", err);
        return res
        .status(500)
        .json({
            error: "Erro ao buscar setores, fale com um administrador do sistema",
        });
    }
}

export async function postSetor(req, res) {
    const { setor_nome, setor_empresa_id } = req.body;
    const { usuario_id } = req.session.user;

    if (!usuario_id) {
        return res
        .status(401)
        .json({ error: "Necessário estar logado para realizar operações." });
    }

    if (!setor_nome || !setor_empresa_id) {
        return res.status(400).json({ error: "Nome e ID da empresa são obrigatórios." });
    }

    try {
        const novoSetor = await Setor.create({
            setor_nome,
            setor_empresa_id,
        });

        return res.status(201).json(novoSetor);
    } catch (err) {
        console.error("Erro ao criar setor:", err);
        return res.status(500).json({ error: "Erro ao criar setor" });
    }
}

export async function deleteSetor(req, res) {
    const { id } = req.params;
    const { usuario_id } = req.session.user;

    if (!usuario_id) {
        return res
        .status(401)
        .json({ error: "Necessário estar logado para realizar operações." });
    }

    try {
        const setor = await Setor.findByPk(id);
        if (!setor) {
            return res.status(404).json({ error: "Setor não encontrado." });
        }

        await setor.destroy();
        return res.status(200).json({ message: "Setor deletado com sucesso." });
    } catch (err) {
        console.error("Erro ao deletar setor:", err);
        return res.status(500).json({ error: "Erro ao deletar setor" });
    }
}

export async function putSetor(req, res) {
    const { id } = req.params;
    const { setor_nome } = req.body;
    const { usuario_id } = req.session.user;

    if (!usuario_id) {
        return res
        .status(401)
        .json({ error: "Necessário estar logado para realizar operações." });
    }

    try {
        const setor = await Setor.findByPk(id);
        if (!setor) {
            return res.status(404).json({ error: "Setor não encontrado." });
        }

        setor.set({
            setor_nome: setor_nome || setor.setor_nome
        });

        await setor.save();
        return res.status(200).json(setor);
    } catch (err) {
        console.error("Erro ao atualizar setor:", err);
        return res.status(500).json({ error: "Erro ao atualizar setor" });
    }
}