from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProdutoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_produto: int
    nome: str = ""
    valor: float = 0.0
    oldvalor: Optional[float] = None
    marca: str = ""
    saldo: float = 0.0


class ProdutoCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(..., min_length=1, max_length=255)
    marca: str = Field(..., min_length=1, max_length=255)
    valor: float = Field(..., gt=0)
    saldo: float = 0.0


class ProdutoUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: Optional[str] = None
    marca: Optional[str] = None
    valor: Optional[float] = None
    saldo: Optional[float] = None
