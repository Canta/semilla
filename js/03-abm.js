var empty = new Function;

/**
 * Clase ABM.
 * Se utiliza para generalizar métodos de ABMs, en concordancia con la capa de ORM del servidor.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 */
app.ABM = lang.declare(null, {
	
	tabla: null,
	data: null,
	modal: true,
	container: "section:visible .section-contents",
	datos_ok: true,
	
	after_alta: empty,
	after_lista: empty,
	after_modificacion: empty,
	after_baja: empty,
	
	constructor: function(options) {
		this.data = {};
		lang.mixin(this, options);
	},
	
	clear: function() {
		this.data = {};
	},
	
	deferred_alta: null,
	alta: function() {
		var temp_desc = "";
		if (Object.keys(this.data).length > 0 ){
			temp_desc = "Guardando datos..."; 
		} else{
			temp_desc = "Cargando formulario de alta...";
		}
		
		this.deferred_alta = new $.Deferred();
		var temp_abm = this;
		
		var $after_success = function(){
			$obj = null;
			if (temp_abm.modal){
				$obj = $(".modal .frmABM");
			} else {
				$obj = $(temp_abm.container);
			}
			
			if ($obj.find(".error, .erroneo").length <= 0){
				if (temp_abm.modal){
					setTimeout(app.hide_modal,3000);
				}
			}
			delete(temp_abm.data.btnGuardar);
		}
		
		var $tmp = function(resp){
			app.desespere(temp_desc);
			if (temp_abm.modal){
				app.show_modal({
					html:resp.resultado,
					ok: [function(){
							temp_abm.save({
								success: $after_success
							});
						}
					]
				});
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500);
			}
			$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			temp_abm.after_alta($obj);
			temp_abm.deferred_alta.resolve();
		}
		
		this.data.verb = "crud";
		this.data.opcion = this.tabla;
		this.data.form_operacion = "alta";
		if (this.data.btnGuardar == undefined){
			this.data.boton_nuevo_item = "1";
		} 
		
		var tmpdata = this.data;
		var tmp2 = function(txt){
			app.espere(temp_desc, "listo.");
			app.api({data: tmpdata}).then($tmp);
		};
		
		if (this.modal){
			app.hide_modal().then(tmp2);
		} else {
			tmp2();
		}
		
		temp_abm.deferred_alta.then(temp_abm.setup_fields);
		return temp_abm.deferred_alta;
	},
	
	/**
	 * Método save.
	 * Se envían los datos ingresados al servidor para que se guarden.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 */
	save: function($data){
		$data = (typeof $data == "undefined") ? {} : $data;
		$selector = (this.modal === true) ? ".modal .frmABM" : this.container + " .frmABM";
		
		$data.success = (typeof $data.success == "undefined") ? function(){} : $data.success;
		$data.error = (typeof $data.error == "undefined") ? function(){} : $data.error;
		
		ret = new $.Deferred();
		valid = this.validate($selector);
		if (valid === true){
			$datos = $.unserialize($($selector).serialize());
			$datos.btnGuardar = "1";
			this.data = $datos;
			if (this.data.form_operacion == "alta"){
				ret = this.alta().then($data.success,$data.error);
			} else {
				ret = this.modificacion(this.data.ID).then($data.success,$data.error);
			}
		}
		app.modal_ok = valid;
		this.datos_ok = valid;
		return ret;
	},
	
	deferred_lista:null,
	/**
	 * Método lista
	 * Trae del servidor y muestra un listado de items.
	 * Este listado es en rigor un formulario, que permite ejecutar 
	 * acciones sobre los items listados (modificar, borrar, etc).
	 * 
	 * Si el ABM se estableció como modal, el formulario lo muestra en
	 * un div modal. Caso contrario, lo muestra en el contenedor que
	 * el ABM tenga establecido.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 */
	lista: function(){
		
		this.deferred_lista = new $.Deferred();
		var temp_abm = this;
		
		var $tmp = function(resp, status, xhr){
			app.desespere("Cargando listado...");
			if (temp_abm.modal){
				app.show_modal({
					html:resp.resultado
				});
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500);
			}
			$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			temp_abm.after_lista($obj);
			temp_abm.deferred_lista.resolve();
			
		}
		
		this.data.verb = "crud";
		this.data.opcion = this.tabla;
		this.data.form_operacion = "lista";
		
		var tmpdata = this.data;
		var tmp2 = function(){
			app.espere("Cargando listado...", "listo.");
			app.api({
				data: tmpdata,
				on_success : $tmp
			});
		}
		
		if (this.modal){
			app.hide_modal().then(tmp2);
		} else {
			tmp2();
		}
		
		this.deferred_lista.then(temp_abm.setup_fields);
		return this.deferred_lista;
	},
	
	deferred_modificacion:null,
	/**
	 * Método modificación
	 * Trae del servidor y muestra un formulario de modificación.
	 * Es importante tener en cuenta que el formulario puede tener dos 
	 * tiempos: uno vacío, y otro con mensajes de operación posterior a 
	 * un intento de grabado.
	 * 
	 * Si el ABM se estableció como modal, el formulario lo muestra en
	 * un div modal. Caso contrario, lo muestra en el contenedor que
	 * el ABM tenga establecido.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * @date 20130805
	 */
	modificacion: function(){
		if (Object.keys(this.data).length > 0 ){
			temp_desc = "Guardando datos..."; 
		} else{
			temp_desc = "Cargando formulario de modificación...";
		}
		
		
		this.deferred_modificacion = $.Deferred();
		var temp_abm = this;
		
		var $after_success = function(){
			$obj = null;
			if (temp_abm.modal){
				$obj = $(".modal .frmABM");
			} else {
				$obj = $(temp_abm.container);
			}
			
			if ($obj.find(".error, .erroneo").length <= 0){
				//console.debug(["modificacion - after success", $obj, $obj.find(".error, .erroneo")]);
				if (temp_abm.modal){
					setTimeout(app.hide_modal,3000);
				}
			}
			delete(temp_abm.data.btnGuardar);
		}
		
		var $tmp = function(resp, status, xhr){
			app.desespere(temp_desc);
			if (temp_abm.modal){
				app.show_modal({
					html:resp.resultado,
					ok: [function(){
							temp_abm.save({
								success: $after_success
							});
						}
					]
				});
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500);
			}
			$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			temp_abm.after_modificacion($obj);
			temp_abm.deferred_modificacion.resolve();
		}
		
		this.data.verb = "crud";
		this.data.opcion = this.tabla;
		this.data.form_operacion = "modificacion";
		
		var tmpdata = this.data;
		var tmp2 = function(){
			app.espere(temp_desc, "listo.");
			app.api({
				data: tmpdata,
				on_success : $tmp
			});
		};
		
		if (this.modal){
			app.hide_modal().then(tmp2);
		} else {
			tmp2();
		}
		
		this.deferred_modificacion.then(temp_abm.setup_fields);
		return this.deferred_modificacion;

	},
	
	/**
	 * Método validate
	 * Chequea los campos del formulario activo, para comprobar que todos
	 * contengan datos válidos.
	 * 
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * 
	 * @param {mixed} $obj 
	 * Parámetro opcional para determinar dónde debe buscar los campos.
	 * Puede no establecerse, puede ser un objeto de jQuery, o un string
	 * selector válido de jQuery.
	 * 
	 */
	validate: function($obj) {
		$obj = ($obj === undefined) ? $(document) : $obj;
		$obj = ($obj instanceof jQuery) ? $obj : $($obj);
		var $ret = true;
		
		if ($obj.attr("novalidate") !== undefined){
			console.log("\"novalidate\" detectado. Cancelo la validación.");
			return true;
		}
		
		//console.debug($ret);
		//Esto se encarga de los enum de tipo lista opcional (checkboxes y/o texto libre).
		$obj.find(".Field[enum]").each(
			function(indice, elemento){
				var id2 = $(elemento).attr("id");
				var lista = $("#list_"+id2);
				if (lista.length > 0){
					if ($("#"+id2+":invalid").length > 0){
						lista.addClass("invalid");
						$ret = false;
					} else {
						lista.removeClass("invalid");
					}
				}
			}
		);
		//console.debug($ret);
		//Luego, recurro a los métodos del browser para validar.
		if ($obj.find("form").length > 0){
			if ($obj.find("form.frmABM")[0].checkValidity && !$obj.find("form.frmABM")[0].checkValidity()){
				$obj.find("form.frmABM .Field").each(function(){
					if(!this.validity || !this.validity.valid){
						$(this).focus();
						$(this).select();
						return false;
					}
				});
				app.mostrar_error("Hay campos inválidos. Imposible continuar.\n\nChequee los datos y vuelva a intentar.");
				return false;
			}
		}
		//console.debug($ret);
		if ($obj[0].tagName == "FORM"){
			if ($obj[0].checkValidity && !$obj[0].checkValidity()){
				app.mostrar_error("Hay campos inválidos. Imposible continuar.\n\nChequee los datos y vuelva a intentar.");
				return false;
			}
		}
		//console.debug($ret);
		//Si llegué acá, o no había validación vía browser o dió luz verde.
		//De modo que chequeo por si acaso los fields comunes.
		
		//primero la validación de tipo de datos.
		$obj.find("input[pattern]").each(function ($i, $e){
			var $o = $($e);
			var $re = eval("new RegExp(/"+$o.attr("pattern")+"/)");
			var $test = $re.test($.trim($o.val())) || $.trim($o.val()) == "";
			if (!$test){
				$o.addClass("invalid");
				$ret = false;
			} else {
				$o.removeClass("invalid");
			}
		});
		//console.debug($ret);
		//y después la de campos requeridos.
		$obj.find("input[required]").each(function ($i, $e){
			var $o = $($e);
			if ($.trim($o.val()) == "" && ($o.attr("disabled") == undefined || $o.attr("disabled") == "") && ($o.attr("is_id") === undefined || $obj.find("[name='form_operacion']").val() != "alta")){
				$o.addClass("invalid");
				$ret = false;
			} else {
				$o.removeClass("invalid");
			}
		});
		//console.debug($ret);
		
		if (!$ret){
			app.mostrar_error("Faltan datos o hay datos incorrectos.\nRevise la información ingresada y vuelva a intentar.");
		}
		
		return $ret;
	},
	
	deferred_setup_fields:null,
	/**
	 * Método setup_fields
	 * Llamado privado de cada formulario a un método genérico que 
	 * aplica funcionalidades vinculadas a los Fields en formularios.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 * 
	 */
	setup_fields: function (){
		this.deferred_setup_fields = new $.Deferred();
		var tmp_abm = this;
		setTimeout(function(){
			app.ui.setup_fields((tmp_abm.modal) ? ".modal .frmABM" : tmp_abm.container);
			tmp_abm.deferred_setup_fields.resolve("setup_fields resuelto");
		},250);
		return this.deferred_setup_fields;
	}
	
});
