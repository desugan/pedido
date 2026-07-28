/**
 * Normaliza dados de produto da API para o formato do frontend.
 * @param {any} raw - Dados brutos da API.
 * @returns {object} Produto normalizado.
 */
export function mapperProduto(raw: any): any {
  if (!raw) return null;
  return {
    id: Number(raw.id_produto ?? raw.id ?? 0),
    nome: raw.nome ?? '',
    valor: Number(raw.valor ?? 0),
    oldValor: raw.oldvalor != null ? Number(raw.oldvalor) : null,
    marca: raw.marca ?? '',
    saldo: Number(raw.saldo ?? 0),
  };
}

/**
 * Extrai lista normalizada de produtos.
 * @param {any} resposta - Resposta da API.
 * @returns {{ data: any[] }} Lista normalizada.
 */
export function extrairListaNormalizada(resposta: any): { data: any[] } {
  if (!resposta) return { data: [] };
  const lista = Array.isArray(resposta) ? resposta : resposta.data ?? resposta.produtos ?? [];
  return { data: lista.map(mapperProduto) };
}
