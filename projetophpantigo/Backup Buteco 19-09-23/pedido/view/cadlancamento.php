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
  
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
  <script src="../control/ajax.js"></script>
  <link rel="stylesheet" type="text/css" href="estilo.css">



</head>
<body>
  <?php
    include_once('../model/produto.php');
    include_once('../model/cliente.php');
    include_once('../control/funcoes.php');

        $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';
        $id_cliente = isset($_REQUEST['id_cliente']) ? $_REQUEST['id_cliente'] : 0;

        

      if ($msg == 1) {
        echo "<script> alert('Falha ao Buscar o produto!')</script>";
      }elseif ($msg == 2){
        echo "<script> alert('Carrinho Vazio!')</script>";
      }elseif ($msg == 3) {
        echo "<script> alert('Falha ao Salvar o pedido')</script>";
      }elseif ($msg == 4) {
        if($_SESSION['id_perfil'] == 3){
          echo "<script> alert('Pedido salvo com sucesso, vá até o DPTO buscar seu pedido!')</script>";
        }else{
          echo "<script> alert('Pedido salvo com sucesso!')</script>";
        }
      }elseif ($msg == 5) {
        echo "<script> alert('Atenção, seu usuário é somente para visualização. Os pedidos devem ser solicitados ao DPTO de TI!')</script>";
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
      <h1 align="center">Entrada de Produtos</h1>
      <form class="form-group col-lg-12 " action="../control/cadLancamento.php" method="post">

        <div class="form-group col-lg-12">
            
            <div class="form-group col-lg-3">
              <label for="data_lanc">Data Entrada</label>
              <input class="form-control" type="date" name="data_lanc" id="data_lanc" >
            </div>
            <div class="form-group col-lg-8">
              <label for="fornecedor">Fornecedor</label>              
              <select name="fornecedor" id="fornecedor" required class="form-control">
                <option value="#" disabled selected>Selecione...</option>
                <option value="teste">Teste</option>
              </select>
            </div>
            <div class="form-group col-lg col-lg-3">
              <label for="n_nota">N° Documento</label>
              <input class="form-control" type="number" name="n_nota" id="n_nota" >
            </div>
            
            <div class="form-group col-lg-8">
            <label for="chave">Chave Nota Fiscal</label>
            <input class="form-control" type="text" name="chave" id="chave">
            </div>
            <div class="form-group col-lg-1">
            <label>&nbsp</label>
              <button type="button" class="btn btn-default btn-md" ><a href="../control/cadLancamento.php?resetar=1"> Limpar</a></button>
            </div>

        </div>



        <div class="col-lg-12">
          <hr>
          <br>
          <h4 class="col-lg-10"><b>Entrada Produto</b></h4>
          <div class="col-lg-2">
            <button type="button" class="btn btn-success btn-md" data-toggle="modal" data-target="#myModal1">Inserir Produtos</button>
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
            <tr>
              <?php
                $valor = 0;
                if(isset($_SESSION['itensLancamento'])){
                  $itens = $_SESSION['itensLancamento'];
                  foreach ($itens as $key => $item) {
                    echo "<td>".$item[0]."</td>";
                    echo "<td>".$item[1]."</td>";
                    echo "<td>".number_format($item[2],3,',','.')."</td>";
                    echo "<td>".$item[3]."</td>";
                    echo "<td>".number_format($item[4],2,',','.')."</td>";
                    echo "<td><a href='../control/cadPedido.php?deletar=".$key."'>Excluir</a></td>";
                   // echo "<td>".$key."</td>";
                    $valor += $item[4];
                    $total = $valor;
                    echo "<tr>";
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
          <button type="button" class="btn btn-default" ><a href="../control/cadPedido.php?resetar=1"> Limpar Lançamento</a></button>

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
                    
                      echo "<option value='".$registro['id_produto']."' class='bg-info'>".$registro['nome']." - Saldo: ".$registro['saldo']."</option>";
                   
                    
                  }
               ?>
             </select>
             </div>
             <div class="form-group">
              <label>Quantidade:</label>
             <input placeholder="Quantidade" type="number" MIN = 1 step=1 name="qtd" id="qtd" class="form-control " required>
             </div>
             <div class="form-group">
              <label>Valor Total</label>
             <input placeholder="Valor Total" type="number" name="vlr_tot" id="vlr_unit" class="form-control " required>
             </div>
            </div>
            <div class="modal-footer">
              <a class="btn btn-info" href="#"  onclick="Produto();">Inserir</a>
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
                      echo "<option value='".$k['id_cliente']."'>".$k['nome']." -- Status: ".$k['status']."</option>";
                      $clientes[] = array($k['id_cliente'],$k['nome'],$k['status']);                    
                  }

                }else{
                  $x = $cl->buscaCl($idcl);
                  foreach ($x as $k) {
                    if($k['status'] == 'INADINPLENTE' OR $k['status'] == 'INATIVO' ){
                        echo "<option value='' disabled> Consulte o administrador do sistema!</option>";
                    }else{
                      echo "<option value='".$k['id_cliente']."'>".$k['nome']." -- Status: ".$k['status']."</option>";
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
      var v3 = document.querySelector("[name='vlr_tot']").value;
      if(v1 =='#'){
        alert('Selecione um Produto!');
      }else if (v2 == ''){
        alert('Informe uma quantidade!');
      }else if(v3 == ''){
        alert('Informe o valor Total!');
      }else{
        location.href = "../control/cadLancamento.php?id_produto="+v1+"&qtd="+v2+"&vlr_tot="+v3;
      }
    }


</script>

</body>
</html>
