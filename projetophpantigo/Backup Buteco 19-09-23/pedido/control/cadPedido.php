<?php
	session_start();
	/**
  * Control Pedido Sessao
  * Autor: Plínio Araújo
  */

	header('Access-Control-Allow-Origin: *');
	include_once('../model/cliente.php');
	include_once('../model/produto.php');

/******************Limpar Itens da sessão************************/
	if(isset($_REQUEST['resetar'])){
		unset($_SESSION['itensCarrinho']);		
		$msg = 2;
		header("Location: ../view/pedido.php?msg=".$msg);
		exit();
	} 
/*****************************************************************/	


/******************Deletar Itens da sessão************************/
	if(isset($_REQUEST['deletar'])){		
		if(isset($_SESSION['itensCarrinho'])){
			$itensold = $_SESSION['itensCarrinho'];
			foreach ($itensold as $i => $item) {
					if($i != $_REQUEST['deletar']){
						$itens[]=$item;
					}
			}
			if(!isset($itens)){
				unset($_SESSION['itensCarrinho']);
				$msg =2;
				header("Location: ../view/pedido.php?msg=".$msg);				
				exit();
			}else{
				$_SESSION['itensCarrinho'] = $itens; 
				header("Location: ../view/pedido.php");
				
				exit();
			}
		}		
	}
/*****************************************************************/	

	
/******************Inclur Itens da sessão************************/




	
	if (isset($_REQUEST['id_produto']) && isset($_REQUEST['qtd'])) {
		if (isset($_SESSION['itensCarrinho'])) {
			$itens = $_SESSION['itensCarrinho'];
		} else {
			$itens = array();
		}
		 

		$qtd = isset($_REQUEST['qtd']) ? $_REQUEST['qtd'] : 0;

		if($qtd == 0 or $qtd < 1){
			$msg = 1;
			header("Location: ../view/pedido.php?msg=".$msg);
			exit();
		}else{
			$qtd = $_REQUEST['qtd'];	
		}

		/* VALIDA SE O ITEM JÁ ESTÁ DENTRO DO CARRINHO */
		$id_item = $_REQUEST['id_produto'];

		for ($i=0; $i <count($itens) ; $i++) { 
			if($id_item === $itens[$i][0]){	
				$msg = 7;
				header("Location: ../view/pedido.php?msg=".$msg);
				exit();
			}
		}

		

		
		
		$valor = 0;
		$produto = new Produto();
		$x = $produto->BuscarP($_REQUEST['id_produto']);
		foreach ($x as $key ) {
			if($qtd > $key['saldo']){
				$msg = 6;
				header("Location: ../view/pedido.php?msg=".$msg);
				exit();
			}
			
			$valor = $qtd * $key['valor'];
			$vlr_custo = $key['valor']; 
			if($_SESSION['id_perfil'] == '3'){
				$valor = ($valor *10)/100 + $valor;
				//$custo = $key['valor'];
				$custo = ($key['valor'] *10)/100 + $key['valor'];
				$itens[] = array($key['id_produto'],$key['nome'],$custo,$qtd, $valor,$vlr_custo,$key['saldo']);
			}else{
			 $itens[] = array($key['id_produto'],$key['nome'],$key['valor'],$qtd, $valor,$vlr_custo,$key['saldo']);
			}
		}		
		
		
		
		
		
		$_SESSION['itensCarrinho'] = $itens;
		header("Location: ../view/pedido.php");
		exit();	
	}
	$msg =1;
	header("Location: ../view/pedido.php?msg=".$msg);
/*****************************************************************/	

	
 ?>