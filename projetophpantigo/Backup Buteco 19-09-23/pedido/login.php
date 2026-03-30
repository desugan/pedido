<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<HEADER>
	<link href='assets/css/bootstrap.css' rel='stylesheet' />
    <link href='assets/css/font-awesome.css' rel='stylesheet' />
    <link href='assets/js/morris/morris-0.4.3.min.css' rel='stylesheet' />
    <link href='assets/css/custom.css' rel='stylesheet' />
   <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css' />
</HEADER>
<body>
    <div class="container">
        <div class="row text-center ">
            <div class="col-md-12">
                <br /><br />
                <h2> Buteco do Ti</h2>

                <h5>( Faça o login )</h5>
                 <br />
            </div>
        </div>
         <div class="row ">

                  <div class="col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3 col-xs-10 col-xs-offset-1">
                        <div class="panel panel-default">
                            <div class="panel-heading">
                        <strong>   Entre com os dados </strong>
                            </div>
                            <div class="panel-body">
                                <form action="../model/validaLogin.php" role="form" method="POST">
                                       <br />
                                     <div class="form-group input-group">
                                            <span class="input-group-addon"><i class="fa fa-tag"  ></i></span>
                                            <input type="text" class="form-control" name="login" placeholder="Seu Login " required />
                                        </div>
                                        <div class="form-group input-group">
                                            <span class="input-group-addon"><i class="fa fa-lock"  ></i></span>
                                            <input type="password" class="form-control" name="senha" placeholder="Sua senha" required/>
                                        </div>
                                    <div class="form-group">
                                            <label class="checkbox-inline">
                                                <input type="checkbox" /> Lembre-me
                                            </label>
                                            <span class="pull-right">
                                                   <a href="registro.php" >Cadastre-se </a>
                                            </span>
                                        </div>

                                     <input type="submit" value="Login" name="btnlogin" class="btn btn-primary ">
                                    </form>

                            </div>

                        </div>
                    </div>


        </div>
    </div>

</body>
</html>
