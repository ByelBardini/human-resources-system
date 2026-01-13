/**
 * Script para popular feriados nacionais usando a API BrasilAPI
 * 
 * Uso: node scripts/popularFeriados.js [ano_inicio] [ano_fim]
 * Exemplo: node scripts/popularFeriados.js 2020 2030
 * 
 * Se não informar os anos, usa 2020-2030 por padrão
 */

import dotenv from "dotenv";
import sequelize from "../server/config/database.js";
import Feriado from "../server/models/feriados.js";
import { buscarFeriadosMultiplosAnos } from "../server/utils/brasilApi.js";

dotenv.config();

async function popularFeriados(anoInicio = 2020, anoFim = 2030) {
  try {
    console.log(`\n🔄 Iniciando população de feriados nacionais...`);
    console.log(`📅 Período: ${anoInicio} a ${anoFim}\n`);

    // Gerar array de anos
    const anos = [];
    for (let ano = anoInicio; ano <= anoFim; ano++) {
      anos.push(ano);
    }

    // Buscar feriados da API
    console.log(`🌐 Buscando feriados da API BrasilAPI...`);
    const feriados = await buscarFeriadosMultiplosAnos(anos);

    console.log(`✅ ${feriados.length} feriados encontrados\n`);

    // Conectar ao banco
    await sequelize.authenticate();
    console.log("✅ Conexão com banco de dados estabelecida\n");

    // Inserir feriados (IGNORE para evitar duplicatas)
    let inseridos = 0;
    let ignorados = 0;

    for (const feriado of feriados) {
      try {
        const [feriadoCriado, criado] = await Feriado.findOrCreate({
          where: {
            feriado_data: feriado.feriado_data,
            feriado_tipo: feriado.feriado_tipo,
            feriado_empresa_id: feriado.feriado_empresa_id,
          },
          defaults: feriado,
        });

        if (criado) {
          inseridos++;
          console.log(`  ✅ ${feriado.feriado_nome} - ${feriado.feriado_data}`);
        } else {
          ignorados++;
          console.log(`  ⏭️  ${feriado.feriado_nome} - ${feriado.feriado_data} (já existe)`);
        }
      } catch (error) {
        console.error(`  ❌ Erro ao inserir ${feriado.feriado_nome}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`  ✅ Feriados inseridos: ${inseridos}`);
    console.log(`  ⏭️  Feriados ignorados (já existiam): ${ignorados}`);
    console.log(`  📦 Total processado: ${feriados.length}\n`);

    console.log("✨ População de feriados concluída com sucesso!\n");
  } catch (error) {
    console.error("\n❌ Erro ao popular feriados:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Obter argumentos da linha de comando
const args = process.argv.slice(2);
const anoInicio = args[0] ? parseInt(args[0]) : 2020;
const anoFim = args[1] ? parseInt(args[1]) : 2030;

// Validar anos
if (isNaN(anoInicio) || isNaN(anoFim)) {
  console.error("❌ Erro: Anos devem ser números válidos");
  process.exit(1);
}

if (anoInicio > anoFim) {
  console.error("❌ Erro: Ano inicial deve ser menor ou igual ao ano final");
  process.exit(1);
}

// Executar
popularFeriados(anoInicio, anoFim);
