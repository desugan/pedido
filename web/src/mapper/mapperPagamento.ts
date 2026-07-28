/**
 * Mapeia dados de pagamento da API para o formato do frontend.
 * @param {any} raw - Dados brutos da API.
 * @returns {object} Pagamento mapeado.
 */
export function mapperPagamento(raw: any): any {
  if (!raw) return null;
  return {
    id_pagamento: Number(raw.id_pagamento ?? 0),
    pedidoId: raw.pedido_ids?.[0] ?? null,
    pedidoIds: (raw.pedido_ids || []).map(Number),
    data: raw.data_criacao ?? raw.data_pagamento ?? null,
    valor: Number(raw.valor ?? 0),
    status: (raw.status || '').toUpperCase(),
    clienteNome: raw.cliente?.nome ?? '',
    chavepix: raw.chavepix || '',
    qrcode: raw.qrcode || '',
  };
}

/**
 * Extrai lista mapeada de pagamentos de uma resposta paginada.
 * @param {any} resposta - Resposta da API.
 * @returns {object} Lista mapeada.
 */
export function extrairListaPagamentos(resposta: any): any[] {
  if (!resposta) return [];
  const lista = Array.isArray(resposta) ? resposta : resposta.data ?? [];
  return lista.map(mapperPagamento);
}
