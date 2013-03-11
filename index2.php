<?php
	//Detección de browser, para poder manejar a Internet Explorer.
	$user_agent = $_SERVER['HTTP_USER_AGENT'];
	$is_ie = false;
	if(preg_match('/MSIE/i',$user_agent) && !preg_match('/Opera/i',$user_agent))
	{
		$is_ie = true;
	}
	
	if ($is_ie && strpos($user_agent, "chromeframe") === false){
		//El usuario usa Internet Explorer, y sin Google Chrome Frame.
		header ("Location: ./noie.php"); 
		die("");
	}
	
	include_once("class/orm.class.php");
	include_once("class/template.class.php");
	include_once("class/util/UILib.class.php");
	session_start();
	
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
	<title>Relevamiento de Partidas y Actas</title>
	<?php
		if ($is_ie){
			echo "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\">\n";
		}
		echo UILib::get_common_js();
		echo UILib::get_common_css();
		echo UILib::get_template_js();
		echo UILib::get_template_css();
	?>
</head>
<?php
	include "./templates/".$template->get("folder")."/default.php";
?>
</html>

