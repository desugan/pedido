<?php
  /**
  * 
  * Autor: Plínio Araújo
  */
  session_start();
  
  /* Controla o Tempo do usuário na sessão */
     if(!isset($_SESSION['start_login'])) { // se não tiver pego tempo que logou
        $_SESSION['start_login'] = time(); //pega tempo que logou
        // adiciona 30 minutod ao tempo e grava em outra variável de sessão
        $_SESSION['logout_time'] = $_SESSION['start_login'] + (30*60); 
    }

    // se o tempo atual for maior que o tempo de logout
    if(time() >= $_SESSION['logout_time']) { 
        header("location:login.php"); //vai para logout
        session_destroy();
    } 
  
  /*--------------------Fim Tempo sessão --------------------*/

  if (!isset($_SESSION['usuario'])) {
      header("Location: ../view/login.php?msg=2");
      exit();
  }


    if($_SESSION['id_perfil'] == '1'){
      $idcl = 0;
    }else{
        $idcl =(int) $_SESSION['id_cliente'];
    }

   
    
 ?>

<!DOCTYPE html>
<html>
<head>
  <title>Meus Pagamentos</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
  
  <script src="../control/ajax.js"></script>
  <link rel="stylesheet" type="text/css" href="estilo.css">
</head>
<body>
  <?php
    include_once('../model/produto.php');
    include_once('../model/cliente.php');
    include_once('../control/qrcode/qrlib.php');
    include_once('../control/funcoes.php');

      ///  session_start();

        $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';
        $id_cliente = isset($_REQUEST['id_cliente']) ? $_REQUEST['id_cliente'] : 0;


        if(isset($_SESSION['pagcliente'])){
            $cliente = new Cliente();
            $x = $_SESSION['pagcliente'];
            $cliente->setId($x[0]);
            $cliente->setNome($x[1]);
            $cliente->setStatus($x[2]);
        }else{
          unset($_SESSION['itensCarrinho']);
          //var_dump($_SESSION['itensCarrinho']);
        }
  ?>

<nav class="navbar navbar-inverse">
  <div class="container-fluid">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>

    </div>
    <div class="collapse navbar-collapse" id="myNavbar">
      <ul class="nav navbar-nav">
        <!--Inicio Função para chamar menu ADM ou USU-->
        <?php  if($_SESSION['id_perfil'] == '1'){menuAdm();}else{menuUsu();}?>
        <!--FIM Função para chamar menu ADM ou USU-->
      </ul>
      <ul class="nav navbar-nav navbar-right">
          <li><a href="#"><span class="glyphicon glyphicon-user"></span> &nbsp; <?php if(isset($_SESSION['usuario'])){ echo $_SESSION['usuario'];} ?></a></li>
          <li><a href="../control/sair.php"><span class="glyphicon glyphicon-log-in"></span> Sair</a></li>
        </ul>
    </div>
  </div>
</nav>

<div class="container-fluid text-center">
  <div class="row content">
    <div class="col-sm-2 sidenav">

    </div>
    <div class="col-sm-8 text-left">
      <h1 align="center">Meus Pagamentos</h1>
      <form class="form-group col-lg-12 " action="../control/pedido.php" method="post">

        <div class="col-lg-10">
            <input type="number" name="id_cliente" id="id_cliente" hidden <?php if (isset($cliente)) {echo "value='".$cliente->getId()."'";}?>>
            <div class=" col-lg-6">
              <label>Cliente:</label>
              <input class="form-control" type="text" name="nome" id="nome" disabled  <?php if (isset($cliente)) {echo "value='".$cliente->getNome()."'";}?>>
            </div>
            <div class="col-lg-6">
            <label>Status</label>
            <input class="form-control" type="text" name="status" id="status" disabled  <?php if (isset($cliente)) {echo "value='".$cliente->getStatus()."'";}?>>
            </div>
            <div class="col-lg-6">
              <br>
              <button type="button" class="btn btn-info btn-md" data-toggle="modal" data-target="#myModal">Buscar Clientes</button>
              <button type="button" class="btn btn-default btn-md" ><a href="../control/meupagamento.php?v3=1"> Limpar</a></button>
            </div>

        </div>
