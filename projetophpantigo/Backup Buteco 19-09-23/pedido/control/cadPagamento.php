<?php
	session_start();
	/**
  * Control Pedido Sessao
  * Autor: Plínio Araújo
  */

	header('Access-Control-Allow-Origin: *');
	include_once('../model/cliente.php');
	include_once('../model/produto.php');
	include_once('../model/pedido.php');
	include_once('../model/pix.php');
	include_once('qrcode/qrlib.php');

	if(time() >= $_SESSION['logout_time']) { 
		header("location:../view/login.php?msg=3"); //vai para logout
		session_destroy();
		exit();
	}

/******************Limpar Itens da sessão************************/
	if(isset($_REQUEST['resetar'])){
		unset($_SESSION['pedidos']);
		unset($_SESSION['Pcliente']);
		unset($_SESSION['pix']);
		unset($_SESSION['qrcode']);
		unset($_SESSION['pag_pedido']);
		unset($_SESSION['pedPagamento']);
		$msg = 1;
		header("Location: ../view/pagamento.php?msg=".$msg);
		exit();
	}
/********************Mostrar Itens do Pedido***************************/	

/******************Deletar Itens da sessão************************/
if(isset($_REQUEST['deletar'])){		
	if(isset($_SESSION['pedidos'])){
		$itensold = $_SESSION['pedidos'];
		foreach ($itensold as $i => $item) {
			
				if($item[0] != $_REQUEST['deletar']){
					$itens[]=$item;
				}
		}
		if(!isset($itens)){
			unset($_SESSION['pedidos']);
			$msg =2;
			header("Location: ../view/pagamento.php?msg=".$msg);				
			exit();
		}else{
			$_SESSION['pedidos'] = $itens; 
			
			header("Location: ../view/pagamento.php");
			
			exit();
		}
	}		
}
/*****************************************************************/	
if(isset($_REQUEST['v1'])){
	$visualizar_pag = new Pedido();
	$x = $visualizar_pag->buscaPagamento($_REQUEST['v1']);

	foreach ($x as $key ) {
		$pag [] = array($key['id_pagamento'],$key['id_pedidos'],$key['valor'],$key['status'],$key['qrcode'],$key['chavepix'],$key['data_criacao'],$key['data_pagamento']);
	}
	
	if(!$x){
		$msg = 2;
		header("Location: ../view/meuspagamento.php?msg=".$msg);
		exit();
	}




	$_SESSION['pag_pedido'] = $pag;
	$msg = 3;
	header("Location: ../view/meuspagamento.php?msg=".$msg);
	exit();
}

/**/
/******************Busca Clientes e seus Pedidos************************/


if(isset($_REQUEST['busca'])){
	$busca = new Cliente();
	$x = $busca->buscaCl($_REQUEST['busca']);
	$id_cliente = $_REQUEST['busca'];
	foreach ($x as $k) {
		$cliente = array($k['id_cliente'],$k['nome'],$k['status']);
	}
	//id_pedido,nome as Nome,total as Total,p.data as Data,p.status as Status
	$pedido = new Pedido();
	$x = $pedido->buscarPendentes($id_cliente);
	$id_pedidos = null;
	foreach ($x as $key ) {			
		$pedidos[] = array($key['id_pedido'],$key['Nome'],$key['Total'],$key['Data'],$key['Status']);	
		$id_pedidos = $key['id_pedido'];
	}

	/*--------------------------------------------------------------------------------------------*/ 
	//Checa se existes pedidos confirmados para o usuário, caso não haja retorna mensagem. 
	if ($id_pedidos == null){
		$msg = 2;
		header("Location: ../view/pagamento.php?msg=".$msg);
		exit();
	}
	/*-------------------------------------------------------------------------------------------- */

	$_SESSION['pedidos'] = $pedidos;	
	$_SESSION['Pcliente'] = $cliente;
	header("Location: ../view/pagamento.php");
	exit();

}


/* */
if(isset($_REQUEST['v2'])){
	$busca = new Cliente();
	$x = $busca->buscaCl($_REQUEST['v2']);
	$id_cliente = $_REQUEST['v2'];
	foreach ($x as $k) {
		$cliente = array($k['id_cliente'],$k['nome'],$k['status']);
	}
	//id_pedido,nome as Nome,total as Total,p.data as Data,p.status as Status
	$pedido = new Pedido();
	$x = $pedido->pagamentoPendentes($id_cliente);
	$id_pedidos = [];
	foreach ($x as $key ) {			
		$pagamentos[] = array($key['id_pagamento'],$key['valor'],$key['qrcode'],$key['chavepix'],$key['status'],$key['id_cliente'],$key['data_criacao'],$key['data_pagamento']);	
		$id_pedidos = $key['id_pagamento'];
	}
	
	/*--------------------------------------------------------------------------------------------*/ 
	//Checa se existes pedidos confirmados para o usuário, caso não haja retorna mensagem. 
	if ($id_pedidos == null){
		$msg = 2;
		header("Location: ../view/meuspagamento.php?msg=".$msg);
		exit();
	}
	/*-------------------------------------------------------------------------------------------- */

	$_SESSION['pagamentos'] = $pagamentos;	
	$_SESSION['Pcliente'] = $cliente;
	
	//var_dump($pagamentos);exit();
	
	header("Location: ../view/meuspagamento.php");
	exit();
}
/* ------------------------fim------------------------------- */

