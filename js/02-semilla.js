/*
 * Semilla Framework.
 * 
 * Copyright 2013 Daniel Cantarín <omega_canta@yahoo.com>
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
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
 * def function.
 * Helper function for easy and clean class definitions.
 * It lets me define properties an methods in a class implementing 
 * prototype inheritance in a not so verbose way. 
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @param {Object} obj
 * @this {Function}
 */
Function.prototype.def = function(obj){
	for (var k in obj){
		this.prototype[k] = obj[k];
	}
	
	/**
	 * add_event_handler function.
	 * Its name is quite self descriptive :P
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {String} en 
	 * Event Handler name
	 * @param {Function} f 
	 * A function to execute when the event happens.
	 * @this {Function}
	 */
	this.prototype["add_event_handler"] = function(en, f){
		if (typeof f === "undefined" || ! (f instanceof Function) ){
			throw "[Semilla] add_event_handler: Function expected.";
		}
		
		if ( 
			this.events !== undefined 
			&& this.events[en] !== undefined 
			&& this.events[en] instanceof Array
			){
			this.events[en].push(f);
		}
	}
	
	/**
	 * fire_event function.
	 * Common function for event handlers.
	 * Given an event name, it checks for its existance, and in case 
	 * it's there, this function fires all its handler functions.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {String} en 
	 * Event Handler name
	 * @param {Object} data 
	 * Arbitrary data for the handlers. Every handler must know the data
	 * structure it's going to receive given the event.
	 * @this {Function}
	 */
	this.prototype["fire_event"] = function(en, data){
		
		if ( 
			this.events === undefined 
			|| this.events[en] === undefined 
			|| !(this.events[en] instanceof Array)
			){
			return;
		}
		
		for (var i = 0; i < this.events[en].length; i++){
			try{
				this.events[en][i](data, this);
			} catch(e){
				console.debug("[Semilla] fire_event: problem calling index "+ i +" in '"+en+"' event handlers list:\n"+e);
			}
		}
	}
}


