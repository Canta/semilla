<?php

/**
 * get_raw_url
 * Dado un componente de un contenido, devuelve las url de su raw original.
 * 
 * @requires: clase proxy.
 * 
 **/

require_once("../class/proxy.class.php");

// TO DO:
// Agregar gestión de IDs de componentes. Actualmente sólo se usa para obtener MP3s de mixcloud.

$ret = Array("success" => true, "data" => Array("message"=>"ok", "url"=>""));

$p = new Proxy(Array("destino"=>"http://offliberty.com/off.php"));


if (isset($_REQUEST["track"])){
	$d = file_get_contents("php://input");
	$d = (trim($d) == "") ? null : $d;
	$p->set_referer("http://offliberty.com/");
	$r = $p->resend_data("", $_POST);
	
	preg_match_all("/HREF\=\"(http:\/\/.+\.mp3)\"/",$r[0]["respuesta"], $matches);
	if (count($matches)){
		$ret["data"]["url"] = $matches[count($matches)-1][0];
	} else {
		$ret["success"] = false;
		$ret["data"]["message"] = "No se encontró la URL del RAW."
	}
}

die(json_encode($ret));

?>
