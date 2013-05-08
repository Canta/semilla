<?php
require_once("../class/api.class.php");
require_once("../class/orm.class.php");
/** 
 * get_content
 * API verb for content access
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class get_content extends API{
	
	public function do_your_stuff($arr){
		
		
		if (!isset($arr["search"]) ){
			return APIResponse::fail("No search object specified. Search aborted.");
		}
		
		$search = json_decode($arr["search"],true);
		
		if (is_null($search)){
			return APIResponse::fail("Search object invalid. Search aborted.");
		}
		
		
		$conds = Array();
		foreach ($search as $key => $value){
			$cond = new Condicion();
			$cond->set_comparando($key);
			$cond->set_comparador($value);
			$conds[] = $cond;
		}
		$abm1 = new ABM("contents");
		$abm1->load($conds);
		$abm2 = new ABM("processed");
		$cond = new Condicion();
		$cond->set_comparando("id_content");
		$cond->set_comparador($abm1->get("ID"));
		$abm2->cache(false);
		$lista = $abm2->search(Array($cond));
		$items = $lista->get_items();
		
		$content = "";
		foreach ($items as $item){
			$content .= $item["chunk"];
		}
		
		$this->data["response"]->data["content"] = $content;
		
		return $this->data["response"];
	}
	
}

?>