<!--*********************************************************************************************************** -->
<div class="col-lg-12">
          <hr>
          <br>
          <h4 class="col-lg-10"><b>Meus Pagamentos</b></h4>
          
          <br>
        </div>
        <div class="col-lg-12">
          <table class="table table-hover table-bordered" id="pedido">
            <th>N° Pagamento:</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data Criação</th>
            <th>Data Fechamento</th>
            <th>Ação</th>
            <tr>
              <?php
                
                $aberto = 0;
                $pago = 0;
                $total = 0;
                if(isset($_SESSION['pagamentos'])){
                  $itens = $_SESSION['pagamentos'];
                  foreach ($itens as $key => $item) {
                    echo "<td>".$item[0]."</td>";                   
                    echo "<td> R$ ".number_format($item[1], 2, ',', '.')."</td>";
                    echo "<td>".$item[4]."</td>";  
                    echo "<td>".date('d-m-Y H:i:s',strtotime($item[6]))."</td>";                    
                     if($item[7] == null){echo "<td>ABERTO</td>";}else{Echo "<td>".date('d-m-Y H:i:s',strtotime($item[7]))."</td>";}
                     echo "<td>";
                     echo "<a class='btn btn-info btn-sm' href='../control/meupagamento.php?v1=".$item[0]."'>Visualizar</a> ";
                     if($_SESSION['id_perfil'] == '1'){
                        echo "<a class='btn btn btn-success btn-sm' href='../control/meupagamento.php?v4=".$item[0]."'>Baixar</a> ";
                      echo "<a class='btn btn btn-warning btn-sm' href='../control/meupagamento.php?v5=".$item[0]."'>Voltar Baixa</a> ";                
                      echo "<a class='btn btn-danger btn-sm' href='../control/meupagamento.php?v6=".$item[0]."'>Excluir</a></td>";
                      }     
                   

                    echo "<tr>";
                    
                    if($item[4] == 'EXCLUIDO'){                      
                    }else{
                     
                      $aberto -= $item[1];
                    }
                    if($item[4] == 'PAGO'){
                      $pago += $item[1];
                    }
                  }
                 
                }
                $total = $pago + $aberto;
              ?>

          </table>
        </div>
        <div id="teste">

        </div>
        <div class="col-lg-12">
          <hr>
          <h5 align="right">Total Pedidos: R$ <?php if(isset($aberto)){echo number_format($aberto, 2, ',', '.');} ?></h5>
          <h5 align="right">Total Pago: R$ <?php if(isset($pago)){echo number_format($pago, 2, ',', '.');} ?></h5>          
         
          <h5 align="right">Posição Financeira: R$ <?php if(isset($total)){echo number_format($total, 2, ',', '.');} ?></h5>
          <?php
            if(isset($total)){             
                $_SESSION['vFinal'] = $total;
              }            
            ?>
            
           


        </div>   
           


