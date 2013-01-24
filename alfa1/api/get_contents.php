<?php
/** 
 * get_contents
 * Devuelve una lista de contenidos
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */

require_once("api.lib.php");
if (!isset($_SESSION)){
	session_start();
}

$ret["data"]["contents"] = Array();

$c = Array("fields" => Array(), "rampant"=>Array(), "raw"=>Array(), "cooked"=>Array(), "tags"=>Array());
$c["fields"]["name"] = "Literatura norteamericana - Teórico - 20100407";
$c["fields"]["kind"] = "audio";
$c["fields"]["type"] = "clase grabada";
$c["fields"]["record_date"] = "20100407";

$c["rampant"][] = "http://flashmirrors.com/files/b2d0vyu6fmtpsr5/_20100407_---Literatura-Norteamericana---Teorico.rar";

$ret["data"]["contents"][] = $c;

die(json_encode($ret));

?>
