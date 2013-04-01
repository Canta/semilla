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
		</section>
		<section id="content-create" class="wizard">
			<form id="content-create-form" onsubmit="return false;">
				<div class="wizard-title">
				</div>
				<div class="wizard-page" validation="app.contents.creation.validate(0);" wizardtitle="New content creation ">
					<p>Enter new content's basic data:</p>
					<div id="content-create-properties">
						<p>Name: <input type="text" name="name" id="content-create-name" placeholder="Content's name" required /></p>
						<p>Description: <input type="text" name="name" id="content-create-description" placeholder="Content's description" required /></p>
					</div>
					<p>
						<button type="button">add custom property</button>
					</p>
				</div>
				<div class="wizard-page" validation="app.contents.creation.validate(1);" wizardtitle="Add links to online raw files? ">
					<p>You can add as many links as you want:</p>
					<p><button type="button" onclick="$('#content-create-raw-files').append('<p>raw file url: <input placeholder=\'Enter raw file url here\' type=text name=\'raws[]\' /></p>');" > add link to raw file </button></p>
					<div id="content-create-raw-files">
					</div>
				</div>
				<div class="wizard-page" validation="app.contents.creation.validate(2);" wizardtitle="Process local raw file? ">
					<p></p>
					<p>Select a file to process: <input type="file" name="file" id="content-create-process-file" /></p>
					<p id="content-create-file-details"></p>
				</div>
				<div class="wizard-page" validation="app.contents.creation.validate(3);" wizardtitle="Save content ">
					<p></p>
					<p><button type="button" onclick="app.contents.creation.save();">Save content and close wizard</button></p>
				</div>
				<div class="wizard-buttons">
					<p>
						<button type="button" class="wizard-back-button"> &lt;- Back </button>
						
						<button type="button" class="wizard-next-button"> Next -&gt; </button>
					</p>
				</div>
			</form>
		</section>
	</body>
