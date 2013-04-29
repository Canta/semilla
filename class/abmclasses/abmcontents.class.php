<?php
require_once(dirname(__FILE__)."/../orm.class.php");
require_once(dirname(__FILE__)."/../content.class.php");

class ABMcontents extends ABM{
	
	public function __construct($str = ""){
		parent::__construct("contents");
		$this->datos["raws"] = Array();
		$this->datos["processed"] = "";
		
	}
	
	public function load_fields_from_array($arr){
		parent::load_fields_from_array($arr);
		
		if (isset($arr["data"])){ 
			
			$tmp1 = json_decode($arr["data"]);
			
			if (is_null($tmp1)){
				throw new Exception("ABMContents: bad JSON data.");
			}
			
			if (isset($tmp1->external_links)){
				$this->datos["raws"] = $tmp1->external_links;
			}
			$this->datos["processed"] = $arr["data"];
			
		}
		
		
	}
	
	public function save(){
		parent::save();
		try{
			for ($i = 0; $i < count($this->datos["raws"]); $i++){
				$raw = new ABM("raws");
				$raw->datos["fields"]["URL"]->set_valor( $this->datos["raws"][$i]);
				$raw->datos["fields"]["ID_CONTENT"]->set_valor($this->datos["fields"]["ID"]->get_valor());
				$raw->save();
			}
			
			$c = new Content($this->datos["processed"]);
			$c->data["id"] = $this->get("ID");
			$c->save_processed();
			
		} catch(Exception $e){
			$this->baja($this->datos["fields"]["ID"]->get_valor(), false);
		}
	}
}

?>
