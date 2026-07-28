from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PedidoItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = 0
    pedido_id: int = 0
    produto_nome: str = ""
    quantidade: float = 0.0
    preco_unitario: float = 0.0
    subtotal: float = 0.0


class PedidoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int = 0
    cliente_nome: Optional[str] = None
    status: str = ""
    total: float = 0.0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    itens: list[PedidoItemResponse] = []


class PedidoCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    cliente_id: int = Field(..., gt=0)
    itens: list[dict] = Field(..., min_length=1)


class PedidoStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: str = Field(..., min_length=1)


class PedidoItemCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    produto_id: Optional[int] = None
    produto_nome: str = ""
    quantidade: float = Field(..., gt=0)
    preco_unitario: float = Field(..., ge=0)
