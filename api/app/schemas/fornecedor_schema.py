from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class FornecedorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_fornecedor: int
    razao: str = ""
    cnpj: str = ""
    status: str = ""
    data: Optional[str] = None


class FornecedorCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    razao: str = Field(..., min_length=1, max_length=255)
    cnpj: str = Field(..., min_length=14, max_length=18)
    status: str = "ATIVO"
    data: Optional[str] = None
    id_usuario: Optional[int] = None


class FornecedorUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    razao: Optional[str] = None
    cnpj: Optional[str] = None
    status: Optional[str] = None
    data: Optional[str] = None
    id_usuario: Optional[int] = None
