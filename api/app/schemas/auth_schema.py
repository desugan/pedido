from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    usuario: str = Field(..., min_length=1)
    senha: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    token: str
    user: dict


class AlterarSenhaRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    senha_atual: str = Field(..., min_length=1)
    nova_senha: str = Field(..., min_length=6)
    confirmar_senha: str = Field(..., min_length=6)
