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

var Semilla = (function($fn){
	
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
	$fn.Importer = function(){
		function importer(){
			
		}
		
		importer.kind = "Abstract importer";
		importer.description = "This is an importer that actually does nothing.\nIt's used as definition for other importers to overload.";
		importer.mime_types = [];
		
		return importer;
	}
	
	/**
	 * Exporter class.
	 * Each exporter must know how to convert a content to different formats.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Exporter}
	 */
	$fn.Exporter = function() {
		function exporter(){
			
		}
		
		exporter.kind = "Abstract exporter";
		exporter.description = "This is an exporter that actually does nothing.\nIt's used as definition for other exporters to overload.";
		
		return exporter;
	}

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
	$fn.Advertiser = function(){
		function advertiser(){
			
		}
		
		advertiser.kind = "Abstract advertiser";
		advertiser.description = "This is an advertiser that actually does nothing.\n\
	It's used as definition for other advertisers to overload.";
		
		return advertiser;
	}
	
	/**
	 * Repo class.
	 * Handles repositories of contents.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Repo}
	 */
	$fn.Repo = function(){
		function repo(){
			
		}
		
		repo.kind = "Abstract repo";
		repo.description = "This is a repo that actually does nothing.\nIt's used as definition for other repos to overload.";
		repo.contents = [];
		repo.users = [];
		
		
		return repo;
	}

	
	/**
	 * Propagator class.
	 * It deals with the task of sending contents to other repos.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Propagator}
	 */
	$fn.Propagator = function(){
		function propagator(){
			
		}
		
		propagator.kind = "Abstract propagator";
		propagator.description = "This is a propagator that actually does nothing.\nIt's used as definition for other propagators to overload.";
		
		return propagator;
	}

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
	$fn.Fragment = function(){
		var fragment = {
			id : Math.round(Math.random() * 999999999),
			content : new Blob(),
			text : "",
			text_ready : true
		}
		
		fragment.set_content = function($val){
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
		
		
		return fragment;
	}
	
	/**
	 * Content class.
	 * The main object for Semilla to handle.
	 *
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @constructor
	 * @this {Content}
	 */
	$fn.Content = function(){
		function content(){
			
		}
		
		content.properties = {
			name : "Content's name",
			description : "Content's description"
		};
		
		content.origin = new Blob();
		content.external_links = [];
		content.references = [];
		content.fragments = [];
		content.corrections = [];
		
		return content;
	}
	
	return $fn;
}(function(){}));
