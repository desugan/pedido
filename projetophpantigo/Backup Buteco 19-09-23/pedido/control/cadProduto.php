<?php 

include_once('../model/produto.php');
/**
  * Control Produto
  * Autor: Plínio Araújo
  */

/*
* Mensagens
* 1 = Falha ao cadastrar 
* 2 = Produto Cadastrado com Sucesso
* 3 = Produto Atualizado com Sucesso
* 4 = Produto Exluido com Sucesso
* 5 = Falha ao Excluir o item, verifique se existe pedidos para este item!
* 6 = Falha ao Atualizar o Item.
*/


$nome 		= isset($_REQUEST['nome']) 			? $_REQUEST['nome'] 		: '';
$valor 		= isset($_REQUEST['valor']) 		? $_REQUEST['valor']		: 0;
$saldo 		= isset($_REQUEST['saldo']) 		? $_REQUEST['saldo']		: 0;
$marca 		= isset($_REQUEST['marca']) 			? $_REQUEST['marca'] 		: '';
$id_produto = isset($_REQUEST['id_produto']) 	? $_REQUEST['id_produto']	: 0;

if($nome == ' '){
	header("Location: ../view/cadProduto.php?msg=1");
	exit();
}




$produto = new produto();
$produto->setNome($nome);
$produto->setValor($valor);
$produto->setSaldo($saldo);
$produto->setId_produto($id_produto);
$produto->setMarca($marca);
$produto->setQTDCompra($saldo);
$produto->setDataCompra(date('Y-m-d H:i:s'));
$produto->setQTDCompra($saldo);
$produto->setQtdUltimaCompra($saldo);
$produto->setOldValor($valor);




if(isset($_REQUEST['excluir'])){						
		$x = $produto->excluir();
		if($x){
			$msg = 4;//
			header('Location: ../view/cadProduto.php?msg='.$msg);
			exit();
		}else{
			$msg = 5;
			header('Location: ../view/cadProduto.php?msg='.$msg);
			exit();
		}
}


if($id_produto == 0){
	$x = $produto->criar();	
	$msg = 2;
}else{
	$vl = $produto->oldValor($id_produto);
	foreach ($vl as $key) {
		$produto->setOldValor($key[0]);	
	}
	$x = $produto->atualizar();
	$msg = 3;
	
}



unset($produto);

if($x){
	header("Location: ../view/cadProduto.php?msg=".$msg);	
	exit();
}else{
	if($msg == 2){
		header("Location: ../view/cadProduto.php?msg=1");	
		exit();
	}else{
		header("Location: ../view/cadProduto.php?msg=6");	
		exit();
	}
}






?>