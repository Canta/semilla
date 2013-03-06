<?php

require_once("config.class.php");

class UIlib {
	
	public static function get_common_js(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["field_value"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../js";
		
		$handler = opendir($dir);
		$files = Array();
		while ($file = readdir($handler)) {
			if ($file != "." && $file != ".." && strpos(strtolower($file), ".js") !== false ) {
				$files[] = $file;
			}
		}
		
		foreach ($files as $file){
			$ret .= "<script type=\"text/javascript\" src=\"".$app_path."/js/".$file."?r=".$random."\"></script>\n";
		}
		
		return $ret;
		
	}
	
	public static function get_common_css(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["field_value"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../css";
		
		$handler = opendir($dir);
		$files = Array();
		while ($file = readdir($handler)) {
			if ($file != "." && $file != ".." && strpos(strtolower($file), ".css") !== false ) {
				$files[] = $file;
			}
		}
		
		foreach ($files as $file){
			$ret .= "<link rel=\"stylesheet\" href=\"".$app_path."/css/".$file."?r=".$random."\" type=\"text/css\" />";
		}
		
		return $ret;
		
	}
	
	public static function get_template_js(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["field_value"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../templates/".$_SESSION["template"]->get("folder")."/js";
		
		$handler = opendir($dir);
		$files = Array();
		while ($file = readdir($handler)) {
			if ($file != "." && $file != ".." && strpos(strtolower($file), ".js") !== false ) {
				$files[] = $file;
			}
		}
		
		foreach ($files as $file){
			$ret .= "<script type=\"text/javascript\" src=\"".$app_path."templates/".$_SESSION["template"]->get("folder")."/js/".$file."?r=".$random."\"></script>\n";
		}
		
		return $ret;
	}
	
	public static function get_template_css(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["field_value"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../templates/".$_SESSION["template"]->get("folder")."/css";
		
		$handler = opendir($dir);
		$files = Array();
		while ($file = readdir($handler)) {
			if ($file != "." && $file != ".." && strpos(strtolower($file), ".css") !== false ) {
				$files[] = $file;
			}
		}
		
		foreach ($files as $file){
			$ret .= "<link rel=\"stylesheet\" href=\"".$app_path."templates/".$_SESSION["template"]->get("folder")."/css/".$file."?r=".$random."\" type=\"text/css\" />";
		}
		
		return $ret;
	}
	
}

?>
