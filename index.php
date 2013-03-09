<?php
	//Detección de browser, para poder bannear a Internet Explorer.
	$user_agent = $_SERVER['HTTP_USER_AGENT'];
	if(preg_match('/MSIE/i',$user_agent) && !preg_match('/Opera/i',$user_agent))
	{
		//El usuario usa Internet Explorer.
		//Esto es intolerable.
		header ("Location: ./noie.html"); 
		die("");
	}
	
	session_start();
	include_once("class/orm.class.php");
	include_once("class/template.class.php");
	include_once("class/util/UILib.class.php");
	
	if (!isset($_SESSION["app_path"])){
		$_SESSION["app_path"] = Config::get_field("app_path");
	}
	
	$template = null;
	
	if (isset($_REQUEST["template"])){
		$id_template = (int)$_REQUEST["template"];
		$template = new Template($id_template);
	} else {
		$template = new Template(1);
	}
	
	$_SESSION["template"] = $template;
	
?>
<html>
<head>
	<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
	<title>Desgrabaciones Comunitarias - v. Alfa #1</title>
	<?php
		echo UILib::get_common_js();
		echo UILib::get_common_css();
		echo UILib::get_template_js();
		echo UILib::get_template_css();
	?>
</head>
<?php
	//die(var_dump($template));
	include "./templates/".$template->get("folder")."/default.php";
?>
</html>

