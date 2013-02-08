<?php
require_once("../class/api.class.php");

/** 
 * check_login_status
 * Verbo del API para mantener actualizada la UI del lado del usuario.
 *
 * @author Daniel Cantarín <dcantarin@commsursrl.com.ar>
 */
class check_login_status extends API{
	
	public function do_your_stuff($arr){
		require_once("../class/user.class.php");
		
		if (!isset($_SESSION)){
			session_start();
		}
		if (!isset($_SESSION["user"]) || is_null($_SESSION["user"])){
			return APIResponse::fail("Session expired or not started.");
		}
		
		return $this->data["response"];
	}
	
}

?>
