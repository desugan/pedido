/**
 * Mapeia dados de pedido da API para o formato do frontend.
 * @param {any} raw - Dados brutos da API.
 * @returns {object} Pedido mapeado.
 */
export function mapperPedido(raw: any): any {
  if (!raw) return null;
  return {
    id: Number(raw.id ?? raw.id_pedido ?? 0),
    clienteId: Number(raw.cliente_id ?? raw.id_cliente ?? raw.clienteId ?? 0),
    clienteNome: raw.cliente_nome ?? raw.clienteNome ?? '',
    status: raw.status ?? '',
    total: Number(raw.total ?? 0),
    createdAt: raw.created_at ?? raw.createdAt ?? raw.data ?? null,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? raw.data ?? null,
    itens: Array.isArray(raw.itens) ? raw.itens.map(mapperItemPedido) : [],
  };
}

/**
 * Mapeia dados de item de pedido.
 * @param {any} raw - Dados brutos do item.
 * @returns {object} Item mapeado.
 */
export function mapperItemPedido(raw: any): any {
  if (!raw) return null;
  return {
    id: Number(raw.id ?? 0),
    pedidoId: Number(raw.pedido_id ?? raw.pedidoId ?? 0),
    produtoNome: raw.produto_nome ?? raw.produtoNome ?? '',
    quantidade: Number(raw.quantidade ?? raw.qtd ?? 0),
    precoUnitario: Number(raw.preco_unitario ?? raw.precoUnitario ?? raw.vlr_item ?? 0),
    subtotal: Number(raw.subtotal ?? raw.vlr_total ?? 0),
  };
}

/**
 * Extrai lista mapeada de pedidos de uma resposta paginada.
 * @param {any} resposta - Resposta da API.
 * @returns {{ data: any[], total: number }} Lista mapeada e total.
 */
export function extrairListaPedidos(resposta: any): { data: any[]; total: number } {
  if (!resposta) return { data: [], total: 0 };
  const lista = Array.isArray(resposta) ? resposta : resposta.data ?? resposta.pedidos ?? [];
  return {
    data: lista.map(mapperPedido),
    total: resposta.total ?? lista.length,
  };
}
