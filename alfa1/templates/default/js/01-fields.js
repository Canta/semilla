
app.ui.setup_fields = function($id_container) {
	
	$container = ($id_container === undefined) ? $(window) : $("#"+$id_container);
	
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
	
	set_valores_defecto_enum();
	
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

function set_valores_defecto_enum(){
	//establezco el valor por defecto de todo item enum
	$("[enum]").each(
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

function validafields() {
	return true;
}
