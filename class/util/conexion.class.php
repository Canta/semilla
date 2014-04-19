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
 * Useful link regarding ADODB: http://www.pontikis.net/blog/how-to-write-code-for-any-database-with-php-adodb
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
		
		$this->con = NewADOConnection("pdo");//$this->tipo_base);
		//$this->con = ADONewConnection($this->tipo_base);
		//$this->con->Connect($this->server,$this->user, $this->pass, $this->db);
		$this->con->Connect($this->tipo_base.":host=".$this->server,$this->user, $this->pass, $this->db);
		
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
	
	protected function get_from_cache($hash_query){
		$hash = md5(dirname(__FILE__));
		$ret = false;
		if (
			isset($_SESSION) 
			&& isset($_SESSION[$hash."-ORM-CACHE"])
			&& is_array($_SESSION[$hash."-ORM-CACHE"]) 
			&& isset($_SESSION[$hash."-ORM-CACHE"][$hash_query]) 
			){
			$ret = $_SESSION[$hash."-ORM-CACHE"][$hash_query];
		}
		return $ret;
	}
	
	protected function cache_recordset($rec, $query){
		$hash = md5(dirname(__FILE__));
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
			$_SESSION[$hash."-ORM-CACHE"][md5($query)] = $rec;
		}
	}
	
	public function execute($query, $cache = true){
		$ret  = null;
		$hash = md5(dirname(__FILE__));
		if ($cache){
			$ret = $this->get_from_cache(md5($query));
		} 
		
		if ($ret === false || is_null($ret)) {
			$rs = $this->con->Execute($query);
			while ($array = $rs->FetchRow()) {
				$ret[] = $array;
			}
			if ($cache){
				$this->cache_recordset($ret,$query);
			}
			
			$ret = is_null($ret) || $ret === false ? Array() : $ret;
			
		} else {
			$ret = is_null($ret) || $ret === false ? Array() : $ret;
		}
		
		return $ret;
	}
	
	public function prepare($query, $arr, $cache=false){
		
		if (!is_array($arr)){
			throw new Exception("Clase Conexion, método prepare: se esperaba un Array.");
		}
		
		$ret  = null;
		$hash = md5(dirname(__FILE__));
		if ($cache){
			$ser_arr = json_encode($arr);
			$ret = $this->get_from_cache(md5($query.$ser_arr));
		} 
		
		if ($ret === false || is_null($ret)) {
			$stmt = $this->con->Prepare($query);
			$rs = $this->con->Execute($query,$arr);
			while ($array = $rs->FetchRow()) {
				$ret[] = $array;
			}
			if ($cache){
				$this->cache_recordset($ret,$query);
			}
		} else {
			$ret = Array();
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
	
	public function StartTrans(){
		return $this->con->StartTrans();
	}
	
	public function CompleteTrans($val=true){
		return $this->con->CompleteTrans( ($val === false) ? false : true );
	}
	
	public function FailTrans(){
		return $this->con->FailTrans();
	}
	
	public function HasFailedTrans(){
		return $this->con->HasFailedTrans();
	}
}
?>
