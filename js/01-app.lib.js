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
	var app = function(){};
	app.version = "1.1";
	app.path = ".";
	app.esperando = [];
	app.current_section = $();
	app.timers = {};
	app.ui = {
			wizards : []
	};
	
	app.timers.drag = [];
	
	app.show_modal = function($data){
		
		var def = new $.Deferred();
		if ($data === undefined){
			$data = {};
		}
		if ($data.html === undefined){
			$data.html = "";
		}
		if ($data.ok === undefined){
			$data.ok = [];
		}
		if ($data.cancel === undefined){
			$data.cancel = [];
		}
		
		
		var $tmp_done = function(){
			var $tmp_html = "";
			$tmp_html  = "<div class=\"cubre-cuerpo\"></div><div class=\"modal\">";
			$tmp_html += "<div class=\"modal-html\" >"+$data.html+"</div>";
			$tmp_html += "<div class=\"botonera\"><button id=\"modal_button_cancelar\"> Cancelar </button> <button id=\"modal_button_aceptar\" onclick=\"$(this).attr('disabled','disabled')\"> Aceptar </button></div>";
			$tmp_html += "</div>";
			
			$("body").append($tmp_html);
			$(".cubre-cuerpo").fadeIn(250);
			$(".modal:not(.espere)").fadeIn(500).promise().then(
				function(){
					if ($data.ok instanceof Array){
						for (var $i = 0; $i < $data.ok.length; $i++){
							$("#modal_button_aceptar:visible").on("click",$data.ok[$i]);
						}
					} else if ($data.success instanceof Function) {
						$("#modal_button_aceptar:visible").on("click",$data.ok);
					}
					
					if ($data.cancel instanceof Array){
						for (var $i = 0; $i < $data.cancel.length; $i++){
							$("#modal_button_aceptar:visible").on("click",$data.cancel[$i]);
						}
					} else if ($data.cancel instanceof Function) {
						$("#modal_button_aceptar:visible").on("click",$data.cancel);
					}
					
					$("#modal_button_cancelar:visible").on("click",app.hide_modal);
					
					$("#modal_button_aceptar:visible").on("click",function(){
						if (app.modal_ok){
							app.hide_modal();
						}
					});
					
					def.resolve("modal listo");
				}
			);
			
			app.modal_ok = true;
		};
		
		if ($(".modal:not(.espere)").length > 0 ){
			app.hide_modal().then($tmp_done);
		} else {
			$tmp_done();
		}
		
		return def;
	}
	
	app.hide_modal = function(){
		var def = new $.Deferred();
		if ($(this).attr("id") == "modal_button_aceptar" && app.modal_ok != true){
			def.fail("Error al intentar cerrar un modal");
		}
		$(".cubre-cuerpo").fadeOut(300, function(){
			$(this).remove();
		});
		$(".modal").fadeOut(250).promise().then(function(){
			var t = $(this);
			if (t.attr("onhide") !== undefined && t.attr("onhide") !== ""){
				eval(t.attr("onhide"));
			}
			t.remove();
			
			def.resolve("hide_modal resuelto");
		});
		return def;
	}


	app.espere = function($desc, $fin, $html){
		
		if ($html === undefined){
			$html = "";
		}
		
		//creo los componentes visuales de espera
		if ($("body > .cubre-cuerpo").length == 0){
			$("body").append("<div class=\"cubre-cuerpo\" tyle=\"display:none\"></div>");
		}
		if ($("body > .modal").length == 0){
			$("body").append("<div class=\"modal espere\" tyle=\"display:none\"><div class=\"descripciones\"></div></div>");
		}
		
		if (app.esperando.length == 0 || $("body > .cubre-cuerpo").css("display") == "none"){
			$("body > .cubre-cuerpo").fadeIn(500);
			$("body > .modal").fadeIn(500);
		}
		app.esperando.push([$desc,$fin]);
		var $id = "espere-" + app._str_to_id($desc);
		$("body > .modal .descripciones").append("<p class=\"waiting-text\" id=\""+$id+"\">" + $desc + $html + "</p>");
		
	}

	app.desespere = function($desc){
		if ($desc === undefined){
			if (app.esperando.length > 0){
				$desc = app.esperando[0][0];
				var $id = "espere-" + app._str_to_id($desc);
				$("body > .espere .descripciones #"+$id).removeClass("waiting-text").addClass("ready-text").append("<span>..." + app.esperando[0][1] + "</span>");
				app.esperando.splice(0,1);
			}
		} else {
			for ($i in app.esperando){
				if (app.esperando[$i][0] == $desc){
					var $id = "espere-" + app._str_to_id($desc);
					$("body > .espere .descripciones #"+$id).removeClass("waiting-text").addClass("ready-text").append("<span>..." + app.esperando[$i][1] + "</span>");
					app.esperando.splice($i,1);
					break;
				}
			}
		}
	   
		if (app.esperando.length == 0){
			$(".cubre-cuerpo").fadeOut(500, function(){
				$(this).remove();
			});
			$("body > .espere").fadeOut(500, function(){
				$(this).remove();
			});
		}
	   
	}
	
	app._str_to_id = function($str){
		var $tmp = $str.toLowerCase().replace(/\ /gi,"-").replace(/\"/gi,"");
		return $tmp;
	}
	
	app.mostrar_error = function($msg){
		alert("Error:\n"+$msg);
	}

	app.mostrar_mensaje = function($msg){
		alert($msg);
	}
	
	app.confirmar = function(msg){
		return window.confirm(msg);
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
		var deferred_api_ajax = {};
		var deferred_api = new $.Deferred();
		
		if ($parms === undefined || typeof $parms !== "object"){
			throw "app.api: object expected.";
		}
		if (typeof $parms.data !== "object"){
			throw "app.api: data object expected.";
		}
		if (typeof $parms.data.verb !== "string"){
			throw "app.api: verb string expected in data.";
		}
		if ($parms.on_success !== undefined && !($parms.on_success instanceof Function)){
			throw "app.api: success handler must be a function.";
		}
		
		if ($parms.on_error !== undefined && typeof $parms.on_error !== "function"){
			throw "app.api: error handler must be a function.";
		}
		
		if ($parms.on_success === undefined){
			$parms.on_success = function(){};
		}
		
		if ($parms.on_error === undefined){
			$parms.on_error = function(){};
		}
		
		deferred_api_ajax = $.ajax({
			url: app.path + "/api/",
			type:"POST",
			dataType:"JSON",
			data: $parms.data,
			varb: $parms.data.verb,
			cache: ($parms.cache === undefined) ? false : $parms.cache,
			async: ($parms.async === undefined) ? true : $parms.async
		}).done(
			function($resp, $status, $xhr){
				deferred_api_ajax.xhr = $xhr;
				if ($resp.success){
					deferred_api.resolve($resp.data);
				} else {
					deferred_api.reject($resp.data)
				}
			}
		).fail(
			function($xhr, $status, $error){
				deferred_api_ajax.xhr = $xhr;
				deferred_api.reject({message:$error});
			}
		);
		
		deferred_api.done($parms.on_success).fail($parms.on_error);
		var p = deferred_api;
		
		if ($parms.async === false){
			p.response = JSON.parse(deferred_api_ajax.responseText);
		}
		
		return p;
		
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
		
		if (app.current_section.attr("onclose") != undefined){
			try{
				eval(app.current_section.attr("onclose"));
			}catch(e){
				app.mostrar_error(e);
				return false;
			}
		}
		
		app.sections.fadeOut(100).promise().then(
			function(){
				app.current_section = $sec;
				if ($sec.attr("onshow") != undefined){
					eval($sec.attr("onshow"));
				}
				$sec.fadeIn(300);
			}
		);
		
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
		
		app.sections = $("body > section, body > .section");
		app.current_section = $(app.sections[0]);
		
		window.onbeforeunload = function() { 
			if (app.current_section.attr("onclose") != undefined){
				try{
					eval(app.current_section.attr("onclose"));
				}catch(e){
					app.mostrar_error(e);
					return false;
				}
			}
		}
		
		$(".wizard").each(function($i, $e){
			app.ui.wizards.push(new Wizard($e));
		});
		
	}
);


