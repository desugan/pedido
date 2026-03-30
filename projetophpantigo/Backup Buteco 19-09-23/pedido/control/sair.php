<?php

session_start();

$_SESSION['usuario'] = 0;
$_SESSION['id_perfil'] = "";
$_SESSION['id_cliente']  = "";
$_SESSION['cliente']  = "";
session_destroy();

header("Location: ../view/login.php");
 ?>
