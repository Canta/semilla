<?php
require_once("util/conexion.class.php");
require_once("fields.class.php");
require_once("buttons.class.php");
require_once("extra.class.php");


/**
 * ORM Class.
 * It's the core of the ORM abstraction layer. 
 * It handles any database table and automatically instantiates fields 
 * according to the table's setup. 
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20110808
 */ 
class ORM {
	
	const ERROR_SAVE = 1;
	const ERROR_VALIDACION = 2;
	const ERROR_PERMISO = 3;
	
	public $datos; //Array con datos arbitrarios, desde Fields hasta configuraciones.
	
	public function __construct($tabla = ""){
		//inicializo los datos
		
		$this->datos = Array();
		$this->datos["tabla"] = $tabla;
		$this->datos["campos"] = Array();
		$this->datos["fields"] = Array();
		$this->datos["last_search"] = new Lista();
		$this->datos["campo_id"] = "id";
		$this->datos["cache"] = true;
		
		if ($tabla != "" && !is_null($tabla)){
			$this->check_tabla_existe();
			$this->load_campos();
		}
		
		
	}
	
	public function get_tabla(){
		$this->datos["tabla"] = isset($this->datos["tabla"]) ? $this->datos["tabla"] : "";
		return $this->datos["tabla"];
	}
	
	public function cache($val = null){
		if (is_null($val)){
			return $this->datos["cache"];
		} else {
			$this->datos["cache"] = (bool)$val;
		}
	}
	
	private function check_tabla_existe(){
		try{
			$c = Conexion::get_instance();
			$qs = "select * from ".$this->get_tabla()." limit 1;";
			$r  = $c->execute($qs, $this->cache());
		} catch(Exception $e){
			throw new Exception("Error al intentar leer la tabla \"".$this->get_tabla()."\". Revise que la tabla efectivamente exista y los datos de la conexión sean correctos.");
		}
	}
	
	public function set_tabla($tabla = ""){
		$this->datos["tabla"] = $tabla;
		$this->check_tabla_existe();
	}
	
	//Método load_campos()
	//Dada una tabla, trae todos los nombres de sus campos, con detalles de características.
	public function load_campos(){
		$c = Conexion::get_instance();
		
		$qs = "select * from INFORMATION_SCHEMA.COLUMNS where table_name = '".$this->get_tabla()."' and (table_schema='".$c->get_database_name()."' or table_catalog='".$c->get_database_name()."')";
		$r  = $c->execute($qs);
		$r  = (is_null($r)) ? Array() : $r;
		
		$this->datos["campos"] = $r;
		
		//AGREGADO:
		//Carga también las keys de la tabla.
		//Útil para relaciones y detección de campos ID.
		$qs = "select * from INFORMATION_SCHEMA.table_constraints A inner join INFORMATION_SCHEMA.key_column_usage B on A.constraint_name = B.constraint_name where A.table_name = '".$this->get_tabla()."' and B.table_name='".$this->get_tabla()."' and ( (A.constraint_schema='".$c->get_database_name()."' or A.constraint_catalog='".$c->get_database_name()."') and (B.constraint_schema='".$c->get_database_name()."' or B.constraint_catalog='".$c->get_database_name()."'))";
		$r  = $c->execute($qs);
		$r  = (is_null($r)) ? Array() : $r;
		
		$this->datos["constraints"] = $r;
		$this->set_fields($this->get_empty_fields());
		
		//AGREGADO:
		//Detecta el campo ID, y se queda con el nombre del campo para usos futuros.
		$pkey = null;
		$tmp = $this->datos["constraints"];
		for ($i=0; $i < count($tmp) ; $i++){
			if (strpos(strtolower($tmp[$i]["CONSTRAINT_TYPE"]),"primary") !== false){
				$pkey = $tmp[$i];
				break;
			}
		}
		
		if (!is_null($pkey)){
			$nombre = isset($pkey["COLUMN_NAME"]) ? $pkey["COLUMN_NAME"] : $pkey["column_name"];
			$this->datos["campo_id"] = $nombre;
		}
		
	}
	
	//Método get_campo_fk_values()
	//Dado un nombre de un campo, revisa la lista de constraints para
	//ver si tiene una restricción FOREIGN KEY.
	//Si la tiene, trae de la base de datos los items posibles para esa restricción.
	//Caso contrario, devuelve un array vacío.
	public function get_campo_fk_values($campo){
		$ret = Array();
		
		foreach ($this->datos["constraints"] as $c){
			if (
				isset($c["CONSTRAINT_TYPE"]) && isset($c["TABLE_NAME"]) && isset($c["COLUMN_NAME"])
				&& $c["CONSTRAINT_TYPE"] == "FOREIGN KEY" 
				&& $c["TABLE_NAME"] == $this->get_tabla() 
				&& strtoupper($c["COLUMN_NAME"]) == strtoupper($campo)
				){
				
				$referencia_tabla = $c["REFERENCED_TABLE_NAME"];
				$referencia_campo = $c["REFERENCED_COLUMN_NAME"];
				
				$c  = Conexion::get_instance();
				$qs = "select * from ".$referencia_tabla." order by ".$referencia_campo." asc;";
				$r  = $c->execute($qs, $this->cache());
				
				$ret = $r;
				break;
			}
		}
		
		return $ret;
	}
	
	//Método get_campos()
	//Devuelve los campos de la tabla, si es que fueron cargados.
	//En caso de que se establezca el flag $simple, por defecto desactivado, se devuelve un array de strings con los nombres de los campos.
	//Caso contrario, se devuelve toda la información de los campos.
	public function get_campos($simple = false){
		$ret = Array();
		if (!$simple){
			$ret = $this->datos["campos"];
		} else {
			$tmp = $this->datos["campos"];
			for ($i = 0; $i < count($tmp); $i++){
				$ret[] = isset($tmp[$i]["column_name"]) ? $tmp[$i]["column_name"] : $tmp[$i]["COLUMN_NAME"];
			}
		}
		
		return $ret;
	}
	
	public function get($campo){
		$campo = strtoupper($campo);
		$ret = (isset($this->datos["fields"][$campo])) ? $this->datos["fields"][$campo]->get_valor() : "";
		return $ret;
	}
	
	public function set($campo, $valor){
		$campo = strtoupper($campo);
		if (isset($this->datos["fields"][$campo])) { 
			$this->datos["fields"][$campo]->set_valor($valor);
		} else {
			throw new Exception("<b class=\"exception_text\">>Clase ORM, método set(): no se encuentra el campo '".$campo."'.</b>");
		}
	}
	
	//Método load().
	//Dada una tabla, carga un registro desde la base de datos en el ABM.
	public function load($condiciones = null){
		//Data se espera que sea un array de objetos Condicion.
		if (!is_array($condiciones)){
			throw new Exception("Clase ORM, método load(): se esperaba un array.");
		}
		
		$w = " (1 = 1) ";
		for ($i = 0; $i < count($condiciones); $i++){
			$w .= " AND ". $condiciones[$i]->toString();
		}
		
		$c  = Conexion::get_instance();
		$qs = "select * from ".$this->get_tabla()." where ".$w." limit 1;";
		$r  = $c->execute($qs, $this->cache());
		
		if (is_null($r) || count($r) == 0){
			$r = $this->get_empty_fields();
		} else {
			$r = $this->parse_fields($r);
		}
		
		if (isset($r[0])) { $r = $r[0]; }
		$this->set_fields($r);
		
	}
	
	public function get_fields(){
		$this->datos["fields"] = (isset($this->datos["fields"])) ? $this->datos["fields"] : Array();
		return $this->datos["fields"];
	}
	
