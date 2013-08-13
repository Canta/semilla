
app.ui.setup_fields = function($id_container) {
	
	$container = ($id_container === undefined) ? $(document) : $("#"+$id_container);
	
	
	//establezco los eventos de todo item enum
	$container.find("[enum]").each(
		function($indice, $elemento){
			$id = $elemento.id;
			
			$($elemento).keyup(function($e) {
				enum_keyup($e);
			});
			
			$("#desc_"+$id).change(function($e) {
				enumdesc_onchange($e);
			});
		}
	);
	
	$container.find("[enum_list]").each(
		function($indice, $elemento){
			var $id_value = $elemento.id.substring(5,$elemento.id.length);
			
			$($elemento).find("input").bind("change",function($e) {
				var obj  = $("#"+$id_value);
				var list = $("#list_"+$id_value);
				var inps = list.find("input");
				var str = "";
				obj.val("");
				for (var $i = 0; $i < inps.length; $i++){
					var obj2 = $(inps[$i]);
					if (obj2.attr("checked") || (obj2.attr("type") == "text" && $.trim(obj2.val()) != "")){
						obj.val(obj.val()+obj2.val()+obj.attr("separador"));
					}
				}
				obj.val(obj.val().substring(0,obj.val().length-1));
			});
		}
	);
	
	set_valores_defecto_enum($id_container);
	
	//establezco tabindexs a los campos de los formularios
	$container.find(':input:visible:enabled, :radio:visible:enabled, :checkbox:visible:enabled').each(function($i,$e){ $($e).attr('tabindex',$i+1);});
	
	
	//controlo que las teclas ENTER en los inputs funcionen como TAB
	$container.find('input[type="text"]').keydown(function(event) {
		if (event.keyCode == '13'  || (event.keyCode == '9')) {
			//cuando apreto ENTER, paso al campo siguiente
			event.preventDefault();
			
			if (typeof $(event.target).attr("enum") != "undefined"){
				enum_onchange(event.target);
			}
			$i = parseInt($(event.target).attr("tabindex"));
			$i++;
			while ($("[tabindex = '"+$i+"']").attr("enum_desc") != undefined){
				$i++;
			}
			$e = $("[tabindex = '"+$i+"']").focus();
		}
	});
	
	//Ahora, que en los inputs con el atributo "datetime" se pueda...
	//...ingresar DDMMYY(YY) y traduzca a YYYY-MM-DD.
	//20120810 - Daniel Cantarín: me pidieron que cambie YYYY-MM-DD a DD-MM-YYYY
	$container.find('input[datetime]').keydown(function(event) {
		if ((event.keyCode == '13') || (event.keyCode == '9')){
			//cuando apreto ENTER, o TAB, chequeo el valor y lo traduzco
			$o = $(event.target);
			//Sólo se detona la traducción si el campo mide 6 u 8 chars.
			if (($.trim($o.val()).length == 6) || ($.trim($o.val()).length == 8)){
				
				$dia = $.trim($o.val()).substring(0,2);
				$mes = $.trim($o.val()).substring(2,4);
				$ano = $.trim($o.val()).substring(4);
				
				//me fijo si son números
				if (!isNaN( parseInt($dia)) && !isNaN(parseInt($mes)) && !isNaN(parseInt($ano))){
					$ano = parseInt($ano);
					//acomodo el año a 4 cifras
					if ($ano.toString().length == 2){
						$date = new Date();
						$anio2 = $date.getFullYear().toString();
						$anio3 = parseInt($anio2.substring(2));
						$ano = ($anio3 >= $ano) ? 2000 + $ano : 1900 + $ano;
					}
					//chequeo que sea una fecha válida
					$date = new Date($mes+"/"+$dia+"/"+$ano);
					if ($date.toString() != "Invalid Date"){
						//if (parseInt($mes) < 10) {$mes = "0"+$mes;}
						//if (parseInt($dia) < 10) {$dia = "0"+$dia;}
						//$o.val($ano+"-"+$mes+"-"+$dia);
						$o.val($dia+"-"+$mes+"-"+$ano);
					}
				}
			}
			return true;
		}
	});
	
	//FIX: algunos input en Firefox tienen establecido el atributo value,
	//pero así y todo no se puede acceder a él. Lo arreglo con esto.
	$container.find("[old_value]").each(
		function(i,e){
			$(e).val($(e).attr("old_value"));
		}
	);
	
	//20130804 - Daniel Cantarín
	//Agregada la lógica para la gestión de trees.
	$trees = $(".tree");
	if ($trees.length > 0){
		$trees.collapsibleCheckboxTree();
		
		$trees.find("input[type='checkbox']").bind("change",function(evt){
			$checked = !($(this).attr("checked") == undefined);
			if ($checked){
				$(this).parent().find("ul input[type='checkbox']").attr("checked","checked");
			} else {
				$(this).parent().find("ul input[type='checkbox']").removeAttr("checked");
			}
		});
		
	}
	
	
	//20130805 - Daniel Cantarín
	//Agrego una pequeña lógica para gestión de listas multiselect.
	$(".multiselect tr").bind("click", function(evt){
		$checked = !($(this).find("input[type='checkbox']").attr("checked") == undefined);
		if ($checked){
			$(this).find("input[type='checkbox']").removeAttr("checked");
			$(this).removeAttr("selected");
		} else {
			$(this).find("input[type='checkbox']").attr("checked","checked");
			$(this).attr("selected","selected");
		}
	});
};


