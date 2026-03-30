<?php


function executaSQL($sql) {
		
			
    $dsn = 'mysql:dbname=erp_pedido;host=localhost';			
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

function temp() {    
        
    $login = 'PLINIO';
    $password = 'a4c6dc226ea9d4eeecac91ded7dc62eb';
    $url = "http://189.58.111.114:8085/api/v1/mobile/acoescomerciais//45005/45008/0/0/6/0//N/5";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, "$login:$password");
    $result = json_decode(curl_exec($ch));
    curl_close($ch);  
    $retorno = null;
    
    foreach ($result as $pedido) {
        
       
        $aguardando = "insert into temp (ped_empresa,ped_seq,stt_descricao,hora)
                        values (".$pedido->PED_EMPRESA.",
                                '".$pedido->PED_SEQ."',
                                '".$pedido->STT_DESCRICAO."',
                                '".date('Y-m-d H:m:s')."'
                            
                            );";
        $res = executaSQL($aguardando);
        
                            
    }
    if(!$res){
        return "Falha";
    }else{
        return "Dados Inseridos";
    }
    
}

function aguardandoConclusao(){

    $sql = "select a.* from temp a
            where a.ped_seq not in (select ped_seq from aguardando);";

    $res = executaSQL($sql);

    if(!$res){
        return "Falha ao Consultar";
    }else{
        $x = 0;
        foreach ($res as $key) {
          $x = $key['ped_empresa'];
          break;
        }
        
        if(strlen($x)<= 0){
            return "Sem Dados para Atualizar";
        }else{ 
            
            foreach ($res as $pedido ) {
                var_dump($pedido); exit();
                $insert = "insert into aguardando (ped_empresa,ped_seq,stt_descricao,hora)
                            values (".$pedido['ped_empresa'].",
                                    '".$pedido['ped_seq']."',
                                    '".$pedido['stt_descricao']."',
                                    '".date('Y-m-d H:m:s')."'
                                
                                );";
                //$in = executaSQL($insert);
                echo $insert."<br>";
                exit();
                
            }

            return "Dados Atualizados";
        }
    }
    return "Falha ao consultar";

}

function liberado() {    
        
    $login = 'PLINIO';
    $password = 'a4c6dc226ea9d4eeecac91ded7dc62eb';
    $url = "http://189.58.111.114:8085/api/v1/mobile/acoescomerciais//45005/45008/0/0/6/0//N/8";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, "$login:$password");
    $result = json_decode(curl_exec($ch));
    curl_close($ch);  
    $retorno = null;
    foreach ($result as $pedido) {
        
       
        $aguardando = "insert into liberado (ped_empresa,ped_seq,stt_descricao,hora)
                        values (".$pedido->PED_EMPRESA.",
                                '".$pedido->PED_SEQ."',
                                '".$pedido->STT_DESCRICAO."',
                                '".date('Y-m-d H:m:s')."'
                            
                            );";
        $res = executaSQL($aguardando);
        
                            
    }
    if(!$res){
        return "Falha";
    }else{
        return "Dados Inseridos";
    }
}

    $login = 'PLINIO';
    $password = 'a4c6dc226ea9d4eeecac91ded7dc62eb';
    $url = "http://189.58.111.114:8085/api/v1/mobile/acoescomerciais//45015/45015/0/0/6/0//N/5";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, "$login:$password");
    $result = json_decode(curl_exec($ch));
    curl_close($ch);  
    //$retorno = null;

    var_dump($result);
   

?>