	public function set_fields($r){
		
		//En MySQL tengo mysql_field_flags() para saber si, por ejemplo, es primary key.
		//Pero en PostgreSQL no tengo nada parecido: necesito consultarlo manualmente.
		//De modo que, como ya cargué las constraints en la clase ABM, tomo esa data de ahí.
		
		foreach ($this->datos["constraints"] as $c){
			if (strpos(strtolower($c["CONSTRAINT_TYPE"]),'primary') !== false){
				$tmp = (array_key_exists(strtolower($c["COLUMN_NAME"]),$r)) ? strtolower($c["COLUMN_NAME"]) : strtoupper($c["COLUMN_NAME"]);
				if (isset($r[$tmp]) && $r[$tmp] instanceof Field) {
					$r[$tmp]->set_primary_key(true);
				}
			}
		}
		
		//Establece, desde los datos de los campos, si algún field es nullable o no.
		foreach ($this->datos["campos"] as $c){
			$tmp = (array_key_exists(strtolower($c["COLUMN_NAME"]),$r)) ? strtolower($c["COLUMN_NAME"]) : strtoupper($c["COLUMN_NAME"]);
			if (strpos(strtolower($c["IS_NULLABLE"]),'yes') !== false){
				if (isset($r[$tmp]) && $r[$tmp] instanceof Field) {
					$r[$tmp]->set_requerido(false);
				}
			} else {
				if (isset($r[$tmp]) && $r[$tmp] instanceof Field) {
					$r[$tmp]->set_requerido(true);
				}
			}
			
		}
		
		$this->datos["fields"] = $r;
		
	}
	
	
	private function get_empty_fields(){
		//Devuelve un array de objetos Field vacíos, para usar en formularios de item nuevo.
		$ret = Array();
		if (!is_array($this->datos["campos"]) || count($this->datos["campos"]) == 0){
			//Los campos no están cargados
			//Primero los cargo.
			//$this->load_campos();
			
		} else {
			//los campos ya están cargados.
			//Genero entonces los Fields a partir de la información cargada.
			foreach ($this->datos["campos"] as $campo){
				/*
				echo("<br/>");
				echo(var_dump($campo));
				echo("<br/>");
				*/
				$nombre = (isset($campo["COLUMN_NAME"])) ? strtoupper($campo["COLUMN_NAME"]) : strtoupper($campo["column_name"]);
				
				$largo = (isset($campo["CHARACTER_MAXIMUM_LENGTH"]) && (int)$campo["CHARACTER_MAXIMUM_LENGTH"] > 0) ? (int)$campo["CHARACTER_MAXIMUM_LENGTH"] : 0;
				$largo = ($largo <= 0 && isset($campo["character_maximum_length"]) ) ? (int)$campo["character_maximum_length"] : $largo;
				if ($largo == 0 || $largo == '' || is_null($largo)){
					//Chequeo si no existe también NUMERIC_PRECISION
					$largo = (isset($campo["NUMERIC_PRECISION"]) && (int)$campo["NUMERIC_PRECISION"] > 0) ? (int)$campo["NUMERIC_PRECISION"] : 0;
				}
				
				$comentario = (isset($campo["COLUMN_COMMENT"])) ? $campo["COLUMN_COMMENT"] : $campo["column_comment"];
				$default = (isset($campo["COLUMN_DEFAULT"])) ? $campo["COLUMN_DEFAULT"] : null;
				
				$nullable = (isset($campo["IS_NULLABLE"])) ? $campo["IS_NULLABLE"] : $campo["is_nullable"];
				
				$tipoSQL = (isset($campo["data_type"])) ? $campo["data_type"] : $campo["DATA_TYPE"];;
				$tipoHTML = Field::sqltype2htmltype($tipoSQL);
				$fk_vals = $this->get_campo_fk_values($nombre);
				
				if (strpos(strtolower($tipoSQL),"timestamp") !== false){
					$ret[$nombre] = new TimestampField();
					$default = 'now()';
				}else if (strpos(strtolower($tipoSQL),"bit") !== false){
					$ret[$nombre] = new BitField();
				} else if (count($fk_vals) > 0) {
					$ret[$nombre] = new SelectField($nombre, $comentario, "", $fk_vals);
					$tipoHTML = "select";
				} else {
					$ret[$nombre] = new Field();
				}
				
				//$ret[$nombre]->set_id($tipoHTML.$nombre); //por ejemplo: textLEGAJO, checkboxACTIVO, etc.
				$ret[$nombre]->set_id($nombre); 
				//$ret[$nombre]->set_valor($this->datos[$i][$tmp[$x]]);
				$ret[$nombre]->set_tipo_HTML($tipoHTML);
				$ret[$nombre]->set_tipo_sql($tipoSQL);
				$ret[$nombre]->set_largo( $largo );
				$ret[$nombre]->set_rotulo( $comentario );
				$ret[$nombre]->set_requerido( (trim($nullable) === "NO") );
				$ret[$nombre]->set_valorDefault( $default );
				
				//$ret[$name]->set_requerido( pg_field_is_null($this->consulta, $x) );
				//$ret[$name]->set_primary_key( (strpos($flags, "primary_key") > -1) );
				//$ret[$name]->set_activado( !((boolean)strpos($flags, "auto_increment")) );
				/*
				if ($ret[$nombre] instanceof SelectField){
					die(var_dump($ret[$nombre]->get_requerido()));
				}
				*/
			}
			return $ret;
		}
	}
	
	//Método setup_fields()
	//Dados los fields de una tabla, carga propiedades correspondientes a cada uno.
	//Se pretende que este método sea sobrecargado por cada clase que implemente ABM.
	protected function setup_fields(){
		foreach ($this->datos["campos"] as $campo){
			$nombre = (isset($campo["COLUMN_NAME"])) ? strtoupper($campo["COLUMN_NAME"]) : strtoupper($campo["column_name"]);
			
			$largo = (isset($campo["CHARACTER_MAXIMUM_LENGTH"]) && (int)$campo["CHARACTER_MAXIMUM_LENGTH"] > 0) ? (int)$campo["CHARACTER_MAXIMUM_LENGTH"] : 0;
			$largo = ($largo <= 0 && isset($campo["character_maximum_length"])) ? (int)$campo["character_maximum_length"] : $largo;
			
			$tipoSQL = (isset($campo["data_type"])) ? $campo["data_type"] : $campo["DATA_TYPE"];;
			
			$comentario = (isset($campo["COLUMN_COMMENT"])) ? $campo["COLUMN_COMMENT"] : $campo["column_comment"];
			
			if (isset($this->datos["fields"][$nombre])){
				$this->datos["fields"][$nombre]->set_tipo_sql($tipoSQL);
				$this->datos["fields"][$nombre]->set_largo( $largo );
				$this->datos["fields"][$nombre]->set_rotulo( $comentario );
			}
		}
	}
	
	public function get_campo_id(){
		return $this->datos["campo_id"];
	}
	
	public function get_metodo_serializacion(){
		return $this->datos["metodo_serializacion"];
	}
	
	public function set_metodo_serializacion($val){
		$this->datos["metodo_serializacion"] = $val;
	}
	
	
	public function set_campo_id($str){
		$this->datos["campo_id"] = $str;
	}
	
