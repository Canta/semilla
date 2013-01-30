<?php
require_once("../class/api.class.php");

/** 
 * get_contents
 * API verb for content access
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class get_contents extends API{
	
	public function do_your_stuff($arr){
		require_once("../class/util/conexion.class.php");
		
		if (!isset($arr["search"])){
			return APIResponse::fail("No search string specified. Search aborted.");
		}
		
		$c  = Conexion::get_instance();
		$qs = "select * from contents C where 
		C.id in (select P.id_content from processed P where P.full_object like '%".mysql_escape_string($arr["search"])."%') 
		or C.name like '%".mysql_escape_string($arr["search"])."%'";
		$r  = $c->execute($qs);
		
		$this->data["response"]->data["contents"] = $r;
		
		return $this->data["response"];
	}
	
}

?>
