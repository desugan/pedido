<?php

    function footer() {  
        if(isset($_SESSION['usuario'])){
            $usuario = $_SESSION['usuario'];
        }else{
            $usuario = 'Novo Usuario';
        }  

        echo "
            <footer class='container-fluid text-center'>
            
            <p><img src='../icons/email.png' height='30' width='30'></img> E-mail: <a href='mailto:obrplinio18@gmail.com?subject=Usuário: ".$usuario."'>Clique aqui para nos enviar um e-mail!</a>
            <img src='../icons/wts.png' height='30' width='30'></img> Contato:<a  target='_blank' href='https://api.whatsapp.com/send?phone=5543998031955'> 9 9803-1955</a></p>           
            <p><img src='../icons/icon.png' height='30' width='30'></img>  © 2023 Buteco do Ti - Versão: 1.0.3</p>            
            </footer>";
    }

    function menuAdm(){
        echo "
            
            
            
            <li class='dropdown'>                
                <a class='dropdown-toggle' href='#' id='navbarDropdownMenuLink' data-toggle='dropdown'>
                Cadastros<span class='caret'></span>
                </a>
                <ul class='dropdown-menu dropdown-menu-left'>
                    <li><a href='cadCliente.php'>Cadastro de Clientes</a></li>
                    <li><a href='cadFornecedor.php'>Cadastro de Fornecedores</a></li>
                    <li><a href='cadProduto.php'>Cadastro de Produtos</a></li>                    
                    <li><a href='cadUsuario.php'>Cadastro de Usuários</a></li>
                </ul>
            </li>
            <li><a href='confpedido.php'>Confirmar Pedidos </a></li>
            <li class='dropdown'>                
                <a class='dropdown-toggle' href='#' id='navbarDropdownMenuLink' data-toggle='dropdown'>
                Pagamentos <span class='caret'></span>
                
                </a>
                <ul class='dropdown-menu dropdown-menu-left'>
                    <li><a href='pagamento.php'>Novo Pagamento</a></li>
                    <li><a href='meuspagamento.php'>Meus Pagamento</a></li>
                </ul>
            </li>            
            <li class='dropdown'>                
                <a class='dropdown-toggle' href='#' id='navbarDropdownMenuLink' data-toggle='dropdown'>
                Pedidos <span class='caret'></span>
                
                </a>
                <ul class='dropdown-menu dropdown-menu-left'>
                    <li><a href='pedido.php'>Novo Pedido</a></li>
                    <li><a href='meuspedidos.php'>Meus Pedidos</a></li>
                </ul>
            </li>            
            <li><a href='relatorio.php'>Relatórios</a></li>"
            
            
            
            
            ;
    }

    function menuUsu(){
        echo "        
        <li class='dropdown'>                
            <a class='dropdown-toggle' href='#' id='navbarDropdownMenuLink' data-toggle='dropdown'>
            Pagamentos <span class='caret'></span>
            
            </a>
            <ul class='dropdown-menu dropdown-menu-left'>
                <li><a href='pagamento.php'>Novo Pagamento</a></li>
                <li><a href='meuspagamento.php'>Meus Pagamento</a></li>
            </ul>
        </li>            
        <li class='dropdown'>                
            <a class='dropdown-toggle' href='#' id='navbarDropdownMenuLink' data-toggle='dropdown'>
            Pedidos <span class='caret'></span>
            </a>
            <ul class='dropdown-menu dropdown-menu-left'>
                <li><a href='pedido.php'>Novo Pedido</a></li>
                <li><a href='meuspedidos.php'>Meus Pedidos</a></li>
                <li><a href='confpedido.php'>Confirmar Pedidos</a></li>
            </ul>
        </li>            
        <li><a href='relatorio.php'>Relatórios</a></li>";

    }    


    //MENU DESABILITADO.
    /*<li class='dropdown'>
            <a class='dropdown-toggle' href='#' id='navbarDropdownMenuLink' data-toggle='dropdown'>
                Lançamentos<span class='caret'></span></a>
            <ul class='dropdown-menu dropdown-menu-left'>
                 <li><a href='cadlancamento.php'>Lançamento Produtos</a></li>
                 <li><a href='#'>Meus Lançamentos</a></li>
            </ul>
               
            </li>
     */
?>    

