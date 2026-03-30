<?php
  /**
  * View Pedido
  * Autor: Plínio Araújo
  */
 ?>

<!DOCTYPE html>
<html>
<head>
  <title>Relatório Pedidos</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>

  <script src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.1/js/dataTables.bootstrap.min.js"></script>





  
  <script type="text/javascript" class="init">
    $(document).ready(function () {
       $('#example').DataTable();
     });
</script>
  <link rel="stylesheet" type="text/css" href="estilo.css">
</head>
<body>
  <?php
    session_start();
    include_once("../model/pedido.php");
    $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';

    if ($msg == 1) {
        echo "<script> alert('Pedido excluído com sucesso')</script>";
      }elseif ($msg == 2){
        echo "<script> alert('Falha ao excluir o pedido')</script>";
      }
  ?>

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
        <li><a href="pedido.php">Pedidos</a></li>
        <?php if($_SESSION['id_perfil'] == '1'){echo "<li><a href='cadCliente.php'>Cadastro Cliente</a></li><li><a href='cadProduto.php'>Cadastro Produto</a></li><li><a href='cadUsuario.php'>Usuários</a></li> ";}?>
        <li><a href="pagamento.php">Pagamento</a></li>
        <li><a href="relatorio.php">Relatórios</a></li>
        <div style="color: white;padding: 15px 50px 5px 700px;float: right;font-size: 16px;"><li>
          <?php if(isset($_SESSION['usuario'])) echo $_SESSION['usuario']; ?> &nbsp;
              <a href="../control/sair.php" class="btn btn-danger ">Sair</a></li>
        </div>
      </ul>
    </div>
  </div>
</nav>

<div class="container-fluid text-center">
  <div class="row content">
    <div class="col-sm-2 sidenav">

    </div>
    <div class="col-sm-8 text-left">
      <h1 align="center">Relatórios</h1>

       <table id="example" class="table table-hover table-bordered table-responsive" >
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

            if($_SESSION['id_perfil'] == '1'){
              $usu = 0;
                $x = $pedido->buscar();
            }else{
              $usu = (int)$_SESSION['id_cliente'];
              $x = $pedido->buscarPC($usu);
            }


            foreach ($x as $key) {
              echo "<td>".$key['id_pedido']."</td>";
              echo "<td>".$key['Nome']."</td>";
              echo "<td>R$ ".$key['Total']."</td>";
              echo "<td>".date('d-m-Y H:i:s',strtotime($key['Data']))."</td>";
              echo "<td>".$key['Status']."</td>";
              echo "<td><a href='../control/pedido.php?deletar=".$key['id_pedido']."'>Excluir</a></td>";
              echo "</tr>";
              $total += $key['Total'];
            }
           ?>
         </tbody>
       </table>
         <p> Total Pedido: <?php echo $total; ?></p>

    </div>




    <div class="col-sm-2 sidenav">

    </div>
  </div>
</div>
<footer class="container-fluid text-center">
  <p>Candidato Plínio Araújo</p>
  <p>E-mail: obrplinio18@gmail.com</p>
  <p>Contato: 9 9803-1955</p>
  <p><?php echo date($pedido->getData()); ?></p>
</footer>
</body>
</html>
