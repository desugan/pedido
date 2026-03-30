<?php
	include_once('banco.php');
	/**
  * Classe Pedido
  * Autor: Plínio Araújo
  */

	class Pedido{


		public $id_cliente;
		public $id_pedido;
		public $total;
		public $data;
		public $status;


		function __construct(){

		}

		function getId_pedido(){
			return $this->id_pedido;
		}

		function getStatus(){
			return $this->status;
		}

		function getData(){
			return $this->data;
		}

		function getId_cliente(){
			return $this->id_cliente;
		}

		function getId_produto(){
			return $this->id_produto;
		}

		function getTotal(){
			return $this->total;
		}

		function setId_pedido($id_pedido){
			$this->id_pedido = $id_pedido;
		}

		function setId_cliente($id_cliente){
			$this->id_cliente = $id_cliente;
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
				$sql = "insert into pedido (id_cliente,total,data,status)
						values (".$this->id_cliente.",".$this->total.",'".$this->data."','".$this->status."');";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		


		function buscar(){
			try {
				$sql = "select id_pedido,nome as Nome,total as Total, p.data as Data,p.status as Status from pedido as p
						inner join cliente as cl
						on p.id_cliente = cl.id_cliente order by 4 asc;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				uset($bd);

			} catch (Exception $e){
				print $e;
			}
		}
		function visualizar(){
			try {
				$sql = "select a.id_pedido,b.nome,a.qtd,a.vlr_item,(a.qtd * a.vlr_item) total
						from pedido_item a
						inner join produto as b on a.id_produto = b.id_produto
						where id_pedido = ".$this->getId_pedido()." ;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);
			} catch (Exception $e) {
				print $e;
			}
		}

		function ultimoPedido($id){
			try{
				$sql = "select max(id_pedido) from pedido where id_cliente = $id" ;
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}

		}

		function ultimoPagamento($id){
			try{
				$sql = "select max(id_pagamento)id_pagamento from pagamento where id_cliente = $id" ;
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}

		}
		/*
		* id_pedido,id_produto,qtd,vlr_item,vlt_total
		* values ("$id_pedido.','.$id_produto.','.$qtd.','.$vlr_item.','.$vlr_total.");";
		*/
		function itensPedido($id_pedido,$id_produto,$qtd,$vlr_item,$vlr_total,$vlr_custo,$saldo){
			try{
				$sql = "insert into pedido_item (id_pedido,id_produto,qtd,vlr_item,vlr_total,vlr_custo,saldo_item)
						values ($id_pedido,$id_produto,$qtd,$vlr_item,$vlr_total,$vlr_custo,$saldo);";

				$bd = new Conexao();
				

				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}

		}

		function pagamento($valor,$qrcode,$chavepix,$id_cliente,$data_criacao){
			try{
				$sql = "insert into pagamento (valor,qrcode,status,chavepix,id_cliente,data_criacao)
						values ($valor,'$qrcode','PROCESSANDO PAGAMENTO','$chavepix',$id_cliente,'$data_criacao') ;";
						

				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql;exit();

				unset($bd);

			} catch (Exception $e){
				return 'Erro - '.$e;
			}
			
		}

		function pagamentoPedido($id_pedido,$id_pagamento){
			try{
				$sql = "insert into pagamentopedido (id_pedido,id_pagamento)
						values ($id_pedido,$id_pagamento) ;";
						

				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql;exit();

				unset($bd);

			} catch (Exception $e){
				return 'Erro - '.$e;
			}
			
		}


		function buscarP($id_pedido){
			try{
				$sql = "select p.status as Status from pedido as p
					where  p.id_pedido = $id_pedido";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				return 'Erro - '.$e;
			}
		}

		function buscarPC($id_cliente){
			try{
				$sql = "select id_pedido,nome as Nome,total as Total,p.data as Data,p.status as Status from pedido as p
					inner join cliente as cl on p.id_cliente = cl.id_cliente
					where  p.id_cliente = $id_cliente";

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
				 $sql = "update pedido 
				 		 set status ='$status'
						 , autorizado = '$id_usuario'
						 , data_autorizado = '$data'
						 where id_pedido = $id;  ";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				
				
			} catch (Exception $e) {
				return "Erro ao atualizar Status Pedido";
			}
		}

		function atualizaPedido($id_pedido,$id_cliente){
			try {
				$sql = "update pedido
						set status = 'PROCESSANDO PAGAMENTO'
						where id_cliente = $id_cliente
						and id_pedido = $id_pedido ;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				
			} catch (Exception $e) {
				print $e;
			}
		}

		function baixarPagamento($id_pagamento,$data){
			try {
				$sql = "update pagamento a 
						inner join pagamentopedido b on a.id_pagamento = b.id_pagamento
						inner join pedido c on b.id_pedido = c.id_pedido
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
						inner join pagamentopedido b on a.id_pagamento = b.id_pagamento
						inner join pedido c on b.id_pedido = c.id_pedido
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
						inner join pagamentopedido b on a.id_pagamento = b.id_pagamento
						inner join pedido c on b.id_pedido = c.id_pedido
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


		function buscarPendentes($id_cliente){
			try{
				$sql = "select id_pedido,nome as Nome,total as Total,p.data as Data,p.status as Status from pedido as p
					inner join cliente as cl on p.id_cliente = cl.id_cliente
					where  	p.status = 'CONFIRMADO' 
					
							AND p.id_cliente = $id_cliente;";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function pagamentoPendentes($id_cliente){
			try{
				$sql = "select id_pagamento,valor,qrcode,chavepix,status,id_cliente,data_criacao,data_pagamento
						from PAGAMENTO 
						where id_cliente  = $id_cliente;";

				$bd = new Conexao();
				return $bd->executaSQL($sql);

				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function buscaPagamento($id_cliente){
			try{
				$sql = "select c.id_pagamento,group_concat( a.id_pedido) id_pedidos,c.valor,c.status,c.qrcode,c.chavepix,c.data_criacao,c.data_pagamento
						from pedido a 
						inner join pagamentopedido b on a.id_pedido = b.id_pedido
						inner join pagamento c on b.id_pagamento = c.id_pagamento and a.id_cliente = c.id_cliente
						where c.id_pagamento  = $id_cliente;";

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
							FROM PEDIDO_ITEM A
							INNER JOIN produto b on a.id_produto = b.id_produto
							where a.id_pedido = ".$this->id_pedido.";";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);
			} catch (Exception $e){
				print $e;
			}

		}

		

	}



 ?>
