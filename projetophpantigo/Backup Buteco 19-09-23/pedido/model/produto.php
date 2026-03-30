<?php 
	
	include_once('Banco.php');
	/**
  * Classe Produto
  * Autor: Plínio Araújo
  */
	
	class Produto{

		public $id_produto;
		public $nome;
		public $valor;
		public $saldo;
		public $marca;	
		public $oldValor;
		public $dataCompra;
		public $qtdCompra;
		public $qtd_ultima_compra;

		function __construct(){

		}

		function getNome(){
			return $this->nome;
		}

		function getValor(){
			return $this->valor;
		}


		function getSaldo(){
			return $this->saldo;
		}

		function getId_produto(){
			return $this->id_produto;
		}
		function getMarca(){
			return $this->marca;
		}
		function getOldValor(){
			return $this->valor;
		}

		function setNome($nome){
			$this->nome = $nome;
		}
		function getDataCompra(){
			return $this->dataCompra;
		}

		function setDataCompra($dataCompra){
			$this->dataCompra = $dataCompra;
		}
		function getQTDCompra(){
			return $this->qtdCompra;
		}

		function setQTDCompra($qtdCompra){
			$this->qtdCompra = $qtdCompra;
		}


		function setValor($valor){
			$this->valor = $valor;
		}

		function setId_produto($id_produto){
			$this->id_produto = $id_produto;
		}

		function setSaldo($saldo){
			$this->saldo = $saldo;
		}
		function setMarca($marca){
			$this->marca = $marca;
		}

		function setOldValor($oldValor){
			$this->oldValor = $oldValor;
		}

		function getQtdUltimaCompra(){
			return $this->qtd_ultima_compra;
		}

		function setQtdUltimaCompra($qtd_ultima_compra){
			 $this->qtd_ultima_compra = $qtd_ultima_compra;
		}


		// REMOVIDO ".$this->qtdcompra.",
		function criar(){
			try {
				$sql = " insert into produto (nome,valor,saldo,marca,data_compra,qtd_ultima_compra,oldvalor)
					values ('".$this->nome."',
							".$this->valor.",
							".$this->saldo.",
							'".$this->marca."',							
							'".$this->dataCompra."',
							".$this->qtd_ultima_compra.",
							".$this->oldValor."
							);";	 				
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				//echo $sql; exit();
				
				unset($bd);

			} catch (Exception $e) {
				print $e;				
			}

		}

		function atualizar(){
			try {
				$sql = "update produto set 
					nome = '".$this->nome."', 
					valor = ".$this->valor.",
					saldo = ".$this->saldo.",
					marca = '".$this->marca."',
					oldValor = ".$this->oldValor.",
					qtd_ultima_compra = ".$this->qtdCompra.",
					data_compra = '".$this->dataCompra."'
					 where id_produto = ".$this->id_produto.";";				
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				
				unset($bd);
				
			} catch (Exception $e) {
				print $e;
			}
		}

		function baixaSaldo($vl,$id){
			try {
				$sql = "update produto set 					
					saldo = $vl
					where id_produto = $id;";				
				$bd = new Conexao();
				return $bd->executaSQL($sql);				
				unset($bd);
				
			} catch (Exception $e) {
				print $e;
			}
		}

		function atualizaSaldo($vl,$id){
			try {
				$sql = "update produto set 					
					saldo = $vl
					where id_produto = $id;";				
				$bd = new Conexao();
				return $bd->executaSQL($sql);				
				unset($bd);
				
			} catch (Exception $e) {
				print $e;
			}
		}



		function buscar(){
			try{

				$sql = "select * from produto order by 2;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);				 
				unset($bd);

			} catch(Exception $e){
				print $e;
			}
		}

		function buscarP($id){
			try{

				$sql = "select * from produto where id_produto = $id;";	
				$bd = new Conexao($sql);				
				return $bd->executaSQL($sql);				 
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function excluir(){
			try{
				$sql = "delete from produto where id_produto = ".$this->id_produto.";";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}
		function Saldo(){
			try{
				$sql = "select saldo from produto where id_produto = ".$this->id_produto.";";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}

		function oldValor($id){
			try{
				$sql = "select valor from produto where id_produto = $id;";
				$bd = new Conexao();
				return $bd->executaSQL($sql);
				
				unset($bd);

			} catch (Exception $e){
				print $e;
			}
		}
		

		
	}

 ?>