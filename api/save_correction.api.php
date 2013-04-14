<?php
require_once("../class/api.class.php");
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
		$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
		$c->set_comparando("id_content");
		$c->set_comparador($id_content);
		$cont->load(Array($c));
		
		$tmp1 = json_decode($cont->get("FULL_OBJECT"));
		$tmp1->fragments[$index]->corrections[] = $arr["data"];
		$cont->set("FULL_OBJECT", json_encode($tmp1));
		$cont->save();
		$cont->set_metodo_serializacion("json");
		
		$this->data["response"]->data["correction"] = $arr["data"];
		
		return $this->data["response"];
	}
	
}

?>