Semilla = (function($fn){
	
	$fn.importers   = [];
	$fn.exporter    = [];
	$fn.advertisers = [];
	$fn.propagators = [];
	$fn.repos       = [];

	/**
	 * Importer class.
	 * Each importer must know how to create contents from different
	 * files in different formats.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Importer}
	 */
	
	Importer = function(){
		this.kind = "Abstract importer";
		this.description = "This is an importer that actually does nothing.\nIt's used as definition for other importers to overload.";
		this.mime_types = [];
		this.output_quality = 0.1;
		this.events = {
			file_parsed : [],
			parse_progress : []
		}
		/**
		 * method parse.
		 * Given a File object, and a Repo object, this method generates
		 * a Content object, and then adds it to the repo.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @param {File} f
		 * @param {Repo} r
		 * @return {Boolean}
		 */
		this.parse = function(f, r){
			if (typeof f === "undefined" || ! (f instanceof File) ){
				throw "Semilla.Importer: File expected.";
			}
			if (typeof r === "undefined" || ! (r instanceof Semilla.Repo) ){
				throw "Semilla.Importer: Repo expected.";
			}
			
			return this.__parse(f,r);
		};
		
		this.__parse = function(f,r){
			
			this.fire_event("file_parsed",{});
			return this;
		}
		
		/**
		 * method load_libs.
		 * Every importer is supposed to use ad-hoc libs for different
		 * MIME type file handling.
		 * This method is a generic method for loading those libs.
		 * The strategy is, given that every custom importer class knows
		 * the libs it needs to work, it overloads this function 
		 * implementing all the logic for lib loading before calling any
		 * lib-dependent method.
		 * Also, here's the place where it checks if the lib is already
		 * loaded.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @this {Importer}
		 */
		this.load_libs = function(){
			return;
		}
	};
	$fn.Importer = Importer;
	
	/**
	 * Exporter class.
	 * Each exporter must know how to convert a content to different formats.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Exporter}
	 */
	Exporter = function() {
		this.kind = "Abstract exporter";
		this.description = "This is an exporter that actually does nothing.\nIt's used as definition for other exporters to overload.";
	};
	$fn.Exporter = Exporter;
	
	/**
	 * Advertiser class.
	 * It's a class for advertise contents. 
	 * For example, posting on forums, facebook, twitter, and so on, when
	 * a new content is added to a repo.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Advertiser}
	 */
	Advertiser = function(){
		this.kind = "Abstract advertiser";
		this.description = "This is an advertiser that actually does nothing.\nIt's used as definition for other advertisers to overload.";
	}
	$fn.Advertiser = Advertiser;
	
	/**
	 * Repo class.
	 * Handles repositories of contents.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Repo}
	 */
	Repo = function(){
		this.kind = "Abstract base repo class";
		this.name = "Base Repo";
		this.description = "This is a repo that actually does nothing.\nIt's used as definition for other repos to overload.";
		this.contents = [];
		this.users = [];
		this.events = {
			new_content : [],
			add_progress : []
		};
		/**
		 * method import_content.
		 * Given a File object, this method checks for a compatible 
		 * importer for that File and, if found, generates a fully 
		 * parsed Content object. 
		 * The Content object is then stored in the repo.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @param {File} $f
		 * @return {Boolean}
		 */
		this.import_content = function($f){
			if (! ($f instanceof File)){
				throw "Semilla.Repo.import_content: File object expected";
			}
			
			var imp = Semilla.Util.get_importer_by_mime_type($f.type);
			var ret = false;
			if (imp !== null){
				ret = imp.parse($f, this);
			}
			
			//console.debug("Semilla.Repo.import_content: " + ret);
			return ret;
		}
		
		/**
		 * method add_content.
		 * Given a Content object, this method adds it to the repo's 
		 * contents collection. 
		 * It's in fact a public validations function for inheritance,
		 * as internally calls for a private function once the input is
		 * validated. 
		 * That private function fires the "new_content" event when 
		 * complete, and is supposed to be overloaded by custom repos.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @param {Content} c
		 * @this {Repo}
		 */
		this.add_content = function(c){
			if ( typeof c === "undefined" || ! (c instanceof Semilla.Content) ){
				throw "Semilla.Repo: Content expected.";
			}
			
			this.__add_content(c);
		}
		
		this.__add_content = function(c){
			this.contents.push(c);
			this.fire_event("new_content", {content:c});
		}
		
	}
	$fn.Repo = Repo;
	
	/**
	 * Propagator class.
	 * It deals with the task of sending contents to other repos.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Propagator}
	 */
	Propagator = function(){
		kind = "Abstract propagator";
		description = "This is a propagator that actually does nothing.\nIt's used as definition for other propagators to overload.";
	}
	$fn.Propagator = Propagator;
	
	/**
	 * Fragment class.
	 * The abstraction behind the collaboration.
	 * It's supposed to enable multiple users to work on different parts of 
	 * a content in different places and different times, without losing any
	 * of their works, and without being forced to complete a whole content
	 * processing in order to save a content.
	 * 
	 * It can handle strings, as well as arbitrary binary data.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Fragment}
	 */
	function Fragment(){
		this.id = Math.round(Math.random() * 999999999);
		//"content" should be the raw content of the fragment, wither in
		//a serialized way or some kind of reference (like URLs).
		//Every Content kind has different fragments, that handles this
		//in a different way.
		this.content = ""; 
		//"text" is the text of the fragment 
		this.text = "";
		//"html" is the HTML code of the fragment, used for styling the
		//text, and for UI management.
		this.html = "";
		//"ready" is a property used to know if a fragment is already 
		//transcripted or checked in some valid way. By default, after
		//automated importing, is set to false, given that automated 
		//procces usually renders text not suitable for later accurate 
		//exporting (or even no text at all, and sometimes is fine for
		//a fragment to have no text). Somebody has to check this.
		this.ready = false;
		this.text_ready = true;
		this.from = null;
		this.to   = null;
		this.set_content = function($val){
			/*
			this.text_ready = false;
			this.content = new Blob([$val]);
			var fr = new FileReader();
			fr.addEventListener("load" ,function(e){
				this.text = e.target.result;
				this.text_ready = true;
			});
			fr.readAsText(this.content);
			*/
			this.content = $val;
			this.text = $val;
			return this;
		};
	}
	$fn.Fragment = Fragment;
	
	/**
	 * Content class.
	 * The main object for Semilla to handle.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Content}
	 */
	Content = function(){
		this.properties = {
			name : "Content's name",
			description : "Content's description"
		};
		this.external_links = [];
		this.references = [];
		this.fragments = [];
		this.corrections = [];
		this.kind = "text"; //text, audio, or video. Default text.
		this.origin = { 
			//This property is intended to save the full serialized raw 
			//input file in Base64.
			raw : "",
			content_type: "",
			file_name: ""
		};
		
		
		/**
		 * method add_fragment.
		 * Given a Fragment, adds it to the content's fragments list.
		 * It's redundant given that one can just push the fragment into
		 * the fragments list (it's public), but this function is
		 * intended to also validate the fragment, as custom contents 
		 * may need specific fragment types.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @this {Content}
		 * @param {Fragment} f
		 * @return {void}
		 */
		this.add_fragment = function(f){
			if (!( f instanceof Semilla.Fragment)){
				throw "Content.add_fragment: Fragment expected.";
			}
			
			this.fragments.push(f);
		};
		
		/**
		 * method render_fragment.
		 * Returns an string with an HTML representation of a fragment.
		 * It's useful mainly for UI development, as different content 
		 * kinds needs different UI controls.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @this {Content}
		 * @param {Integer} i
		 * @return {String}
		 */
		this.render_fragment = function(i){
			
			if (!Semilla.Util.is_numeric(i)){
				throw "Content.render_fragment: number expected.";
			}
			
			if (!this.fragments[i]){
				throw "Content.render_fragment: Fragment "+i+" not found.";
			}
			
			var ret = "";
			
			if (this.fragments[i].render){
				//for future custom fragment types implementing own 
				//render logic.
				ret = this.fragments[i].render();
			} else if (this.kind === "text"){
				//Text type.
				//It's assumed that it's an image to be transcripted.
				ret += "<div class=\"semilla-fragment-container\" >";
				ret += "<img class=\"semilla-fragment-text-page\" src=\""+this.fragments[i].content+"\" />";
				ret += "</div>";
			} else if (this.kind === "audio"){
				//Audio type.
				//It's supposed to be time coodinates in an audio.
				var imp = Semilla.Util.get_importer_by_mime_type(
					this.origin.content_type
				);
				imp.load_libs();
				
				ret += "<div class=\"semilla-fragment-container\">";
				ret += "<div class=\"semilla-fragment-audio-player\" \
				from=\""+this.fragments[i].from+"\" to=\""+this.fragments[i].to+"\" ></div>";
				ret += "<div class=\"semilla-fragment-audio-data\" >"+this.origin.raw+"</div>";
				ret += "</div>";
			} else if (this.kind === "video"){
				//Video type.
				//Coordinates, just like the audio type.
				//However, it must render a different player object.
			}
			
			return ret;
		};
		
		/**
		 * method read_raw.
		 * Given a file object, this method reads the full contents as
		 * data URL and saves it in the content's "origin" property.
		 *
		 * @author Daniel Cantarín <omega_canta@yahoo.com>
		 * @this {Content}
		 * @param {Blob} f
		 * A file object to read
		 */
		this.read_raw = function(f){
			
			if (!( f instanceof Blob)){
				throw "Content.read_raw: File (or Blob) expected.";
			}
			
			c.origin.file_name = f.name;
			c.origin.content_type = f.type;
			fr = new FileReader();
			fr.content = this;
			fr.readAsDataURL(f);
			fr.onloadend = function(evt){
				if (evt.target.readyState == FileReader.DONE) { // DONE == 2
					this.content.origin.raw = evt.target.result;
				}
			}
		}
	}
	$fn.Content = Content;
	
	/**
	 * Util namespace.
	 * A placeholder for common util functions.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 */
	
	$fn.Util = {};
	
	/**
	 * is_numeric function.
	 * Checks for a value to be a number.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {mixed} var
	 * @return {boolean}
	 */
	$fn.Util.is_numeric = function(val){
		return !isNaN(parseFloat(val)) && isFinite(val);
	}
	
	/**
	 * ms2s function.
	 * Translates milliseconds to seconds.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {long} ms
	 * @return {float}
	 */
	$fn.Util.ms2s = function (ms){
		if (Semilla.Util.is_numeric(ms)){
			return ms / 1000;
		}
		throw "Semilla.Util.ms2s: '" + ms +"' is not a number";
	}
	
	/**
	 * ms2m function.
	 * Translates milliseconds to minutes.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {long} ms
	 * @return {float}
	 */
	$fn.Util.ms2m = function (ms){
		if (Semilla.Util.is_numeric(ms)){
			return Semilla.Util.ms2s(ms) / 60;
		}
		throw "Semilla.Util.ms2m: '" + ms +"' is not a number";
	}
	
	/**
	 * load_script function.
	 * Util function for scripts loading.
	 * A recurrent operation on internal Semilla classes.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {String} u
	 * Script's url
	 */
	$fn.Util.load_script = function (u){
		if (typeof jQuery != "undefined"){
			jQuery.ajax({
				async:false,
				type:'GET',
				url: u,
				data:null,
				dataType:'script'
			});
		} else if(typeof window == "undefined" && typeof importScripts !== "undefined"){
			//No window object, and importScripts defined. 
			//WebWorker assumed.
			importScripts(u);
		} else if (typeof XMLHttpRequest !== "undefined"){
			//no jQuery, no worker, but XMLHttpRequest present.
			var xhr = new XMLHttpRequest();
			xhr.open("GET", u, false);
			xhr.send();
			if (typeof window !== "undefined"){
				var h = document.getElementsByTagName('head')[0];
				var s = document.createElement('script');
				s.type= 'text/javascript';
				s.innerHTML = xhr.responseText;
				h.appendChild(s);
			} else {
				//Node.js assumed.
			}
		}
	}
	
	/**
	 * get_importer_by_mime_type function.
	 * Given a file's MIME type, it returns an importer suited for that
	 * kind of file.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {String} m
	 * A MIME type.
	 */
	$fn.Util.get_importer_by_mime_type = function(m){
		var imp = null, found = false;
		for (var i = 0; i < Semilla.importers.length && found == false; i++){
			for (var i2 = 0; i2 < Semilla.importers[i].mime_types.length; i2++){
				if (m.toLowerCase() == Semilla.importers[i].mime_types[i2].toLowerCase()){
					imp = Semilla.importers[i];
					found = true;
					break;
				}
			}
		}
		return imp;
	}
	
	/**
	 * clone function.
	 * Given an object, it returns a copy of the object.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {Object} o
	 * An object to be cloned
	 */
	$fn.Util.clone = function(o){
		return eval(uneval(c));
	}
	
	return $fn;
})(function Semilla(){});


