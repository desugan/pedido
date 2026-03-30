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
        header("location:login.php?msg=3"); //vai para logout
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
  <title>Pedidos</title>
  <meta charset="utf-8">  
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  
  <!--<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
  <script src="../control/ajax.js"></script>-->
  <link rel="stylesheet" type="text/css" href="estilo.css">

  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
      <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">



</head>
<body>
  <?php
    include_once('../model/produto.php');
    include_once('../model/cliente.php');
    include_once('../control/funcoes.php');

        $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';
        $id_cliente = isset($_REQUEST['id_cliente']) ? $_REQUEST['id_cliente'] : 0;

        if(isset($_SESSION['cliente'])){
            $cliente = new Cliente();
            $x = $_SESSION['cliente'];
            $cliente->setId($x[0]);
            $cliente->setNome($x[1]);
            $cliente->setStatus($x[2]);
        }else{
          unset($_SESSION['itensCarrinho']);
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
      <h1 align="center">Criar Pedido</h1>
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
              <button type="button" class="btn btn-default btn-md" ><a href="../control/cadCliente.php?resetar=1"> Limpar</a></button>
            </div>

        </div>



        <div class="col-lg-12">
          <hr>
          <br>
          <h4 class="col-lg-10"><b>Pedido</b></h4>
          <div class="col-lg-2">
            <button type="button" class="btn btn-success btn-md" data-toggle="modal" data-target="#myModal1">Produtos</button>
          </div>
          <br>
        </div>
        <div class="col-lg-12">
          <table class="table table-hover table-bordered" id="pedido">
            <th>ID:</th>
            <th>Nome</th>
            <th>Valor Uni.</th>
            <th>Quantidade</th>
            <th>Total</th>
            <th>Ação</th>
            
              <?php
                $valor = 0;
                if(isset($_SESSION['itensCarrinho'])){
                  $itens = $_SESSION['itensCarrinho'];
                  $x = 0;
                  foreach ($itens as $key => $item) {
                    if(isset($item[7])){
                      echo "<tr style='color: red;'>  <td >".$item[0]."**</td>";
                    }else{
                      echo "<tr> <td>".$item[0]."</td>";
                    }
                    echo "<td>".$item[1]."</td>";
                    echo "<td>".number_format($item[2],2,',','.')."</td>";
                    echo "<td>".$item[3]."</td>";
                    echo "<td>".number_format($item[4],2,',','.')."</td>";
                    echo "<td><a href='../control/cadPedido.php?deletar=".$key."'>Excluir</a></td>";
                   // echo "<td>".$key."</td>";
                    $valor += $item[4];
                    $total = $valor;
                    echo "</tr>";
                    $x++;
                  }

                }

              ?>

          </table>
        </div>
        <div id="teste">

        </div>
        <div class="col-lg-12">
          <hr>
          <h5 align="right">Total: R$ <?php if(isset($total)){echo number_format($total,2,',','.');} ?></h5>
          <h5 align="right">Desconto: 0.00
          
          </h5>
          <h5 align="right">Valor Total: R$ <?php if(isset($total)){echo number_format($total,2,',','.');} ?></h5>
          <?php
            if(isset($total)){             
                $_SESSION['vFinal'] = $total;
              }            
            ?>

        </div>
        <div class="col-lg-">
          <br>
          <br>
          <br>
          <br>

          <button type="submit" class="btn btn-success">Salvar</button>
          <button type="button" class="btn btn-default" ><a href="../control/cadPedido.php?resetar=1"> Limpar Carrinho</a></button>

          <br>
          <br><br>
        </div>

      </form>

          <!-- Modal -->
      <div class="modal fade" id="myModal1" role="dialog">
        <div class="modal-dialog">
          <!-- Modal content-->
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal">&times;</button>
              <h4 class="modal-title">Selecione um produto</h4>
            </div>
            <div class="modal-body">
              <div class="form-group">
              <label for="produto">Produto:</label>
              <select name="produto" id="produto" required class="form-control">
                <option value="#" disabled selected>Selecione...</option>
                <?php
                  $pr = new Produto();
                  $x = $pr->buscar();
                  foreach ($x as $registro ) {
                    if($registro['saldo'] > 0){
                      echo "<option required value='".$registro['id_produto']."' class='bg-info'>".$registro['nome']." - Saldo: ".$registro['saldo']."</option>";
                    }
                    
                  }
               ?>
             </select>
             </div>
             <div class="form-group">
              <label>Quantidade:</label>
             <input placeholder="Quantidade" type="number" MIN = 1 step=1 name="qtd" id="qtd" class="form-control " required>
             </div>
            </div>
            <div class="modal-footer">
              <a class="btn btn-info" href="#"  onclick="Produto();">Buscar</a>
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
                    if($k['status'] == 'INADIMPLENTE' OR $k['status'] == 'INATIVO' ){
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
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                   <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                    <h6><strong>Ops, não localizamos o produto,</strong> tente novamente.</h6>                                 
                </div>";
           }elseif($msg==2){
              echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                  <h6><strong>Carrinho Vazio,</strong> bora comprar mais.</h6>                                 
                </div>";
            }elseif($msg==3){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Falha ao salvar o pedido,</strong> tente novamente.</h6>                                 
                  </div>";
             }elseif($msg==4){
              if($_SESSION['id_perfil'] == 3){
                echo "
                  <div class='alert alert-success alert-dismissible' id='myAlert'>
                    <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                    <h6><strong>Pedido salvo com sucesso,</strong> vá até o departamento buscar seu pedido!.</h6>                                 
                    </div>";
              }else{
                echo "
                  <div class='alert alert-success alert-dismissible' id='myAlert'>
                    <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                    <h6><strong>Oba!</strong> Pedido salvo com sucesso!</h6>                                 
                    </div>";
              }
             }elseif($msg==5){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção, seu usuário é somente para visualização,</strong> os pedidos devem ser solicitados ao DPTO de TI!.</h6>                                 
                  </div>";
             }elseif($msg==6){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> a quantidade informada é maior que o saldo disponível.</h6>                                 
                  </div>";
              }elseif($msg==7){
                    echo "
                      <div class='alert alert-danger alert-dismissible' id='myAlert'>
                        <a href='#' class='close'>&times;</a>
                        <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                        <h6><strong>Atenção,</strong> o item já está no carrinho, selecione um outro.</h6>                                 
                        </div>";}
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
        location.href = "../control/cadCliente.php?busca="+v1;
      }
    }
     function Produto(){
      var v1 = document.querySelector("[name='produto']").value;
      var v2 = document.querySelector("[name='qtd']").value;
      if(v1 == '#'){
        alert('Selecione um item!');
      }else if (v2 == ''){
        alert('Informe uma quantidade!');
      }else{
        location.href = "../control/cadPedido.php?id_produto="+v1+"&qtd="+v2;
      }
    }
    $(".alert-dismissible").fadeTo(5000, 500).slideUp(500, function(){
      $(".alert-dismissible").alert('close');
    });


</script>

</body>
</html>