	//20120815 - Daniel Cantarín
	//parse_fields($r) es un reemplazo para Query->get_fields().
	//La creo en el proceso de migración hacia ABMs 100% en objetos y multiRDBS.
	protected function parse_fields($r){
		$ret = Array();
		foreach ($r as $item){
			$ret[] = Array();
			$i = count($ret) -1;
			foreach ($this->datos["campos"] as $campo){
				//Postgre altera el case de los nombres de los campos, de modo que tengo que chequearlo.
				$nombre = (isset($campo["COLUMN_NAME"])) ? strtoupper($campo["COLUMN_NAME"]) : strtoupper($campo["column_name"]);
				$nombre2 = (isset($campo["COLUMN_NAME"])) ? $campo["COLUMN_NAME"] : $campo["column_name"];
				//echo("Campo:".$nombre."<br/>");
				$largo = (isset($campo["CHARACTER_MAXIMUM_LENGTH"]) && (int)$campo["CHARACTER_MAXIMUM_LENGTH"] > 0) ? (int)$campo["CHARACTER_MAXIMUM_LENGTH"] : 0;
				$largo = ($largo <= 0 && isset($campo["character_maximum_length"])) ? (int)$campo["character_maximum_length"] : $largo;
				if ($largo == 0 || $largo == '' || is_null($largo)){
					//Chequeo si no existe también NUMERIC_PRECISION
					$largo = (isset($campo["NUMERIC_PRECISION"]) && (int)$campo["NUMERIC_PRECISION"] > 0) ? (int)$campo["NUMERIC_PRECISION"] : 0;
				}
				
				$comentario = (isset($campo["COLUMN_COMMENT"])) ? $campo["COLUMN_COMMENT"] : $campo["column_comment"];
				
				$tipoSQL = (isset($campo["data_type"])) ? $campo["data_type"] : $campo["DATA_TYPE"];
				$tipoHTML = Field::sqltype2htmltype($tipoSQL);
				
				$nullable = (isset($campo["IS_NULLABLE"])) ? $campo["IS_NULLABLE"] : $campo["is_nullable"];
				
				$default = (isset($campo["COLUMN_DEFAULT"])) ? $campo["COLUMN_DEFAULT"] : "";
				$default = (is_null($default)) ? "null" : $default;
				
				$cc = $this->datos["constraints"];
				$pkey = false;
				foreach ($cc as $constraint){
					$cctype = (isset($constraint["CONSTRAINT_TYPE"])) ? $constraint["CONSTRAINT_TYPE"] : $constraint["constraint_type"];
					$ccfield = (isset($constraint["COLUMN_NAME"])) ? $constraint["COLUMN_NAME"] : $constraint["column_name"];
					if (($ccfield == $nombre || $ccfield == $nombre2) && strtoupper($cctype) == "PRIMARY KEY"){
						$pkey = true;
						break;
					}
				}
				
				$valor = isset($item[$nombre2]) ? $item[$nombre2] : null;
				if (is_null($valor)){
					$valor = isset($item[$nombre]) ? $item[$nombre] : null;
					$valor = is_null($valor) ? $item[strtolower($nombre2)] : $valor;
				}
				
				//echo($nombre.":".$tipoSQL."<br/>");
				$fk_vals = $this->get_campo_fk_values($nombre);
				if (strpos(strtolower($tipoSQL),"timestamp") !== false) {
					$ret[$i][$nombre] = new TimestampField();
				} else if (strtolower($tipoSQL) == "bit") {
					$ret[$i][$nombre] = new BitField();
				} else if (count($fk_vals) > 0){
					$ret[$i][$nombre] = new SelectField($nombre, $comentario, $valor, $fk_vals);
					$tipoHTML = "select";
				} else {
					$ret[$i][$nombre] = new Field();
				}
				//$ret[$i][$nombre]->set_id($tipoHTML.$nombre); //por ejemplo: textLEGAJO, checkboxACTIVO, etc.
				
				$ret[$i][$nombre]->set_id($nombre);
				$ret[$i][$nombre]->set_largo($largo);
				$ret[$i][$nombre]->set_tipo_HTML($tipoHTML);
				$ret[$i][$nombre]->set_tipo_sql($tipoSQL);
				$ret[$i][$nombre]->set_rotulo($comentario);
				$ret[$i][$nombre]->set_requerido( (trim($nullable) === "NO") );
				$ret[$i][$nombre]->set_valor($valor);
				
				//echo(var_dump($pkey)); echo("<br>");
				$ret[$i][$nombre]->set_primary_key( $pkey );
				//$ret[$i][$nombre]->set_activado( !((boolean)strpos($flags, "auto_increment")) );
				if (!$pkey){
					$ret[$i][$nombre]->set_valorDefault( $default );
					//echo("default: "); echo(var_dump($default)); echo("<br/>");
				}
				
			}
		}
		
		return $ret;
	}
	
}

class ABM extends ORM{
	
	public function __construct($tabla){
		parent::__construct($tabla);
		
		$this->datos["formbuttons"] = Array();
		$this->datos["mensajes"] = Array();
		$this->datos["form_columnas"] = 2;
		$this->datos["form_extra_code_arriba"] = Array();
		$this->datos["form_extra_code_abajo"] = Array();
		$this->datos["form_titulo"] = "ABM - ". ucfirst(strtolower($tabla));
		$this->datos["form_descripcion"] = "";
		$this->datos["form_operacion"] = "lista";
		$this->datos["form_operacion_default"] = "lista";
		$this->datos["form_mode"] = "post";
		$this->datos["form_target"] = "";
		$this->datos["form_action"] = "";
		$this->datos["metodo_serializacion"] = "html";
		$this->datos["operaciones_posibles"] = Array("alta", "baja", "modificacion", "lista", "ver");
		$this->datos["search_options"] = Array();
		$this->datos["request_data"] = Array();
		$this->datos["force_insert"] = false;
		$this->datos["campo_fecha_vigencia"] = null;
		$this->datos["itemsxpagina"] = 10;
		$this->datos["pagina_actual"] = 1;
		$this->datos["parent-abm"] = null;
		
		
		//Botones por defecto para el formulario.
		//$boton_ok	  = new FormButton("btnGuardar", "", " Guardar datos ", "submit");
		$boton_cancel = new FormButton("btnCancel", "", " Cancelar ", "button", Array("onclick" => "accion_cancelar();"));
		$this->set_form_buttons(Array($boton_cancel));
		
		$this->setup_fields();
	}
	
	public function add_mensaje($msg = NULL){
		if (is_array($msg) || get_class($msg) != "MensajeOperacion"){
			throw new Exception("Clase ABM, método add_mensaje(): se esperaba un objeto de tipo MensajeOperacion.");
		}
		
		$this->datos["mensajes"][] = $msg;
	}
	
	public function get_mensajes(){
		$this->datos["mensajes"] = (isset($this->datos["mensajes"])) ? $this->datos["mensajes"] : Array();
		return $this->datos["mensajes"];
	}
	
	public function get_pagina_actual(){
		return $this->datos["pagina_actual"];
	}
	
	public function get_items_por_pagina(){
		return $this->datos["itemsxpagina"];
	}
	
	public function set_pagina_actual($val){
		$this->datos["pagina_actual"] = $val;
	}
	
	public function set_items_por_pagina($val){
		$this->datos["itemsxpagina"] = $val;
	}
	
	//Método save()
	//Dada una tabla, guarda los datos cargados previamente en el array de fields.
	public function save(){
		//Primero valido los datos.
		$valido = $this->validate();
		if (!$valido){
			$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: no se pudieron guardar los datos porque fallaron las validaciones. ",ABM::ERROR_VALIDACION);
			//throw new Exception("Clase ABM, método save(): falló la validación de datos, imposible continuar.");
			$this->add_mensaje($msg);
		} else {
			
			$tmp_msg = "";
			$tmp_msg_error = "";
			
			$pkey = null;
			$tmp = $this->datos["constraints"];
			for ($i=0; $i < count($tmp) ; $i++){
				if (strpos(strtolower($tmp[$i]["CONSTRAINT_TYPE"]),"primary") !== false){
					$pkey = $tmp[$i];
					break;
				}
			}
			
			$es_insert = $this->is_new_item();
			$qs  = "";
			$ffkey = null;
			$ffs = $this->datos["fields"];
			$campos = $this->get_campos(true);
			for ($i=0; $i <count($campos); $i++){
				$campos[$i] = strtoupper($campos[$i]);
			}
			
			if (!$es_insert){
				//update
				$tmp_msg = "la actualización";
				$qs = "update ".$this->datos["tabla"]." set ";
				foreach ($ffs as $key=>$ff){
					if (strtolower($key) !== strtolower($pkey["COLUMN_NAME"])){
						if (array_search($key,$campos) !== false){
							$qs .= $key . " = " .$ff->get_valor_para_sql() . ", ";
						}
					} else {
						$ffkey = $ff;
					}
				}
				$qs  = substr_replace($qs ,"",-2);
				$qs .= " where " . $pkey["COLUMN_NAME"] . " = " . $ffkey->get_valor_para_sql();
			} else {
				//insert
				$tmp_msg = "el alta";
				$qs = "insert into ".$this->datos["tabla"]."(";
				foreach ($ffs as $key=>$ff){
					if (strtolower($key) !== strtolower($pkey["COLUMN_NAME"])){
						if (array_search($key,$campos) !== false){
							$qs .= $key . ", ";
						}
					} else {
						$ffkey = $ff;
					}
				}
				$qs  = substr_replace($qs ,"",-2);
				$qs .= ") values (";
				foreach ($ffs as $key=>$ff){
					if (strtolower($key) !== strtolower($pkey["COLUMN_NAME"])){
						if (array_search($key,$campos) !== false){
							$qs .= $ff->get_valor_para_sql() . ", ";
						}
					}
				}
				$qs  = substr_replace($qs ,"",-2);
				$qs .= ")";
			}
			
			//die(var_dump($qs));
			//Una vez con la query construida, la ejecuto.
			$c = Conexion::get_instance();
			try{
				$ret = $c->execute($qs,false);
			}catch(Exception $e){
				$ret = false;
				//$tmp_msg_error = "Error: ".$e->getMessage();
				$tmp_msg_error = "Error en la base de datos.";
			}
			
			if ($es_insert){
				//necesito obtener el último ID insertado
				$qs = "select ".$pkey["COLUMN_NAME"]." from ".$this->datos["tabla"]." order by ".$pkey["COLUMN_NAME"]." desc limit 1;";
				$c = Conexion::get_instance();
				$ret2 = $c->execute($qs,false);
				foreach ($ffs as $key=>$ff){
					if (strtolower($key) == strtolower($pkey["COLUMN_NAME"])){
						$tmp_valor = isset($ret2[0][strtoupper($key)]) ? $ret2[0][strtoupper($key)] : $ret2[0][strtolower($key)];
						$this->datos["fields"][$key]->set_valor($tmp_valor);
					}
				}
			}
			
			
			if ($ret !== false) {
				$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: ".$tmp_msg." de datos se realizó con éxito. ");
			} else {
				$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: error durante ".$tmp_msg." de datos. \n".$tmp_msg_error, ABM::ERROR_SAVE);
			}
			$this->add_mensaje($msg);
			
		}
	}
	
