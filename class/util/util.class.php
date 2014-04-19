<?php
//require_once(dirname(__FILE__).str_replace("/",DIRECTORY_SEPARATOR,"/connection.class.php"));

/**
 * Util class for common operations.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20110916
 */
class util {
	
	public static function null2empty($value){
		$return = ($value === NULL) ? "" : $value;
		return $return;
	}
	
	public static function null2cero($value){
		$return = ($value === NULL) ? 0 : $value;
		return $return;
	}
	
	public static function null2array($value){
		$tmp = array();
		$return = ($value === NULL) ? $tmp : $value;
		return $return;
	}
	
	public static function redirect($location, $reemplazar = 1, $codigo_http = NULL) {
		if(!headers_sent()){
				header('location: ' . urldecode($location), $reemplazar, $codigo_http);
				//die();
		}
		echo('<meta http-equiv="refresh" content="0; url=' . urldecode($location) . '"/>'); 
		die('<script>document.location.href=' . urldecode($location) . ';</script>');
		return;
	}
	
	//Función encerar().
	//Dado un valor, se asegura de que tenga al menos $chars caracteres.
	//Si no es el caso, agrega ceros a la izquierda.
	//Útil para casos típicos de gestión de ints como strings, como ser
	//el mes o día en una fecha, u hora o minutos, cuando tienen un sólo dígito y se necesita con dos.
	public static function encerar($val, $chars){
		while (strlen($val) < $chars){
			$val = "0".$val;
		}
		return $val;
	}
	
	public static function get_current_URL() {
		$pageURL = 'http';
		if (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
			$pageURL .= "://";
		if ($_SERVER["SERVER_PORT"] != "80") {
			$pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
		} else {
			$pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
		}
		return $pageURL;
	}
 
    public static function get_simple_array( $array, $assoc = false ) {
        $ret = array();

        foreach( $array as $key => $value ) {
            if( is_array( $value ) ) {
                $ret = array_merge( $ret, self::get_simple_array( $value, $assoc) );
            } else {               
                if($assoc){
                    if(!is_numeric($key))
                        $ret[$key] = $value;
                } else {
                    if(is_numeric($key))
                        $ret[$key] = $value;
                }
            }
        }
    
        return $ret;
    }
    
}

?>
