<?php

include_once('../model/usuario.php');
/**
  * Control Cliente
  * Autor: Plínio Araújo
  */

session_start();


/**
* Codigos das msg
* 1 - Falha ao Cadastrar Usuário
* 2 - Senha não conferem
* 3 - Falta Vincular PERFIL ou Cliente
* 4 - Usuário cadastrado com sucesso
* 5 - Usuário Atualizado com Sucesso
* 6 - Falha ao Atualizar Usuário
* 7 - Usuário Excluído com Sucesso!
*/

if(time() >= $_SESSION['logout_time']) { 
	header("location:../view/login.php?msg=3"); //vai para logout
	session_destroy();
	exit();
}
$usu = new Usuario();

if(isset($_REQUEST['excluir'])){
	$res = $usu->excluir();
	header('Location: ../view/cadUsuario.php?msg=7');
	exit();
}

//Resetar Senha
if(isset($_REQUEST['v1'])){
	$v1 = $_REQUEST['v1'];
	$res = $usu->atualizarSenha(md5('mudar123'),$v1);
	header('Location: ../view/cadUsuario.php?msg=8');
	exit();
}

$id_usuario		= isset($_REQUEST['id_usuario']) 	? $_REQUEST['id_usuario']	: 0;
$usuario 		= isset($_REQUEST['usuario']) 		? $_REQUEST['usuario']		: '';
$id_cliente 	= isset($_REQUEST['id_cliente'])	? $_REQUEST['id_cliente']	: 0;
$id_perfil 		= isset($_REQUEST['id_perfil']) 	? $_REQUEST['id_perfil']	: 0;



if($usuario == ''){
	header("Location: ../view/cadCliente.php?msg=1");
	exit();
}

if($id_perfil == 0 && $id_cliente == 0){
	header("Location: ../view/cadCliente.php?msg=3");
	exit();
}


$usu->setIdUsuario($id_usuario);
$usu->setUsuario($usuario);
$usu->setSenha(md5('mudar123'));
$usu->setIdCliente($id_cliente);
$usu->setIdPerfil($id_perfil);








if($id_usuario == 0){
	$x = $usu->criar();
	$msg = 4;
}else{		
	$x = $usu->atualizar();
	$msg = 5;	
}

unset($usu);

if($x == 0){
	header("Location: ../view/cadUsuario.php?msg=1");
	exit();
}else{
	header("Location: ../view/cadUsuario.php?msg=".$msg);
	exit();
}






?>
