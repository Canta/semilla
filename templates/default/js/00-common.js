
app.player = {};

app.contents = {};
app.contents.all = [];
app.contents.creation = {};
app.contents.processing = {};

app.contents.creation.validate = function($number){
	if (isNaN($number)){
		throw "app.contents.creation.validate: page number expected.";
	}
	
	return true;
};

app.contents.creation.save = function(){
	var $creation_data = { verb: "new_content"};
	
	$creation_data.name = $("#content-create #content-create-name").val();
	if ($creation_data.name == ""){
		throw "app.contents.creation.save: content name required.";
	}
	
	$creation_data.kind = $("#content-create #content-create-kind").val();
	if ($creation_data.kind == "none"){
		throw "app.contents.creation.save: content kind required.";
	}
	
	var $raws = $("#content-create input[name='raws[]']");
	$creation_data.raws = [];
	for (var $i = 0; $i < $raws.length; $i++){
		$creation_data.raws.push($raws[$i].value);
	}
	
	$creation_data.processed = app.contents.creation.processed;
	
	$creation_data.on_success = function(){
		app.ui.change_section("contents");
	}
	
	app.api({data:$creation_data});
	
	
}

/**
 * app.contents.search
 * Given an input, stated in the UI's search text box, searches in the servers.
 */ 
app.contents.search = function(){
	app.espere("Buscando contenidos...", "listo.");
	app.api({
		data: {
			verb: "get_contents",
			search: $("#text-search-contents").val()
		},
		on_success: function ($resp, $status, $xhr){
			if ($resp.success){
				app.contents.show_in_search_list($resp.data.contents);
				app.desespere("Buscando contenidos...");
			} else {
				app.mostrar_error($resp.data.message);
			}
		}
	});
};
app.contents.search.history = [];
app.contents.search.list = $();
app.contents.load_all = function(){
	app.espere("Cargando contenidos desde el servidor...","contenidos cargados.");
	if (window.localStorage && window.localStorage.getItem("contents")){
		app.contents.all = JSON.parse(window.localStorage.getItem("contents"));
		app.contents.show_latests();
		app.desespere("Cargando contenidos desde el servidor...");
		return true;
	}
	app.api({
		data:{
			verb: "get_all_contents"
		},
		on_success: function($resp, $status, $xhr){
			if ($resp.success){
				window.localStorage.setItem("contents", JSON.stringify($resp.data.contents));
				app.contents.all = $resp.data.contents;
				app.contents.show_latests();
				app.desespere("Cargando contenidos desde el servidor...");
			} else {
				app.mostrar_error($resp.data.message);
			}
		}
	});
}

/**
 * contents.get_latests
 * returns the last 10 contents from the full list
 * 
 * @returns array
 **/
app.contents.get_latests = function(){
	var $arr = [];
	for (var $i = app.contents.all.length - 1; $i > -1 && $i > app.contents.all.length - 10; $i--){
		app.contents.all[$i].index = $i;
		$arr.push(app.contents.all[$i]);
	}
	return $arr;
}

/**
 * contents.show_latests
 * Shows on the search list the last 10 contents from the full list
 * 
 * @returns void
 **/
app.contents.show_latests = function(){
	var $arr = app.contents.get_latests();
	app.contents.show_in_search_list($arr);
}

/**
 * contents.show_in_search_list
 * Given an array of contents, shows all of them in the search list
 * 
 * @param $cs array 
 * An array of content objects. 
 * 
 * @returns void
 **/

app.contents.show_in_search_list = function($cs){
	if ($cs == undefined || !($cs instanceof Array) ){
		throw "app.contents.show_in_search_list: array expected.";
	}
	
	app.contents.search.list.find(".item").remove();
	
	var $tmp_html = "";
	
	for (var $i = 0; $i < $cs.length; $i++){
		$tmp_html += "<div class=\"item con-sombrita redondeadito\" index=\""+$cs[$i].index+"\">"+$cs[$i].name+"</div>";
	}
	
	app.contents.search.list.append($tmp_html);
}

/**
 * app.contents.new_item
 * Starts the UI environment for content creation.
 */
app.contents.new_item = function(){
	// vars cleanup
	app.contents.creation.processed = {};
	$("#content-create #content-create-raw-files").html("");
	$("#content-create #content-create-name").val("");
	$("#content-create #content-create-kind")[0].selectedIndex=0;
	
	$("#content-create #content-create-process-file").replaceWith( $("#content-create #content-create-process-file")[0].outerHTML );
	$("#content-create #content-create-process-file")[0].addEventListener("change", app.contents.read_raw_data);
	$("#content-create-file-details").html("");
	
	app.ui.get_object("content-create").reset();
	
	app.ui.change_section("content-create");
}

/**
 * app.contents.read_raw_data
 * Given a raw file (typically, a binary blob), it reads some metadata
 * from the file in order to start the decomposition process.
 * 
 * It's an event handler for a file type input.
 */
