<?php

    include_once('../model/fornecedor.php');
    /**
     * Control Fornecedor
     * Autor: Plínio Araújo
     */



    $x = new Fornecedor();

    $x->setIdFornecedor(1);
    $x->setRazao('SUPER GOLF');
    $x->setCnpj('10970887007964');
    $x->setStatus('INATIVO');
    $x->setData('2023-06-20 13:20:00');
    $x->setIdUsuario(1);

    echo "Obejto criado <br>";
    var_dump($x);
    echo "<p>";


    //$x->atualizar();

    $y = $x->buscarFornecedor();
    foreach ($y as $key) {
        echo "Fornecedor do Objeto <br>";
        echo $key['razao'];
        echo "<br><p>";
    }


    $y = $x->buscarFornecedores();
    echo "Todos Fornecedores Cadastrados <br>";
    foreach ($y as $key) {
        echo $key['razao'];
        echo "<br>";
    }
        
 
