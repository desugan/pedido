<?php
   /**
   * View Pedido
   * Autor: Plínio Araújo
   */

   session_start();
   session_destroy();
   $msg = isset($_REQUEST['msg']) ? $_REQUEST['msg'] : '';
   include_once("../control/funcoes.php");


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
      
      <div class="main">
         <div class="container">
            <center>
               <div class="middle">

                  <div id="login">

                     <form action="..\control\conLogin.php" method="post">
                        <fieldset class="clearfix">

                           <p ><span class="fa fa-user"></span><input id='usuario' name='usuario' type="text"  Placeholder="Usuario" required></p>
                           <!-- JS because of IE support; better: placeholder="Username" -->
                           <p><span class="fa fa-lock"></span><input id='senha' name='senha' type="password" required  Placeholder="Senha" required></p>
                           <p><span class="fa fa-lock"></span><input id='senha' name='nsenha' type="password" required 
                            Placeholder="Nova Senha" required></p>
                           <p><span class="fa fa-lock"></span><input id='senha' name='csenha' type="password" required 
                            Placeholder="Confirmar Senha" required></p>
                           <!-- JS because of IE support; better: placeholder="Password" -->
                           <div>            
                           
                           <span style="width:48%; text-align:left;  display: inline-block;"><input type="submit" onClick="history.go(-1)" value="Voltar"></span>
                           <span style="width:50%; text-align:right;  display: inline-block;"><input type="submit" value="Mudar Senha"></span>
                              
                           </div>
                        </fieldset>
                        <br>
                        <?php
                           if ($msg == 1) {
                              echo "
                              <div class='alert alert-danger alert-dismissible' id='myAlert'>
                                 <a href='#' class='close'>&times;</a>
                                 <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                                 <h6><strong>Não foi possível alterar a senha,</strong> tente novamente.</h6>                                 
                              </div>
                              ";
                           }elseif($msg==2){
                              echo "
                              <div class='alert alert-danger alert-dismissible' id='myAlert'>
                                 <a href='#' class='close'>&times;</a>
                                 <span class='glyphicon glyphicon-thumbs-down fa-2x'></span>
                                 <h6><strong>As senhas não conferem,</strong> tente novamente.</h6>                                 
                              </div>";
                            }
                        ?>
                        <div class="clearfix"></div>
                     </form>
                     <div class="clearfix"></div>
                  </div>
                  <!-- end login -->
                  <div class="logo">
                     Boteco do Ti
                     <div class="clearfix"></div>
                  </div>
                  

               </div>
            </center>
            
         </div>

       
     
      
      <script>
         $(".alert-dismissible").fadeTo(2000, 500).slideUp(500, function(){
            $(".alert-dismissible").alert('close');
         });
      </script>
   </body>
</html>
