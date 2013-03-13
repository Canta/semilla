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

Semilla = function($fn){
	
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
	
	Importer = function(){};
	Importer.prototype = {
		kind : "Abstract importer",
		description : "This is an importer that actually does nothing.\nIt's used as definition for other importers to overload.",
		mime_types : []
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
	Exporter = function() {};
	Exporter.prototype = {
		kind : "Abstract exporter",
		description : "This is an exporter that actually does nothing.\nIt's used as definition for other exporters to overload."
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
	Advertiser = function(){};
	Advertiser.prototype = {
		kind : "Abstract advertiser",
		description : "This is an advertiser that actually does nothing.\nIt's used as definition for other advertisers to overload."
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
	Repo = function(){};
	Repo.prototype = {
		kind : "Abstract repo",
		description : "This is a repo that actually does nothing.\nIt's used as definition for other repos to overload.",
		contents : [],
		users : []
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
	Propagator = function(){};
	Propagator.prototype = {
		kind : "Abstract propagator",
		description : "This is a propagator that actually does nothing.\nIt's used as definition for other propagators to overload."
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
	Fragment = function(){};
	Fragment.prototype = {
		id : Math.round(Math.random() * 999999999),
		content : new Blob(),
		text : "",
		text_ready : true,
		set_content : function($val){
			this.text_ready = false;
			this.content = new Blob([$val]);
			var fr = new FileReader();
			fr.addEventListener("load" ,function(e){
				this.text = e.target.result;
				this.text_ready = true;
			});
			fr.readAsText(this.content);
			return this;
		}
	};
	$fn.Fragment = Fragment;
	
	/**
	 * Content class.
	 * The main object for Semilla to handle.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Content}
	 */
	Content = function(){};
	Content.prototype = {
		properties : {
			name : "Content's name",
			description : "Content's description"
		},
		origin : new Blob(),
		external_links : [],
		references : [],
		fragments : [],
		corrections : [],
		
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
		add_fragment : function(f){
			if (!( f instanceof Semilla.Fragment)){
				throw "Content.add_fragment: Fragment expected.";
			}
			
			this.fragments.push(f);
		}
		
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
		
		return ret;
	}
	
	
	return $fn;
}(function Semilla(){});

/**
 * MP3Importer class.
 * Translates from MP3 files into Content classes.
 *
 * It uses the FANTASTIC Aurora.js framework for JS audio handling.
 * https://github.com/ofmlabs/aurora.js
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
		//the magic goes here
		return true;
	}
});

Semilla.importers.push(new Semilla.MP3Importer());
