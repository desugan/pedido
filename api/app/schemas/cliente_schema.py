from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClienteFinanceiro(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    limite_credito: float = 0.0
    saldo_utilizado: float = 0.0


class ClienteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_cliente: int
    nome: str = ""
    status: str = ""
    contato: Optional[str] = None
    limite_credito: float = 0.0
    credito_utilizado: float = 0.0
    saldo_restante: float = 0.0
    financeiro: Optional[ClienteFinanceiro] = None
    total_pedidos: int = 0
    total_pagamentos: int = 0


class ClienteCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(..., min_length=1, max_length=150)
    status: str = "ATIVO"
    limite_credito: float = 0.0


class ClienteUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: Optional[str] = None
    status: Optional[str] = None
    contato: Optional[str] = None
    limite_credito: Optional[float] = None