/**
 * MemoryRepo class.
 * Basic repo for in-memory content handling.
 * It's the Semilla's default repo.
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @constructor
 * @this {MemoryRepo}
 */
Semilla.MemoryRepo = function(){};
Semilla.MemoryRepo.prototype = new Semilla.Repo();
Semilla.MemoryRepo.def({
	kind : "In-memory volatile repo",
	name : "In-memory volatile repo",
	description : "This repo kind is the default Semilla's repo, and is used for in-memory content storing."
});
Semilla.repos.push( new Semilla.MemoryRepo() );


/**
 * HTTPRepo class.
 * Repo for HTTP distribution, via POST requests.
 * It's useful for building Semilla compatible web sites. 
 * On server's side, it just requires a handler for the repo calls, and
 * that should be enough for sending and searching contents.
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @constructor
 * @this {HTTPRepo}
 */
Semilla.HTTPRepo = function(){};
Semilla.HTTPRepo.prototype = new Semilla.Repo();
Semilla.HTTPRepo.def({
	kind : "HTTP Repo",
	name : "Web site",
	description : "A repo for HTTP POST content handling.",
	//flag for sending or not the serialized raw full file content.
	//it dramatically changes the resources requirements.
	send_raw : true,
	//API controller url
	endpoint : "./api/",
	// __add_content is called by the public inherited add_content.
	__add_content: function(c){
		var data = new FormData();
		var xhr = new XMLHttpRequest();
		xhr.repo = this;
		xhr.upload.repo = this;
		xhr.content = c;
		
		xhr.onreadystatechange = function(evt){
			if (evt.target.readyState == 4){
				var r = JSON.parse(evt.target.responseText);
				this.repo.fire_event("add_progress", {progress:100});
				if (r.success){
					this.repo.contents.push(this.content);
					this.repo.fire_event("new_content", {content:this.content});
				} else {
					alert("Error! :S\n"+r.data.message);
				}
			}
		}
		
		xhr.upload.onprogress = function(evt) {
			var loaded = (evt.loaded / evt.total);
			if (loaded < 1) {
				this.repo.fire_event("add_progress", {progress:(loaded * 100)});
			}
		};
		
		data.append("verb", "new_content");
		for (var i in c.properties){
			data.append(i, c.properties[i]);
		}
		
		if (this.send_raw !== true){
			c = Semilla.Util.clone(c); 
			//now "c" is a copy of the original and not a reference.
			c.origin.raw = "";
		}
		
		data.append("kind", "2"); //hardcoded for demo app compat.
		data.append("data", JSON.stringify(c));
		xhr.open("POST", this.endpoint);
		this.fire_event("add_progress", {progress:0});
		setTimeout(function(){xhr.send(data);},100);
	}
});



