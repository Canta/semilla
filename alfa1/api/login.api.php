<?php
require_once("../class/api.class.php");

/** 
 * login
 * Verbo del API para loguearse en el sistema
 *
 * @author Daniel Cantarín <dcantarin@commsursrl.com.ar>
 */
class login extends API{
	
	public function do_your_stuff($arr){
		require_once("../class/user.class.php");
		
		if (!isset($arr["username"]) || !isset($arr["password"]) || trim($arr["username"]) == "" || $arr["password"] == "" ){
			return APIResponse::fail("No username or password specified. Login aborted.");
		}
		
		User::login($arr["username"], $arr["password"]);
		
		if (!isset($_SESSION)){
			session_start();
		}
		if (!isset($_SESSION["user"]) || is_null($_SESSION["user"])){
			return APIResponse::fail("Wrong username or password.");
		}
		
		return $this->data["response"];
	}
	
}

?>
