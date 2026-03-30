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
  // Valida se o usuário é ADM, caso negativo retorna para Pedido.
  if($_SESSION['id_perfil'] != '1'){
    	header("Location: ../view/pedido.php");

      exit();
  }
 ?>
<!DOCTYPE html>
<html>
<head>
  <title>Cadastro Cliente</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
  
  <link rel="stylesheet" type="text/css" href="estilo.css">
</head>
<body>
  <?php
    include_once('../model/cliente.php');
    include_once('../control/funcoes.php');

        $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';

      
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
      <h1 align="center">Cadastro Cliente</h1>
      <form class="form-group col-lg-12 " action="../control/cadCliente.php" method="post">
        <div class="form-group col-lg-6 " >
          <input type="number" name="id_cliente" id="id_cliente" hidden>
          <label  for="nome">Nome</label>
          <input type="text" class="form-control" id="nome" name="nome" required>
        </div>
        <div class="form-group col-lg-6">
          <label for="status">Status</label>
          <select required name="status" id="status" class="form-control ">
            <option value="" disabled selected>Selecione....</option>
            <option value="ATIVO">ATIVO</option>
            <option value="INATIVO">INATIVO</option>
            <option value="INADIMPLENTE">INADIMPLENTE</option>

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

      <button class="btn btn-block btn-success btn-lg" onclick="javascript:relCliente();" type="button">Clientes Cadastrados</button>
      <div class="container col-lg-12" id="rels" style="display: none;">
        <h5>**Clique para editar.</h5>
        <table class="table" >
          <th>ID</th>
          <th>Nome</th>
          <th>Status</th>

          <tr onclick='javascript:getValue(this)'>
            <?php
              $cl = new Cliente();
              $x = $cl->buscar();

              foreach ($x as $k ) {
                if($k['status'] == 'ATIVO'){
                  echo "<tr class='bg-success' onclick='javascript:getValue(this)'>";
                  echo "<td>".$k['id_cliente']."</td>";
                  echo "<td>".$k['nome']."</td>";                
                  echo "<td>".$k['status']."</td></tr>";
                }else{
                  echo "<tr class='bg-warning' onclick='javascript:getValue(this)'>";
                  echo "<td>".$k['id_cliente']."</td>";
                  echo "<td>".$k['nome']."</td>";                
                  echo "<td>".$k['status']."</td></tr>";
                }
              }

             ?>
        </table>
      </div>
    </div>
    <div class="col-sm-2 sidenav">
    <?php
        if ($msg == 1) {
          echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                   <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                    <h6><strong>Atenção,</strong> falha ao cadastrar o cliente.</h6>                                 
                </div>";
           }elseif($msg==2){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Oba!</strong> Cliente cadastrado com sucesso.</h6>                                 
                </div>";                
            }elseif($msg==3){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Oba!</strong> Cliente atualizado com sucesso.</h6>                                 
                </div>";                
            }elseif($msg==4){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Oba!</strong> Cliente excluído com sucesso.</h6>                                 
                </div>";                
            }

            
           
       ?>

    </div>
  </div>
</div>

<?php footer();?>

<script>
   function relCliente(){
    var div1 = document.getElementById("rels").style.display;
    if(div1 == 'none'){
      document.getElementById("rels").style.display='block';
    }else{
      document.getElementById("rels").style.display='none';
      }
    }
    function getValue(obj){
      document.querySelector("[name='id_cliente']").value   = obj.getElementsByTagName("td")[0].innerHTML;
      document.querySelector("[name='nome']").value         = obj.getElementsByTagName("td")[1].innerHTML;
      document.querySelector("[name='status']").value           = obj.getElementsByTagName("td")[2].innerHTML;
      document.querySelector("[name='nome']").focus();
    }
    $(".alert-dismissible").fadeTo(5000, 500).slideUp(500, function(){
      $(".alert-dismissible").alert('close');
    });
</script>

</body>
</html>
