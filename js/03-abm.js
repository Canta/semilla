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
	autoclose: true,
	
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
		delete(this.modal_previous_search);
	},
	
	create_deferred : function(abm){
		ret = new $.Deferred();
		ret.abm = abm;
		return ret;
	},
	
	deferred_alta: null,
	alta: function() {
		var temp_desc = "";
		if (Object.keys(this.data).length > 0 ){
			temp_desc = "Guardando datos..."; 
		} else{
			temp_desc = "Cargando formulario de alta...";
		}
		
		this.deferred_alta = this.create_deferred(this);
		var temp_abm = this;
		
		var $after_success = function(){
			var $obj = null;
			if (temp_abm.modal){
				$obj = $(".modal .frmABM");
			} else {
				$obj = $(temp_abm.container);
			}
			
			if ($obj.find(".error, .erroneo").length <= 0){
				if (temp_abm.modal){
					$("#modal_button_cancelar, #modal_button_aceptar").remove();
					if (temp_abm.autoclose === true){
						setTimeout(app.hide_modal,3000);
					}
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
				}).then(
					function(){temp_abm.deferred_alta.resolve("alta lista");}
				);
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500).promise().then(
					function(){temp_abm.deferred_alta.resolve("alta lista");}
				);
			}
			$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			temp_abm.after_alta($obj);
			
		}
		
		this.data.verb = "crud";
		this.data.opcion = this.tabla;
		
		if(!this.data.form_operacion)
			this.data.form_operacion = "alta";
		
		//console.log("ABM - alta - form_operacion: "+this.data.form_operacion);
		
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
		
		app.ui.current_abm = temp_abm;
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
		
		ret = this.create_deferred(this);
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
		
		this.deferred_lista = this.create_deferred(this);
		var temp_abm = this;
		
		var $tmp = function(resp, status, xhr){
			app.desespere("Cargando listado...");
			if (temp_abm.modal){
				app.show_modal({
					html:resp.resultado
				}).then(
					function(){temp_abm.deferred_lista.resolve("lista renderizada");}
				);
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500).promise().then(
					function(){temp_abm.deferred_lista.resolve("lista renderizada");}
				);
			}
			$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			temp_abm.after_lista($obj);
			
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
		
		app.ui.current_abm = temp_abm;
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
		
		
		this.deferred_modificacion = this.create_deferred(this);
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
					$("#modal_button_cancelar, #modal_button_aceptar").remove();
					if (temp_abm.autoclose === true){
						setTimeout(app.hide_modal,3000);
					}
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
				}).then(
					function(){temp_abm.deferred_modificacion.resolve("modificacion lista");}
				);
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500).promise().then(
					function(){temp_abm.deferred_modificacion.resolve("modificacion lista");}
				);
			}
			$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			temp_abm.after_modificacion($obj);
			
		}
		
		this.data.verb = "crud";
		this.data.opcion = this.tabla;
		
		if(!this.data.form_operacion)
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
		
		app.ui.current_abm = temp_abm;
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
	setup_fields: function (obj){
		var d = new $.Deferred();
		if (this instanceof app.ABM){
			this.deferred_setup_fields = d;
		} else {
			if (this.abm) {
				this.abm.deferred_setup_fields = d;
			} else {
				obj.deferred_setup_fields = d;
			}
		}
		var tmp_abm = (this instanceof app.ABM) ? this : this.abm;
		tmp_abm = (tmp_abm === undefined) ? obj : tmp_abm;
		setTimeout(function(){
			app.ui.setup_fields((tmp_abm.modal) ? ".modal .frmABM" : tmp_abm.container);
			tmp_abm.deferred_setup_fields.resolve("setup_fields resuelto");
		},250);
		return d;
	},
	
	/**
	 * Método search
	 * 
	 * Busca información en las tablas que trabaja el ABM, devolviendo
	 * una lista con resultados.
	 * 
	 * @author Daniel Cantarín <omega_canta@yahoo.com>
	 **/
	search: function(parms){
		if (!(parms instanceof Array)){
			throw "ABM.search: se esperaba un Array de condiciones";
		}
		
		var temp_desc = "Buscando datos...";
		
		var d = this.create_deferred(this);
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
		
		
		var tmp = function(resp, status, xhr){
			app.desespere(temp_desc);
			if (temp_abm.modal){
				app.show_modal({
					html: resp.resultado
				});
			} else {
				$(temp_abm.container).html(resp.resultado).fadeIn(500);
			}
			//$obj = (temp_abm.modal) ? $(".modal .frmABM") : $(temp_abm.container) ;
			//temp_abm.after_modificacion($obj);
			temp_abm.modal = (temp_abm.modal_previous_search !== undefined) ? temp_abm.modal_previous_search : temp_abm.modal;
			d.resolve();
		}
		
		this.data.verb = "crud";
		this.data.opcion = this.tabla;
		
		if(!this.data.form_operacion){
			this.data.form_operacion = "lista";
		}
		
		
		this.data.conditions = [];
		for(var i in parms){
			if (parms[i] instanceof app.Condicion){
				this.data.conditions.push(parms[i].toJson());
			} else {
				if (typeof parms[i] == "string"){
					if (parseInt(i) === NaN){
						this.data[i] = parms[i];
					} else {
						this.data[parms[i]] = parms[i];
					}
				} else {
					this.data[i] = parms[i];
				}
			}
		}
		
		var tmpdata = this.data;
		var tmp2 = function(){
			app.espere(temp_desc, "listo.");
			app.api({data: tmpdata}).then(tmp);
		};
		
		if (this.modal){
			app.hide_modal().then(tmp2);
		} else {
			tmp2();
		}
		
		d.then(temp_abm.setup_fields).then(app.ui.setup_solapas);
		return d;

	},
	
	show_search_form : function (){
		var temp_abm = this;
		this.clear();
		this.modal_previous_search = this.modal;
		this.modal = true;
		this.search(['render_search_form']).then(
			function(){
				setTimeout(
					function(){$("#modal_button_aceptar").off("click").on("click",
						function(obj){
							var data = temp_abm.parse_search_data();
							if (data === null){
								app.mostrar_error("Hay datos incorrectos en el formulario de búsqueda.\nRevise los datos y vuelva a intentar.");
							} else {
								temp_abm.clear();
								temp_abm.search(data);
								app.hide_modal();
							}
						}).attr("onclick","");
					},
				500);
			}
		);
	},
	
	parse_search_data: function(){
		var ret = null;
		//primero obtengo la solapa activa
		var obj = $(".solapa_contenido:visible");
		if (obj.length == 1){
			//Luego, si es simple o si es avanzada, la operación es diferente.
			var fields = obj.parent().find(".select_fields > option");
			var dummy = new app.Condicion();
			if (obj.attr("nombre") == "simple"){
				//Acá obtengo el string del texto libre, y genero una búsqueda.
				ret = [];
				var valor = $("[name='field_busqueda_simple']:visible").val();
				for(var i=0; i < fields.length; i++){
					var c = new app.Condicion(dummy.TIPO_LIKE, dummy.ENTRE_CAMPO_Y_VALOR);
					c.comparando(fields[i].value);
					c.comparador(valor);
					ret.push(c);
				}
				ret["search_strict"] = false;
			} else if (obj.attr("nombre") == "avanzada"){
				var condiciones = $(".criterio:visible");
				if (condiciones.length > 0){
					ret = [];
					for(var i=0; i < condiciones.length; i++){
						var tipo = $(condiciones[i]).find(".criterio_tipo").val();
						var entre = $(condiciones[i]).find(".criterio_entre").val();
						var campo = $(condiciones[i]).find("[name=campos]").val();
						var valor = (entre == "2") ? $(condiciones[i]).find("[name=campos2]").val() : $(condiciones[i]).find(".criterio_valor").val();
						var c = new app.Condicion(tipo, entre);
						c.comparando(campo);
						c.comparador(valor);
						ret.push(c);
					}
					ret["search_strict"] = $(".select_strict:visible").val() === "true";
				}
			}
		}
		return ret;
	}
	
});

