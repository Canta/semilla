<?php
require_once("../class/api.class.php");
require_once("../class/content.class.php");
/** 
 * save_correction
 * API verb for fragment modification
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
class save_correction extends API{
	
	public function do_your_stuff($arr){
		require_once("../class/util/conexion.class.php");
		require_once("../class/abmclasses/abmcontents.class.php");
		
		if (!isset($arr["content_id"])){
			return APIResponse::fail("No content id specified. Correction save aborted.");
		}
		
		if (!isset($arr["fragment"])){
			return APIResponse::fail("No fragment index specified. Correction save aborted.");
		}
		
		$index      = (int)$arr["fragment"];
		$id_content = (int)$arr["content_id"];
		
		$cont = new Content();
		$cont->data["id"] = $id_content;
		
		$temp = $cont->get_processed_from_db();
		
		$tmp1 = json_decode($temp);
		if (is_null($tmp1)){
			return APIResponse::fail("Bad previous content. Correction saving canceled.");
		}
		
		//$tmp1->fragments[$index]->corrections[] = json_decode($arr["data"]); 
		
		$cont2 = new Content($temp); 
		$cont2->add_correction($index,$arr["data"]);
		$arr2  = $cont2->get_fragment_stats();
		
		//saving new fragments stats
		$cont3 = new ABMContents();
		$cont3->cache(false);
		$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
		$c->set_comparando("id");
		$c->set_comparador($id_content);
		$cont3->load(Array($c));
		$cont3->load_fields_from_array($arr2);
		$cont3->save();
		
		//and saving correction
		$cont2->save_processed();
		
		$this->data["response"]->data["correction"] = $arr["data"];//stripslashes($arr["data"]);
		
		return $this->data["response"];
	}
	
}

?>