<!--*********************************************************************************************************** -->        
          <!-- Modal -->
      <div class="modal fade" id="myModal1" role="dialog">
        <div class="modal-dialog">

          <!-- Modal content-->
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal">&times;</button>
              <h4 class="modal-title">Dados Pagamento</h4>
            </div>
            <?php 
              if(isset($_SESSION['pag_pedido'])){
                foreach ($_SESSION['pag_pedido'] as $key) {
                  $pag_id_pagamento   = $key[0];
                  $pag_id_pedido      = $key[1];
                  $pag_valor          = $key[2];
                  $pag_status         = $key[3];
                  if($key[7]){
                    $pag_qrcode = "../control/imagens/pago.png";
                  }else {
                    $pag_qrcode         = $key[4];
                  }
                   
                  $pag_chavepix       = $key[5];
                  $pag_data_criacao   = $key[6];
                  $pag_data_pagamento = $key[7];
                }

              }
            
            
            ?>
            <div class="modal-body">
            <div class="form-group">
              <label>ID Pagamento: </label>
                <?php if(isset($pag_id_pagamento)){echo "".$pag_id_pagamento.""; } ?>                 
            </div>
            <div class="form-group">              
              <label><b>Data Criação: </b> </label>
                <?php if(isset($pag_data_criacao)){echo "".date('d-m-Y H:i:s',strtotime($pag_data_criacao)).""; } ?>                         
            </div>
            <div class="form-group">
              <label>Situação Pagamento: </label>  
                <?php if(isset($pag_status)){echo "".$pag_status.""; } ?>            
            </div>
            <div class="form-group">              
              <label><b>Data Pagamento: </b> </label>
                <?php if(isset($pag_data_pagamento)){echo "".date('d-m-Y H:i:s',strtotime($pag_data_pagamento)).""; }else{ echo "EM ABERTO";} ?>                         
            </div>
              
             <div class="form-group">
              <label>Pedidos: </label>  
               <div class="form-group"> <textarea class='form-control' id='pedidos' disabled ><?php if(isset($pag_id_pedido)){echo "".$pag_id_pedido.""; }else{ echo "SEM PEDIDOS";} ?> </textarea></div>           
            </div>

             <div class="form-group">
              <label>Valor Total: </label>
               R$ <?php if(isset($pag_valor)){echo number_format($pag_valor,2,',','.');} ?>              
             </div>
             <div class="form-group">
                <b>PIX Celular:</b> 43991091018
             </div>
             <div class=" form-group">
                <label for="pix"> Chave PIX</label>                 
                <div>
                <textarea class='form-control' id='pix' disabled ><?php if(isset($pag_chavepix)){echo "".$pag_chavepix.""; } ?></textarea><br>  
                <button type="button" class="btn btn-sm btn-info" onclick="copyStringToClipboard()"  id = 'brtn1'>Pix Copia Cola</button>                               
                </div> 
            </div>
            <div class="form-group"> 
                <label for="qrpix"> QRCode PIX</label><br>
                <img id="qrpix" <?php if(isset($pag_qrcode)){echo "src='".$pag_qrcode."'";}?> />
             </div>
            </div>
            <div class="modal-footer">
              
              <button type="button" class="btn btn-default" data-dismiss="modal">Fechar</button>
            </div>
          </div>

        </div>
      </div>


      <div class="modal fade" id="myModal" role="dialog">
        <div class="modal-dialog">

          <!-- Modal content-->
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal">&times;</button>
              <h4 class="modal-title">Clientes</h4>
            </div>
            <div class="modal-body">
              <select required id="clientes" name="clientes" class="form-control">
              <option value="" disabled selected> Selecione...</option>
              <?php
                $cl = new Cliente();

              if($idcl == 0){
                  $x = $cl->buscar();
                  foreach ($x as $k) {
                      if($k['id_cliente'] == $_SESSION['id_cliente']){
                          echo "<option value='".$k['id_cliente']."'selected >".$k['nome']." -- Status: ".$k['status']."</option>";
                          $clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
                      }else{
                          echo "<option value='".$k['id_cliente']."'>".$k['nome']." -- Status: ".$k['status']."</option>";
                          $clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
                      }
                  }

              }else{
                  $x = $cl->buscaCl($idcl);
                  foreach ($x as $k) {
                      if($k['status'] == 'INADINPLENTE' OR $k['status'] == 'INATIVO' ){
                          echo "<option value='' disabled> Consulte o administrador do sistema!</option>";
                      }elseif($k['id_cliente'] == $_SESSION['id_cliente']){
                          echo "<option value='".$k['id_cliente']."' selected>".$k['nome']." -- Status: ".$k['status']."</option>";
                          $clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
                      }
                  }
              }

               ?>
            </select>
            </div>
            <div class="modal-footer">
              <a class="btn btn-info" href="#"  onclick="abreLink();">Buscar</a>
              <button type="button" class="btn btn-default" data-dismiss="modal" onclick="javascript:id();">Fechar</button>

            </div>
          </div>

        </div>
      </div>

    </div>
    <div class="col-sm-2 sidenav">
    <?php
        if ($msg == 1) {
          echo "
                <div class='alert alert-warning alert-dismissible' id='myAlert'>
                   <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                    <h6><strong>Atenção,</strong> sua carteira está vazia.</h6>                                 
                </div>";
           }elseif($msg==2){
              echo "
                <div class='alert alert-warning alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> não há pedidos confirmados para o usuário.</h6>                                 
                </div>";                
            }elseif($msg==4){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> falha ao realizar a baixa.</h6>                                 
                </div>";                
            }elseif($msg==5){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Oba!</strong> Baixa confirmada.</h6>                                 
                </div>";                
            }elseif($msg==6){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Oba!</strong> Baixa retornada com sucesso.</h6>                                 
                </div>";                
            }elseif($msg==7){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> falha ao retornar a baixa.</h6>                                 
                </div>";                
            }elseif($msg==8){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Oba!</strong> Pagamento excluído com sucesso.</h6>                                 
                </div>";                
            }elseif($msg==9){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> falha ao excluir a baixa.</h6>                                 
                </div>";                
            }
       ?>         
    </div>
  </div>
</div>
<?php footer();?>

<script>

    function getValue(obj){
      document.querySelector("[name='id_produto']").value   = obj.getElementsByTagName("td")[0].innerHTML;
      document.querySelector("[name='nome']").value         = obj.getElementsByTagName("td")[1].innerHTML;
      document.querySelector("[name='valor']").value        = obj.getElementsByTagName("td")[2].innerHTML;
      document.querySelector("[name='qtd']").value          = obj.getElementsByTagName("td")[3].innerHTML;
    }

    function abreLink(){
      var v1 = document.querySelector("[name='clientes']").value;
      if(v1 ==''){
        alert('Selecione um Cliente!');
      }else{
        location.href = "../control/meupagamento.php?v2="+v1;
      }
    }  
    $(".alert-dismissible").fadeTo(5000, 500).slideUp(500, function(){
      $(".alert-dismissible").alert('close');
    });
  
  <?php 
  if($msg == 3){
    echo "$('#myModal1').modal('show');";
  }
  ?>

function copyStringToClipboard () {
        var str = document.getElementById("pix").value;

        // Create new element
        var el = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = str;
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style = {position: 'absolute', left: '-9999px'};
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);
     }



   
     


</script>

</body>
</html>