function enum_onchange($item){
	$id = $item.id;
	$valor = $($item).val();
	$test = $("#desc_"+$id+" option[value='"+$valor+"']");
	if ($test.length > 0){
		$("#desc_"+$id).val($valor);
	} else {
		$("#desc_"+$id+">option")[0].selected=true;
		$($item).val($("#desc_"+$id+">option")[0].value);
	}
	//return true;
}

function enum_keyup($e){
	
	$code	=	($e.keyCode ? $e.keyCode : $e.which);
	$item	=	($e.target ? $e.target : $e.srcElement);
	$item	=	$($item);
	
	$id 	=	$item.attr("id");
	//$re		=	new RegExp(/[0-9a-zA-Z\+\-]+/);
	//$valor	=	($re.test(String.fromCharCode($e.which))) ? String.fromCharCode($e.which) : $($item).val();
	$valor	= $item.val();
	
	$test	=	$("#desc_"+$id+" option[value='"+$valor+"']");
	$opts	=	$("#desc_"+$id+">option");
	
	$indice = 0;
	if ($test.length > 0){
		for ($i = 0; $i < $opts.length; $i++){
			if ($valor.toLowerCase() == $opts[$i].value.toLowerCase()){
				$indice = $i;
				break;
			}
		}
	} else {
		$indice = -1;
	}
	
	if ($code == 38){
		//flecha arriba
		$indice = ($indice <= 0) ? 0 : ($indice - 1);
	} else if ($code == 40){
		//flecha abajo
		$indice = ($indice == ($opts.length -1)) ? ($opts.length - 1) : ($indice + 1);
	}
	
	if ($indice != -1) {
		$item.val($opts[$indice].value);
		$opts[$indice].selected=true;
	}
	
}

function enumdesc_onchange($e){
	$item	=	($e.target ? $e.target : $e.srcElement);
	$item	=	$($item);
	$id 	=	$item.attr("id");
	$id 	=	$id.replace("desc_","");
	$("#"+$id).val($item.find("option:selected").val()).focus();
	try {
		eval($("#"+$id).attr("onchange"));
	} catch($e){
		
	}
}

function set_valores_defecto_enum($id_container){
	//establezco el valor por defecto de todo item enum
	
	$container = ($id_container === undefined) ? $(document) : $("#"+$id_container);
	
	$container.find("[enum]").each(
		function($indice, $elemento){
			$id 	=	$elemento.id;
			$valor	=	$($elemento).val();
			$test	=	$("#desc_"+$id+" option[value='"+$valor+"']");
			$opts	=	$("#desc_"+$id+">option");
			if ($test.length == 0){
				$val = ($opts[0] == undefined) ? "" : $opts[0].value;
				$($elemento).val($val);
			} else {
				for ($i = 0; $i < $opts.length; $i++){
					$opts[$i].selected = false;
				}
				$test[0].selected = true;
			}
		}
	);
}

