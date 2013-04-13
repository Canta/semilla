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
		
		if (!isset($arr["name"])){
			return APIResponse::fail("No content name specified. Content creation aborted.");
		}
		
		if (!isset($arr["kind"])){
			return APIResponse::fail("No content kind specified. Content creation aborted.");
		}
		
		$arr["id_repo"] = 1;
		
		$newc = new ABMcontents();
		$newc->load_fields_from_array($arr);
		$newc->save();
		$newc->set_metodo_serializacion("json");
		
		$this->data["response"]->data["id"] = $newc->get("ID");
		
		return $this->data["response"];
	}
	
}

?>
