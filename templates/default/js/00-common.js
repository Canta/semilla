
app.player = {};

app.contents = {};
app.contents.all = [];
app.contents.creation = {};
app.contents.processing = {};

Semilla.repos.push(new Semilla.HTTPRepo());

app.contents.creation.validate = function($number){
	if (isNaN($number)){
		throw "app.contents.creation.validate: page number expected.";
	}
	
	return true;
};

app.contents.creation.save = function(){
	
	if (app.contents.creation.processed === null){
		app.mostrar_error("Debe procesar un contenido primero.");
		return;
	}
	
	app.contents.creation.processed.name = $("#content-create #content-create-name").val();
	if (app.contents.creation.processed.name == ""){
		app.mostrar_error("Debe especificar un nombre para el contenido.");
		$("#content-create #content-create-name").focus();
		return;
	}
	
	app.contents.creation.processed.description = $("#content-create #content-create-description").val();
	if (app.contents.creation.processed.description == ""){
		app.mostrar_error("Debe especificar una descripción para el contenido.");
		$("#content-create #content-create-description").focus();
		return;
	}
	
	var $raws = $("#content-create input[name='raws[]']");
	for (var $i = 0; $i < $raws.length; $i++){
		app.contents.creation.processed.external_links.push($raws[$i].value);
	}
	
	var $tmp_html = "<p><b>Seleccione dónde quiere compartir el contenido: </b></p>\
	<div id=\"content-create-save-where\" >\n";
	
	for (var i = 1; i < Semilla.repos.length; i++){
		$tmp_html += "<label style=\"cursor:pointer; border-bottom: black 2px dashed;\" >"+Semilla.repos[i].description+" <input value=\""+i+"\" type=\"checkbox\" /></label>";
	}
	
	$tmp_html += "</div>";
	
	app.show_modal({
		ok: [function(){
			var repos = $("#content-create-save-where input");
			for (var i = 0; i < repos.length; i++){
				if (repos[i].checked){
					var a = repos[i].value;
					setTimeout(function(){
						Semilla.repos[a].add_content(app.contents.creation.processed);
					},1000);
				}
			}
			app.ui.change_section(0);
		}],
		html: $tmp_html
	})
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
	app.contents.creation.processed = null;
	$("#content-create #content-create-raw-files").html("");
	$("#content-create #content-create-name").val("");
	
	$("#content-create #content-create-process-file").replaceWith( $("#content-create #content-create-process-file")[0].outerHTML );
	$("#content-create #content-create-process-file")[0].addEventListener("change", app.contents.read_raw_data);
	$("#content-create-file-details").html("");
	
	app.ui.change_section("content-create");
}

/**
 * app.contents.read_raw_data
 * Given a raw file (typically, a binary blob), it reads some metadata
 * from the file in order to start the decomposition process.
 * 
 * It's an event handler function for a file type input.
 */
app.contents.read_raw_data = function(evt){
	$files = evt.target.files;
	
	var $file = $files[0];
	var $tmp_html = "";
	var imported = Semilla.repos[0].import_content($file);
	
	if (imported){
		$tmp_html += "<span class='exito' style='color:#ffffff;'>File: <b>\""+$file.name+"\"</b> - Size: <b>"+Math.round(($file.size / 1024 ) / 1024)+" MB</b> - Type: <i>\""+$file.type+"\"</i></span>";
	} else {
		$tmp_html += "<span class='error' style='color:#ffffff;font-weight:bold;'>" + $file.name+": I can't import <i>" + $file.type + "</i> file type yet :(</span>";
	}
	$("#content-create-file-details").html($tmp_html);
	return imported;
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
		
		for (var i in Semilla.importers){
			Semilla.importers[i].add_event_handler("parse_progress",
				function(data){
					$("#content-create-import-progress").val(data.progress);
				}
			);
		}
		
		Semilla.repos[0].add_event_handler("new_content",
			function(d){
				app.contents.creation.processed = d.content;
			}
		);
		
		Semilla.repos[1].name="Desgrabaciones Comunitarias";
		Semilla.repos[1].description="Desgrabaciones Comunitarias, versión Alfa";
		Semilla.repos[1].endpoint="http://dc.danielcantarin.com.ar/alfa1/api/";
		
		for (var i = 1; i < Semilla.repos.length; i++){
			Semilla.repos[i].add_event_handler("add_progress",
				function(data, repo){
					if (data.progress == 0){
						var $desc = "Compartiendo en " + repo.name + "...";
						var $html = "<br/><progress id=\"progress-"+repo.name.replace(" ","-")+"\" value=0 max=100/>";
						repo.espere_text = $desc;
						app.espere($desc, "", $html);
					} else if (data.progress < 100){
						$("#progress-" + repo.name.replace(" ", "-")).val(data.progress);
					} else {
						app.desespere(repo.espere_text);
					}
				}
			);
		}
		
		app.espere("Cargando sistema","sistema cargado.");
		$(window).bind("load", function(){
			app.current_section.fadeIn(250);
			app.contents.search.list = $("#content-list > .lista > .items");
			
			
			window.URL = window.URL || window.webkitURL;
			app.desespere("Cargando sistema");
			
		});
		
		
	}
);
