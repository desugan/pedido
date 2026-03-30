<?php

/**
  * Classe Banco
  * Autor: Plínio Araújo
  */
	class Conexao{
		
		function executaSQL($sql) {
		
			
			$dsn = 'mysql:dbname=pedido;host=localhost';			
			$user = 'leao';
			$pass = '..oaeL@leao..';			

			try{
	        	$con = new PDO($dsn, $user, $pass);
	        	$con->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	        	$res = $con->query($sql);
	        	return $res;
						
			
				
	    	}catch(PDOException $e){
		        //echo 'ERROR: Falha ao executar Script!';
				echo $e;
			die();
	    	}
		
		}
	}



  ?>

