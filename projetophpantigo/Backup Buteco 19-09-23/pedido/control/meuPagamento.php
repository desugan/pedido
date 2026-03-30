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


/********************Mostrar Itens do Pedido***************************/	
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

/************************************************************************/

/********************Confirmar pagamento e atualizar os status do Pedido e Pagamentos***************************/	
if(isset($_REQUEST['v4'])){
	
	$atualizar_pag = new Pedido();

	$x = $atualizar_pag->baixarPagamento($_REQUEST['v4'],date('Y-m-d H:i:s'));

	//Retorna Mesnagem de Erro
	if(!$x){
		$msg = 4;
		header("Location: ../view/meuspagamento.php?msg=".$msg);
		exit();
	}
    if(isset($_SESSION['pagcliente'])){
	
		$id_cliente = $_SESSION['pagcliente'][0];
	}
	$x = $atualizar_pag->pagamentoPendentes($id_cliente);

	$id_pedidos = [];
	foreach ($x as $key ) {			
		$pagamentos[] = array($key['id_pagamento'],$key['valor'],$key['qrcode'],$key['chavepix'],$key['status'],$key['id_cliente'],$key['data_criacao'],$key['data_pagamento']);	
		
	}
	

	

	unset($_SESSION['pagamentos'] );
	$_SESSION['pagamentos'] = $pagamentos;
	//Retorna mensagem de Confirmação de Baixa
	$msg = 5;
	header("Location: ../view/meuspagamento.php?msg=".$msg);
	exit();
}
/* Script responsável para VOLTAR a baixa do pagamento e atualizar o status do pedido para PROCESSANDO PAGAMENTO */
if(isset($_REQUEST['v5'])){
	
	$atualizar_pag = new Pedido();

	$x = $atualizar_pag->retornarBaixarPagamento($_REQUEST['v5'],date('Y-m-d H:i:s')); 

	//Retorna Mesnagem de Erro
	if(!$x){
		$msg = 7;
		header("Location: ../view/meuspagamento.php?msg=".$msg);
		exit();
	}
    if(isset($_SESSION['pagcliente'])){
	
		$id_cliente = $_SESSION['pagcliente'][0];
	}
	$x = $atualizar_pag->pagamentoPendentes($id_cliente);

	$id_pedidos = [];
	foreach ($x as $key ) {			
		$pagamentos[] = array($key['id_pagamento'],$key['valor'],$key['qrcode'],$key['chavepix'],$key['status'],$key['id_cliente'],$key['data_criacao'],$key['data_pagamento']);	
		
	}
	

	

	unset($_SESSION['pagamentos'] );
	$_SESSION['pagamentos'] = $pagamentos;
	//Retorna mensagem de Confirmação de Baixa
	$msg = 6;
	header("Location: ../view/meuspagamento.php?msg=".$msg);
	exit();
}
/* Script responsável para EXCLUIR a baixa do pagamento e voltar o Status do Pedido para Confirmado */
if(isset($_REQUEST['v6'])){
	
	$atualizar_pag = new Pedido();

	$x = $atualizar_pag->excluirBaixarPagamento($_REQUEST['v6'],date('Y-m-d H:i:s'));

	//Retorna Mesnagem de Erro
	if(!$x){
		$msg = 89;
		header("Location: ../view/meuspagamento.php?msg=".$msg);
		exit();
	}
    if(isset($_SESSION['pagcliente'])){
	
		$id_cliente = $_SESSION['pagcliente'][0];
	}
	$x = $atualizar_pag->pagamentoPendentes($id_cliente);

	$id_pedidos = [];
	foreach ($x as $key ) {			
		$pagamentos[] = array($key['id_pagamento'],$key['valor'],$key['qrcode'],$key['chavepix'],$key['status'],$key['id_cliente'],$key['data_criacao'],$key['data_pagamento']);	
		
	}
	

	

	unset($_SESSION['pagamentos'] );
	$_SESSION['pagamentos'] = $pagamentos;
	//Retorna mensagem de Confirmação de Baixa
	$msg = 8;
	header("Location: ../view/meuspagamento.php?msg=".$msg);
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
	$_SESSION['pagcliente'] = $cliente;
	
	//var_dump($pagamentos);exit();
	
	header("Location: ../view/meuspagamento.php");
	exit();
}
/* ------------------------fim------------------------------- */

/******************Limpar Itens da sessão************************/
if(isset($_REQUEST['v3'])){
	unset($_SESSION['pedidos']);
	unset($_SESSION['pagcliente']);
	unset($_SESSION['pagamentos']);
	unset($_SESSION['pix']);
	unset($_SESSION['qrcode']);
	unset($_SESSION['pedPagamento']);
	unset($_SESSION['pag_pedido']);
	
		
	
	$msg = 1;
	header("Location: ../view/meuspagamento.php?msg=".$msg);
	exit();
}
/****************** FIM ************************/




if(isset($_REQUEST['v1']) && isset($_SESSION['pedidos'])){
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
	$pag_id_cliente = $_SESSION['pagcliente'][0] ;

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

	if($x){
		echo "Pagamento Criado";
		echo "<img src='$file'>";
		
	}else{
		echo "Falha no pagamento";
		
	}
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


	

	unset($_SESSION['pagcliente']);	
	unset($_SESSION['pedidos']);	
	
	$_SESSION['pedidos'] = $pedidos;	
	$_SESSION['pagcliente'] = $cliente;
	header("Location: ../view/pagamento.php");
	exit();
}

/*****************************************************************/	

/*****************************************************************/	

	
 ?>