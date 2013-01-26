<?php
/**
 * Generic API calls handler
 * It's supposed to work detecting app verbs and calling the corresponding file.
 * Once a file for the verb is found, it instantiates an API extended class and
 * pass the data given from the call to the API class instance.
 * 
 */ 
header("Access-Control-Allow-Origin:*");
require_once("../class/api.class.php");

if (!isset($_REQUEST["verb"])){
	die(json_encode(APIResponse::fail("Verb not found.")));
}
$api = new API();
$v = strtolower($_REQUEST["verb"]);
$found = false;
foreach (glob(dirname(__FILE__)."/*.php") as $filename){
	$tmp = explode("/",$filename);
	if (strtolower($tmp[count($tmp)-1]) == $v . ".api.php"){
		require_once($filename);
		$found = true;
		break;
	}
}

if (!$found){
	die(json_encode(APIResponse::fail("Verb not found.")));
}

// If the verb is found, then there should be an API extending class defined 
// with the same name.
$api = new $v(); 

$ret = $api->do_your_stuff($_REQUEST);
die(json_encode($ret));
?>
