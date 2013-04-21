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
		$cont = new ABM("processed");
		$cont->cache(false);
		$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
		$c->set_comparando("id_content");
		$c->set_comparador($id_content);
		$cont->load(Array($c));
		
		$tmp1 = json_decode(stripslashes($cont->get("FULL_OBJECT")));
		
		$tmp1->fragments[$index]->corrections[] = json_decode(stripslashes($arr["data"]));
		
		$cont2 = new Content(json_encode($tmp1));
		$arr2  = $cont2->get_fragment_stats();
		
		//saving new fragments stats
		
		$cont3 = new ABMContents();
		$cont3->cache(false);
		$c->set_comparando("id");
		$cont3->load(Array($c));
		$cont3->load_fields_from_array($arr2);
		$cont3->save();
		
		$cont->set("FULL_OBJECT", stripslashes($cont2->to_json()));
		$cont->save();
		
		$this->data["response"]->data["correction"] = stripslashes($arr["data"]);
		
		return $this->data["response"];
	}
	
}

?>