app.contents.read_raw_data = function(evt){
	$files = evt.target.files;
	// evt.target.files is a FileList object.
	// That kind of object is NOT serializable to Web Workers.
	// However, File objects are, and Arrays too.
	// So... i create an array of file objects then, just in case.
	app.contents.files = [];
	app.contents.current_kind = $("#content-create-kind")[0].options[$("#content-create-kind")[0].selectedIndex].innerHTML;
	
	var $kind = app.contents.current_kind;
	var $tmp_html = "";
	var $ok = false;
	
	// The File object has three useful properties: size, name, and type.
	// "type" is the file's MIME type.
	for (var $i = 0; $i < $files.length; $i++){
		var $file = $files[$i];
		if (!app.contents.is_file_type_valid($file.type) ){
			$tmp_html += $file.name+": " + $file.type + " no es un tipo de archivo válido para el tipo de contenido " + $kind + ".<br/>";
		} else {
			$ok = true;
			$tmp_html += "File: <b>\""+$file.name+"\"</b> - Size: <b>"+Math.round(($file.size / 1024 ) / 1024)+" MB</b> - Type: <i>\""+$file.type+"\"</i><br/>";
			$file.extra_data = {};
			
			// Now, i try to get extra data from the file
			if ($kind == "audio"){
				// From audio files, i need the duration.
				//$file.extra_data.duration = NaN;
				//app.player = Player.fromFile($file);
				//app.player.preload();
				//$file.extra_data.duration = app.player.duration;
				//app.player.play();
				Semilla.import_content($("#content-create-process-file")[0].files[0]);
				
				
			} else if ($kind == "text"){
				var $tmp_pdf = function($script, $status, $xhr){
					PDFJS.workerSrc = app.path+"/js/workers/pdf.js";
					$file.extra_data.pages = [];
					app.contents.processing.pages = [];
					a = FileReader();
					app.espere("Procesando archivo...", "archivo procesado.");
					a.readAsArrayBuffer($file);
					a.onloadend = function(evt){
						if (evt.target.readyState == FileReader.DONE) { // DONE == 2
							//var c = convertDataURIToBinary(evt.target.result);
							var c = Uint8Array(evt.target.result);
							PDFJS.getDocument(c).then(function(pdf) {
								//console.debug(pdf.pdfInfo.numPages);
								app.contents.processing.raw_in_process = pdf;
								$("#content-create-process-output").html("");
								var canvas = document.createElement("canvas");
								$("#content-create-process-output").append(canvas)
								var context = canvas.getContext('2d');
								app.contents.processing.processed_pages = [];
								var $curr_page = 1;
								var fun = function($i){
									pdf.getPage($curr_page).then(function(page){
										var scale = 1.5;
										var viewport = page.getViewport(scale);
										canvas.height = viewport.height;
										canvas.width = viewport.width;
										var renderContext = {
											canvasContext: context,
											viewport: viewport
										};
										page.render(renderContext).then(
											function(){
												app.contents.processing.processed_pages.push(true);
												app.contents.processing.raw_in_process.getPage($curr_page).data.getTextContent().then(
													function(text){
														textin = $.makeArray($(text.bidiTexts).map(function(element,value){return value.str})).join('\n'); 
														app.contents.processing.pages.push({text: textin,dataURL: canvas.toDataURL("image/jpeg")}); 
													}
												);
												if (app.contents.processing.raw_in_process.pdfInfo.numPages == app.contents.processing.processed_pages.length){
													app.desespere("Procesando archivo...");
												} else {
													$curr_page++;
													fun($curr_page);
												}
											}
										);
										
									});
								}
								fun($curr_page);
								//for (var $i=0; $i < pdf.pdfInfo.numPages; $i++){
									
								//}
							});
						}
						
					}
				};
				
				if ($file.type.toLowerCase().indexOf("pdf")>-1){
					$.ajax({
						url: app.path + "/js/workers/pdf.js",
						cache:true,
						async: true,
						dataType: "script",
						success: $tmp_pdf
					});
				}
				
			}
			
			app.contents.files.push($file);
		}
	}
	
	$("#content-create-file-details").html($tmp_html);
	
}

function convertDataURIToBinary(dataURI) {
  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  var base64 = dataURI.substring(base64Index);
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

/**
 * app.contents.is_file_type_valid
 * Given a file MIME type, it checks if the file is valid for the current
 * selected content kind.
 */
app.contents.is_file_type_valid = function($type){
	$kinds = ["audio", "text", "video"];
	
	$kinds["audio"] = ["audio/ogg", "audio/vorbis", "audio/mpeg", "video/ogg", "audio/mp3"];
	$kinds["video"] = ["video/webm"];
	$kinds["text"]  = ["application/pdf"];
	
	$k = app.contents.current_kind;
	
	$found = false;
	if ($kinds[$k]){
		for (var $i = 0; $i < $kinds[$k].length; $i++){
			if ($type == $kinds[$k][$i]){
				$found = true;
				break;
			}
		}
	}
	
	return $found;
}

/**
 * app.contents.process_files
 * Starts the decomposition process.
 * It assumes that the app.contents.files array is well setted.
 */
app.contents.process_files = function(){
	
}

$(document).ready(
	function(){
		
		app.espere("Cargando sistema","sistema cargado.");
		$(window).bind("load", function(){
			app.current_section.fadeIn(250);
			app.contents.search.list = $("#content-list > .lista > .items");
			
			
			window.URL = window.URL || window.webkitURL;
			app.desespere("Cargando sistema");
			
		});
		
		
	}
);