function validafields($obj) {
	
	$obj = ($obj === undefined) ? $(document) : $obj;
	$obj = ($obj instanceof jQuery) ? $obj : $($obj);
	var $ret = true;
	
	if ($obj.attr("novalidate") !== undefined){
		console.debug("cancelo la validación");
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
			return false;
		}
	}
	//console.debug($ret);
	if ($obj[0].tagName == "FORM"){
		if ($obj[0].checkValidity && !$obj[0].checkValidity()){
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
}



/* Métodos para la clase Lista */

function accion_ver($obj){
	$obj = $($obj);
	$id = $obj.attr("item_id");
	
	$("#campo_id_"+$id).attr("checked","checked");
	$("input[name='form_operacion']").val("ver");
	
	var clase = $obj.parents("form").attr("id").replace("frm");
	try{
		eval(clase+".ver("+$id+");");
	} catch(e){
		a = new ABM(clase);
		a.ver();
	}
}

function accion_modificar($obj){
	$obj = $($obj);
	$id = $obj.attr("item_id");
	
	$("#campo_id_"+$id).attr("checked","checked");
	$("input[name='form_operacion']").val("modificacion");
	
	var clase = $obj.parents("form").attr("id").replace("frm","");
	
	try{
		eval(clase+".modificacion("+$id+");");
	} catch(e){
		a = new ABM(clase);
		a.modificacion();
	}
}

function accion_baja($obj){
	if (confirm("¿Está seguro que desea eliminar el registro?\n\nTenga en cuenta que esta acción no puede desacerse.")){
		$obj = $($obj);
		$id = $obj.attr("item_id");
		
		$("#campo_id_"+$id).attr("checked","checked");
		$("input[name='form_operacion']").val("baja");
	}
}

function accion_eliminar($obj){
	accion_baja($obj);
}

function accion_alta(){
	$("input[name='form_operacion']").val("alta");
	$("form.frmABM").attr("novalidate","novalidate").find("input").attr("novalidate","novalidate");
	//$("form.frmABM")[0].submit();
}

function accion_lista(){
	$("input[name='form_operacion']").val("lista");
	$("form.frmABM").attr("novalidate","novalidate").find("input").attr("novalidate","novalidate");
	//$("form.frmABM")[0].submit();
}

function accion_desactivar($obj){
	$obj = $($obj);
	$id = $obj.attr("item_id");
	
	$("#campo_id_"+$id).attr("checked","checked");
	$("input[name='form_operacion']").val("baja");
}

function accion_activar($obj){
	$obj = $($obj);
	$id = $obj.attr("item_id");
	
	$("#campo_id_"+$id).attr("checked","checked");
	$("input[name='form_operacion']").val("alta");
}


function accion_update_fields($arr, $url){
	
	if ($arr === undefined){
		$arr = Array();
	}
	
	if ($url === undefined){
		$url = ".";
	}
	
	$data = $("form[class='frmABM']:visible").serialize();
	for (var $i = 0; $i < $arr.length; $i++){
		$data += "&update_fields[]="+$arr[$i];
	}
	$data += "&metodo_serializacion=json";
	
	$tmp = function($ret, $status, $obj){
		for (var $i = 0; $i < $ret.length; $i++){
			$item = $ret[$i];
			$("#"+$item.data.id).val($item.data.valor);
			$desc = $("#desc_"+$item.data.id);
			
			if ($desc.length > 0){
				$tmp_html = "";
				for (var $i2 = 0; $i2 < $item.data.items.length; $i2++){
					$tmp_html += "<option value=\""+$item.data.items[$i2][$item.data.campo_indice]+"\">"+$item.data.items[$i2][$item.data.campo_descriptivo]+"</option>\n";
				}
				$desc.html($tmp_html);
				set_valores_defecto_enum();
			}
		}
		app.desespere("Actualizando campos.");
	}
	
	app.espere("Actualizando campos.","listo");
	$.ajax({
		data: $data,
		success: $tmp,
		url: $url,
		async: true,
		cache: false,
		dataType: "json"
	});
}


function accion_siguiente(){
	$pagina_actual = parseInt($("input[name='pagina_actual']").val()) + 1;
	$("input[name='pagina_actual']").val($pagina_actual);
}

function accion_anterior(){
	$pagina_actual = parseInt($("input[name='pagina_actual']").val()) - 1;
	$("input[name='pagina_actual']").val($pagina_actual);
}

function accion_ir_a_pagina($pag){
	$("input[name='pagina_actual']").val($pag);
	$("[class='frmABM']").submit();
}

function accion_cancelar(){
	location.href="./";
}
