<?php
require_once("../class/api.class.php");

/** 
 * search_contents
 * API verb for content searching
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class search_contents extends API{
	
	public function do_your_stuff($arr){
		require_once("../class/util/conexion.class.php");
		
		if (!isset($arr["search_string"])){
			return APIResponse::fail("No search string specified. Search aborted.");
		}
		
		$c  = Conexion::get_instance();
		$qs = "select * from contents C where 
		C.id in (select P.id_content from processed P where P.chunk like '%".mysql_real_escape_string($arr["search_string"])."%') 
		or C.name like '%".mysql_real_escape_string($arr["search_string"])."%'";
		$r  = $c->execute($qs,false);
		
		$this->data["response"]->data["contents"] = $r;
		
		return $this->data["response"];
	}
	
}

?>
