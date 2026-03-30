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
  	//---------------Treixo responsavel por Mudar o status do pedido e retornar o saldo para o produto, recebe de Relatorio e retorna para relatorio-------------------------//
	if(isset($_REQUEST['deletar'])){
		$pedido = new Pedido();
		$produto = new Produto();
		$pedido->setId_pedido($_REQUEST['deletar']);
		$id_pedido = $_REQUEST['deletar'];
		$autor = $_SESSION['usuario'];
		$data = date('Y-m-d H:i:s');

		$x = $pedido->buscarP($id_pedido);
		foreach ($x as $key => $value) {
			if($value == 'EXCLUIDO' OR $value == 'PAGO'){
				$msg = 7;
				header("Location: ../view/relatorio.php?msg=".$msg);
				exit();
			}
		}
		
		$x = $pedido->excluir();
		foreach ($x as $key) {
			$produto->atualizaSaldo($key['novo_saldo'],$key['id_produto']);			
		}	
		
		$pedido->atualizar($id_pedido,3,$autor,$data);
		if($x){
			$msg = 1;
			header("Location: ../view/relatorio.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/relatorio.php?msg=".$msg);
			exit();
		}
	}

	//---------------Retorna os Itens do pedido da pagina Relatorios-------------------------//
	if(isset($_REQUEST['v1'])){
		
		$pedido = new Pedido();
		$pedido->setId_pedido($_REQUEST['v1']);
		
		$x = $pedido->visualizar();
		$view = array();
		foreach ($x as $key) {
			$view[] = array($key['id_pedido'],$key['nome'], $key['qtd'], $key['vlr_item'], $key['total']);
			//$clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
		}
		$_SESSION['visualizar'] = $view;
		//var_dump($_SESSION['visualizar']);

		//exit();
		if($x){
			$msg = 3;
			header("Location: ../view/relatorio.php?msg=".$msg);
			
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/relatorio.php?msg=".$msg);
			exit();
		}
	}
	//---------------Retorna os Itens do pedido da pagina meusPedidos-------------------------//
	if(isset($_REQUEST['v2'])){
		
		$pedido = new Pedido();
		$pedido->setId_pedido($_REQUEST['v2']);
		
		$x = $pedido->visualizar();

		$view = array();
		foreach ($x as $key) {
			$view[] = array($key['id_pedido'],$key['nome'], $key['qtd'], $key['vlr_item'], $key['total']);
			//$clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
		}
		$_SESSION['visualizar'] = $view;
		//var_dump($_SESSION['visualizar']);


		if($x){
			$msg = 3;
			header("Location: ../view/meuspedidos.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/meuspedidos.php?msg=".$msg);
			exit();
		}
	}
	//---------------Retorna os Itens do pedido da pagina Confirmar Pedido-------------------------//
	if(isset($_REQUEST['v3'])){
		
		$pedido = new Pedido();
		$pedido->setId_pedido($_REQUEST['v3']);
		
		$x = $pedido->visualizar();
		$view = array();
		foreach ($x as $key) {
			$view[] = array($key['nome'], $key['qtd'], $key['vlr_item'], $key['total']);
			//$clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
		}
		$_SESSION['visualizar'] = $view;
		//var_dump($_SESSION['visualizar']);

		//exit();
		if($x){
			$msg = 3;
			header("Location: ../view/confpedido.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/confpedido.php?msg=".$msg);
			exit();
		}
	}
	//---------------Retorna os Itens do pedido da pagina Confirmar Pedidos-------------------------//
	if(isset($_REQUEST['v4'])){
		
		$pedido = new Pedido();
		$id_pedido = $_REQUEST['v4'];
		$autor = $_SESSION['usuario'];
		$data = date('Y-m-d H:i:s');
		
		$x = $pedido->atualizar($id_pedido,2,$autor,$data);
		
		$_SESSION['visualizar'] = $view;
		
		if($x){
			$msg = 1;
			header("Location: ../view/confpedido.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/confpedido.php?msg=".$msg);
			exit();
		}
	}
	//------------------Volta Status para Pendente, recebe de Relatorios e retorna para Confirmar Pedido---------------------------//
	if(isset($_REQUEST['v5'])){
		$pedido = new Pedido();
		$id_pedido = $_REQUEST['v5'];
		$autor = $_SESSION['usuario'];
		$data = date('Y-m-d H:i:s');

		$x = $pedido->buscarP($id_pedido);
		foreach ($x as $key) {
			if($key['Status'] == 'EXCLUIDO' OR $key['Status'] == 'PAGO' or $key['Status'] == 'CONFIRMANDO PAGAMENTO'){
				$msg = 6;
				header("Location: ../view/relatorio.php?msg=".$msg);
				exit();
			}
			
		}
		
		$x = $pedido->atualizar($id_pedido,1,$autor,$data);
		
		$_SESSION['visualizar'] = $view;
		
		if($x){
			$msg = 4;
			header("Location: ../view/confpedido.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/confpedido.php?msg=".$msg);
			exit();
		}
	}
	
	//-------------------------------------------------------//
	//------------------Volta Status para Pendente, recebe de MeusPedidos e retorna para MeusPedidos---------------------------//
	if(isset($_REQUEST['v6'])){
		$pedido = new Pedido();
		$id_pedido = $_REQUEST['v6'];
		$autor = $_SESSION['usuario'];
		$data = date('Y-m-d H:i:s');

		$x = $pedido->buscarP($id_pedido);
		foreach ($x as $key) {
			if($key['Status'] == 'EXCLUIDO' OR $key['Status'] == 'PAGO' or $key['Status'] == 'CONFIRMANDO PAGAMENTO'){
				$msg = 6;
				header("Location: ../view/meuspedidos.php?msg=".$msg);
				exit();
			}
			
		}
		
		$x = $pedido->atualizar($id_pedido,1,$autor,$data);
		
		//$_SESSION['visualizar'] = $view;
		//var_dump($_SESSION['visualizar']);exit();
		
		if($x){
			$msg = 4;
			header("Location: ../view/meuspedidos.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/meuspedidos.php?msg=".$msg);
			exit();
		}
	}
	
	//-------------------------------------------------------//
	//---------------Inicio V7, recebe de MeusPedidos e retorna para MeusPedidos-------------------------//
	/*
	* Treixo responsavel por Mudar o status do pedido e retornar o saldo para o produto.
	* 
	*/
	if(isset($_REQUEST['v7'])){
		$pedido = new Pedido();
		$produto = new Produto();
		$pedido->setId_pedido($_REQUEST['v7']);
		$id_pedido = $_REQUEST['v7'];
		$autor = $_SESSION['usuario'];
		$data = date('Y-m-d H:i:s');

		$x = $pedido->buscarP($id_pedido);
		foreach ($x as $key => $value) {
			if($value == 'EXCLUIDO' OR $value == 'PAGO'){
				$msg = 7;
				header("Location: ../view/meuspedidos.php?msg=".$msg);
				exit();
			}
		}
		
		$x = $pedido->excluir();
		foreach ($x as $key) {
			$produto->atualizaSaldo($key['novo_saldo'],$key['id_produto']);			
		}	
		
		$pedido->atualizar($id_pedido,3,$autor,$data);
		if($x){
			$msg = 1;
			header("Location: ../view/meuspedidos.php?msg=".$msg);
			exit();
		}else{
			$msg = 2;
			header("Location: ../view/meuspedidos.php?msg=".$msg);
			exit();
		}
	}
	//--------------------------------------------------------------------------------//
	//Treixo responsalvel para gerar o Pedido no Cliente.
	//Checa se existe uma pessoa na sessao e se existe intes detro do carrinho.
	if(isset($_SESSION['itensCarrinho']) && $_SESSION['cliente']){
		

		$cliente 	= new Cliente();
		$pedido 	= new Pedido();
		$produto 	= new Produto;
		$produto2 	= new Produto;
		
		$cl = $_SESSION['cliente'];
		if ($_SESSION['id_perfil'] == '3'){
			$status = 'PENDENTE';
		}else{
			$status = 'CONFIRMADO';
		}

		$cliente->setId($cl[0]);
		$cliente->setNome($cl[1]);
		$cliente->setStatus($cl[2]);

		$itens = $_SESSION['itensCarrinho'];
		$vFinal = $_SESSION['vFinal'];




		$pedido->setId_cliente($cl[0]);
		$pedido->setTotal($vFinal);
		$pedido->setStatus($status);
		$pedido->setData(date('Y-m-d H:i:s'));
		//$pedido->setData('03/11/2022');


		/* VALIDAR SALDO DO ITEM ANTES DE CRIAR O PEDIDO */
		
		
		$saldo = '';
		$falta = [];
		$f = 0;
		foreach ($itens as $item) {
			$x = $produto2->BuscarP($item[0]);	
			foreach ($x as $key ) {				
				$saldo = $key[5];
			}
			if($saldo < $item[3]){
				$msg = 6;
				$f = 1;
				$falta[] =  array($item[0],$item[1],$item[2],$item[3],$item[4],$item[5],$item[6],$f);
				//header("Location: ../view/pedido.php?msg=".$msg);
				//exit();				
			}else{
				$falta[] =  $item;
			}

		}

		
		$_SESSION['itensCarrinho'] = $falta;

		//var_dump($falta);exit();
		if($f == 1 ){
			header("Location: ../view/pedido.php?msg=".$msg);
			exit();
		}



		

		/* FIM VALIDAÇÃO SALDO ITEM.1 */

		$x = $pedido->criar();

		$ult = $pedido->ultimoPedido($cliente->getId());

		foreach ($ult as $ultimo ) {
			$ultimoPedido = $ultimo[0];
		}
		print_r($ultimoPedido[0]);
		//id_pedido,id_produto,qtd,vlr_item,vlt_total
		/*
		*
		*/
		$saldo = array();

		

		foreach ($itens as $item => $value ) {
			
			$produto->setId_produto($value[0]);
			$p = $pedido->itensPedido($ultimoPedido,$value[0],$value[3],$value[2],$vFinal,$value[5],$value[6]);
			if($p){
				$saldo = $produto->Saldo();
				foreach ($saldo as $key) {
					$oldSaldo = $key[0];
				}
				$oldSaldo = $oldSaldo - $value[3];
				$k = $produto->baixaSaldo($oldSaldo,$value[0]);

			}else{
				$pedido->setId_pedido($ultimo);
				$pedido->excluir();
				exit();
			}

		}


		//$x = $pedido->criar();
		if($x){
			$msg = 4;
			unset($_SESSION['itensCarrinho']);
			unset($_SESSION['cliente']);
			header("Location: ../view/pedido.php?msg=".$msg);
			exit();
		}else{
			$msg = 3;

			header("Location: ../view/pedido.php?msg=".$msg);
			exit();
		}
	}else{
		$msg = 3;
		header("Location: ../view/pedido.php?msg=".$msg);
		exit();
	}





 ?>
