/*
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 */

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
		current_section : $(),
		timers : {},
		ui : {
			wizards : []
		}
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
	
	app.api = function($parms){
		if ($parms === undefined || typeof $parms !== "object"){
			throw "app.api: object expected.";
		}
		if (typeof $parms.data !== "object"){
			throw "app.api: data object expected.";
		}
		if (typeof $parms.data.verb !== "string"){
			throw "app.api: verb string expected in data.";
		}
		if ($parms.on_success !== undefined && typeof $parms.on_success !== "function"){
			throw "app.api: success handler must be a function.";
		} else if ($parms.on_success === undefined){
			$parms.on_success = function($resp, $status, $xhr){
				if (!$resp.success){
					app.mostrar_error("El servidor respondió:\n"+$resp.data.message);
				}
			};
		}
		if ($parms.on_error !== undefined && typeof $parms.on_error !== "function"){
			throw "app.api: error handler must be a function.";
		} else if ($parms.on_error === undefined){
			$parms.on_error = function($xhr, $status, $error){
				throw "app.api:\n"+this.verb+"\n"+$error;
			};
		}
		
		$resp = $.ajax({
			url: app.path + "/api/",
			type:"POST",
			dataType:"JSON",
			data: $parms.data,
			varb: $parms.data.verb,
			cache: ($parms.cache === undefined) ? false : $parms.cache,
			async: ($parms.async === undefined) ? true : $parms.async,
			success: $parms.on_success,
			error: $parms.on_error
		});
		
		if ($parms.async === false){
			return JSON.parse($resp.responseText);
		}
	}
	
	app.ui.change_section = function($val){
		var $sec = null;
		if (!isNaN($val)){
			// section index number from the app.sections array.
			if ($val >= app.sections.length || $val < 0){
				throw "app.ui.change_section: invalid section number.";
			}
			$sec = $(app.sections[$val]);
		} else if (typeof $val === "string"){
			// section DOM id
			$sec = $("#"+$val);
			if ($sec.length == 0){
				throw "app.ui.change_section: section id '"+$val+"' not found.";
			}
		} else if ($val instanceof jQuery) {
			// a jQuery selected object. 
			// index 0 is assumed to be the one selected
			if ($val.length == 0){
				throw "app.ui.change_section: invalid section selection.";
			}
			$sec = $($val[0]);
		} else if ($val instanceof HTMLElement){
			// an HTML DOM element.
			if ($val.tagName !== "SECTION"){
				throw "app.ui.change_section: element not a section.";
			}
			$sec = $($val);
		} else {
			throw "app.ui.change_section: invalid argument data type.";
		}
		
		app.sections.fadeOut(300);
		setTimeout(function(){$sec.fadeIn(300);},350);
		app.current_section = $sec;
	}
	
	app.ui.get_object = function($str){
		if (typeof $str !== "string"){
			throw "app.ui.get_object: object id string expected.";
		}
		
		var found = false;
		var obj = {};
		
		if (!found) {
			for (var $i = 0; $i < app.ui.wizards.length; $i++){
				if (app.ui.wizards[$i].obj.attr("id") == $str){
					found = true;
					obj = app.ui.wizards[$i];
				}
			}
		}
		
		
		return obj;
	}
	
	if (window !== undefined){
		// check for web workers
		window.app = app;
	}
	return app;
})();

/**
 * Wizard class
 * Handles UI wizards
 */
var Wizard = function($obj){
	var self = {
		obj : ($obj instanceof jQuery) ? $($obj[0]) : $($obj)
	}
	
	self.pages = self.obj.find(".wizard-page");
	self.current_page = -1; //at startup, it's -1. Then, uses the "next()" method.
	self.back_button = self.obj.find(".wizard-back-button");
	self.next_button = self.obj.find(".wizard-next-button");
	
	self.next = function(){
		
		$valid = (self.current_page > -1) ? eval($(self.pages[self.current_page]).attr("validation")) : true;
		
		if ($valid === undefined){
			$valid = true;
		}
		
		if ($valid === true){
			if (self.current_page >= 0){
				self.hide_page(self.current_page);
				self.back_button.removeAttr("disabled");
			} else {
				self.back_button.attr("disabled","disabled");
			}
			
			self.current_page = (self.current_page < self.pages.length -1) ? self.current_page + 1 : self.current_page;
			self.show_page(self.current_page);
			
			if (self.current_page < self.pages.length - 1) {
				self.next_button.removeAttr("disabled");
			} else {
				self.next_button.attr("disabled", "");
			}
			
			self.obj.find(".wizard-title").html("<h1>"+$(self.pages[self.current_page]).attr("wizardtitle")+"</h1>");
		} else {
			app.mostrar_error("Hay datos inválidos.\nPor favor, revise los datos y vuelva a intentar.");
		}
	}
	
	self.back = function(){
		if (self.current_page < self.pages.length) {
			self.hide_page(self.current_page, "left");
			self.next_button.removeAttr("disabled");
		} else {
			self.next_button.attr("disabled", "");
		}
		
		self.current_page = (self.current_page > 0) ? self.current_page - 1 : self.current_page;
		self.show_page(self.current_page, "right");
		
		if (self.current_page > 0){
			self.back_button.removeAttr("disabled");
		} else {
			self.back_button.attr("disabled","disabled");
		}
		
		self.obj.find(".wizard-title").html("<h1>"+$(self.pages[self.current_page]).attr("wizardtitle")+"</h1>");
	}
	
	self.show_page = function($number){
		if (isNaN($number)){
			throw "Wizard.show_page: page number expected.";
		}
		
		$(self.pages[$number]).removeClass("wizard-page-out");
		$(self.pages[$number]).fadeIn(150);
		
	}
	
	self.hide_page = function($number){
		if (isNaN($number)){
			throw "Wizard.hide_page: page number expected.";
		}
		
		$(self.pages[$number]).addClass("wizard-page-out");
	}
	
	self.__init__ = function (){
		
		for (var $i = self.pages.length -1; $i > -1; $i--){
			$(self.pages[$i]).css("z-index", (self.pages.length - $i) + 1);
		}
		self.current_page = -1;
		self.back_button.bind("click",self.back);
		self.next_button.bind("click",self.next);
		self.next();
	};
	
	self.reset = function (){
		self.current_page = -1;
		self.next();
	};
	
	self.__init__();
	
	return self;
}


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
		
		app.sections = $("body > section");
		app.current_section = $(app.sections[0]);
		
		$(".wizard").each(function($i, $e){
			app.ui.wizards.push(new Wizard($e));
		});
		
	}
);
