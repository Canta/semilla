<?php
require_once("../class/api.class.php");
require_once("../class/content.class.php");
/** 
 * new_content
 * API verb for content creation
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class new_content extends API{
	
	public function do_your_stuff($arr){
		require_once("../class/util/conexion.class.php");
		require_once("../class/abmclasses/abmcontents.class.php");
		
		if (!isset($arr["token"])){
			return APIResponse::fail("No token specified. Content creation aborted.");
		}
		
		if (!isset($_SESSION)){
			@session_start();
		}
		
		if (!isset($_SESSION["upload"][$arr["token"]]) ){
			return APIResponse::fail("Invalid token. Permission to create content denied.");
		}
		
		$arr["id_repo"] = 1;
		$arr["kind"] = 2;
		
		$tmp_content = "";
		$tmp_content = implode("",$_SESSION["upload"][$arr["token"]]["chunks"]);
		
		$stats = Array();
		$tmp_content = new Content($tmp_content);
		unset($_SESSION["upload"][$arr["token"]]);
		
		try{
			
			if (!isset($tmp_content->data["properties"]["name"]) || $tmp_content->data["properties"]["name"] == ""){
				return APIResponse::fail("No content name specified. Content creation aborted.");
			} else {
				$arr["name"] = $tmp_content->data["properties"]["name"];
			}
			
			if (!isset($tmp_content->data["properties"]["description"]) || $tmp_content->data["properties"]["description"] == ""){
				return APIResponse::fail("No content description specified. Content creation aborted.");
			} else {
				$arr["description"] = $tmp_content->data["properties"]["description"];
			}
			
			$stats = $tmp_content->get_fragment_stats();
			
			
		}catch(Exception $e){
			return APIResponse::fail("Error parsing content data:\n".$e->getMessage());
		}
		
		$arr["data"] = $tmp_content->to_json(); //stripslashes($tmp_content->to_json());
		$arr["ready"] = $stats["ready"];
		$arr["parsed"] = $stats["parsed"];
		$arr["empty"] = $stats["empty"];
		
		try{
			$newc = new ABMcontents();
			$newc->cache(false);
			$newc->load_fields_from_array($arr);
			$newc->save();
		} catch(Exception $e){
			return APIResponse::fail("Error parsing content data:\n".$e->getMessage());
		}
		
		$this->data["response"]->data["id"] = $newc->get("ID");
		$this->data["response"]->data["length"] = strlen($newc->datos["processed"]);
		
		return $this->data["response"];
	}
	
}

?>