/* jQuery extension: deserializing. */
jQuery.unserialize = function(str){
	var items = str.split('&');
	var ret = "{";
	var arrays = [];
	var index = "";
	for (var i = 0; i < items.length; i++) {
		var parts = items[i].split(/=/);
		//console.log(parts[0], parts[0].indexOf("%5B"),  parts[0].indexOf("["));
		if (parts[0].indexOf("%5B") > -1 || parts[0].indexOf("[") > -1){
			//Array serializado
			index = (parts[0].indexOf("%5B") > -1) ? parts[0].replace("%5B","").replace("%5D","") : parts[0].replace("[","").replace("]","");
			//console.log("array detectado:", index);
			//console.log(arrays[index] === undefined);
			if (arrays[index] === undefined){
				arrays[index] = [];
			}
			arrays[index].push( decodeURIComponent(parts[1].replace(/\+/g," ")));
			//console.log("arrays:", arrays);
		} else {
			//console.log("common item (not array)");
			if (parts.length > 1){
				ret += "\""+parts[0] + "\": \"" + decodeURIComponent(parts[1].replace(/\+/g," ")).replace(/\n/g,"\\n").replace(/\r/g,"\\r") + "\", ";
			}
		}
		
	};
	
	ret = (ret != "{") ? ret.substr(0,ret.length-2) + "}" : ret + "}";
	//console.log(ret, arrays);
	var ret2 = JSON.parse(ret);
	//proceso los arrays
	for (arr in arrays){
		ret2[arr] = arrays[arr];
	}
	return ret2;
}