/**
 * MP3Importer class.
 * Translates from MP3 files into Content classes.
 *
 * It uses the FANTASTIC Aurora.js framework for JS audio handling.
 * https://github.com/audiocogs/aurora.js
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @constructor
 * @this {MP3Importer}
 */
Semilla.MP3Importer = function(){};
Semilla.MP3Importer.prototype = new Semilla.Importer();
Semilla.MP3Importer.def({
	kind        : "MP3 File importer",
	description : "An importer for Mp3 files. It takes a MP3 file, and creates a Semilla content.",
	mime_types  : ["audio/mp3", "audio/mpeg"],
	load_libs   : function(){
		//REQUIRES:
		//aurora.js and mp3.js (aurora's mp3 decoder)
		if (typeof AV == "undefined"){
			Semilla.Util.load_script("./js/libs/aurora.js");
		}
		if (AV.Decoder.find("mp3") === null){
			Semilla.Util.load_script("./js/libs/mp3.js");
		}
	},
	__parse       : function(f, r){
		this.load_libs();
		try{
			//console.debug("MP3Importer.parse: creating asset.");
			var imp = this;
			var p = new AV.Player.fromFile(f);
			p.original_file = f;
			//var a = p.asset;
			//console.debug("MP3Importer.parse: setting 'duration' event.");
			p.on('duration', function(duration) {
				//console.debug("MP3Importer.parse: asset duration: " + duration);
				//Once with the audio duration, we can create the Content.
				c = new Semilla.Content();
				c.read_raw(f);
				c.kind = "audio";
				imp.fire_event("parse_progress", {progress: 0});
				var $tmp = function(i, duration){
					
					var fr = new Semilla.Fragment();
					//TODO:
					//set every fragments content.
					fr.from = i;
					fr.to   = ((i + 5000) < duration) ? (i + 5000) : duration;
					c.add_fragment(fr);
					imp.fire_event("parse_progress", {progress: (i * 100 / duration)});
					
					if ((i + 5000) < duration) {
						setTimeout(function(){$tmp(i + 5000,duration);},10);
					} else {
						imp.fire_event("parse_progress", {progress: 100});
						r.add_content(c);
					}
				}
				$tmp(0,duration);
			});
			//console.debug("MP3Importer.parse: starting asset loading process.");
			//a.start();
			p.preload();
			return true;
		} catch (e){
			return false;
		}
	}
});
Semilla.importers.push(new Semilla.MP3Importer());