	//Funcion baja()
	//Dato un registro, lo dá de baja.
	//La baja puede ser lógica (activo = 0) o concreta (delete).
	//Acepta un array de IDs como parámetro, de modo de poder dar de baja muchos registros.
	public function baja($id, $logica = true, $data = null){
		$data = (is_array($data)) ? $data : Array();
		
		//Chequeo permisos.
		if (!isset($_SESSION["user"]) || !$_SESSION["user"]->puede($this->get_tabla(),"DELETE")){
			$msg = new MensajeOperacion("El usuario no cuenta con permiso para borrar registros en esta tabla.", ABM::ERROR_PERMISO);
			$this->add_mensaje($msg);
			return;
		}
		
		if ($logica === true){
			//Baja lógica
			$data["activo"] = "0";
			if (is_array($id)) {
				foreach ($id as $valor) {
					//echo("valor: $valor<br>\n");
					$data2 = $data;
					$data2[$this->get_campo_id()] = $valor;
					$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
					$c->set_comparando($this->get_campo_id());
					$c->set_comparador($valor);
					$tmp_abm = get_class($this);
					$tmp_abm = new $tmp_abm();
					$tmp_abm->load(Array($c));
					$tmp_abm->load_fields_from_array($data2);
					$tmp_abm->save();
				}
				$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: Se desactivaron ".count($id)." items.");
				$this->add_mensaje($msg);
			} else {
				$this->load_fields_from_array($data);
				$this->save();
			}
		} else {
			//Baja concreta
			if (is_array($id)){
				foreach ($id as $valor) {
					$c		= Conexion::get_instance();
					$qs		= "delete from " . $this->get_tabla() . " where " . $this->get_campo_id() . " = " . $valor . ";";
					$ret 	= $c->execute($qs);
				}
				$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: Se eliminaron ".count($id)." registros de la base de datos.");
				$this->add_mensaje($msg);
			} else {
				$c		= Conexion::get_instance();
				$qs		= "delete from " . $this->get_tabla() . " where " . $this->get_campo_id() . " = " . $id . ";";
				$ret 	= $c->execute($qs);
				$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: Se eliminó de la base de datos el registro #".$id.".");
				$this->add_mensaje($msg);
			}
		}
	}
	
	//Función reactivar()
	//Dado un registro, lo reactiva (activo = 1).
	//Acepta un array de IDs como parámetro, de modo de poder reactivar muchos registros.
	public function reactivar($id, $data = null){
		$data = (is_array($data)) ? $data : Array();
		
		$data["activo"] = "1";
		if (is_array($id)) {
			foreach ($id as $valor) {
				$data2 = $data;
				$data2[$this->get_campo_id()] = $valor;
				$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
				$c->set_comparando($this->get_campo_id());
				$c->set_comparador($valor);
				$tmp_abm = get_class($this);
				$tmp_abm = new $tmp_abm();
				$tmp_abm->load(Array($c));
				$tmp_abm->load_fields_from_array($data2);
				$tmp_abm->save();
			}
		} else {
			$this->load_fields_from_array($data);
			$this->save();
		}
	}
	
	public function set_force_insert($val){
		$this->datos["force_insert"] = ($val === true);
	}
	
	public function set_campo_fecha_vigencia($val){
		$this->datos["campo_fecha_vigencia"] = $val;
	}
	
	public function get_campo_fecha_vigencia(){
		return $this->datos["campo_fecha_vigencia"];
	}
	
	
	//función tiene_valor_en_campo_id()
	//Busca el campo ID de la tabla, y se fija si tiene cargado un valor en ese campo.
	public function tiene_valor_en_campo_id(){
		
		$ffs = $this->datos["fields"];
		
		return ($ffs[strtoupper($this->get_campo_id())]->get_valor() != "");
		
	}
	
	//Función is_new_item()
	//Se encarga de determinar si se trata de un insert; o caso contrario, un update.
	public function is_new_item(){
		//Para saber si se trata de un update o un insert, me fijo en si el campo ID está seteado.
		//Por definición, si no está seteado ese campo es un alta, y caso contrario un update.
		
		$es_insert = !($this->tiene_valor_en_campo_id());
		
		//20120827 - Daniel Cantarín
		//Agrego la lógica de la fecha de vigencia directamente a la clase ABM.
		//De este modo se utiliza en cualquier otro ABM, y es omitible si no se necesita.
		//Para el caso, chequeo que haya establecido un campo que opera como "fecha de vigencia".
		//Dicho valor típicamente es null, y caso contrario un string con el nombre del campo.
		if ( $this->requiere_nueva_vigencia() !== false){
			$es_insert = true;
		}
		
		$es_insert = ($this->datos["force_insert"] === true) ? true : $es_insert;
		
		return $es_insert;
	}
	
	public function tiene_fecha_vigencia(){
		//Chequeo si la tabla tiene el campo fecha_vigencia.
		//REQUIERE: que ya esté cargado el array de campos de la tabla.
		/*
		$q = new Query();
		$d = $q->coneccion->database;
		$qs = "select * from INFORMATION_SCHEMA.COLUMNS where table_name='".$this->datos["tabla"]."' and table_catalog='".$d."' and column_name='fecha_vigencia';";
		$res = $q->executeQuery($qs);
		$res = (is_null($res)) ? Array(0 => Array()) : $res;
		return (count($res[0]) > 0);
		*/
		
		$ret = false;
		
		if (!is_null($this->get_campo_fecha_vigencia())){
			foreach($this->datos["campos"] as $campo){
				$nombre = isset($campo["COLUMN_NAME"]) ? $campo["COLUMN_NAME"] : $campo["column_name"];
				if (strtolower($this->get_campo_fecha_vigencia()) === strtolower($nombre)){
					//existe el campo establecido como "de fecha de vigencia" en la tabla.
					$ret = true;
					break;
				}
			}
		}
		
		return $ret;
	}
	
	
	//Método requiere_nueva_vigencia()
	//Dado un item, en caso de que tenga fecha de vigencia, analiza
	//si ese item requiere un nuevo registro al guardarse o se trata de un update.
	//NOTA: requiere que el campo "fecha de vigencia" tenga un formato compatible con las 
	//funciones SQL de fechas. Puntualmente, extract().
	public function requiere_nueva_vigencia(){
		$ret = false;
		
		if ($this->tiene_fecha_vigencia() === true){
			$q   = new Query();
			$qs  = "select extract(month from ".$this->get_campo_fecha_vigencia().") as mes, extract(year from ".$this->get_campo_fecha_vigencia().") as anio from " . $this->get_tabla();
			$qs .= " where ";
			
			$ffs = $this->datos["fields"];
			
			if ($this->tiene_valor_en_campo_id()){
				$qs .= " " . $this->get_campo_id() . " = " . $ffs[strtoupper($this->get_campo_id())]->get_valor_para_sql(). " and ";
			} else {
				foreach ($ffs as $key => $ff){
					if ($ff->get_valor() != ""){
						$qs .= " " . $key . " = " . $ff->get_valor_para_sql(). " and ";
					}
				}
			}
			
			$qs .= " (1=1) order by ".$this->get_campo_id()." desc limit 1;";
			
			$r = $q->executeQuery($qs); 
			
			if (!is_null($r) && count($r) > 0){
				$mes = $r[0]["mes"];
				$anio = $r[0]["anio"];
				$tmp_fecha = getdate();
				if ((int)$mes != (int)$tmp_fecha["mon"] || (int)$anio != $tmp_fecha["year"]){
					$ret = true;
				}
			}
		}
		
		return $ret;
	}
	
	
	//Método validate()
	//Loopea por todos los fields y chequea los datos que contienen con diferentes criterios.
	//Devuelve true o false.
	public function validate(){
		$fs = $this->get_fields();
		$ret = true;
		
		$id = strtoupper($this->get_campo_id());
		$new = $this->is_new_item();
		
		foreach ($fs as $nombre => $f){
			
			if (!($new && $id == strtoupper($nombre))){
				if (!$f->validate()){
					$ret = false;
					$rot = $f->get_rotulo();
					$f->add_clase_CSS("erroneo");
					$msg = new MensajeOperacion("El valor del campo ".(($rot == "") ? $nombre : $rot)." es inválido. ",ABM::ERROR_VALIDACION);
					$this->add_mensaje($msg);
				}
			}
		}
		return $ret;
	}
	
