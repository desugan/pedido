<?php

	session_start();

	if (!isset($_SESSION['usuario'])) {
      header("Location: ../view/login.php?msg=2");
      exit();
   }

   // se o tempo atual for maior que o tempo de logout
   if(time() >= $_SESSION['logout_time']) { 
		header("location:../view/login.php?msg=3"); //vai para logout
		session_destroy();
		exit();
	} 
	include_once("../model/pedido.php");
	include_once("../model/cliente.php");
	include_once("../model/produto.php");
	/**
  * Control Pedido
  * Autor: Plínio Araújo
  */
  $data_lanc 	= isset($_REQUEST['data_lanc']) 	? $_REQUEST['data_lanc']	: "";
  $fornecedor 	= isset($_REQUEST['fornecedor'])	? $_REQUEST['fornecedor']	: "";
  $n_nota 		= isset($_REQUEST['n_nota']) 		? $_REQUEST['n_nota']		: "";
  $chave 		= isset($_REQUEST['chave']) 		? $_REQUEST['chave']		: "";

  echo $data_lanc;
  echo "<br>";
  echo $fornecedor;
  echo "<br>";
  echo $n_nota;
  echo "<br>";
  echo $chave;

  /******************Inclur Itens da sessão************************/
	
	if (isset($_REQUEST['id_produto']) && isset($_REQUEST['qtd']) && isset($_REQUEST['vlr_tot'])) {
		if (isset($_SESSION['itensLancamento'])) {
			$itens = $_SESSION['itensLancamento'];
		} else {
			$itens = array();
		}
		

		$qtd = isset($_REQUEST['qtd']) ? $_REQUEST['qtd'] : 0;
		$vlr_tot = isset($_REQUEST['vlr_tot']) ? $_REQUEST['vlr_tot'] : 0;

		if($qtd == 0 or $qtd < 1){
			$msg = 1;
			header("Location: ../view/pedido.php?msg=".$msg);
			exit();
		}

		


		$valor = 0;
		$produto = new Produto();
		$x = $produto->BuscarP($_REQUEST['id_produto']);
		foreach ($x as $key ) {
			$valor = $vlr_tot / $qtd;
			
			 $itens[] = array($key['id_produto'],$key['nome'],$valor,$qtd, $vlr_tot);
			}
		

		
		
		$_SESSION['itensLancamento'] = $itens;
		var_dump($_SESSION['itensLancamento']);

		header("Location: ../view/cadlancamento.php");
		exit();	
	}
	$msg =1;
	header("Location: ../view/cadlancamento.php?msg=".$msg);
/*****************************************************************/	

  exit();
  
  




 ?>
