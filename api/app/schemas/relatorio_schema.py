from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RelatorioPeriodo(BaseModel):
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None


class RelatorioPedidosResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo: str = "pedidos"
    periodo: RelatorioPeriodo = RelatorioPeriodo()
    totais: dict = {}
    dados: list[dict] = []


class RelatorioPagamentosResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo: str = "pagamentos"
    periodo: RelatorioPeriodo = RelatorioPeriodo()
    totais: dict = {}
    dados: list[dict] = []


class RelatorioClientesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo: str = "clientes"
    totais: dict = {}
    dados: list[dict] = []


class RelatorioVendasResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo: str = "vendas"
    periodo: RelatorioPeriodo = RelatorioPeriodo()
    totais: dict = {}
    dados: list[dict] = []


class RelatorioUsuarioRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id_cliente: int = Field(..., gt=0)