	public function get_rotulos_from_field_names($fns){
		//$fns se supone que sea un Array con nombres de campos.
		if (is_array($fns)){
			$fs = $this->get_fields();
			/*
			for ($i =0; $i < count($fns); $i++){
				if (is_string($fns[$i]) && isset($fs[strtoupper($fns[$i])]) && $fs[strtoupper($fns[$i])]->get_rotulo() != "" ){
						$fns[$i] = $fs[strtoupper($fns[$i])]->get_rotulo();
				}
			}
			*/
			
			foreach ($fns as $k=>$v){
				if (is_string($v) && isset($fs[strtoupper($v)]) && $fs[strtoupper($v)]->get_rotulo() != "" ){
						$fns[$k] = $fs[strtoupper($v)]->get_rotulo();
				}
			}
			
			return $fns;
		} else {
			throw new Exception("<b class=\"exception_text\">Clase ORM, método get_rotulos_from_field_names(): se esperaba un array.</b>b>\n");
		}
	}

	
	public function load_fields_from_array($arr){
		//Dado un array, típicamente $_REQUEST, carga valores en los fields.
		$this->datos["fields"] = isset($this->datos["fields"]) ? $this->datos["fields"] : $this->get_empty_fields();
		foreach ($this->datos["fields"] as $nombre => $ff){
			$tmp = "";
			$found = false;
			if (isset($arr[$nombre])){
				$tmp = $arr[$nombre];
				$found = true;
			} else if (isset($arr[strtolower($nombre)])){
				$tmp = $arr[strtolower($nombre)];
				$found = true;
			} else if (isset($arr[strtoupper($nombre)])){
				$tmp = $arr[strtoupper($nombre)];
				$found = true;
			} else if (isset($arr["text".$nombre]) ) {
				$tmp = $arr["text".$nombre];
				$found = true;
			} else if (isset($arr["txt".$nombre]) ) {
				$tmp = $arr["txt".$nombre];
				$found = true;
			} else if (isset($arr["text".strtoupper($nombre)]) ) {
				$tmp = $arr["text".strtoupper($nombre)];
				$found = true;
			} else if (isset($arr["txt".strtoupper($nombre)]) ) {
				$tmp = $arr["txt".strtoupper($nombre)];
				$found = true;
			}
			//echo $nombre .": ". $tmp . "<br>";
			if ($found === true){
				if (is_array($tmp)){
					$this->datos["fields"][$nombre]->set_valores($tmp);
				} else {
					$this->datos["fields"][$nombre]->set_valor($tmp);
				}
			}
		}
		//die(var_dump($arr));
	}
	
	public function set_form_buttons($arr = null){
		$this->datos["formbuttons"] = $arr;
	}
	
	public function get_form_buttons(){
		return $this->datos["formbuttons"];
	}
	
	public function add_form_button($button, $ultimo = true){
		if (!isset($this->datos["formbuttons"]) || !is_array($this->datos["formbuttons"])){
			$this->datos["formbuttons"] = Array();
		}
		if ($ultimo === true){ 
			$this->datos["formbuttons"][] = $button;
		} else {
			array_unshift($this->datos["formbuttons"], $button);
		}
	}
	
	public function set_request_data($data){
		$this->datos["request_data"] = $data;
	}
	
	public function get_request_data(){
		return $this->datos["request_data"];
	}
	
	public function render_form($data = null){
		$metodo = (!is_null($data) && isset($data["metodo_serializacion"]) ) ? $data["metodo_serializacion"] : $this->get_metodo_serializacion();
		$ret = null;
		//$this->setup_fields();
		switch ($metodo){
			case "html":
				$ret = $this->render_form_html($data);
				break;
			case "json":
				$ret = $this->render_form_json();
				break;
			default:
				throw new Exception("<b class=\"exception_text\">Clase ABM, método render_form(): método inválido (\"".$metodo."\").</b>");
				break;
		}
		
		return $ret;
	}
	
	public function render_form_html($data = null){
		$this->datos["tabla"] = (isset($this->datos["tabla"])) ? $this->datos["tabla"] : "";
		$this->datos["form_columnas"] = (isset($this->datos["form_columnas"])) ? $this->datos["form_columnas"] : 2;
		$this->datos["form_extra_code_arriba"] = (isset($this->datos["form_extra_code_arriba"])) ? $this->datos["form_extra_code_arriba"] : Array();
		$this->datos["form_extra_code_abajo"] = (isset($this->datos["form_extra_code_abajo"])) ? $this->datos["form_extra_code_abajo"] : Array();
		$this->datos["form_titulo"] = (isset($this->datos["form_titulo"])) ? $this->datos["form_titulo"] : "";
		$this->datos["form_descripcion"] = (isset($this->datos["form_descripcion"])) ? $this->datos["form_descripcion"] : "";
		
		$solo_con_rotulo = (!is_null($data) && isset($data["solo_con_rotulo"]) ) ? $data["solo_con_rotulo"] : True;
		
		$onsubmit = (strtolower($this->datos["form_mode"]) == "post") ? " onsubmit=\"return validafields();\" " : " onsubmit=\"return false;\" ";
		$target = (trim($this->datos["form_target"]) != "") ? " target=\"".$this->datos["form_target"]."\" " : "";
		$action = $this->datos["form_action"];
		
		$form = "<form ".$onsubmit." id=\"frm".$this->datos["tabla"]."\" name=\"frm".$this->datos["tabla"]."\" method=\"post\" action=\"".$action."\" class=\"frmABM\" columnas=\"".$this->datos["form_columnas"]."\" ".$target.">\n";
		
		$form .= "<input type=\"hidden\" name=\"form_operacion\" value=\"".$this->get_operacion()."\" />\n";
		$form .= "<div class=\"FormTitulo\">".$this->datos["form_titulo"]."</div>\n";
		$form .= "<div class=\"FormDescripcion\">".$this->datos["form_descripcion"]."</div>\n";
		
		foreach ($this->get_mensajes() as $m){
			$form .= $m->render()." &nbsp; ";
		}
		
		foreach ($this->datos["form_extra_code_arriba"] as $code){
			$form .= $code;
		}
		
		$op = $this->get_operacion();
		if ($op == "lista"){
			//Si es una lista, tomo la última lista existente y la renderizo.
			//die(var_dump($this->datos["last_search"]));
			$form .= $this->datos["last_search"]->render();
		} else if ($op == "alta" || $op == "modificacion" || $op = "ver"){
			//Si se trata de un alta o modificación, dibujo los campos.
			$cols = (isset($this->datos["form_columnas"])) ? $this->datos["form_columnas"] : 2;
			$i = 0;
			$limit = count($this->get_fields());
			foreach ($this->get_fields() as $k=>$ff){
				if (($solo_con_rotulo != true) || ($ff->get_rotulo() != "" && $solo_con_rotulo == true) || $ff->get_primary_key() === true ){
					if ($i % $cols == 0) {
						$form .= "<div class=\"Field_Row\" >\n";
					}
					$ff->set_columnas($cols);
					$form .= $ff->render()."\n";
					$i++;
					if ($i % $cols == 0) {
						$form .= "</div>\n";
					} else if ($i == $limit){
						$nf = new NullField();
						while($i % $cols != 0){
							$i++;
							$form .= $nf->render()."\n";
						}
						$form .= "</div>\n";
					}
				}
			}
		}
		
		foreach ($this->datos["form_extra_code_abajo"] as $code){
			$form .= $code;
		}
		
		$form .= "<br/><div class=\"Field_RowButtons\" >\n";
		foreach ($this->get_form_buttons() as $fb){
			$form .= $fb->render()." &nbsp; ";
		}
		$form .= "</div></form>\n";
		
		return $form;
	}
	
