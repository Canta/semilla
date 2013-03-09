<?php

require_once(dirname(__FILE__)."/orm.class.php");

class User Extends Model{
	
	public function __construct($id = 0){
		parent::__construct("users");
		if (($id !== NULL) && ($id > 0)){
			$this->load($id);
		}
	}
	
	public static function login($uname, $pwd){
		require_once(dirname(__FILE__)."/util/config.class.php");
		
		if (trim($uname) == "" || trim($pwd) == ""){
			throw new Exception("User::login: neither username or password can be empty strings.");
		}
		
		$m = new Model("users");
		$algorithm = Config::get_field("pass_algorithm");
		$s = $m->search(Array("username = '".mysql_real_escape_string($uname)."'", "password = ".$algorithm["field_value"]."('".mysql_real_escape_string($pwd)."')"));
		if (count($s) > 0){
			if (!isset($_SESSION)){
				session_start();
			}
			$_SESSION["user"] = $s[0];
		} else {
			$_SESSION["user"] = null;
		}
		
	}
	
}

class users extends User{
	
}

?>
