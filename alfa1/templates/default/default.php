	<body>
		<section id="contents" class="redondeadito con-sombrita">
			<div class="section-title">Desgrabaciones comunitarias - v. Alfa #1</div>
			<div class="section-body">
				<div id="content-list" class="lista-container">
					<div class="lista">
						<div class="botonera">
							Buscar: 
							<input type="text" name="text-search-contents" id="text-search-contents" />
							<button onclick="app.contents.search();">search contents</button>
							<button onclick="app.contents.new_item();">add content</button>
						</div>
						<div class="items">
							
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
		<section id="content-create">
		</section>
	</body>
