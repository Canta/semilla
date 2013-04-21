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

//FIX: handle magic quotes in crappy servers.
//http://www.php.net/manual/en/security.magicquotes.disabling.php
if (get_magic_quotes_gpc()) {
	/*
    $process = array(&$_GET, &$_POST, &$_COOKIE, &$_REQUEST);
    while (list($key, $val) = each($process)) {
        foreach ($val as $k => $v) {
            unset($process[$key][$k]);
            if (is_array($v)) {
                $process[$key][stripslashes($k)] = $v;
                $process[] = &$process[$key][stripslashes($k)];
            } else {
                $process[$key][stripslashes($k)] = stripslashes($v);
            }
        }
    }
    unset($process);
    */
    $_REQUEST["data"] = stripslashes($_REQUEST["data"]);//str_replace("\\\\","\\", $_REQUEST["data"]);
}

$ret = $api->do_your_stuff($_REQUEST);
die(json_encode($ret));
?>
