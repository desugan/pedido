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
  <title>Cadastro Usuários</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
  <link rel="stylesheet" type="text/css" href="estilo.css">

</head>
<body>
  <?php
    include_once('../model/usuario.php');
    include_once('../model/cliente.php');
    include_once('../control/funcoes.php');
    $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';

    /**
    * Codigos das msg
    * 1 - Falha ao Cadastrar Usuário
    * 2 - Senha não conferem
    * 3 - Falta Vincular PERFIL ou Cliente
    * 4 - Usuário Cadastrado com Sucesso!
    * 5 - Usuário Atualizado com Sucesso!
    * 6 - Falha ao Atualizar Usuário
    * 7 - Usuário Excluído com Sucesso!
    */

      if ($msg == 1) {
        echo "<script> alert('Falha ao cadastrar Produto!')</script>";
      }elseif ($msg == 2){
        echo "<script> alert('Senhas não conferem!')</script>";
      }elseif ($msg == 3) {
        echo "<script> alert('Faltou vincular um Cliente ou Perfil!')</script>";
      }elseif ($msg == 4) {
        echo "<script> alert('Usuário Cadastrado com Sucesso!')</script>";
      }elseif ($msg == 5) {
        echo "<script> alert('Usuário Atualizado com Sucesso!')</script>";
      }elseif ($msg == 6) {
        echo "<script> alert('Falha ao Atualizar Usuário!')</script>";
      }elseif ($msg == 7) {
        echo "<script> alert('Usuário Excluído com Sucesso!')</script>";
      }elseif ($msg == 8) {
        echo "<script> alert('Senha resetada')</script>";
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
      <h1 align="center">Cadastro Usuários</h1>
      <form class="form-group col-lg-12 " action="../control/cadUsuario.php" method="post">
        <div class="form-group col-lg-6 " >
          <input type="number" name="id_usuario" id="id_usuario" hidden>
          <label  for="nome">Nome</label>
          <input type="text" class="form-control" id="usuario" name="usuario" required>
        </div>
        <div class="form-group col-lg-3">
          <label for="id_cliente">Vínculo Cliente</label>
            <select required id="id_cliente" name="id_cliente" class="form-control">
              <option value="" disabled selected> Selecione...</option>
              <?php
                $cl = new Cliente();
                  $x = $cl->buscar();
                  foreach ($x as $k) {
                    echo "<option  value='".$k['id_cliente']."'>".$k['nome']." -- Status: ".$k['status']."</option>";
                    $clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);
                  }

               ?>
            </select>
        </div>
        <div class="form-group col-lg-3 " >
          <label  for="id_perfil">Perfil</label>
          <select class="form-control" id='id_perfil' name="id_perfil">
            <option value="" disabled selected>Selecione...</option>
            <?php
              $x = $cl->buscaPerfil();
              foreach ($x as $key) {
                echo "<option value='".$key['id_perfil']."'>".$key['perfil']."</option>";
              }
             ?>
          </select>
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

      <button class="btn btn-block btn-success btn-lg" onclick="javascript:relProdutos();" type="button">Usuários Cadastrados</button>
      <div class="container col-lg-12" id="rels" style="display: none;">
        <h5>**Clique para editar.</h5>
        <table class="table " >
          <th>Cod.</th>
          <th>Nome</th>
          <th>Cliente</th>
          <th>Perfil</th>
          <th hidden>id Perfil</th>
          <th hidden>id_Cliente</th>
          <th>Ação</th>

          <tr onclick='javascript:getValue(this)'>
            <?php
              $us = new Usuario();
              $x = $us->buscar();
              foreach ($x as $k ) {
                echo "<tr onclick='javascript:getValue(this)'>";
                echo "<td>".$k['id_usuario']."</td>";
                echo "<td>".$k['usuario']."</td>";
                echo "<td>".$k['cliente']."</td>";
                echo "<td>".$k['perfil']."</td>";
                echo "<td hidden>".$k['id_perfil']."</td>";
                echo "<td hidden>".$k['id_cliente']."</td>";                
                echo "<td><a class='btn btn-danger btn-sm' href='../control/cadUsuario.php?v1=".$k['id_usuario']."'>Resetar Senha</a></td></tr>";
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
      document.querySelector("[name='id_usuario']").value = obj.getElementsByTagName("td")[0].innerHTML;
      document.querySelector("[name='usuario']").value    = obj.getElementsByTagName("td")[1].innerHTML;
      document.querySelector("[name='id_perfil']").value  = obj.getElementsByTagName("td")[4].innerHTML;
      document.querySelector("[name='id_cliente']").value = obj.getElementsByTagName("td")[5].innerHTML;
    }


</script>

</body>
</html>
