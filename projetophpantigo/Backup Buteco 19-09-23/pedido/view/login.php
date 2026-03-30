<?php
   /**
   * View Pedido
   * Autor: Plínio Araújo
   */

   session_start();
   $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';
   include_once('../control/funcoes.php');

   ?>
<!DOCTYPE html>
<html>
   <head> 
      <title>Login Buteco Ti</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
     
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
      <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
      
      <script src="../control/ajax.js"></script>
      <link rel="stylesheet" type="text/css" href="login.css">
   </head>
   <body>
        
      <!------ Include the above in your HEAD tag ---------->
      <div class="container">
  
  
</div>


      <div class="main">
         <div class="container">
            <div style="text-align: center;">
               <div class="middle">

                  <div id="login">

                     <form action="..\control\conLogin.php" method="post">
                        <fieldset class="clearfix">

                           <p ><span class="fa fa-user"></span><input id='usuario' name='usuario' type="text" autofocus  Placeholder="Usuario" required></p>
                           <!-- JS because of IE support; better: placeholder="Username" -->
                           <p><span class="fa fa-lock"></span><input id='senha' name='senha' type="password"  Placeholder="Senha" required></p>
                           <!-- JS because of IE support; better: placeholder="Password" -->
                           <div>                              
                           <span style="width:48%; text-align:right;  display: inline-block;">
                              <input type="submit" onclick="location.href='mudarsenha.php';" value="Mudar Senha">
                           </span>    
                           
                           
                           <span style="width:50%; text-align:right;  display: inline-block;">
                              <input type="submit" value="Entrar">
                           </span>
                              
                              
                           </div>
                           <br>
                        </fieldset>
                        <?php
                           if ($msg == 1) {
                              echo "
                              <div class='alert alert-danger alert-dismissible' id='myAlert'>
                                 <a href='#' class='close'>&times;</a>
                                 <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                                 <h6><strong>Usuário ou Senha incorretas,</strong> tente novamente.</h6>                                 
                              </div>
                              ";
                           }elseif($msg==2){
                              echo "
                              <div class='alert alert-danger alert-dismissible' id='myAlert'>
                                 <a href='#' class='close'>&times;</a>
                                 <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                                 <h6><strong>Usuário não logado,</strong> entre com seu usuário e senha.</h6>                                 
                              </div>";
                            }elseif($msg==3){
                              echo "
                              <div class='alert alert-danger alert-dismissible' id='myAlert'>
                                 <a href='#' class='close'>&times;</a>
                                 <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                                 <h6><strong>Sua requisição foi Cancelada.</strong> Tempo de Sessão expirado, faça o Login novamente.</h6>                                 
                              </div>";
                            }
                        ?>
                        
                        <div class="clearfix"></div>
                     </form>
                     <div class="clearfix"></div>
                  </div>
                  
                  <!-- end login -->
                  <div class="logo">
                     Buteco do TI
                     <div class="clearfix"></div>
                  </div>

               </div>
            </div>
         </div>
      </div>
      <?php footer();?>
      <script>
         $(".alert-dismissible").fadeTo(5000, 500).slideUp(500, function(){
            $(".alert-dismissible").alert('close');
         });
      </script>
   </body>
</html>
