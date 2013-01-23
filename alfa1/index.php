<?php
	header("Access-Control-Allow-Origin:*");
?>
<html lang="es">
	<head>
		<meta charset="utf-8" />
		<title>Desgrabaciones Comunitarias - v. Alfa #1</title>
		<script type="text/javascript" src="js/jquery-1.7.min.js"></script>
		<script type="text/javascript" src="js/app.lib.js"></script>
		<script type="text/javascript" src="js/common.js"></script>
		<style>
			@import url('css/app.lib.css');
			@import url('css/default.css');
		</style>
	</head>
	<body>
		<section id="contents">
			<div class="section-title">Desgrabaciones comunitarias - v. Alfa #1</div>
			<div class="section-body">
				<div id="tag-list" class="redondeadito con-sombrita">
				</div>
				<div id="content-list" class="redondeadito con-sombrita lista-container">
					<div class="lista redondeadito">
						<div class="status">
							Resultados de la búsqueda
						</div>
						<div class="items">
							<div class="item con-sombrita">
								item 1
							</div>
							<div class="item con-sombrita">
								item 2
							</div>
						</div>
						<div class="botonera">
							Página <span>1</span> de <span>1</span> 
							<button>&lt;-Anterior</button>
							<button>Siguiente-&gt;</button>
						</div>
					</div>
				</div>
			</div>
		</section>
		<section id="content-overview">
			<audio src="" controls="true" id="player-main" preload="auto" crossdomain="true" ></audio>
			<button onclick="app.player.toggle_play()"> play / pausa </button>
			<input type="file" id="file-main" onchange="app.player.load_file();"/>
		</section>
		<section id="content-edit">
		</section>
	</body>
</html>
