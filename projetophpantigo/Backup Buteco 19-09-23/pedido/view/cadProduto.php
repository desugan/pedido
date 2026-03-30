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
  if($_SESSION['id_perfil'] != '1'){
    	header("Location: ../view/pedido.php");
      exit();
  }
 ?>
<!DOCTYPE html>
<html>
<head>
  <title>Cadastro Produto</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
  <link rel="stylesheet" type="text/css" href="estilo.css">
  
</head>
<body>
  <?php
    include_once('../model/produto.php');
    include_once('../control/funcoes.php');

        $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';

      if ($msg == 1) {
        echo "<script> alert('Falha ao cadastrar Produto!')</script>";
      }elseif ($msg == 2){
        echo "<script> alert('Produto Cadastrado com sucesso!')</script>";
      }elseif ($msg == 3) {
        echo "<script> alert('Produto atualizado com sucesso!')</script>";
      }elseif ($msg == 4) {
        echo "<script> alert('Produto Excluido com sucesso!')</script>";
      }elseif ($msg == 5) {
        echo "<script> alert('Falha ao Excluir o item, verifique se existe pedidos para este item!')</script>";
      }elseif ($msg == 6) {
        echo "<script> alert('Falha ao Atualizar o Item!')</script>";
      }elseif ($msg == 7) {
        echo "<script> alert('Quantidade mínima é 1. Por favor verifique o saldo!')</script>";
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
      <h1 align="center">Cadastro Produtos</h1>
      <form class="form-group col-lg-12 " action="../control/cadProduto.php" method="post">
        <div class="form-group col-lg-6 " >
          <input type="number" name="id_produto" id="id_produto" hidden>
          <label  for="nome">Nome</label>
          <input type="text" class="form-control" id="nome" name="nome" required>
        </div>
        <div class="form-group col-lg-6 ">
          <label  for="marca">Marca</label>
          <input type="text" class="form-control" id="marca" name="marca" required>
        </div>
        <div class="form-group col-lg-6">
          <label for="valor">Valor Un.</label>
          <input type="number" step=0.01 class="form-control" id="valor" name="valor" required>
        </div>
         <div class="form-group col-lg-6">
          <label for="valor">Saldo</label>
          <input type="number" MIN = 0 step=1 class="form-control" id="saldo" name="saldo" required>
        </div>
        <div class="col-lg-6">
          <br>
          <button type="submit" class="btn btn-success">Salvar</button>
          <button type="reset" class="btn btn-default">Limpar</button>
          <button type="submit" name="excluir" value="excluir" class="btn btn-danger">Excluir</button>
          <br>
          <br><br>
        </div>

      </form>

      <button class="btn btn-block btn-success btn-lg" onclick="javascript:relProdutos();" type="button">Produtos Cadastrados</button>
      <div class="container col-lg-12" id="rels" style="display: none;">
        <h5>**Clique para editar.</h5>
        <table class="table" >
          <th>Cod.</th>
          <th>Nome</th> 
          <th>Marca</th>
          <th>Valor Unitário</th>
          <th>Saldo</th>
            <?php
              $pr = new Produto();
              $x = $pr->buscar();
              foreach ($x as $k ) {
                echo "<tr onclick='javascript:getValue(this)'>";
                echo "<td>".$k['id_produto']."</td>";
                echo "<td>".$k['nome']."</td>";
                echo "<td>".$k['marca']."</td>";
                echo "<td>".$k['valor']."</td>";
                echo "<td>".$k['saldo']."</td></tr>";
              }
             ?>
        </table>
      </div>
    </div>
    <div class="col-sm-2 sidenav">

    </div>
  </div>
</div>

<?php footer();?>

<script>
   function relProdutos(){
    var div1 = document.getElementById("rels").style.display;
    if(div1 == 'none'){
      document.getElementById("rels").style.display='block';
    }else{
      document.getElementById("rels").style.display='none';
      }
    }
    function getValue(obj){
      document.querySelector("[name='id_produto']").value   = obj.getElementsByTagName("td")[0].innerHTML;
      document.querySelector("[name='nome']").value         = obj.getElementsByTagName("td")[1].innerHTML;
      document.querySelector("[name='marca']").value         = obj.getElementsByTagName("td")[2].innerHTML;
      document.querySelector("[name='valor']").value           = obj.getElementsByTagName("td")[3].innerHTML;
      document.querySelector("[name='saldo']").value           = obj.getElementsByTagName("td")[4].innerHTML;
      document.querySelector("[name='nome']").focus();
    }
</script>

</body>
</html>
