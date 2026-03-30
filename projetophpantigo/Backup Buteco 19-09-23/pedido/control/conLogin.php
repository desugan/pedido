<?php

include_once('../model/usuario.php');
/**
  * Control Cliente
  * Autor: Plínio Araújo
  */

session_start();

$usuario 	= strtoupper(isset($_REQUEST['usuario'])	? $_REQUEST['usuario'] 		: "");
$senha 		= isset($_REQUEST['senha']) 				? $_REQUEST['senha']		: "";
$csenha 	= isset($_REQUEST['csenha']) 				? $_REQUEST['csenha']		: "";
$nsenha 	= isset($_REQUEST['nsenha']) 				? $_REQUEST['nsenha']		: "";
$valida = 0;


if ($nsenha != $csenha) {
	header("Location: ../view/mudarsenha.php?msg=2");
	exit();
}

$u = (new Usuario)->validaUsuario(	$usuario);
foreach ($u as $key) {
	if(md5($senha) == $key['senha'] && $usuario == $key['usuario']){
		$valida = $key['usuario'];
		$senha = $key['senha'];
		$id_perfil = $key['id_perfil'];
		$id_cliente = $key['id_cliente'];
		$id_usuario = $key['id_usuario'];
		if($nsenha != ""){
			$u = (new Usuario)->atualizarSenha(md5($nsenha),$id_usuario);
		}

	}
}
if(strlen($valida) >1){
	$_SESSION['usuario'] = $usuario;
	$_SESSION['id_perfil'] = $id_perfil;
	$_SESSION['id_cliente'] = $id_cliente;
	header("Location: ../view/pedido.php");
	exit();
}else {
	header("Location: ../view/login.php?msg=1");
	exit();
}




exit();
/*--------------------------------------------------------------------------------------------------*/
// Utilizar codigo abaixo e refatorar para preencher o usuário da sessão


if(strlen($usuario) > 0){
	$busca = new Usuario();
	$x = $busca->buscaU($usuario);
	if($x){
		foreach ($x as $key ) {
			$_SESSION['usuario'] = $key[0];

		}
	}
	}
	unset($_SESSION['cliente']);
	unset($_SESSION['itensCarrinho']);
	$_SESSION['cliente'] = $cliente;
	header("Location: ../view/pedido.php");
	exit();




?>
