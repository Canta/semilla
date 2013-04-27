<?php
require_once("../class/api.class.php");
require_once("../class/orm.class.php");
/** 
 * get_upload_token
 * API verb for generating an upload token
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class get_upload_token extends API{
	
	public function do_your_stuff($arr){
		
		
		if (!isset($arr["size"]) ){
			return APIResponse::fail("No upload size specified. Permission to upload denied.");
		}
		
		if (!isset($arr["chunk_size"]) ){
			return APIResponse::fail("No chunk size specified. Permission to upload denied.");
		}
		
		if (!isset($_SESSION)){
			@session_start();
		}
		
		$hash = md5($arr["size"]);
		
		if (!isset($_SESSION["upload"])){
			$_SESSION["upload"] = Array();
		}
		
		$_SESSION["upload"][$hash] = Array();
		$_SESSION["upload"][$hash]["chunks"] = Array();
		$_SESSION["upload"][$hash]["max_chunks"] = ceil($arr["size"] / $arr["chunk_size"]);
		
		if (!is_numeric($_SESSION["upload"][$hash]["max_chunks"])){
			return APIResponse::fail("Error calculating maximum chunk number. Permission to upload denied.");
		}
		
		$this->data["response"]->data["token"] = $hash;
		
		return $this->data["response"];
	}
	
}

?>
