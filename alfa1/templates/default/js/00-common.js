
app.player = {};
app.player.toggle_play = function(){
	if (app.player.instance.paused){
		app.player.instance.play();
	} else {
		app.player.instance.pause();
	}
}

app.player.load_file = function(){
	$f = $("#file-main")[0].files[0];
	/*
	$fr = new FileReader();
	app.espere("Cargando audio...");
	$fr.onload = function (e) {
		app.player.instance.src = e.target.result;
		app.desespere("Cargando audio...");
	};
	$fr.readAsDataURL($f);
	*/
	/*
	console.debug($f);
	app.player.instance.src = "file://" + $f.fullPath;
	*/
	app.player.instance.src = window.URL.createObjectURL($f);
	
}

app.contents = {};
app.contents.all = [];
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
app.contents.search.list = $("#content-list > .lista > .items");
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
		$tmp_html += "<div class=\"item con-sombrita redondeadito\" index=\""+$cs[$i].index+"\">"+$cs[$i].fields.name+"</div>";
	}
	
	app.contents.search.list.append($tmp_html);
}


$(document).ready(
	function(){
		
		app.espere("Cargando sistema","sistema cargado.");
		$(window).bind("load", function(){
			app.current_section.fadeIn(250);
			app.desespere("Cargando sistema");
			//app.player.instance = $("#player-main")[0];
		});
		
		
	}
);
