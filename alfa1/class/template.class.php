<?php

require_once(dirname(__FILE__)."/orm.class.php");

class Template Extends Model{
	
	public function __construct($id = 0){
		parent::__construct("template");
		if (($id !== NULL) && ($id > 0)){
			$this->load($id);
		}
	}
	
	public function get_path(){
		$ret  = $_SESSION["app_path"]["field_value"];
		$ret .= "templates/".$this->get("folder")."/";
		
		return $ret;
	}
	
}

?>
