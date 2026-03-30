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
  include_once("../model/pedido.php");
    include_once("../control/funcoes.php");
    $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';
 ?>

<!DOCTYPE html>
<html>
<head>
  <title>Relatórios</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
 
  
  <link rel="stylesheet" type="text/css" href="estilo.css">

   <!-- Base Css Files -->
   <link href="/pedido/control/css/bootstrap.min.css" rel="stylesheet" />

    <!-- Font Icons -->
    <link href="/pedido/control/assets/font-awesome/css/font-awesome.min.css" rel="stylesheet" />
    <link href="/pedido/control/assets/ionicon/css/ionicons.min.css" rel="stylesheet" />
    <link href="/pedido/control/css/material-design-iconic-font.min.css" rel="stylesheet">

    <!-- animate css -->
     <link href="/pedido/control/css/animate.css" rel="stylesheet" />

    <!-- Waves-effect -->
    <link href="/pedido/control/css/waves-effect.css" rel="stylesheet">

    <!-- Custom Files -->
    <link href="css/helper.css" rel="stylesheet" type="text/css" />
    <link href="css/style.css" rel="stylesheet" type="text/css" />
 
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
        <h2> Direita</h2>
    </div>
    <div class="col-sm-8 text-left">
      <h1 align="center">Dashboard</h1>
      <!-- Start Widget -->
       <!-- Start Widget -->
       <div class="row">
                            <div class="col-md-6 col-sm-6 col-lg-3">
                                <div class="mini-stat clearfix bx-shadow">
                                    <span class="mini-stat-icon bg-info"><i class="ion-social-usd"></i></span>
                                    <div class="mini-stat-info text-right text-muted">
                                        <span class="counter">15852</span>
                                        Total Sales
                                    </div>
                                    <div class="tiles-progress">
                                        <div class="m-t-20">
                                            <h5 class="text-uppercase">Sales <span class="pull-right">60%</span></h5>
                                            <div class="progress progress-sm m-0">
                                                <div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%;">
                                                    <span class="sr-only">60% Complete</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-sm-6 col-lg-3">
                                <div class="mini-stat clearfix bx-shadow">
                                    <span class="mini-stat-icon bg-purple"><i class="ion-ios7-cart"></i></span>
                                    <div class="mini-stat-info text-right text-muted">
                                        <span class="counter">956</span>
                                        New Orders
                                    </div>
                                    <div class="tiles-progress">
                                        <div class="m-t-20">
                                            <h5 class="text-uppercase">Orders <span class="pull-right">90%</span></h5>
                                            <div class="progress progress-sm m-0">
                                                <div class="progress-bar progress-bar-purple" role="progressbar" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100" style="width: 90%;">
                                                    <span class="sr-only">90% Complete</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6 col-sm-6 col-lg-3">
                                <div class="mini-stat clearfix bx-shadow">
                                    <span class="mini-stat-icon bg-success"><i class="ion-eye"></i></span>
                                    <div class="mini-stat-info text-right text-muted">
                                        <span class="counter">20544</span>
                                        Unique Visitors
                                    </div>
                                    <div class="tiles-progress">
                                        <div class="m-t-20">
                                            <h5 class="text-uppercase">Visitors <span class="pull-right">60%</span></h5>
                                            <div class="progress progress-sm m-0">
                                                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%;">
                                                    <span class="sr-only">60% Complete</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6 col-sm-6 col-lg-3">
                                <div class="mini-stat clearfix bx-shadow">
                                    <span class="mini-stat-icon bg-primary"><i class="ion-android-contacts"></i></span>
                                    <div class="mini-stat-info text-right text-muted">
                                        <span class="counter">5210</span>
                                        New Users
                                    </div>
                                    <div class="tiles-progress">
                                        <div class="m-t-20">
                                            <h5 class="text-uppercase">Users <span class="pull-right">57%</span></h5>
                                            <div class="progress progress-sm m-0">
                                                <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="57" aria-valuemin="0" aria-valuemax="100" style="width: 57%;">
                                                    <span class="sr-only">57% Complete</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> 
                        <!-- End row-->
                        <div class="row">
                            <div class="col-lg-8">
                                <div class="portlet"><!-- /portlet heading -->
                                    <div class="portlet-heading">
                                        <h3 class="portlet-title text-dark text-uppercase">
                                            Website Stats
                                        </h3>
                                        <div class="portlet-widgets">
                                            <a href="javascript:;" data-toggle="reload"><i class="ion-refresh"></i></a>
                                            <span class="divider"></span>
                                            <a data-toggle="collapse" data-parent="#accordion1" href="#portlet1"><i class="ion-minus-round"></i></a>
                                            <span class="divider"></span>
                                            <a href="#" data-toggle="remove"><i class="ion-close-round"></i></a>
                                        </div>
                                        <div class="clearfix"></div>
                                    </div>
                                    <div id="portlet1" class="panel-collapse collapse in">
                                        <div class="portlet-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div id="website-stats" style="position: relative;height: 320px;"></div>
                                                    <div class="row text-center m-t-30">
                                                        <div class="col-sm-4">
                                                            <h4 class="counter">86,956</h4>
                                                            <small class="text-muted"> Weekly Report</small>
                                                        </div>
                                                        <div class="col-sm-4">
                                                            <h4 class="counter">86,69</h4>
                                                            <small class="text-muted">Monthly Report</small>
                                                        </div>
                                                        <div class="col-sm-4">
                                                            <h4 class="counter">948,16</h4>
                                                            <small class="text-muted">Yearly Report</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div> <!-- /Portlet -->
                            </div> <!-- end col -->

                            <div class="col-lg-4">
                                <div class="portlet"><!-- /portlet heading -->
                                    <div class="portlet-heading">
                                        <h3 class="portlet-title text-dark text-uppercase">
                                            Website Stats
                                        </h3>
                                        <div class="portlet-widgets">
                                            <a href="javascript:;" data-toggle="reload"><i class="ion-refresh"></i></a>
                                            <span class="divider"></span>
                                            <a data-toggle="collapse" data-parent="#accordion1" href="#portlet2"><i class="ion-minus-round"></i></a>
                                            <span class="divider"></span>
                                            <a href="#" data-toggle="remove"><i class="ion-close-round"></i></a>
                                        </div>
                                        <div class="clearfix"></div>
                                    </div>
                                    <div id="portlet2" class="panel-collapse collapse in">
                                        <div class="portlet-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div id="pie-chart">
                                                        <div id="pie-chart-container" class="flot-chart" style="height: 320px;">
                                                        </div>
                                                    </div>

                                                    <div class="row text-center m-t-30">
                                                        <div class="col-sm-6">
                                                            <h4 class="counter">86,956</h4>
                                                            <small class="text-muted"> Weekly Report</small>
                                                        </div>
                                                        <div class="col-sm-6">
                                                            <h4 class="counter">86,69</h4>
                                                            <small class="text-muted">Monthly Report</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div> <!-- /Portlet -->
                            </div> <!-- end col -->
                        </div> <!-- End row -->
                       
                              
     <!-- End row-->
    </div>
    <div class="col-sm-2 sidenav">
        <h2> Esquerda</h2>
     <?php
        if ($msg == 1) {
          echo "
                <div class='alert alert-success alert-dismissible' id='myAlert'>
                   <a href='#' class='close'>&times;</a>
                    <span class='glyphicon glyphicon-thumbs-up fa-2x'></span>
                    <h6><strong>Oba!</strong> Pedido excluído com sucesso!</h6>                                 
                </div>";
           }elseif($msg==2){
              echo "
                <div class='alert alert-danger alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> falha ao excluir o pedido!</h6>                                 
                </div>";                
            }elseif($msg==5){
              echo "
                <div class='alert alert-warning alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> 
                    seu usuário é somente para visualização. Os pedidos devem ser solicitados ao DPTO de TI!</h6>                                 
                </div>";
            }elseif($msg==6){
              echo "
                <div class='alert alert-warning alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> 
                    para mudança de status o pedido não deve estar como CONFIRMANDO PAGAMENTO, EXCLUÍDO ou PAGO!</h6>                                 
                </div>";
            }elseif($msg==7){
              echo "
                <div class='alert alert-warning alert-dismissible' id='myAlert'>
                  <a href='#' class='close'>&times;</a>
                  <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                  <h6><strong>Atenção,</strong> 
                  para excluir o pedido não deve estar como PAGO!</h6>                                 
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
  
    jQuery(document).ready(function($) {
                $('.counter').counterUp({
                    delay: 100,
                    time: 1200
                });
            });
            
       
</script>
<!-- Dashboard -->
<script src="/pedido/control/js/jquery.dashboard.js"></script>
<script src="/pedido/control/js/jquery.min.js"></script>
<script src="/pedido/control/js/bootstrap.min.js"></script>
<script src="/pedido/control/js/waves.js"></script>


 <!-- CUSTOM JS -->
 <script src="/pedido/control/js/jquery.app.js"></script>

<script src="/pedido/control/assets/flot-chart/jquery.flot.js"></script>
<script src="/pedido/control/assets/fastclick/fastclick.js"></script>

<script src="assets/counterup/waypoints.min.js" type="text/javascript"></script>
<script src="assets/counterup/jquery.counterup.min.js" type="text/javascript"></script>


<script>
            var resizefunc = [];
</script>

        <!-- jQuery  -->
        <script src="/pedido/control/js/jquery.min.js"></script>**
        <script src="/pedido/control/js/bootstrap.min.js"></script>

        <script src="/pedido/control/assets/fastclick/fastclick.js"></script>**

        <!-- sweet alerts -->
        <script src="/pedido/control/assets/sweet-alert/sweet-alert.min.js"></script>
        <script src="/pedido/control/assets/sweet-alert/sweet-alert.init.js"></script>

        <!-- flot Chart -->
        <script src="/pedido/control/assets/flot-chart/jquery.flot.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.time.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.tooltip.min.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.resize.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.pie.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.selection.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.stack.js"></script>
        <script src="/pedido/control/assets/flot-chart/jquery.flot.crosshair.js"></script>

        <!-- Counter-up -->
        <script src="/pedido/control/assets/counterup/waypoints.min.js" type="text/javascript"></script>
        <script src="/pedido/control/assets/counterup/jquery.counterup.min.js" type="text/javascript"></script>
        
        <!-- CUSTOM JS -->
        <script src="/pedido/control/js/jquery.app.js"></script>

        <!-- Dashboard -->
        <script src="/pedido/control/js/jquery.dashboard.js"></script>


        <script type="text/javascript">
            /* ==============================================
            Counter Up
            =============================================== */
            jQuery(document).ready(function($) {
                $('.counter').counterUp({
                    delay: 100,
                    time: 1200
                });
            });
        </script>

</body>
</html>
