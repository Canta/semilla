<?php
require_once("../class/api.class.php");
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
		$ready = 0;
		$parsed = 0;
		$empty = 0;
		
		try{
			$tmp_content = json_decode($arr["data"], true);
			
			if (!isset($tmp_content["properties"]["name"])){
				return APIResponse::fail("No content name specified. Content creation aborted.");
			} else {
				$arr["name"] = $tmp_content["properties"]["name"];
			}
			
			if (!isset($tmp_content["properties"]["description"])){
				return APIResponse::fail("No content description specified. Content creation aborted.");
			} else {
				$arr["description"] = $tmp_content["properties"]["description"];
			}
			
			for ($i = 0; $i < count($tmp_content["fragments"]); $i++){
				if ($tmp_content["fragments"][$i]["ready"] === true){
					$ready++;
				} else if ($tmp_content["fragments"][$i]["parsed"] === true){
					$parsed++;
				} else if (count($tmp_content["fragments"][$i]["corrections"]) > 0){
					$c = $tmp_content["fragments"][$i]["corrections"][count($tmp_content["fragments"][$i]["corrections"])-1];
					if ($c["ready"]===true){
						$ready++;
					}else{
						$parsed++;
					}
				} else {
					$empty++;
				}
			}
			
		}catch(Exception $e){
			return APIResponse::fail("Error parsing content data:\n".$e->getMessage());
		}
		
		$arr["ready"] = $ready;
		$arr["parsed"] = $parsed;
		$arr["empty"] = $empty;
		
		$newc = new ABMcontents();
		$newc->load_fields_from_array($arr);
		$newc->save();
		$newc->set_metodo_serializacion("json");
		
		$this->data["response"]->data["id"] = $newc->get("ID");
		
		return $this->data["response"];
	}
	
}

?>
