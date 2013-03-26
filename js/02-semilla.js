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

Function.prototype.def = function(obj){
	for (var k in obj){
		this.prototype[k] = obj[k];
	}
}

Semilla = (function($fn){
	
	$fn.importers   = [];
	$fn.exporter    = [];
	$fn.advertisers = [];
	$fn.propagators = [];

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
		this.kind = "Abstract repo";
		this.description = "This is a repo that actually does nothing.\nIt's used as definition for other repos to overload.";
		this.contents = [];
		this.users = [];
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
		this.content = (typeof Blob !== "undefined") ? new Blob() : "";
		this.text = "";
		this.text_ready = true;
		this.from = null;
		this.to   = null;
		this.set_content = function($val){
			this.text_ready = false;
			this.content = new Blob([$val]);
			var fr = new FileReader();
			fr.addEventListener("load" ,function(e){
				this.text = e.target.result;
				this.text_ready = true;
			});
			fr.readAsText(this.content);
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
		this.origin = (typeof Blob !== "undefined") ? new Blob() : "";
		this.external_links = [];
		this.references = [];
		this.fragments = [];
		this.corrections = [];
		
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
		
	}
	$fn.Content = Content;
	
	/**
	 * method import_content.
	 * Given a File object, this method checks for a compatible importer
	 * for that File and, if found, returns a fully parsed Content 
	 * object. If not, returns the boolean false value.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @param {File} $f
	 * @return {Content}
	 */
	$fn.import_content = function($f){
		if (! ($f instanceof File)){
			throw "Semilla.import_content: File object expected";
		}
		
		var imp = null, found = false;
		for (var i = 0; i < this.importers.length && found == false; i++){
			for (var i2 = 0; i2 < this.importers[i].mime_types.length; i2++){
				if ($f.type.toLowerCase() == this.importers[i].mime_types[i2].toLowerCase()){
					imp = this.importers[i];
					found = true;
				}
			}
		}
		
		var ret = false;
		if (imp !== null){
			ret = imp.parse($f);
		}
		
		//console.debug("Semilla.import_content: " + ret);
		return ret;
	}
	
	
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
	
	return $fn;
})(function Semilla(){});

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
	description : "An importer for Mp3 files. It takes an MP3, and creates a Semilla content.",
	mime_types  : ["audio/mp3", "audio/mpeg"],
	parse       : function(f){
		//REQUIRES:
		//aurora.js and mp3.js (aurora's mp3 decoder)
		if (typeof Player == "undefined"){
			if (typeof jQuery != "undefined"){
				jQuery.ajax({
					async:false,
					type:'GET',
					url: "./js/libs/aurora.js",
					data:null,
					dataType:'script'
				});
			} else if(typeof window == "undefined" && typeof importScripts !== "undefined"){
				//No window object, and importScripts defined. 
				//WebWorker assumed.
				importScripts("./libs/aurora.js");
			}
		}
		if (typeof MP3Stream == "undefined"){
			if (typeof jQuery != "undefined"){
				jQuery.ajax({
					async:false,
					type:'GET',
					url: "./js/libs/mp3.js",
					data:null,
					dataType:'script'
				});
			} else if(typeof window == "undefined" && typeof importScripts !== "undefined"){
				//No window object, and importScripts defined. 
				//WebWorker assumed.
				importScripts("./libs/aurora.js");
			}
		}
		
		try{
			//console.debug("MP3Importer.parse: creating asset.");
			var a = new Asset.fromFile(f);
			//console.debug("MP3Importer.parse: setting 'duration' event.");
			a.on('duration', function(duration) {
				//console.debug("MP3Importer.parse: asset duration: " + duration);
				//Once with the audio duration, we can create the Content.
				c = new Semilla.Content();
				for (var i = 0; i < duration; i=i+5000){
					var fr = new Semilla.Fragment();
					//TODO:
					//set every fragments content.
					fr.from = i;
					fr.to   = ((i + 5000) < duration) ? (i + 5000) : duration;
					c.add_fragment(fr);
				}
				window.c = c;
			});
			//console.debug("MP3Importer.parse: starting asset loading process.");
			a.start();
			return true;
		} catch (e){
			return false;
		}
	}
});
Semilla.importers.push(new Semilla.MP3Importer());
