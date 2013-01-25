/**
 * App class.
 * It's used as a global namespace for common operations.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
var App = (function() {
	var app = {
		version : "alfa1",
		path : ".",
		esperando : [],
		current_section : $($("body > section")[0]),
		timers : {}
	};

	app.timers.drag = [];

	app.show_modal = function($data){
		
		if ($data === undefined){
			$data = {};
		}
		if ($data.html === undefined){
			$data.html = "";
		}
		if ($data.ok === undefined || !($data.ok instanceof Array) ){
			$data.ok = [];
		}
		if ($data.cancel === undefined || !($data.cancel instanceof Array) ){
			$data.cancel = [];
		}
		
		$tmp_html  = "<div class=\"cubre-cuerpo\"></div><div class=\"modal\">";
		$tmp_html += "<div class=\"modal-html\" >"+$data.html+"</div>";
		$tmp_html += "<div class=\"botonera\"><button id=\"modal_button_cancelar\"> Cancelar </button> <button id=\"modal_button_aceptar\"> Aceptar </button></div>";
		$tmp_html += "</div>";
		
		$("body").append($tmp_html);
		$(".cubre-cuerpo").fadeIn(250);
		$(".modal").fadeIn(500);
		
		$("#modal_button_cancelar, #modal_button_aceptar").bind("click",app.hide_modal);
		
		for (var $i = 0; $i < $data.ok.length; $i++){
			$("#modal_button_aceptar").bind("click",$data.ok[$i]);
		}
		for (var $i = 0; $i < $data.cancel.length; $i++){
			$("#modal_button_cancelar").bind("click",$data.cancel[$i]);
		}
	}

	app.hide_modal = function(){
		$(".cubre-cuerpo").fadeOut(500);
		$(".modal").fadeOut(250);
		window.setTimeout(function(){
			$(".cubre-cuerpo, .modal").remove();
		},1000);
	}


	app.espere = function($desc, $fin){
		//creo los componentes visuales de espera
		if ($("body > .cubre-cuerpo").length == 0){
			$("body").append("<div class=\"cubre-cuerpo\" tyle=\"display:none\"></div>");
		}
		if ($("body > .modal").length == 0){
			$("body").append("<div class=\"modal\" tyle=\"display:none\"></div>");
		}
		
		if (app.esperando.length == 0 || $("body > .cubre-cuerpo").css("display") == "none"){
			$("body > .cubre-cuerpo").fadeIn(500);
			$("body > .modal").fadeIn(500);
		}
		app.esperando.push([$desc,$fin]);
		$("body > .modal .descripcion").text($("body > .modal .descripcion").text() + $desc + "...\n");
		
	}

	app.desespere = function($desc){
		if ($desc === undefined){
			if (app.esperando.length > 0){
				$("body > .modal .descripcion").text($("body > .modal .descripcion").text() + "..." + app.esperando[0][1] + "\n");
				app.esperando.splice(0,1);
			}
		} else {
			for ($i in app.esperando){
				if (app.esperando[$i][0] == $desc){
					$("body > .modal .descripcion").text($("body > .modal .descripcion").text() + "..." + app.esperando[$i][1] + "\n");
					app.esperando.splice($i,1);
					break;
				}
			}
		}
	   
		if (app.esperando.length == 0){
			$(".cubre-cuerpo").fadeOut(500);
			$("body > .modal").fadeOut(500);
		}
	   
	}

	app.mostrar_error = function($msg){
		alert("Error:\n"+$msg);
	}

	app.mostrar_mensaje = function($msg){
		alert($msg);
	}

	app.start_drag = function($e){
		$random = Math.round(Math.random() * 999999);
		if ($e[0].className.indexOf("draggable") <= -1){
			$e = $e.parent(".draggable");
			if ($e.length == 0){
				return false;
			}
		}
		$id = $e.attr("id");
		if ($id == undefined){
			$id = "draggable" + $random;
			$e.attr("id",$id);
		}
		if ($e.css("left") == null || $e.css("left") == undefined){
			$e.css("left",$e[0].offsetLeft+"px");
		}
		if ($e.css("top") == null || $e.css("top") == undefined){
			$e.css("top",$e[0].offsetLeft+"px");
		}
	
		$deltax = app.mouseX - parseInt($e.css("left").replace("px","").replace("auto","10"));
		$deltay = app.mouseY - parseInt($e.css("top").replace("px","").replace("auto","10"));
	
		$id_timer = window.setInterval(
			"$(\"#"+$id+"\").css('left',(app.mouseX - "+$deltax+") + \"px\").css('top',(app.mouseY - "+$deltay+") + \"px\");",
			10
		);
		app.timers.drag.push($id_timer);
		$e.attr("id_timer_drag",$id_timer);
	}

	app.stop_drag = function($e){
		if ($e[0].className.indexOf("draggable") <= -1){
			$e = $e.parent(".draggable");
			if ($e.length == 0){
				return false;
			}
		}
		$id_timer = $e.attr("id_timer_drag");
		window.clearInterval($id_timer);
	}
	window.app = app;
	return app;
})();

$(document).ready(
	function(){
		$(".draggable").mousedown(function(e){
			app.start_drag($(e.target));
		});
	
		$(".draggable").mouseup(function(e){
			app.stop_drag($(e.target));
		});
	
		$(document).bind("keyup",function($e){
			if ($e.keyCode == 27){
				for ($i in app.timers.drag){
					try{
						window.clearInterval(app.timers.drag[$i]);
					} catch($e){
						//nada
					}
				}
			}
		});
		
		$(document).mousemove(function(e){
			app.mouseX = e.pageX;
			app.mouseY = e.pageY;
		});
	
	}
);
