
app.player = {};

app.contents = {};
app.contents.all = [];
app.contents.creation = {};
app.contents.processing = {};
app.contents.edition = {};
app.contents.edition.player = null;

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
	
	app.contents.creation.processed.properties.name = $("#content-create #content-create-name").val();
	if (app.contents.creation.processed.properties.name == ""){
		app.mostrar_error("Debe especificar un nombre para el contenido.");
		$("#content-create #content-create-name").focus();
		return;
	}
	
	app.contents.creation.processed.properties.description = $("#content-create #content-create-description").val();
	if (app.contents.creation.processed.properties.description == ""){
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
			app.contents.edition.edit(app.contents.creation.processed);
		}],
		html: $tmp_html
	})
}

/**
 * app.contents.search
 * Given an input, stated in the UI's search text box, searches in the servers.
 */ 
app.contents.search = function(){
	//app.espere("Buscando contenidos...", "listo.");
	
	var search_string = $.trim($("#text-search-contents").val());
	
	if (search_string !== ""){
		for (var i in Semilla.repos){
			Semilla.repos[i].search(search_string);
		}
	}
	
	/*
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
	*/
};
app.contents.search.history = [];
app.contents.search.list = $();

/**
 * app.contents.load_from_repo
 * Given a repo name and a content ID, it gets the content from the repo.
 */ 
app.contents.load_from_repo = function(repo_name, id){
	
	var repo = null;
	for (var i = 0; i < Semilla.repos.length; i++){
		if (Semilla.repos[i].name == repo_name){
			repo = Semilla.repos[i];
			break;
		}
	}
	
	if (repo === null){
		throw "app.contents.load_from_repo: Repository \""+repo_name+"\" not found.";
	}
	
	app.espere("Cargando contenido desde "+repo_name+"...", "listo.");
	
	repo.get_content({"id":id}, function(content,repo){
		app.contents.edition.edit(content);
		app.desespere("Cargando contenido desde "+repo_name+"...");
	});
	
};



/**
 * contents.show_in_search_list
 * Given an array of contents, shows all of them in the search list
 * 
 * @param $cs array 
 * An array of content objects. 
 * 
 * @returns void
 **/

