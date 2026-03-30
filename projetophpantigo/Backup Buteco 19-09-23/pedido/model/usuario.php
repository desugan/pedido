<?php

	include_once('banco.php');
 /**
  * Classe Usuario
  * Autor: Plínio Araújo
  */
 class Usuario
 {

	private $idUsuario;
	private $usuario;
 	private $senha;
	private $id_cliente;
	private $id_perfil;

 	function __construct(){
 	}

 	function getUsuario(){
 		return $this->usuario;
 	}

 	function getSenha(){
 		return $this->senha;
 	}

 	function getIdUsuario(){
 		return $this->idUsuario;
 	}

	function getPerfil(){
		return $this->id_perfil;
	}

	function getCliente(){
		return $this->id_cliente;
	}

 	function setIdUsuario($idUsuario){
 		$this->idUsuario = $idUsuario;
 	}

 	function setUsuario($usuario){
 		$this->usuario = $usuario;
 	}

 	function setSenha($senha){
 		$this->senha = $senha;
 	}
	function setIdPerfil($perfil){
		$this->id_perfil = $perfil;
	}

	function setIdCliente($cliente){
		$this->id_cliente = $cliente;
	}

	/**
	* Criar usuário
	*/

 	function criar(){
 		try{
 			$sql = "insert into Usuario (usuario,senha,id_perfil,id_cliente)
 					values('".$this->usuario."','14d777febb71c53630e9e843bedbd4d8',".$this->id_perfil.",".$this->id_cliente. ");";
 			$bd = new Conexao();
 		return $bd->executaSQL($sql);
 		}catch(exeption $e ){
 			return print $e;
 		}

 	}

 	function atualizar(){ 

 		try {
 			$sql = "update Usuario 	set usuario = '".$this->usuario.																
																"',id_perfil = ".$this->id_perfil.
																",id_cliente = ".$this->id_cliente.
																" where id_Usuario = ".$this->idUsuario.";";

 			$bd = new Conexao();
 			return $bd->executaSQL($sql);
 			unset($bd);

 			} catch (Exception $e) {
 				return print $e;
 			}

 	}

	 function atualizarSenha($nsenha,$id){

		try {
			$sql = "update Usuario 	set senha = '".$nsenha.															   														   
						"' where id_usuario = ".$id.";";
			
			$bd = new Conexao();
			return $bd->executaSQL($sql);
			unset($bd);

			} catch (Exception $e) {
				return print $e;
			}

	}

 	function excluir(){
 		try {

 			$sql = " delete from Usuario where id_Usuario = ".$this->idUsuario.";";

 			$bd = new Conexao();
 			return $bd->executaSQL($sql);
 			unset($bd);
 		} catch (Exception $e) {
 			return print $e;

 		}
 	}

 	function buscar(){
 		try{

 			$sql = "select u.id_usuario,u.usuario as usuario,cl.nome cliente,p.perfil perfil,u.id_cliente as id_cliente,u.id_perfil as id_perfil
							from usuario u
							left join cliente cl on u.id_cliente = cl.id_cliente
							left join perfil p on u.id_perfil = p.id_perfil order by 2;";
 			$bd = new Conexao();

 			return $bd->executaSQL($sql);
 			unset($bd);

 		}catch(exeption $e ){
 			return print $e;
 		}

 	}

	 function buscarU($id){
		try{

			$sql = "select *
					from usuario 						   
					where id_usuario = ".$id.";";
			$bd = new Conexao();

			return $bd->executaSQL($sql);
			unset($bd);

		}catch(exeption $e ){
			return print $e;
		}

	}

 		function validaUsuario($id){
 		try{
 			$sql = "select * from Usuario where usuario = '".$id."';";
			$bd = new Conexao();
 			return $bd->executaSQL($sql);
 		unset($bd);
 		}catch(exeption $e ){
 			return False;
 		}

 	}

 }







 ?>