jQuery.fn.unserialize = function(parm){
	//If not string, JSON is assumed.
	var items = (typeof parm == "string") ? parm.split('&') : parm;
	if (typeof items !== "object"){
		throw new Error("unserialize: string or JSON object expected.");
	}
	//Check for the need of building an array from some item.
	//May return a false positive, but it's still better than looping twice.
	//TODO: confirm if it's ok to simplify this method by always calling
	//$.unserialize(parm) without any extra checking. 
	var need_to_build = ((typeof parm == "string") && decodeURIComponent(parm).indexOf("[]=") > -1);
	items = (need_to_build) ? $.unserialize(parm) : items;
	
	
	for (var i in items){
		var parts = (items instanceof Array) ? items[i].split(/=/) : [i, (items[i] instanceof Array) ? items[i] : "" + items[i]];
		parts[0] = decodeURIComponent(parts[0]);
		if (parts[0].indexOf("[]") == -1 && parts[1] instanceof Array){
			parts[0] += "[]";
		}
		obj = this.find('[name=\''+ parts[0] +'\']');
		if (obj.length == 0){
			try{
				obj = this.parent().find('[name=\''+ parts[0] +'\']');
			} catch(e){}
		}
		if (typeof obj.attr("type") == "string" && ( obj.attr("type").toLowerCase() == "radio" || obj.attr("type").toLowerCase() == "checkbox")){
			 obj.each(function(index, coso) {
				coso = $(coso);
				//if the value is an array, i gotta search the item with that value.
				if (parts[1] instanceof Array){
					for (var i2 in parts[1]){
						var val = ""+parts[1][i2];
						if (coso.attr("value") == decodeURIComponent(val.replace(/\+/g," "))){
							coso.prop("checked",true);
						} else {
							if (!$.inArray(coso.val(),parts[1])){
								coso.prop("checked",false);
							}
						}
					}
				} else {
					val = "" + parts[1];
					if (coso.attr("value") == decodeURIComponent(val.replace(/\+/g," "))){
						coso.prop("checked",true);
					} else {
						coso.prop("checked",false);
					}
				}
			 });
		} else if (obj.length > 0 && obj[0].tagName == "SELECT" && parts[1] instanceof Array && obj.prop("multiple")){
			//Here, i have an array for a multi-select.
			obj.val(parts[1]);
		} else {
			//When the value is an array, we join without delimiter
			var val = (parts[1] instanceof Array) ? parts[1].join("") : parts[1];
			//when the value is an object, we set the value to ""
			val = (typeof val == "object") ? "" : val;
			
			obj.val(decodeURIComponent(val.replace(/\+/g," ")));
		}
	};
	return this;
}

jQuery.fn.emit = jQuery.fn.trigger;

String.prototype.decodeHTML = function(){
    var txt = document.createElement("textarea");
    txt.innerHTML = this;
    return txt.value;
}