	public function render_form_json(){
		$rd = $this->get_request_data();
		$ff = $this->get_fields();
		$ret = $ff;
		
		if (isset($rd["update_fields"])){
			$ret = Array();
			foreach($rd["update_fields"] as $nombre){
				$ret[] = $ff[strtoupper($nombre)];
			}
		} 
		return json_encode($ret);
	}
	
	public function add_code_to_form($str, $arriba = false){
		if ($arriba){
			$this->datos["form_extra_code_arriba"][] = $str;
		} else {
			$this->datos["form_extra_code_abajo"][] = $str;
		}
	}
	
	public function set_form_columnas($int = 2){
		$this->datos["form_columnas"] = $int;
	}
	
	public function set_form_titulo($str){
		$this->datos["form_titulo"] = $str;
	}
	
	//Función analizar_operacion()
	//Dado un array de datos, detetermina el tipo de operación del ABM
	// que se está trabajando con esos datos, y realiza algunas acciones comunes.
	//Las operaciones básicas de ABM son: Alta, Baja, Modificación, y Lista.
	public function analizar_operacion($data){
		if (!is_array($data)){
			throw new Exception("Clase ABM, método analizar_operacion(): Se esperaba un Array.\n");
		}
		
		$data["form_operacion"] = (isset($data["form_operacion"])) ? strtolower($data["form_operacion"]) : $this->datos["form_operacion_default"];
		$op = $data["form_operacion"];
		//echo("<br/>analizar_operacion: OP ".$op."<br/>");
		if (array_search($op,$this->datos["operaciones_posibles"]) === false){
			throw new Exception("<b class=\"exception_text\">Clase ABM, método analizar_operacion(): operación inválida (\"".$op."\").</b>");
			break;
		}
		
		
		$metodo = (isset($data["metodo_serializacion"])) ? $data["metodo_serializacion"] : $this->datos["metodo_serializacion"];
		$pagina_actual = (isset($data["pagina_actual"])) ? $data["pagina_actual"] : 1;
		$itemsxpagina = (isset($data["itemsxpagina"])) ? $data["itemsxpagina"] : 10;
		
		$this->set_metodo_serializacion($metodo);
		$this->set_items_por_pagina($itemsxpagina);
		$this->set_pagina_actual($pagina_actual);
		$this->set_request_data($data);
		
		//La variable $id la utilizo más tarde para determinar algunos comportamientos.
		$id = isset($data[$this->get_campo_id()]) ? $data[$this->get_campo_id()] : null;
		
		//Acá analizo las diferentes operaciones del ABM y ejecuto los 
		//procesos que corresponde a cada acción.
		if(isset($data['btnGuardar']) && ($op == "alta" || $op == "modificacion")){
			//Grabación de datos
			//echo("<br/>analizar_operacion: 1<br/>");
			$this->load_fields_from_array($data);
			if (!is_null($this->datos["parent-abm"]) && $this->datos["parent-abm"] instanceof ABM){
				//En este caso, se trata de un abm combinado.
				$this->datos["parent-abm"]->save();
			} else {
				$this->save();
			}
			
			$tmpok = true;
			$msgs = $this->get_mensajes();
			foreach ($msgs as $msg){
				if ($msg->isError()){
					$tmpok = false;
					break;
				}
			}
			
			$op = ($tmpok) ? "modificacion" : $op;
		} else if(isset($data['boton_nuevo_item']) && ($op == "alta")){
			//Nuevo item
			//Muestra el formulario de modificación, pero vacío.
			//Más tarde, al guardar los datos, agrega un item a la base.
			//Para que eso funcione, el campo ID tiene que estar vacío.
			//echo("<br/>analizar_operacion: 2<br/>");
			if (
					isset($this->datos["fields"][strtoupper($this->get_campo_id())])
					&& ($this->datos["fields"][strtoupper($this->get_campo_id())] instanceof Field)
				){
				$this->datos["fields"][strtoupper($this->get_campo_id())]->set_valor("");
			}
		} else if (isset($data["update_fields"])){
			//Si está establecido el campo "update_fields", se trata de una actualización de campos.
			//De modo que actualizo los campos en cuestión, y devuelvo el formulario de la misma
			//operación que estaba viendo el usuario anteriormente.
			//echo("<br/>analizar_operacion: 3<br/>");
			$this->load_fields_from_array($data);
			$this->setup_fields();
		} else if ($op == "modificacion" || $op == "ver"){
			//Modificación o visualización de algún item
			
			//Se entiende que sí o sí se trata de un item sólo.
			//De modo que del array de IDs se toma el item 0.
			//echo("<br/>analizar_operacion: 4<br/>");
			$tmp_valor = (is_array($id)) ? $id[0] : $id;
			if (!is_null($tmp_valor)){
				$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
				$c->set_comparando($this->get_campo_id());
				$c->set_comparador($tmp_valor);
				$this->load(Array($c));
			}
			$this->load_fields_from_array($data);
			if (!is_null($tmp_valor)){
				$this->datos["fields"][strtoupper($this->get_campo_id())]->set_valor($tmp_valor);
			}
			//esto de abajo es necesario porque el método load() recrea 
			//los Form Fields, que al ser recién creados tienen el rótulo en blanco.
			$this->setup_fields(); 
			//La visualización no permite modificar ningún campo
			if ($op == "ver"){
				foreach ($this->datos["fields"] as $ffnombre => $ffobj){
					//echo($this->datos["fields"][$ffnombre]->get_rotulo()."<br/>");
					$this->datos["fields"][$ffnombre]->set_activado(false);
				}
			}
			
		} else if(isset($data['boton_desactivar']) && ($op == "baja")){
			//Baja lógica de uno o muchos items
			//echo("<br/>analizar_operacion: 5<br/>");
			$this->baja($id, true, $data);
			$op = "lista";
		} else if($op == "baja"){
			//Baja física de uno o muchos items
			//echo("<br/>analizar_operacion: 5<br/>");
			$this->baja($id, false, $data);
			$op = "lista";
		} else if(isset($data['boton_activar']) && ($op == "alta")){
			//reactivación de uno o muchos items
			//echo("<br/>analizar_operacion: 6<br/>");
			$this->baja($id, true, $data);
			$op = "lista";
		} else {
			//echo("<br/>analizar_operacion: 7<br/>");
		}
		
		$boton_nuevo = new FormButton("boton_nuevo_item", "", " Agregar item ", "submit", Array("onclick"=>"accion_alta();"));
		$boton_guardar = new FormButton("btnGuardar", "", " Guardar datos ", "submit");
		$boton_listado = new FormButton("boton_listado", "", " Listado ", "submit", Array("onclick"=>"accion_lista();"));
		
		switch ($op){
			case "lista":
				$this->add_form_button($boton_nuevo, false);
				break;
			case "alta":
				$this->add_form_button($boton_guardar, false);
				$this->add_form_button($boton_listado, false);
				break;
			case "modificacion":
				$this->add_form_button($boton_nuevo, false);
				$this->add_form_button($boton_guardar, false);
				$this->add_form_button($boton_listado, false);
				break;
			case "baja":
				$this->add_form_button($boton_nuevo, false);
				$this->add_form_button($boton_listado, false);
				break;
			default:
				//throw new Exception("<b class=\"exception_text\">Clase ABM, método analizar_operacion(): operación inválida (\"".$op."\").</b>");
				break;
		}
		
		$this->set_operacion($op);
		
	}
	
