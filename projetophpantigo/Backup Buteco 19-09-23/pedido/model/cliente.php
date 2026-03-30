<?php

	include_once('banco.php');
 /**
  * Classe Cliente
  * Autor: Plínio Araújo
  */
 class Cliente
 {

 	public $nome;
 	public $status;
 	public $id;

 	function __construct(){

 	}

 	function getNome(){
 		return $this->nome;
 	}

 	function getStatus(){
 		return $this->status;
 	}

 	function getId(){
 		return $this->id;
 	}

 	function setId($id){
 		$this->id = $id;
 	}

 	function setNome($nome){
 		$this->nome = $nome;
 	}

 	function setStatus($status){
 		$this->status = $status;
 	}


 	function criar(){
 		try{

 			$sql = "insert into Cliente (nome,status)
 					values('".$this->nome."','".$this->status."');";
 			$bd = new Conexao();

 		return $bd->executaSQL($sql);
 		}catch(exeption $e ){
 			return print $e;
 		}

 	}

 	function atualizar(){

 		try {
 			$sql = "update cliente set nome = '".$this->nome."',status = '".$this->status."' where id_Cliente = ".$this->id.";";

 			$bd = new Conexao();
 			return $bd->executaSQL($sql);
 			unset($bd);

 			} catch (Exception $e) {
 				return print $e;
 			}

 	}

 	function excluir(){
 		try {

 			$sql = " delete from cliente where id_Cliente = ".$this->id.";";

 			$bd = new Conexao();
 			return $bd->executaSQL($sql);
 			unset($bd);
 		} catch (Exception $e) {
 			return print $e;

 		}
 	}

 	function buscar(){
 		try{

 			$sql = "select * from cliente order by 2;";
 			$bd = new Conexao();

 			return $bd->executaSQL($sql);
 			unset($bd);

 		}catch(exeption $e ){
 			return print $e;
 		}

 	}

 		function buscaCl($id){
 		try{

 			$sql = "select * from cliente where id_Cliente = $id;";
 			$bd = new Conexao();
 		return $bd->executaSQL($sql);
 		unset($bd);
 		}catch(exeption $e ){
 			return print $e;
 		}

 	}
	function buscaPerfil(){
		try {
			$sql = "select * from perfil;";
			$bd = new Conexao();
			return $bd->executaSQL($sql);

		} catch (\Exception $e) {
			return print $e;

		}

	}

 }







 ?>