app.contents.show_in_search_list = function($cs, repo){
	if ($cs == undefined || !($cs instanceof Array) ){
		throw "app.contents.show_in_search_list: array expected.";
	}
	
	app.contents.search.list.find(".item").remove();
	
	var $tmp_html = "";
	var $tmp_options = "<option id='-1'>---</option>";
	
	for (var $i = 0; $i < Semilla.exporters.length; $i++){
		$tmp_options += "<option value=\""+$i+"\" >"+Semilla.exporters[$i].extension+"</option>\n";
	}
	
	
	for (var $i = 0; $i < $cs.length; $i++){
		var total = parseInt($cs[$i].READY) + parseInt($cs[$i].PARSED) + parseInt($cs[$i].EMPTY);
		total = (total == 0) ? 1 : total;
		var ready = Math.round(parseInt($cs[$i].READY) * 100 / total);
		var parsed = Math.round(parseInt($cs[$i].PARSED) * 100 / total);
		var empty = Math.round(parseInt($cs[$i].EMPTY * 100 / total));
		
		$tmp_html += "<div class=\"item con-sombrita redondeadito\" id_content=\""+$cs[$i].ID+"\" repo_name=\""+repo.name+"\" ><span class=\"content-name\" onclick=\"app.contents.load_from_repo($(this).parent().attr('repo_name'), $(this).parent().attr('id_content'));\" title=\"Click para editar...\">"+$cs[$i].NAME+"</span><span class=\"content-stats\">"+total+" fragmentos: "+ready+"% listos, "+parsed+"% pre-editados, "+empty+"% vacíos</span><span class=\"content-options\">Exportar: <select id=\"select-options-"+$cs[$i].ID+"\" onchange=\"app.contents.edition.export(this.parentNode.parentNode);\" title='Seleccione formato...'>"+$tmp_options+"</select></span></div>";
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
	var type = $file.type;
	if (type == null || type == undefined || type == ""){
		var name = $file.name.split(".");
		type = "application/" + name[name.length-1].toLowerCase();
	}
	
	
	if (imported){
		$tmp_html += "<span class='exito' style='color:#ffffff;'>File: <b>\""+$file.name+"\"</b> - Size: <b>"+Math.round(($file.size / 1024 ) / 1024)+" MB</b> - Type: <i>\""+type+"\"</i></span>";
		$("#content-create-name").val($file.name);
		
	} else {
		$tmp_html += "<span class='error' style='color:#ffffff;font-weight:bold;'>" + $file.name+": I can't import \"<i>" + type + "</i>\" file type yet :(</span>";
		$("#content-create-name").val("");
	}
	$("#content-create-description").val("");
	$("#content-create-file-details").html($tmp_html);
	return imported;
}

function convertDataURIToBinary(dataURI) {
  BASE64_MARKER = ",";
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

function convertHtmlToText(inputText) {
    var returnText = "" + inputText;

    //-- remove BR tags and replace them with line break
    returnText=returnText.replace(/<br>/gi, "\n");
    returnText=returnText.replace(/<br\s\/>/gi, "\n");
    returnText=returnText.replace(/<br\/>/gi, "\n");

    //-- remove P and A tags but preserve what's inside of them
    returnText=returnText.replace(/<p.*>/gi, "\n");
    returnText=returnText.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");

    //-- remove all inside SCRIPT and STYLE tags
    returnText=returnText.replace(/<script.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/script>/gi, "");
    returnText=returnText.replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, "");
    //-- remove all else
    returnText=returnText.replace(/<(?:.|\s)*?>/g, "");

    //-- get rid of more than 2 multiple line breaks:
    returnText=returnText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n");

    //-- get rid of more than 2 spaces:
    returnText = returnText.replace(/ +(?= )/g,'');

    //-- get rid of html-encoded characters:
    returnText=returnText.replace(/&nbsp;/gi," ");
    returnText=returnText.replace(/&amp;/gi,"&");
    returnText=returnText.replace(/&quot;/gi,'"');
    returnText=returnText.replace(/&lt;/gi,'<');
    returnText=returnText.replace(/&gt;/gi,'>');

    //-- return
    return returnText;
}


/**
 * app.contents.edition.edit
 * Given a a content, it renders the UI for edition envitonment.
 * 
 * @param {Semilla.Content} c
 * A content to be edited.
 */
app.contents.edition.edit = function(c){
	if ( !(c instanceof Semilla.Content) ){
		throw "app.contents.edition.edit: Semilla.Content expected.";
	}
	
	var ifr = 0; 
	app.contents.edition.player = null;
	app.espere("Leyendo fragmentos","...ok");
	$("#fragments-thumbs").html("<div style=\"display:none;\"></div>");
	var $tmp_function = function() {
		if (ifr < c.fragments.length){
			var $html = "<div class=\"fragment\" index=\""+ifr+"\" fragment_id=\""+c.fragments[ifr].id+"\" ";
			if (c.fragments[ifr].ready){
				$html += "ready ";
			} else if (c.fragments[ifr].parsed){
				$html += "parsed ";
			}
			$html += " onclick=\"app.contents.edition.render_fragment($(this).attr('index'))\">&nbsp;</div>";
			$("#fragments-thumbs > div").append($html);
			ifr++;
			setTimeout($tmp_function, 100);
		} else {
			
			var $tmp2 = function(){
				$("#fragments-thumbs > div").css("display","inline-block");
				var w1 = $("#fragments-thumbs").width();
				var w = 
					(c.fragments.length + 1) * (w1 * 0.1) //10% por cada frag.
					+ 2 //el borde de cada frag
					+ c.fragments.length * (w1 * 0.01); //el margen derecho
					
				$("#fragments-thumbs > div").width(w);
				$("#fragments-thumbs > div > .fragment").width(w1 * 0.1).css("margin-right", (w1*0.01));
				
				app.contents.edition.editing = c;
				app.contents.edition.render_fragment(0);
				app.desespere("Leyendo fragmentos");
			}
			
			setTimeout($tmp2, 2000);
		}
	}
	$tmp_function();
	
	app.ui.change_section("content-edit");
}


/**
 * app.contents.edition.render_fragment
 * Given a fragment, it renders its UI for edition envitonment.
 * 
 * @param {integer} i
 * The fragment's index
 */
app.contents.edition.render_fragment = function(i){
	
	var fr = app.contents.edition.editing.fragments[i].load_latest_correction();
	
	if (app.contents.edition.editing.kind.toString() == "text"){
		$("#fragment-render").html(app.contents.edition.editing.render_fragment(i));
	} else if (app.contents.edition.editing.kind.toString() == "audio"){
		if ( app.contents.edition.player == null){
			
			//En caso de que no estén cargadas, cargo las librerías de gestión de audio
			//var imp = Semilla.Util.get_importer_by_mime_type(app.contents.edition.editing.origin.content_type);
			//imp.load_libs();
			
			$("#fragment-render").html(app.contents.edition.editing.render_fragment(i));
			$(".semilla-fragment-audio-player").html(
				"<button class=\"play-button\" type=\"button\" onclick=\"app.contents.edition.toggle_player();\"></button>\
				<progress id=\"fragment-play-progress\" value=\"0\" max=\"5000\" />"
			);
			
			//app.contents.edition.player = AV.Player.fromURL($(".semilla-fragment-audio-data").html());
			//$(".semilla-fragment-audio-data").html().split(",")[1]
			var bloby = new Blob([convertDataURIToBinary($(".semilla-fragment-audio-data").html())], {type: "application/octet-binary"});
			
			app.contents.edition.player = AV.Player.fromFile(bloby);
			app.contents.edition.player.progress = $("#fragment-play-progress");
			app.contents.edition.player.on('buffer', function(perc) {
				if (perc == 100){
					this.seek(fr.from);
				}
			});
			app.contents.edition.player.on('progress', function(perc) {
				if (app.contents.edition.player.to && this.currentTime >= app.contents.edition.player.to){
					this.seek(app.contents.edition.player.from);
				}
				app.contents.edition.player.progress.val(this.currentTime - app.contents.edition.player.from);
			});
			app.contents.edition.toggle_player();
		} else {
			setTimeout(function(){
				app.contents.edition.player.seek(fr.from);
			},100);
		}
		
		app.contents.edition.player.from = fr.from;
		app.contents.edition.player.to = fr.to;
	}
	
	$(
		$(".fragment").removeAttr("selected").removeClass("glow")[i]
	).attr("selected","true").addClass("glow");
	
	$("#fragment-editor").html(fr.html);
	
	app.contents.edition.current_fragment = i;
}

/**
 * app.contents.edition.toggle_player
 * When a player is used for a fragment, this functions turns the 
 * playback on and off, depending on the player's playing state.
 */
app.contents.edition.toggle_player = function(){
	app.contents.edition.player.togglePlayback();
	if (app.contents.edition.player.playing){
		$("#.semilla-fragment-audio-player .play-button").attr("playing","true");
	} else {
		$("#.semilla-fragment-audio-player .play-button").removeAttr("playing");
	}
}

/**
 * app.contents.edition.toggle_player
 * Given a selection of random HTML in the edit field, this function
 * takes the internal text from that selection and groups it inside 
 * a single paragraph.
 */
app.contents.edition.group_in_paragraph = function(){
	var t = getSelection().getRangeAt(0).toString();
	var a = getSelection().getRangeAt(0).startContainer.parentElement;
	a.innerHTML = t;
	var b = a.outerHTML;
	//document.execCommand("delete");
	document.execCommand("insertHTML", false, b);
}

/**
 * app.contents.edition.save_fragment
 * Saves the current content of the fragment as a correction.
 */
app.contents.edition.save_fragment = function(){
	
	var c   = app.contents.edition.editing;
	var f1  = c.fragments[app.contents.edition.current_fragment];
	var f2  = new Semilla.Fragment();
	f2.content = ""; //not needed for text edition.
	//f2.text    = $("#fragment-editor").text();
	f2.text    = convertHtmlToText($("#fragment-editor").html());
	f2.html    = $("#fragment-editor").html();
	f2.from    = f1.from;
	f2.to      = f1.to;
	f2.parsed  = true;
	f2.ready   = f1.ready;
	//app.contents.edition.editing.fragments[app.contents.edition.current_fragment].corrections.push(f2);
	
	Semilla.repos[1].save_correction(f2, c.id.toString(), parseInt(app.contents.edition.current_fragment));
}

/**
 * app.contents.edition.finalize_fragment
 * Same as save_fragment, but it also flags the fragment as ready.
 */
app.contents.edition.finalize_fragment = function(){
	app.contents.edition.editing.fragments[app.contents.edition.current_fragment].ready = true;
	app.contents.edition.save_fragment();
};


app.contents.edition.export = function(obj){
	
	var r = null;
	var e = null;
	obj = $(obj);
	for (var i = 0; i < Semilla.repos.length; i++){
		if (Semilla.repos[i].name == obj.attr("repo_name")){
			r = Semilla.repos[i];
			break;
		}
	}
	
	for (var i = 0; i < Semilla.exporters.length; i++){
		if (i == parseInt(obj.find("select").val())){
			e = Semilla.exporters[i];
			break;
		}
	}
	
	if (r !== null && e !== null){
		r.exporter = e;
		var texto = "Obteniendo contenido desde "+r.name+"...";
		app.espere(texto, "");
		r.get_content({"id":obj.attr("id_content")}, function(content, repo){
			app.desespere(texto);
			repo.exporter.parse(content);
		});
	}
	
}


$(document).ready(
	function(){
		
		for (var i in Semilla.importers){
			Semilla.importers[i].on("parse_progress",
				function(data){
					$("#content-create-import-progress").val(data.progress);
				}
			);
		}
		
		for (var i in Semilla.exporters){
			Semilla.exporters[i].on("parse_start",
				function(data, exp){
					app.espere("Exportando contenido a "+exp.extension+"...","listo.");
				}
			);
			
			Semilla.exporters[i].on("parse_end",
				function(data, exp){
					app.desespere("Exportando contenido a "+exp.extension+"...");
					var u = URL.createObjectURL(new Blob([exp.output]));
					var l = "<p>Descargar: <a href="+u+" download='"+exp.content.properties.name+"."+exp.extension+"'>"+exp.content.properties.name+"."+exp.extension+"</a></p>";
					var $tmp = function(){
						app.show_modal({
							html : l,
							ok : [
								function(){
									$(".modal a")[0].click();
								}
							]
						});
					};
					setTimeout($tmp,2000);
				}
			);
		}
		
		Semilla.repos[0].on("new_content",
			function(d){
				app.contents.creation.processed = d.content;
			}
		);
		
		Semilla.repos[1].name="Desgrabaciones Comunitarias";
		Semilla.repos[1].description="Desgrabaciones Comunitarias, versión Alfa";
		Semilla.repos[1].endpoint="./api/";
		
		Semilla.repos[1].on("search_end",
			function(data,repo){
				app.contents.show_in_search_list(repo.search_results, repo);
				app.desespere("Buscando contenidos en "+repo.name+"...");
			}
		);
		
		Semilla.repos[1].on("search_start",
			function(data,repo){
				app.espere("Buscando contenidos en "+repo.name+"...", "listo.");
			}
		);
		
		for (var i = 1; i < Semilla.repos.length; i++){
			Semilla.repos[i].on("upload_progress",
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
			
			Semilla.repos[i].on("save_progress",
				function(data, repo){
					if (data.progress == 0){
						var $desc = "Guardando fragmento en " + repo.name + "...";
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
			
			Semilla.repos[i].on("new_correction",
				function(data,repo){
					
					var co = (typeof data.correction == "string") ? JSON.parse(data.correction) : data.correction;
					
					if (co.ready){
						$($(".fragment")[app.contents.edition.current_fragment]).attr("ready","true");
					} else {
						$($(".fragment")[app.contents.edition.current_fragment]).attr("parsed","true");
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
