<?php

require_once("config.class.php");

class UIlib {
	
	public static function get_common_js(){
		/*
		$ret = "";
		$app_path = Config::get_field("app_path");
		
		$random = mt_rand();
		$ret .= "
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/jquery.js?r=".$random."\"></script>
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/jquery-ui.js?r=".$random."\"></script>
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/jquery.swfobject.1-1-1.min.js?r=".$random."\"></script>
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/ajaxapi.js?r=".$random."\"></script>
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/common.js.php?r=".$random."\"></script>
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/animator.js?r=".$random."\"></script>
		<script type=\"text/javascript\" src=\"".$app_path["field_value"]."js/spriteslib.js?r=".$random."\"></script>
		";
		
		return $ret;
		*/
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
