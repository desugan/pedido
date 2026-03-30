<?php 

include_once('../model/cliente.php');
/**
  * Control Cliente
  * Autor: Plínio Araújo
  */

session_start();

if(time() >= $_SESSION['logout_time']) { 
	header("location:../view/login.php?msg=3"); //vai para logout
	session_destroy();
	exit();
}

$nome 		= isset($_REQUEST['nome']) 			? $_REQUEST['nome'] 		: '';
$Status 		= isset($_REQUEST['status']) 			? $_REQUEST['status']			: 0;
$id_cliente = isset($_REQUEST['id_cliente']) 	? $_REQUEST['id_cliente']	: 0;

if(isset($_REQUEST['resetar'])){
	unset($_SESSION['cliente']);
	unset($_SESSION['itensCarrinho']);
	header("Location: ../view/pedido.php");
	exit();
}

if(isset($_REQUEST['busca'])){
	$busca = new Cliente();
	$x = $busca->buscaCl($_REQUEST['busca']);

	foreach ($x as $k) {
		$cliente = array($k['id_cliente'],$k['nome'],$k['status']);
	}
	unset($_SESSION['cliente']);
	unset($_SESSION['itensCarrinho']);
	$_SESSION['cliente'] = $cliente;
	header("Location: ../view/pedido.php");
	exit();
}

if($nome == ' ' && $Status == 0){
	header("Location: ../view/cadCliente.php?msg=1");
	exit();
}


$cliente = new Cliente();
$cliente->setNome($nome);
$cliente->setStatus($Status);
$cliente->setId($id_cliente);

if($_REQUEST['excluir']){
	$res = $cliente->excluir();
	header('Location: ../view/cadCliente.php?msg=4');
	exit();
}


if($id_cliente == 0){
	$x = $cliente->criar();
	$msg = 2;
}else{
	$x = $cliente->atualizar();
	$msg = 3;

}
unset($cliente);

if($x == 0){
	header("Location: ../view/cadCliente.php?msg=1");
	exit();
}else{
	header("Location: ../view/cadCliente.php?msg=".$msg);
	exit();
}






?>
