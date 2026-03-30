<?php
  /**
  * 
  * Autor: Plínio Araújo
  */
  session_start();

  /* Controla o Tempo do usuário na sessão */
     if(!isset($_SESSION['start_login'])) { // se não tiver pego tempo que logou
        $_SESSION['start_login'] = time(); //pega tempo que logou
        // adiciona 30 minutos ao tempo e grava em outra variável de sessão
        $_SESSION['logout_time'] = $_SESSION['start_login'] + (30*60); 
    }

    // se o tempo atual for maior que o tempo de logout
    if(time() >= $_SESSION['logout_time']) { 
        session_destroy();
        header("Location: ../view/login.php?msg=2"); //vai para logout
        
    } 

    if (!isset($_SESSION['usuario'])) {
      header("Location: ../view/login.php?msg=2");
      exit();
  }
  
  /*--------------------Fim Tempo sessão --------------------*/
    include_once("../model/pedido.php");
    include_once('../control/funcoes.php');
    $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';

   

 ?>

<!DOCTYPE html>
<html>
<head>
  <title>Confirmar Pedidos</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>

  
  
  <link rel="stylesheet" type="text/css" href="estilo.css">
                              <!-- Tabela avançada-->
  <script src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.1/js/dataTables.bootstrap.min.js"></script>
  <script type="text/javascript" class="init">
   
   $(document).ready(function () {    
    $('#pedidos').DataTable();    
    $('.dataTables_length').addClass('bs-select');
  });
  </script> 
</head>
<body>
<nav class="navbar navbar-inverse">
  <div class="container-fluid">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
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
      <h1 align="center">Confirmar Pedidos Pendentes</h1>
      <!-- Modal Para Visualizar Itens do pedido selecionado-->
      <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLabel">Itens do Pedido</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
             <table class="table">
             <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Valor Total</th>                  
                </tr>
            </thead>
            <tbody>
              <tr>
              <?php
                if(isset($_SESSION['visualizar'])){
                  $itens = $_SESSION['visualizar'];
                  $valor = 0;
                  foreach ($itens as $item) {
                    echo "<td>".$item[0]."</td>";
                    echo "<td>".$item[1]."</td>";
                    echo "<td>R$ ".number_format($item[2],2,',','.')."</td>";
                    echo "<td>R$ ".number_format($item[3],2,',','.')."</td></tr>";  
                    $valor += $item[3];
                    $total = $valor;                 
                  }
                }
              ?>
              
            </tbody>

             </table>
            </div>
            <div class="modal-footer">
              <h5 align="left">Total: R$ <?php echo number_format($total,2,',','.');?></h5>
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>            
            </div>
          </div>
        </div>
      </div>

      <table id="pedidos" class="table table-hover table-bordered table-responsive" >
         <thead>
           <tr>
             <th>Nº Pedido</th>
             <th>Cliente</th>
             <th>Valor Total</th>
             <th>Data Pedido</th>
             <th>Status</th>
             <th>Ação</th>
           </tr>
       </thead>
       <tbody>
        <tr>
          <?php
            $total = 0;
            $pedido = new Pedido();
            
            if($_SESSION['id_perfil'] == '3'){
              $usu = (int)$_SESSION['id_cliente'];
              $x = $pedido->buscarPC($usu);

            }else{
              $x = $pedido->buscar();
            }

            foreach ($x as $key) {
              if($key['Status'] == 'PENDENTE'){
                echo "<td>".$key['id_pedido']."</td>";
                echo "<td>".$key['Nome']."</td>";
                echo "<td>R$ ".number_format($key['Total'],2,',','.')."</td>";
                echo "<td>".date('d-m-Y H:i:s',strtotime($key['Data']))."</td>";
                echo "<td>".$key['Status']."</td>";
                //echo "<td><a href='../control/pedido.php?deletar=".$key['id_pedido']."'>Excluir</a></td>";
                echo "<td> <a class='btn btn-success btn-sm' href='../control/pedido.php?v3=".$key['id_pedido']."'>Visualizar</a> ";
                if($_SESSION['id_perfil'] != '3'){
                  echo "<a class='btn btn btn-warning btn-sm' href='../control/pedido.php?v4=".$key['id_pedido']."'>Confirmar</a> ";                
                  
                }
                if($_SESSION['id_perfil'] == '1'){                                 
                  echo "<a class='btn btn-danger btn-sm' href='../control/pedido.php?deletar=".$key['id_pedido']."'>Excluir</a></td>";
                }
                echo "</tr>";
                $total += $key['Total'];
              }
            }
                  echo "<td hidden=''></td>";
                  echo "<td hidden=''></td>";
                  echo "<td hidden=''></td>";
                  echo "<td hidden=''></td>";
                  echo "<td hidden=''></td>";
                  echo "<td hidden=''></td></tr>";
           ?>
        </tbody>    
       </table>
         <p> Total Pedidos Pendentes: R$ <?php echo number_format($total,2,',','.'); ?></p>

    </div>




    <div class="col-sm-2 sidenav">

    <?php
        if ($msg == 1) {
          echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                   <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                    <h6><strong>Oba!</strong> Pedido confirmado com sucesso!</h6>                                 
                </div>";
           }elseif($msg==2){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> falha ao excluir o pedido!</h6>                                 
                </div>";                
            }elseif($msg==4){
              echo "
                <div class='alert alert-warning alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> pedido atualizado para PENDENTE!</h6>                                 
                </div>";
            }            
       ?>   

    </div>
  </div>
</div>
<?php footer();?>
<script>
   $(".alert-dismissible").fadeTo(5000, 500).slideUp(500, function(){
      $(".alert-dismissible").alert('close');
    });
  <?php 
  if($msg == 3){
    echo "$('#myModal').modal('show');";
  }
  ?>
</script>
</body>
</html>
