	<body>
		<section id="contents" >
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
			<div id="content-edit-fragments">
			
			</div>
			<div id="content-edit-editor">
			
			</div>
		</section>
		<section id="content-create">
			<div id="file-import">
				<p>Seleccione un archivo para procesar: <input type="file" name="file" id="content-create-process-file" /></p>
				<p id="content-create-file-details">
				</p>
				<p>
					<progress id="content-create-import-progress" value="0" max="100" />
				</p>
				<p id="content-create-process-output">
				</p>
			</div>
			<div id="basic-data">
				<p>Datos básicos del contenido:</p>
				<div id="content-create-properties">
					<p>Nombre: <input type="text" name="name" id="content-create-name" placeholder="Nombre del contenido" required /></p>
					<p>Descripción: <input type="text" name="name" id="content-create-description" placeholder="Descripción del contenido" required /></p>
				</div>
				<p>
					<button type="button">Agregar propiedad...</button>
				</p>
			</div>
			<div id="links">
				<p>Links al archivo original:</p>
				<p><button type="button" onclick="$('#content-create-raw-files').append('<p>URL del archivo: <input placeholder=\'Ingrese la URL aquí\' type=text name=\'raws[]\' /></p>');" > Agregar link al archivo </button></p>
				<div id="content-create-raw-files">
				</div>
			</div>
			<div id="botones">
				<p>
					<button type="button" onclick="app.contents.creation.save();">Compartir Contenido</button>
				</p>
			</div>
		</section>
	</body>
