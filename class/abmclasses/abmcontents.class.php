<?php
require_once(dirname(__FILE__)."/../orm.class.php");


class ABMcontents extends ABM{
	
	public function __construct($str = ""){
		parent::__construct("contents");
		$this->datos["raws"] = Array();
		$this->datos["processed"] = "";
		
	}
	
	public function load_fields_from_array($arr){
		parent::load_fields_from_array($arr);
		
		if (isset($arr["raws"])){
			$this->datos["raws"] = $arr["raws"];
		}
		
		if (isset($arr["processed"])){
			$this->datos["processed"] = $arr["processed"];
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
		} catch(Exception $e){
			$this->baja($this->datos["fields"]["ID"]->get_valor(), false);
		}
	}
}

?>
