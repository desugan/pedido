<?php


include_once('banco.php');
/**
 * Classe Fornecedor
 * Autor: Plínio Araújo
 */
class Fornecedor {

    private $id_fornecedor;
    private $razao;
    private $cnpj;
    private $status;
    private $data;
    private $id_usuario;


    function __construct(){

    }


    /**
    * @return mixed
    */
    public function getRazao(){
        return $this->razao;
    }

    /**
    * @return mixed
    */
    public function setRazao($razao){
        $this->razao = $razao;
    }

    /**
     * @return mixed
     */
    public function getIdFornecedor()
    {
        return $this->id_fornecedor;
    }

    /**
     * @param mixed $id_fornecedor
     */
    public function setIdFornecedor($id_fornecedor)
    {
        $this->id_fornecedor = $id_fornecedor;
    }

    /**
     * @return mixed
     */
    public function getCnpj()
    {
        return $this->cnpj;
    }

    /**
     * @param mixed $cnpj
     */
    public function setCnpj($cnpj)
    {
        $this->cnpj = $cnpj;
    }

    /**
     * @return mixed
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * @param mixed $status
     */
    public function setStatus($status)
    {
        $this->status = $status;
    }

    /**
     * @return mixed
     */
    public function getIdUsuario()
    {
        return $this->id_usuario;
    }

    /**
     * @param mixed $id_usuario
     */
    public function setIdUsuario($id_usuario)
    {
        $this->id_usuario = $id_usuario;
    }

     /**
     * @return mixed
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     * @param mixed $id_usuario
     */
    public function setData($data)
    {
        $this->data = $data;
    }



    public function buscarFornecedores(){
        try{

            $sql = "select * from fornecedor order by 2;";
            $bd = new Conexao();

            return $bd->executaSQL($sql);            
           
            unset($bd);

        }catch(exeption $e ){
            return print $e;
            
        }
    }

    public function buscarFornecedor(){
        try{

            $sql = "select * from fornecedor where id_fornecedor = $this->id_fornecedor;";
            $bd = new Conexao();

            return $bd->executaSQL($sql);            
           
            unset($bd);

        }catch(exeption $e ){
            return print $e;
            
        }
    }

    public function criar(){
        try{

            $sql = "insert into Fornecedor (razao,cnpj,status,data,id_usuario)
 					values('".$this->razao."','"
                             .$this->cnpj."','"
                             .$this->data."','"
                             .$this->data."',"
                             .$this->id_usuario.");";
            $bd = new Conexao();
            
            return $bd->executaSQL($sql);
        }catch(exeption $e ){
            return print $e;
        }

    }

    public function atualizar(){

        try {
            $sql = "update Fornecedor 
                    set razao = '".$this->razao."',
                    cnpj = '".$this->cnpj."',
                    status = '".$this->status."',
                    data = '".$this->data."',
                    id_usuario = $this->id_usuario 
                where id_fornecedor = ".$this->id_fornecedor.";";
            //var_dump($sql);            exit();
            $bd = new Conexao();
            return $bd->executaSQL($sql);
            unset($bd);

        } catch (Exception $e) {
            return print $e;
        }

    }







}