/******************Limpar Itens da sessão************************/
if(isset($_REQUEST['v3'])){
	unset($_SESSION['pedidos']);
	unset($_SESSION['Pcliente']);
	unset($_SESSION['pagamentos']);
	unset($_SESSION['pix']);
	unset($_SESSION['qrcode']);
	unset($_SESSION['pedPagamento']);
	$msg = 1;
	header("Location: ../view/meuspagamento.php?msg=".$msg);
	exit();
}
/****************** FIM ************************/




if(isset($_REQUEST['v7']) && isset($_SESSION['pedidos'])){
	$data_criacao = date('Y-m-d H:i:s');

	$pag = new Pedido ();
	
	/*--------------------INICIO-------------------- */
	/* Recupera os Ids dos pedidos e o valor total */
	$pag_total = 0;
	$pag_id_pedido = null;
	foreach ($_SESSION['pedidos'] as $key) {
		$pag_id_pedido[] = $key[0];
		$nome = $key[1];
		$pag_total += $key[2];
	}

	//$pag_id_pedido = implode(",", $pag_id_pedido);

	/*--------------------FIM-------------------- */


	/* Recupera o Ids do cliente */
	$pag_id_cliente = $_SESSION['Pcliente'][0] ;

	/*--------------------FIM-------------------- */




	/* Script responsável em gerar o objeto PIX */
	
	
	$obj = (new Payload)->setPixkey('+5543991091018')
						->setDescription($nome)
						->setMerchantName('Buteco')
						->setMerchantCity('Londrina')
						->setTxId('000')
						->setAmout($pag_total);



	$payloadQrCode = $obj->getPayload();

	$_SESSION['pix'] = $payloadQrCode;


	/*--------------------FIM-------------------- */

	/*
	* Gerando Imagem QRCODE
	*/
	$path = '../control/imagens/';
	$file = $path.uniqid().".png";
	$text = $payloadQrCode;
	// $ecc stores error correction capability('L')
	$ecc = 'L';
	$pixel_Size = 10;
	$frame_Size = 10;
	
	// Generates QR Code and Stores it in directory given
	QRcode::png($payloadQrCode,$file);
  
	// Displaying the stored QR code from directory
	$_SESSION['qrcode'] = $file;
	/*--------------------FIM-------------------- */

	/* Cria o Pagamento */

	$x = $pag->pagamento($pag_total,$file,$payloadQrCode,$pag_id_cliente,$data_criacao);

	/*--------------------FIM-------------------- */



	/* Recupera o cód do ultimo pedido do cliente */

	$x = $pag->ultimoPagamento($pag_id_cliente);
  
	foreach ($x as $key) {
		$pag_ultimoIdPagamento = $key['id_pagamento'];
	}

	/*--------------------FIM-------------------- */

	
	
	/* Script Responsável por criar os Itens do pagamento */

	foreach ($pag_id_pedido as $key ) {
		$x1 = $pag->pagamentoPedido($key,$pag_ultimoIdPagamento);
		if($x1){$y = $pag->atualizaPedido($key,$pag_id_cliente);} // Caso hajá problema em criar os Itens de pagamento não será atualizado os pedidos.
	}
	
	/*--------------------FIM-------------------- */

	$x = $pag->buscaPagamento($pag_ultimoIdPagamento);
	$pagamento = [];
	foreach ($x as $key ) {
		$pagamento [] = array($key['id_pagamento'],$key['id_pedidos'],$key['valor'],$key['status'],$key['qrcode'],$key['chavepix'],$key['data_criacao'],$key['data_pagamento']);
	}
	
	if(!$x){
		$msg = 2;
		header("Location: ../view/pagamento.php?msg=".$msg);
		exit();
	}




	//$_SESSION['pag_pedido'] = $pag;
	

	unset($_SESSION['Pcliente']);	
	unset($_SESSION['pedidos']);	
	
	
	$_SESSION['pedPagamento'] = $pagamento;	
	$_SESSION['Pcliente'] = $cliente;
	header("Location: ../view/pagamento.php?msg=3");
	exit();
}else{
	$msg = 1;
	header("Location: ../view/pagamento.php?msg=".$msg);
	exit();

}

/*****************************************************************/	

/*****************************************************************/	

	
 ?>