/**
 * PDFImporter class.
 * Translates from PDF files into Content classes.
 *
 * It uses the great Mozilla's pdf.js library for pdf handling via JS.
 * https://github.com/mozilla/pdf.js
 *
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @constructor
 * @this {PDFImporter}
 */
Semilla.PDFImporter = function(){};
Semilla.PDFImporter.prototype = new Semilla.Importer();
Semilla.PDFImporter.def({
	kind        : "PDF File importer",
	description : "An importer for PDF files. It takes a PDF, and creates a Semilla content.",
	mime_types  : ["application/pdf", "application/x-pdf", "application/vnd.pdf", "text/pdf"],
	load_libs   : function(){
		//REQUIRES:
		//pdf.js
		if (typeof PDFJS == "undefined"){
			Semilla.Util.load_script("./js/libs/pdf.js");
		}
		
	},
	__parse       : function(f, r){
		//TODO:
		//try to get the text position somehow, not just raw text, as
		//discussed here: 
		//https://groups.google.com/forum/?fromgroups=#!topic/mozilla.dev.pdf-js/Qzq-xA2MHjs
		
		
		try{
			PDFJS.workerSrc = app.path+"/js/libs/pdf.js";
			a = new FileReader();
			c = new Semilla.Content();
			c.read_raw(f);
			var imp = this;
			a.readAsArrayBuffer(f);
			a.onloadend = function(evt){
				if (evt.target.readyState == FileReader.DONE) { // DONE == 2
					var p = new Uint8Array(evt.target.result);
					PDFJS.getDocument(p).then(function(pdf) {
						imp.fire_event("parse_progress", {progress: 0});
						var canvas = document.createElement("canvas");
						//$("#content-create-process-output").append(canvas)
						var context = canvas.getContext('2d');
						var $curr_page = 1;
						var fun = function($i){
							pdf.getPage($curr_page).then(function(page){
								var scale = 1.5;
								var viewport = page.getViewport(scale);
								context.fillStyle = "white";
								canvas.height = viewport.height;
								canvas.width = viewport.width;
								context.fillRect(0, 0, viewport.width, viewport.height);
								var renderContext = {
									canvasContext: context,
									viewport: viewport
								};
								page.render(renderContext).then(
									function(){
										var fr = new Semilla.Fragment();
										var b = canvas.toDataURL("image/jpeg",imp.quality);
										fr.set_content(b);
										
										pdf.getPage($curr_page).data.getTextContent().then(
											function(text){
												textin = $.makeArray($(text.bidiTexts).map(function(element,value){return value.str})).join('\n'); 
												fr.text = textin;
												fr.text_ready = true;
												c.add_fragment(fr);
											}
										);
										
										if (pdf.pdfInfo.numPages == $curr_page){
											c.origin = f;
											imp.fire_event("parse_progress", {progress: 100});
											r.add_content(c);
										} else {
											imp.fire_event("parse_progress", {progress: ($curr_page * 100 / pdf.pdfInfo.numPages)});
											$curr_page++;
											fun($curr_page);
										}
									}
								);
								
							});
						}
						fun($curr_page);
					});
				}
				
			}
			return true;
		} catch (e){
			console.debug(e);
			return false;
		}
	}
});
Semilla.importers.push(new Semilla.PDFImporter());
