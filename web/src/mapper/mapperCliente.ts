/**
 * Normaliza dados de cliente da API para o formato do frontend.
 * @param {any} raw - Dados brutos da API.
 * @returns {object} Cliente normalizado.
 */
export function mapperCliente(raw: any): any {
  if (!raw) return null;
  const limite = Number(raw.limite_credito ?? 0);
  const utilizado = Number(raw.credito_utilizado ?? raw.saldo_utilizado ?? 0);
  const id = Number(raw.id_cliente ?? raw.id ?? 0);
  return {
    id,
    id_cliente: id,
    nome: raw.nome ?? '',
    status: raw.status ?? '',
    contato: raw.contato ?? null,
    limiteCredito: limite,
    creditoUtilizado: utilizado,
    saldoRestante: Number(raw.saldo_restante ?? (limite - utilizado)),
    totalPedidos: Number(raw.total_pedidos ?? 0),
    totalPagamentos: Number(raw.total_pagamentos ?? 0),
  };
}

/**
 * Extrai lista normalizada de clientes.
 * @param {any} resposta - Resposta da API.
 * @returns {{ data: any[] }} Lista normalizada.
 */
export function extrairListaNormalizada(resposta: any): { data: any[] } {
  if (!resposta) return { data: [] };
  const lista = Array.isArray(resposta) ? resposta : resposta.data ?? resposta.clientes ?? [];
  return { data: lista.map(mapperCliente) };
}
