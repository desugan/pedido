from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class LancamentoItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_produto: int = 0
    produto_nome: str = ""
    qtd: float = 0.0
    vlr_item: float = 0.0
    vlr_total: float = 0.0


class LancamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_lancamento: int
    id_fornecedor: int = 0
    fornecedor_nome: Optional[str] = None
    total: float = 0.0
    data: Optional[str] = None
    status: str = ""
    documento: Optional[str] = None
    id_usuario: Optional[int] = None
    usuario_nome: Optional[str] = None
    itens: list[LancamentoItemResponse] = []


class LancamentoCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id_fornecedor: int = Field(..., gt=0)
    itens: list[dict] = Field(..., min_length=1)
    status: str = "PENDENTE"
    chave: Optional[str] = None
    documento: Optional[str] = None
    id_usuario: Optional[int] = None


class LancamentoStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: str = Field(..., pattern=r"^(PENDENTE|CONFIRMADO|CANCELADO)$")
