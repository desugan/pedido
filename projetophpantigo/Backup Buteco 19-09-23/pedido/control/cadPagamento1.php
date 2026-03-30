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

/******************Limpar Itens da sessão************************/
	if(isset($_REQUEST['resetar'])){
		unset($_SESSION['pedidos']);
		unset($_SESSION['Pcliente']);
		unset($_SESSION['pix']);
		unset($_SESSION['qrcode']);
		$msg = 1;
		header("Location: ../view/pagamento.php?msg=".$msg);
		exit();
	}
/********************Mostrar Itens do Pedido***************************/	
if(isset($_REQUEST['verItens'])){
	$pedido = new Pedido();
	//$x = $pedido->
	$msg = 2;
	header("Location: ../view/pagamento.php?msg=".$msg);
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

	/*-------------------------------------------------------------------------------------------- */
	//Checa se existes pedidos confirmados para o usuário, caso não haja retorna mensagem. 
	if ($id_pedidos == null){
		$msg = 2;
		header("Location: ../view/pagamento.php?msg=".$msg);
		exit();
	}
	/*-------------------------------------------------------------------------------------------- */

	$id_pedidos = substr($id_pedidos,0,-1);
	
	//Gerar PIX 
	$pixTotal = 0;
	foreach ($pedidos as $key) {
		$pixTotal += $key[2];
		$nome = $key[1];
		
	}
	
	$obj = (new Payload)->setPixkey('+5543998031955')
						->setDescription($nome)
						->setMerchantName('Buteco')
						->setMerchantCity('Londrina')
						->setTxId('000')
						->setAmout($pixTotal);



	$payloadQrCode = $obj->getPayload();	
	$_SESSION['pix'] = $payloadQrCode;	
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
	

	unset($_SESSION['Pcliente']);	
	unset($_SESSION['pedidos']);	
	
	$_SESSION['pedidos'] = $pedidos;	
	$_SESSION['Pcliente'] = $cliente;
	header("Location: ../view/pagamento.php");
	exit();
}

/*****************************************************************/	

	
/******************Inclur Pedidos da sessão************************/
	
	if (isset($_REQUEST['id_cliente'])) {
		if (isset($_SESSION['pedido'])) {
			$pedidos = $_SESSION['pedidos'];
		} else {
			$pedidos = array();
		}
		


		//id_pedido,nome as Nome,total as Total,p.data as Data,p.status as Status
		$pedido = new Pedido();
		$x = $pedido->BuscarPC($_REQUEST['id_cliente']);
		foreach ($x as $key ) {			
			$pedidos[] = array($key['id_pedido'],$key['Nome'],$key['Total'],$key['Data'],$key['Status']);
		}

		
		var_dump($pedidos);
		$_SESSION['pedidos'] = $pedidos;
		header("Location: ../view/pagamento.php");
		exit();	
	}
	$msg =1;
	header("Location: ../view/pagamento.php?msg=".$msg);
/*****************************************************************/	

	
 ?>