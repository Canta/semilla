<?php
require_once("../class/api.class.php");
require_once("../class/orm.class.php");
/** 
 * upload
 * API verb for uploading
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class upload extends API{
	
	public function do_your_stuff($arr){
		
		
		if (!isset($arr["chunk"]) ){
			return APIResponse::fail("No chunk specified.");
		}
		
		if (!isset($arr["token"]) ){
			return APIResponse::fail("No token specified.");
		}
		
		if (!isset($_SESSION)){
			@session_start();
		}
		
		if (!isset($_SESSION["upload"][$arr["token"]]) ){
			return APIResponse::fail("Invalid token. Permission to upload denied.");
		}
		
		
		$token = $arr["token"];
		$finished = false;
		
		if (count($_SESSION["upload"][$token]["chunks"]) == $_SESSION["upload"][$token]["max_chunks"]){
			$finished = true;
		}
		
		if (!$finished){
			$_SESSION["upload"][$token]["chunks"][] = $arr["chunk"];
		} else {
			return APIResponse::fail("Upload already finished.");
		}
		
		if (count($_SESSION["upload"][$token]["chunks"]) == $_SESSION["upload"][$token]["max_chunks"]){
			$finished = true;
		}
		
		$this->data["response"]->data["chunk_count"] = count($_SESSION["upload"][$token]["chunks"]);
		$this->data["response"]->data["finished"] = $finished;
		
		return $this->data["response"];
	}
	
}

?>