	public function set_operacion($op = null){
		if (is_null($op)){
			throw new Exception("Clase ABM, método set_operacion(): se esperaba un String.\n");
		}
		$this->datos["form_operacion"] = $op;
	}
	
	public function get_operacion(){
		$default = (isset($this->datos["form_operacion_default"])) ? $this->datos["form_operacion_default"] : "lista";
		$this->datos["form_operacion"] = (isset($this->datos["form_operacion"])) ? strtolower($this->datos["form_operacion"]) : $default;
		return $this->datos["form_operacion"];
	}
	
	//Función Search.
	//Dado un array de criterios, busca items en la tabla del ABM.
	//Opcionalmente se puede ingresar un array con los campos de resultado.
	//Caso contrario, muestra todos los campos de la tabla
	public function search($criterios, $campos = null, $campo_id = null, $paginado=null, $order_by = null){
		if (!is_array($criterios)){
			throw new Exception("Clase ABM, método search(): se esperaba un array de criterios.<br/>\n");
		}
		
		//Validaciones y seteos por defecto.
		$campos   = is_array($campos) ? $campos : Array();
		$campo_id = is_null($campo_id) ? $this->datos["campo_id"] : $campo_id;
		$order_by = is_null($order_by) ? $this->datos["campo_id"] : $order_by;
		//Me aseguro de que siempre esté el ID en la lista de campos
		if (!in_array($campo_id, $campos)){
			array_unshift($campos, $campo_id);
		}
		
		//Si solamente está establecido el campo id, entiendo que no se 
		//establecieron campos en la consulta, razón por la cual
		//selecciono todos los campos. Caso contrario, me queda una lista
		//de los campos establecidos, separados por coma, lista para sql.
		
		$fs = Array();
		foreach ($campos as $nombre => $item){
			if ($item instanceOf Field){
				$fs[] = $nombre;
			} else {
				//Se asume String cuando no es Field
				$fs[] = $item;
			}
		}
		//die(var_dump($fs));
		$fs = implode(",", $fs);
		if ($fs == $campo_id . "," || $fs == $campo_id ){
			$fs = " * ";
		}
		
		$qs = "select ".$fs." from ".$this->get_tabla()." where (1=1) ";
		
		foreach ($criterios as $c){
			if (!is_string($c) && get_class($c) == "Condicion"){
				$qs .= "AND (".$c->toString().") ";
			} else {
				$qs .= "AND (".$c.") ";
			}
		}
		$qs .= "ORDER BY ".$order_by." ";
		
		//die(var_dump($qs));
		$c = Conexion::get_instance();
		$row = null;
		$items = null;
		if (is_null($paginado)){
			$r = $c->execute($qs,false);
			$r = (is_null($r) || $r === false) ? Array(Array()) : $r;
			$row = (count($r) > 0) ? $r[0] : Array();
			$items = $r;
		} else{
			
			$r = $c->PageExecute($qs, $this->get_items_por_pagina(), $this->get_pagina_actual());
			$r = (is_null($r) || $r === false) ? Array("items"=>Array(),"metadata" =>Array()) : $r;
			$r["items"] = (is_null($r["items"]) || $r["items"] === false) ? Array(Array()) : $r["items"];
			$row = (count($r["items"]) > 0) ? $r["items"][0] : Array();
			$items = $r["items"];
		}
		
		if ($fs == " * "){
			//obtengo la lista completa de campos de la tabla.
			//Sólo si no se establecieron los campos ("select *").
			$campos = Array();
			foreach($row as $key=>$value){
				if (!is_numeric($key)){
					//Me quedo solamente con los índices que no sean numéricos.
					$campos[] = $key;
				}
			}
		}
		
		//Utilizo los rotulos para los campos, en caso de que los tengan
		$campos = $this->get_rotulos_from_field_names($campos);
		
		$lista_parms = Array(
			"campos"=>$campos, 
			"items"=>$items, 
			"tabla"=>$this->get_tabla(),
			"paginado" => (is_null($paginado)) ? false : true,
			"pagina_actual" => (is_null($paginado)) ? null : $r["metadata"]["pagina_actual"],
			"max_pages" => (is_null($paginado)) ? null : $r["metadata"]["max_pages"],
			"itemsxpagina" => (is_null($paginado)) ? null : $r["metadata"]["numero_items"],
			"max_items" => (is_null($paginado)) ? null : $r["metadata"]["max_items"],
			"campo_id" => $campo_id,
			"form_mode" => $this->datos["form_mode"],
			"opciones" => $this->datos["search_options"],
			"caller" => get_class($this)
		);
		
		$clase_lista = (isset($this->datos["search_results_class"])) ? $this->datos["search_results_class"] : "Lista";
		$l = new $clase_lista($lista_parms);
		
		$this->datos["last_search"] = $l;
		
		return $l;
	}
	
}

/**
 * Model Class.
 * A class for model layer abstraction generalization.
 * It has different target use cases, more MVC "model" layer related.
 * The strategy is to make a generic inheritable class for the model 
 * layer, and internally re-use ABM when in need of operations like, 
 * lets say, saving an item, without the added cumbersome requirements 
 * ABM may have. 
 * 
 * For example, the ABM's "load()" method requires an array of Condition
 * objects, where Model's "load()" takes an item id. 
 * ABM's "search()" has been made in order to include a listing 
 * operation as an option of the rendered output, while Model's "search"
 * just maka a simple search. 
 * And so on. There may be many use cases where a CRUD form differs from
 * what a MVC model layer needs.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20110808
 */ 
class Model extends ORM{
	
	public function __construct($tabla){
		parent::__construct($tabla);
	}
	
	public function load($id = 0){
		if (!is_array($id)){
			$c = new Condicion(Condicion::TIPO_IGUAL);
			$c->set_comparando($this->get_campo_id());
			$c->set_comparador($id);
			$criterios = Array($c);
		} else {
			//Si es un array, se asume que es un array de condiciones
			$criterios = $id;
		}
		parent::load($criterios);
	}
	
	public function get_data(){
		return $this->datos;
	}
	
	public function search($criterios){
		if (!is_array($criterios)){
			throw new Exception("Clase Model, método search(): se esperaba un array de criterios.<br/>\n");
		}
		
		$qs = "select ".$this->get_campo_id()." from ".$this->get_tabla()." where (1=1) ";
		
		foreach ($criterios as $c){
			if (!is_string($c) && get_class($c) == "Condicion"){
				$qs .= "AND (".$c->toString().") ";
			} else {
				$qs .= "AND (".$c.") ";
			}
		}
		
		//die(var_dump($qs));
		
		$c = Conexion::get_instance();
		$r = $c->execute($qs, $this->cache());
		$r = (is_null($r) || $r === false) ? Array(Array()) : $r;
		
		$ret = Array();
		
		foreach ($r as $item){
			$tmp_class = get_class($this);
			
			if ($tmp_class == "Model"){
				$ret[] = new $tmp_class($this->get_tabla());
				$ret[count($ret)-1]->load($item[$this->get_campo_id()]);
			} else{
				$ret[] = new $tmp_class($item[$this->get_campo_id()]);
			}
		}
		
		return $ret;
	}
	
	protected function filter_data(){
		$tmp = clone $this;
		
		if (isset($tmp->datos["restricted_fields"]) && is_array($tmp->datos["restricted_fields"])){
			foreach ($tmp->datos["restricted_fields"] as $rfield){
				unset($tmp->datos["fields"][strtoupper($rfield)]);
			}
		}
		
		if (isset($tmp->datos["encrypted_fields"]) && is_array($tmp->datos["encrypted_fields"])){
			foreach ($tmp->datos["encrypted_fields"] as $efield){
				if (count($tmp->datos["fields"][strtoupper($efield)]->get_valores()) > 1){
					$tmp2 = $tmp->datos["fields"][strtoupper($efield)]->get_valores();
					for ($i = 0; $i<count($tmp2); $i++){
						$tmp2[$i] = md5($tmp2[$i]);
					}
					$tmp->datos["fields"][strtoupper($efield)]->set_valores($tmp2);
				} else {
					$tmp->datos["fields"][strtoupper($efield)]->set_valor(md5($tmp->datos["fields"][strtoupper($efield)]->get_valor()));
				}
			}
		}
		
		return $tmp;
	}
	
