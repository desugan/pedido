<?php
	include_once('banco.php');
	/**
  * Classe Entrada
  * Autor: Plínio Araújo
  */

	class lancamento{


		public $id_fornecedor;
		public $id_lancamento;
		public $total;
		public $data;
		public $status;


		function __construct(){

		}

		function getId_lancamento(){
			return $this->id_lancamento;
		}

		function getStatus(){
			return $this->status;
		}

		function getData(){
			return $this->data;
		}

		function getId_fornecedor(){
			return $this->id_fornecedor;
		}

		function getTotal(){
			return $this->total;
		}

		function setId_lancamento($id_lancamento){
			$this->id_lancamento = $id_lancamento;
		}

		function setId_fornecedor($id_fornecedor){
			$this->id_fornecedor = $id_fornecedor;
		}

		function setTotal($total){
			$this->total = $total;
		}

		function setData($data){
			$this->data = $data;
		}

		function setStatus($status){
			$this->status = $status;
		}


		function criar(){
			try{
				$sql = "insert into lancamento (id_fornecedor,total,data,status)
						values (".$this->id_fornecedor.",".$this->total.",'".$this->data."','".$this->status."');";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		


		function buscar(){
			try {
				$sql = "select id_lancamento,nome as Nome,total as Total, p.data as Data,p.status as Status from lancamento as p
						inner join fornecedor as cl
						on p.id_fornecedor = cl.id_fornecedor order by 4 asc;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				uset($bd);

			} catch (Exception $e){
				print $e;
			}
		}
		function visualizar(){
			try {
				$sql = "select b.nome,a.qtd,a.vlr_item,(a.qtd * a.vlr_item) total
						from lancamento_item a
						inner join produto as b on a.id_produto = b.id_produto
						where id_lancamento = ".$this->getId_lancamento()." ;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);
			} catch (Exception $e) {
				print $e;
			}
		}

		function ultimolancamento($id){
			try{
				$sql = "select max(id_lancamento) from lancamento where id_fornecedor = $id" ;
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}

		}

		function ultimoPagamento($id){
			try{
				$sql = "select max(id_pagamento)id_pagamento from pagamento where id_fornecedor = $id" ;
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}

		}
		/*
		* id_lancamento,id_produto,qtd,vlr_item,vlt_total
		* values ("$id_lancamento.','.$id_produto.','.$qtd.','.$vlr_item.','.$vlr_total.");";
		*/
		function itenslancamento($id_lancamento,$id_produto,$qtd,$vlr_item,$vlr_total){
			try{
				$sql = "insert into lancamento_item (id_lancamento,id_produto,qtd,vlr_item,vlr_total)
						values ($id_lancamento,$id_produto,$qtd,$vlr_item,$vlr_total);";

				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}

		}

		function pagamento($valor,$qrcode,$chavepix,$id_fornecedor,$data_criacao){
			try{
				$sql = "insert into pagamento (valor,qrcode,status,chavepix,id_fornecedor,data_criacao)
						values ($valor,'$qrcode','PROCESSANDO PAGAMENTO','$chavepix',$id_fornecedor,'$data_criacao') ;";
						

				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql;exit();

				unset($bd);

			} catch (Exception $e){
				return 'Erro - '.$e;
			}
			
		}

		function pagamentolancamento($id_lancamento,$id_pagamento){
			try{
				$sql = "insert into pagamentolancamento (id_lancamento,id_pagamento)
						values ($id_lancamento,$id_pagamento) ;";
						

				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql;exit();

				unset($bd);

			} catch (Exception $e){
				return 'Erro - '.$e;
			}
			
		}


		function buscarP($id_lancamento){
			try{
				$sql = "select p.status as Status from lancamento as p
					where  p.id_lancamento = $id_lancamento";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				return 'Erro - '.$e;
			}
		}

		function buscarPC($id_fornecedor){
			try{
				$sql = "select id_lancamento,nome as Nome,total as Total,p.data as Data,p.status as Status from lancamento as p
					inner join fornecedor as cl on p.id_fornecedor = cl.id_fornecedor
					where  p.id_fornecedor = $id_fornecedor";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function atualizar($id,$tipo,$id_usuario,$data){
			/*
			* 1 = PENDENTE
			* 2 = CONFIRMADO
			* 3 = EXCLUIDO
			* 4 = PAGO
			* 5 = AGUARDANDO CONFIRMAÇÃO
			 */
			if($tipo == 1){
				$status = 'PENDENTE';
			}elseif ($tipo == 2) {
				$status = 'CONFIRMADO';
			}elseif ($tipo == 3) {
				$status = 'EXCLUIDO';
			}elseif ($tipo == 4) {
				$status = 'PAGO';
			}elseif ($tipo == 5) {
				$status = 'AGUARDANDO CONFIRMACAO';
			}
			try {
				 $sql = "update lancamento 
				 		 set status ='$status'
						 , autorizado = '$id_usuario'
						 , data_autorizado = '$data'
						 where id_lancamento = $id;  ";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				
				
			} catch (Exception $e) {
				return "Erro ao atualizar Status lancamento";
			}
		}

		function atualizalancamento($id_lancamento,$id_fornecedor){
			try {
				$sql = "update lancamento
						set status = 'PROCESSANDO PAGAMENTO'
						where id_fornecedor = $id_fornecedor
						and id_lancamento = $id_lancamento ;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				
			} catch (Exception $e) {
				print $e;
			}
		}

		function baixarPagamento($id_pagamento,$data){
			try {
				$sql = "update pagamento a 
						inner join pagamentolancamento b on a.id_pagamento = b.id_pagamento
						inner join lancamento c on b.id_lancamento = c.id_lancamento
						set a.status = 'PAGO',
							c.status = 'PAGO',
							a.data_pagamento = '$data'
						WHERE  A.id_pagamento = $id_pagamento;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql; exit();
				
			} catch (Exception $e) {
				print $e;
			}
		}

		function retornarBaixarPagamento($id_pagamento,$data){
			try {
				$sql = "update pagamento a 
						inner join pagamentolancamento b on a.id_pagamento = b.id_pagamento
						inner join lancamento c on b.id_lancamento = c.id_lancamento
						set a.status = 'PROCESSANDO PAGAMENTO',
							c.status = 'PROCESSANDO PAGAMENTO',
							a.data_pagamento = NULL
						WHERE  A.id_pagamento = $id_pagamento;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql; exit();
				
			} catch (Exception $e) {
				print $e;
			}
		}
		function excluirBaixarPagamento($id_pagamento,$data){
			try {
				$sql = "update pagamento a 
						inner join pagamentolancamento b on a.id_pagamento = b.id_pagamento
						inner join lancamento c on b.id_lancamento = c.id_lancamento
						set a.status = 'EXCLUIDO',
							c.status = 'CONFIRMADO',
							a.data_pagamento = '$data'
						WHERE  A.id_pagamento = $id_pagamento;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql; exit();
				
			} catch (Exception $e) {
				print $e;
			}
		}


		function buscarPendentes($id_fornecedor){
			try{
				$sql = "select id_lancamento,nome as Nome,total as Total,p.data as Data,p.status as Status from lancamento as p
					inner join fornecedor as cl on p.id_fornecedor = cl.id_fornecedor
					where  	p.status = 'CONFIRMADO' 
					
							AND p.id_fornecedor = $id_fornecedor;";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function pagamentoPendentes($id_fornecedor){
			try{
				$sql = "select id_pagamento,valor,qrcode,chavepix,status,id_fornecedor,data_criacao,data_pagamento
						from PAGAMENTO 
						where id_fornecedor  = $id_fornecedor;";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function buscaPagamento($id_fornecedor){
			try{
				$sql = "select c.id_pagamento,group_concat( a.id_lancamento) id_lancamentos,c.valor,c.status,c.qrcode,c.chavepix,c.data_criacao,c.data_pagamento
						from lancamento a 
						inner join pagamentolancamento b on a.id_lancamento = b.id_lancamento
						inner join pagamento c on b.id_pagamento = c.id_pagamento and a.id_fornecedor = c.id_fornecedor
						where c.id_pagamento  = $id_fornecedor;";

				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql; exit();
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function excluir(){
			try{
				$sql = "select b.id_produto,(b.saldo+a.qtd) novo_saldo
							FROM lancamento_ITEM A
							INNER JOIN produto b on a.id_produto = b.id_produto
							where a.id_lancamento = ".$this->id_lancamento.";";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);
			} catch (Exception $e){
				print $e;
			}

		}

		

	}



 ?>
