<?php
require_once(dirname(__FILE__)."/conexion.class.php");

/**
 * Config class.
 * A little class for config access. 
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20110920
 */
class Config{
	
	public static function get_field($fieldName = ""){
		$return = array(array());
		
		if ((trim($fieldName) != "") && ($fieldName !== NULL)){
			$c = Conexion::get_instance();
			$return = $c->execute("select * from config where field_name = '$fieldName';", false);
		}
		
		return $return[0];
	}
	
	public static function set_field($fieldName, $value){
		$r = NULL;
		if ((trim($fieldName) != "") && ($fieldName !== NULL)){
			$c = Conexion::get_instance();
			$tmp = array(); //temporal empty array.
			if (Config::get_field($fieldName) == $tmp) {
				$r = $c->execute("insert into config (field_name, field_value) values ('$fieldName', '$value') ", false);
			} else {
				$r = $c->execute("update config set field_value = '$value' where field_name = '$fieldName' ", false);
			}
		}
	}
	
}

?>
