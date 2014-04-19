<?php

require_once("config.class.php");

class UIlib {
	
	public static function get_common_js(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["FIELD_VALUE"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../js";
		
		$files = scandir($dir);
		
		foreach ($files as $file){
			if ($file != "." && $file != ".." && strpos(strtolower($file),".js") !== false ){
				$ret .= "<script type=\"text/javascript\" src=\"".$app_path."/js/".$file."?r=".$random."\"></script>\n";
			}
		}
		
		return $ret;
		
	}
	
	public static function get_common_css(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["FIELD_VALUE"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../css";
		
		$files = scandir($dir);
		
		foreach ($files as $file){
			if ($file != "." && $file != ".." && strpos(strtolower($file),".css") !== false ){
				$ret .= "<link rel=\"stylesheet\" href=\"".$app_path."/css/".$file."?r=".$random."\" type=\"text/css\" />";
			}
		}
		
		return $ret;
		
	}
	
	public static function get_template_js(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["FIELD_VALUE"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../templates/".$_SESSION["template"]."/js";
		
		$files = scandir($dir);
		foreach ($files as $file){
			if ($file != "." && $file != ".." && strpos(strtolower($file),".js") !== false ){
				$ret .= "<script type=\"text/javascript\" src=\"".$app_path."templates/".$_SESSION["template"]."/js/".$file."?r=".$random."\"></script>\n";
			}
		}
		
		return $ret;
	}
	
	public static function get_template_css(){
		$ret = "";
		$app_path = $_SESSION["app_path"]["FIELD_VALUE"];
		$random = mt_rand();
		
		$dir = dirname(__FILE__)."/../../templates/".$_SESSION["template"]."/css";
		
		$files = scandir($dir);
		foreach ($files as $file){
			if ($file != "." && $file != ".." && strpos(strtolower($file),".css") !== false ){
				$ret .= "<link rel=\"stylesheet\" href=\"".$app_path."templates/".$_SESSION["template"]."/css/".$file."?r=".$random."\" type=\"text/css\" />";
			}
		}
		
		return $ret;
	}
	
}

?>