	public function to_json(){
		return json_encode($this->filter_data());
	}
	
	public function to_array(){
		$tmp = $this->filter_data();
		
		$tmp2 = Array();
		foreach ($tmp->datos["fields"] as $key=>$f){
			$tmp2[$key]=$f->get_valor();
		}
		
		return $tmp2;
	}
	
}

/**
 * ClassGetter Class.
 * A helper class for search handling.
 * It makes it easy to get a collection of instances of Model classes.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20110808
 */ 
class ClassGetter {
	
	public static function get_all($tabla){
		//Devuelve un array con todos los items que tengan campo id != 0
		$searcher = new ABM($tabla);
		$class_name = ucwords($tabla);
		$c = new Condicion(Condicion::TIPO_DISTINTO);
		$c->set_comparando($searcher->get_campo_id());
		$c->set_comparador("0");
		$criterios = Array($c);
		$ids = $searcher->search($criterios,Array($searcher->get_campo_id()),$searcher->get_campo_id());
		$ret = Array();
		
		foreach ($ids->get_items() as $item){
			$tmp = (class_exists($class_name)) ?  new $class_name() : new Model($tabla);
			$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
			$c->set_comparando($tmp->get_campo_id());
			$c->set_comparador($item[$tmp->get_campo_id()]);
			$tmp->load(Array($c));
			$ret[] = $tmp;
		}
		
		return $ret;
	}
	
	public static function get($tabla, $criterios){
		//Devuelve un array con todos los items que cumplan con los criterios
		$searcher = new ABM($tabla);
		$class_name = ucwords($tabla);
		$ids = $searcher->search($criterios,Array($searcher->get_campo_id()),$searcher->get_campo_id());
		$ret = Array();
		
		
		foreach ($ids->get_items() as $item){
			$tmp = (class_exists($class_name)) ?  new $class_name() : new Model($tabla);
			$c = new Condicion(Condicion::TIPO_IGUAL, Condicion::ENTRE_CAMPO_Y_VALOR);
			$c->set_comparando($tmp->get_campo_id());
			$c->set_comparador($item[$tmp->get_campo_id()]);
			$tmp->load(Array($c));
			
			$ret[] = $tmp;
		}
		return $ret;
	}
	
}



/**
 * ABMCombinado Class.
 * An extension of the ABM class that handles multiple tables.
 * 
 * It's a common need in CRUD forms rendering that the form cover not 
 * only a single table, but a combination of a few. This is usually 
 * given the strategies behind database table normalizations.
 * So, this recurrent use case should be automated too, and this class 
 * takes that job.
 * 
 * The strategy is to define a list of tables the CRUD form must handle,
 * and then work internally using ABM classes for those tables, 
 * iterating through the instances and rendering a common form. This 
 * makes easy to build custom complex CRUD forms, letting us programmers
 * to work only in the use case business logic.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20130803
 */ 
class ABMCombinado extends ABM{
	
	public function __construct($data = null){
		if (is_null($data) || !is_array($data)){
			throw new Exception("ABMCombinado class: An array of strings was expected.");
		}
		
		/*
		 * I need some of the functionality of the base ABM class, and 
		 * for that i need to instantiate it in the common way, even 
		 * when ABMCombinado works in another way (ABM requires a table).
		 * So, in order to make it transparent to the programmer, i 
		 * just call the constructor of ABM with the first table stated
		 * for ABMCombinado. It should work without big trouble.
		 */
		parent::__construct($data[0]); 
		
		$this->datos["tablas"] = $data;
		$this->datos["abms"] = Array();
		$this->datos["default_abm_class"] = "ABM";
		$this->datos["already_saved"] = false;
		
		$this->create_abms();
		
	}
	
	protected function create_abms(){
		foreach ($this->datos["tablas"] as $nombre){
			$clase_abm = (class_exists("ABM".$nombre)) ?  "ABM".$nombre : null;
			$clase_abm = (class_exists($nombre."ABM")) ?  $nombre."ABM" : $clase_abm;
			$abm = (!is_null($clase_abm)) ?  new $clase_abm() : new $this->datos["default_abm_class"]($nombre);
			
			/*
			 * When you mix multiple classes in a single form, there may
			 * be conflict between field names. 
			 * To handle this, i created a mechanism of field aliases.
			 * Here, i state that no ID field will be handled by itself, 
			 * but by using its alias field, that should not present 
			 * name conflicts.
			 * Other conflictive fields should be handled in a similar 
			 * way in extended custom classes.
			 */
			
			$id = strtoupper($abm->get_campo_id());
			$clase_field = get_class($abm->datos["fields"][$id]);
			$id_alias = "ORM-ALIAS-".strtoupper(md5($nombre."-".$id));
			$alias = new $clase_field(
				$id_alias,
				$abm->datos["fields"][$id]->get_valor(),
				$abm->datos["fields"][$id]->get_rotulo()
			);
			$alias->set_primary_key(true);
			$abm->datos["fields"][$id_alias] = $alias;
			$abm->datos["fields"][$id]->data["alias"] = $abm->datos["fields"][$id_alias];
			$abm->datos["fields"][$id]->set_primary_key(false);
			$abm->datos["parent-abm"] = $this;
			
			$this->datos["abms"][strtoupper($nombre)] = $abm;
		}
	}
	
	public function analizar_operacion($data){
		parent::analizar_operacion($data);
		foreach($this->datos["abms"] as $nombre=>$abm){
			$this->datos["abms"][$nombre]->analizar_operacion($data);
		}
		
	}
	
	public function load_fields_from_array($arr){
		parent::load_fields_from_array($arr);
		foreach($this->datos["abms"] as $nombre=>$abm){
			$this->datos["abms"][$nombre]->load_fields_from_array($arr);
		}
		
	}
	
	public function validate(){
		$ret = true;
		foreach($this->datos["abms"] as $nombre=>$abm){
			if (!$this->datos["abms"][$nombre]->validate()){
				$ret = false;
			}
		}
		return $ret;
	}
	
	public function save(){
		if (!$this->datos["already_saved"]){
			if ($this->validate() === true){
				foreach($this->datos["abms"] as $nombre=>$abm){
					$this->datos["abms"][$nombre]->datos["mensajes"] = Array();
					$this->datos["abms"][$nombre]->save();
				}
			} else {
				$msg = new MensajeOperacion("[".date('Y-m-j h:i:s')."]: no se pudieron guardar los datos porque fallaron las validaciones. ",ABM::ERROR_VALIDACION);
				$this->datos["abms"][strtoupper($this->datos["tablas"][0])]->add_mensaje($msg);
			}
			$this->datos["already_saved"] = true;
		}
	}
	
	public function render_form($data = null){
		$metodo = (!is_null($data) && isset($data["metodo_serializacion"]) ) ? $data["metodo_serializacion"] : $this->get_metodo_serializacion();
		$ret = null;
		switch ($metodo){
			case "html":
				$ret  = "<form onsubmit=\"return validafields();\" id=\"form_combinado\" name=\"form_combinado\" method=\"post\" action=\"\" class=\"frmABM\" columnas=\"".$this->datos["form_columnas"]."\" >\n";
				foreach($this->datos["abms"] as $nombre=>$abm){
					$tmp_form = $abm->render_form($data);
					$tmp_form = preg_replace("/\<\/form\>\n$/","",$tmp_form);
					$tmp_form = preg_replace("/\<form .+?\>\n$/","",$tmp_form);
					$ret .= $tmp_form."\n";
				}
				$ret .= "</form>\n";
				
				break;
			case "json":
				$ret  = "";
				foreach($this->datos["abms"] as $nombre=>$abm){
					$ret .= $abm->render_form($data);
				}
				break;
			default:
				throw new Exception("<b class=\"exception_text\">Clase ABM, método render_form(): método inválido (\"".$metodo."\").</b>");
				break;
		}
		
		return $ret;
		
	}
	
}


try{
	/* Incluyo TODAS las clases de ABM que existan declaradas */
	
	foreach (glob(dirname(__FILE__)."/abmclasses/*.class.php") as $filename){
		require_once($filename);
	}
} catch(Exception $e){
	//nada 
}


?>
