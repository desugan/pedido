from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PagamentoPedidoLink(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_pagamento_pedido: int = 0
    id_pedido: int = 0
    id_pagamento: int = 0


class PagamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_pagamento: int
    valor: float = 0.0
    qrcode: Optional[str] = None
    chavepix: Optional[str] = None
    status: str = ""
    data_criacao: Optional[str] = None
    data_pagamento: Optional[str] = None
    id_cliente: int = 0
    cliente: Optional[dict] = None
    pagamentopedido: list[PagamentoPedidoLink] = []
    pedido_ids: list[int] = []


class PagamentoCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    valor: float = Field(..., gt=0)
    qrcode: str = ""
    chavepix: str = ""
    id_cliente: int = Field(..., gt=0)
    pedido_ids: Optional[list[int]] = None


class PagamentoStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: str = Field(..., min_length=1)
