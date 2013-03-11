<?php
	include_once("class/orm.class.php");
	include_once("class/template.class.php");
	include_once("class/util/UILib.class.php");
	@session_start();
	
	if (!isset($_SESSION["app_path"])){
		$_SESSION["app_path"] = Config::get_field("app_path");
	}
	$_SESSION["template"] = (isset($_SESSION["template"])) ?  $_SESSION["template"] : new Template(1);
?>
<!DOCTYPE HTML>
<html>
<head>
	<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
	<title>Relevamiento de Partidas y Actas</title>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
<?php
	echo UILib::get_common_js();
	echo UILib::get_common_css();
	echo UILib::get_template_css();
?>
	<script type="text/javascript">
		$(document).ready( function(){
			app.ui.change_section(0);
		});
	</script>
	<style>
		/* fixes para IE */
		a, img{
			border:none;
		}
	</style>
</head>
	<body>
		<div class="header">
			<a style="position: absolute; left: 113px; top: 30px;" href="http://www.mininterior.gov.ar/index.php">
				<img alt="" style=" border:0;" src="templates/default/img/topEscudo2.png">
			</a>
		</div>
		<div class="footer">
				<p>&nbsp; MINISTERIO DEL INTERIOR Y TRANSPORTE&nbsp;&nbsp;|&nbsp;&nbsp;25 de Mayo 101&nbsp;&nbsp;|&nbsp;&nbsp;(C1002ABC) Ciudad Autónoma de Buenos Aires&nbsp;&nbsp;|&nbsp;&nbsp;Tel. +54 (011) 4339-0800</p>
				<a target="_blank" id="casarosada" href="http://www.presidencia.gob.ar/">
					<img src="templates/default/img/casa_rosada.png" />
				</a>
		</div>
		<div id="noie-message" class="section frmABM">
			<div class="section-title FormTitulo">Relevamiento del Sistema Nacional de Gestión de Partidas y Actas</div>
			<div class="section-body">
				Se detectó que no todos los componentes del sistema están instalados correctamente.<br/>
				Para continuar, instale los siguientes componentes:<br/><br/>
				
				<li><b>Google Chrome Frame</b> para Internet Explorer: <a href="http://www.google.com/chromeframe" target="_blank">Instalar</a></li><br/>
				
				<br/><br/>
				Una vez concluida la instalación de todos los componentes, reinicie su explorador e intente entrar nuevamente al sistema.
			</div>
		</div>
	</body>
</html>