//Implementación en JS de la clase Condición para las búsquedas.
app.Condicion = lang.declare(null,{
	//Constantes para los tipos de comparaciones
	TIPO_IGUAL 			: 0,
	TIPO_MAYOR_IGUAL 	: 1,
	TIPO_MENOR_IGUAL 	: 2,
	TIPO_LIKE 			: 3,
	TIPO_IN 			: 4,
	TIPO_NOT_IN 		: 5,
	TIPO_DISTINTO		: 6,
	//Constantes para las variables involucradas
	ENTRE_VALORES 			: 0,
	ENTRE_CAMPO_Y_VALOR 	: 1,
	ENTRE_CAMPO_Y_CAMPO 	: 2,
	ENTRE_CAMPO_Y_DEFAULT	: 3,
	
	//Constructor.
	//Por defecto, asume una condición entre un campo y un valor.
	constructor: function(tipo, entre){
		tipo = (tipo === undefined) ? 0 : tipo;
		entre = (entre === undefined) ? 0 : entre;
		this.datos = [];
		this.datos["comparando"] = null;
		this.datos["comparador"] = null;
		this.datos["tipo"] = tipo;
		this.datos["entre"] = entre;
		return this;
	},
	
	comparador: function (val){
		if (val !== undefined){
			this.datos["comparador"] = val;
		}
		return this.datos["comparador"];
	},
	
	comparando: function(val){
		if (val !== undefined){
			this.datos["comparando"] = val;
		}
		return this.datos["comparando"];
	},
	
	tipo: function(val){
		if (val !== undefined){
			this.datos["tipo"] = val;
		}
		return this.datos["tipo"];
	},
	
	entre: function(val){
		if (val !== undefined){
			this.datos["entre"] = val;
		}
		return this.datos["entre"];
	},
	
	toJson: function(){
		var ret = {};
		for (var i in this.datos){
			ret[i] = this.datos[i];
		}
		return ret;
	}
	
});
