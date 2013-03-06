<?php
require_once("adodb5/adodb-exceptions.inc.php");
require_once('adodb5/adodb.inc.php');
define('ADODB_ASSOC_CASE', 1);

/**
 * 
 * Conexion class.
 * Main entry for ADODB database abstraction layer.
 * It's used by the whole system for database access.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class Conexion
{
	private static $instance;
	private $con;
	private $user = null;
	private $pass = null;
	private $db = null;
	private $server = null;
	private $tipo_base = null;
	const DATABASE_PREFIX = "";
	
	private function __construct($user = null, $pass = null, $db = null, $server = null, $tipo_base = null)
	{
		require("conexion.config");
		$this->user = (!is_null($user)) ? $user : Conexion::DATABASE_PREFIX.$cconfig["user"];
		$this->pass = (!is_null($pass)) ? $pass : Conexion::DATABASE_PREFIX.$cconfig["pass"];
		$this->db = (!is_null($db)) ? $db : Conexion::DATABASE_PREFIX.$cconfig["db"];
		$this->server = (!is_null($server)) ? $server : Conexion::DATABASE_PREFIX.$cconfig["server"];
		$this->tipo_base = (!is_null($tipo_base)) ? $tipo_base : Conexion::DATABASE_PREFIX.$cconfig["tipo_base"];
		
		$this->con = ADONewConnection($this->tipo_base);
		$this->con->Connect($this->server,$this->user, $this->pass, $this->db);
		
		if ($this->tipo_base == "mysql"){
			$this->con->execute("set names utf8;");
		}
	}
	
	private function __clone(){
	
	}
	
	public static function get_instance($reconect = false, $user = null, $pass = null, $db = null, $server = null, $tipo_base = null) {
		if(Conexion::$instance === null || $reconect === true) {
			Conexion::$instance = new Conexion($user, $pass, $db, $server, $tipo_base);
		}
		return Conexion::$instance;
	}
	
	public function execute($query, $cache = true){
		$ret  = Array();
		$hash = md5(dirname(__FILE__));
		if ( 
			$cache
			&& isset($_SESSION) 
			&& isset($_SESSION[$hash."-ORM-CACHE"])
			&& is_array($_SESSION[$hash."-ORM-CACHE"]) 
			&& isset($_SESSION[$hash."-ORM-CACHE"][md5($query)]) 
		){
			$ret = $_SESSION[$hash."-ORM-CACHE"][md5($query)];
		} else {
			$rs = $this->con->Execute($query);
			while ($array = $rs->FetchRow()) {
				$ret[] = $array;
			}
			if ($cache){
				if (!isset($_SESSION)){
					@session_start();
				}
				if (!isset($_SESSION[$hash."-ORM-CACHE"]) || !is_array($_SESSION[$hash."-ORM-CACHE"]) ){
					$_SESSION[$hash."-ORM-CACHE"] = Array();
				}
				
				if (
					strpos(strtolower($query),"insert into") === false
					&& strpos(strtolower($query),"update ") === false
					&& strpos(strtolower($query),"delete from") === false
				){
					$_SESSION[$hash."-ORM-CACHE"][md5($query)] = $ret;
				}
			}
		}
		
		return $ret;
	}
	
	public function PageExecute($query, $numitems=10, $pagina=1){
		$rs = $this->con->PageExecute($query,$numitems,$pagina);
		
		$ret = Array("items"=>Array(), "metadata"=>Array());
		while ($array = $rs->FetchRow()) {
			$ret["items"][] = $array;
		}
		
		$max = (int)$this->con->_maxRecordCount;
		$max_pages = ($max <= 0) ? 0 : (int) ceil($max / $numitems);
		
		$ret["metadata"]["max_items"] = $max;
		$ret["metadata"]["max_pages"] = $max_pages;
		$ret["metadata"]["pagina_actual"] = $pagina;
		$ret["metadata"]["numero_items"] = $numitems;
		
		return $ret;
	}
	
	public function get_database_name(){
		return $this->db;
	}
	
	public static function try_config($user = "", $pass = "", $db = "", $server = "", $tipo_base = ""){
		//Prueba una conexión con los datos dados
		$i = Conexion::get_instance();
		
		try{
			$this->user = $user;
			$this->pass = $pass;
			$this->db = $db;
			$this->server = $server;
			$this->con->Connect($this->server,$this->user, $this->pass, $this->db);
			$this->con = ADONewConnection($this->tipo_base);
		} catch(Exception $e){
			throw $e;
		}
		
		return $i;
	}
	
}
?>
