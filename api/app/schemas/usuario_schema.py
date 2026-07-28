from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PerfilResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_perfil: int
    perfil: str = ""


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    id_cliente: int = 0
    id_perfil: int = 0
    usuario: str = ""
    cliente_nome: Optional[str] = None
    perfil_nome: Optional[str] = None


class UsuarioCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    usuario: str = Field(..., min_length=1, max_length=255)
    senha: str = Field(..., min_length=1, max_length=255)
    id_cliente: int = Field(..., gt=0)
    id_perfil: int = Field(..., gt=0)


class UsuarioUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    usuario: Optional[str] = None
    senha: Optional[str] = None
    id_cliente: Optional[int] = None
    id_perfil: Optional[int] = None
