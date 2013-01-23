<?php
header("Access-Control-Allow-Origin:*");
/** 
* api.lib.php - Definiciones genéricas de clases, variables, y métodos, para el subsistema de APIs.
*
* @author Daniel Cantarín <omega_canta@yahoo.com>
* @version 1.0
*
*/

/** 
* $ret - Common associative array for response serialization.
* Every API script assume it's already defined.
*
* @var Array
* 
*/
$ret = Array(
	"success"	=> true,
	"data" 		=> Array("message"=>"Operación finalizada.")
);


/**
* Función errorHandler - Pequeño código para que las warnings (que no son excepciones) se entiendan como excepciones.
* 
* @param int $errno Número de error.
* @param string $errstr Descripción del error.
* @param string $errfile Nombre del archivo donde sucedió el error.
* @param int $errline Número de línea en la que sucedió el error.
*/
function errorHandler($errno, $errstr, $errfile, $errline) {
	//throw new Exception($errstr, $errno);
	$ret = Array(
		"success"	=> false,
		"data" 		=> Array("message"=>"Error #".$errno.": ".$errstr, "archivos" => Array())
	);
	die(json_encode($ret));
}
set_error_handler('errorHandler');



?>
