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
		
		if (!isset($arr["data"])){
			return APIResponse::fail("No content data specified. Content creation aborted.");
		}
		
		if (!isset($arr["kind"])){
			return APIResponse::fail("No content kind specified. Content creation aborted.");
		}
		
		$arr["id_repo"] = 1;
		
		$tmp_content = Array();
		$stats = Array();
		$tmp_content = new Content($arr["data"]);
		
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
		
		$arr["data"] = stripslashes($tmp_content->to_json());
		$arr["ready"] = $stats["ready"];
		$arr["parsed"] = $stats["parsed"];
		$arr["empty"] = $stats["empty"];
		
		$newc = new ABMcontents();
		$newc->load_fields_from_array($arr);
		$newc->save();
		$newc->set_metodo_serializacion("json");
		
		$this->data["response"]->data["id"] = $newc->get("ID");
		
		return $this->data["response"];
	}
	
}

?>
