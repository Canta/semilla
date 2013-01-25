<?php
/**
 * Field class
 * Data field abstraction class.
 * It's used to handle field operations, like validations or form rendering.
 * The point of this class is to have a common way of developing custom 
 * and complex form (UI) fields without losing data field automation.
 * Extending this class, any field can be created, with custom validation
 * and custom UI. 
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20110808
 */ 
class Field {
	
	public $data; 
	
	public function __construct($id="", $rotulo="", $valor="", $tipoHTML=""){
		$this->data = Array();
		$this->data["id"] = $id;
		$this->data["rotulo"] = $rotulo;
		$this->data["valor"] = Array($valor);
		$this->data["events"] = array();
		$this->data["activado"] = TRUE;
		$this->data["requerido"] = false;
		$this->data["largo"] = 0;
		$this->data["primaryKey"] = false;
		$this->data["columnas"] = 0;
		$this->data["valor_default"] = null;
		
		if (trim($tipoHTML) == ""){
			$tipoHTML = "text";
		}
		
		//chequeo que sea un tipo de campo válido
		switch(strtolower(trim($tipoHTML))){
			case "textarea":
				break;
			case "text":
				break;
			case "password":
				break;
			case "hidden":
				break;
			case "button":
				break;
			case "submit":
				break;
			case "checkbox":
				break;
			case "radio":
				break;
			case "enum":
				break;
			case "select":
				break; 
			default:
				trigger_error("No se puede definir un Field de tipo '".$tipoHTML."'", E_USER_ERROR);
				die("");
		}
		$this->data["tipoHTML"] = strtolower(trim($tipoHTML));
		$this->data["tipoSQL"] = "varchar";
		$this->data["regexValidacion"] = ""; 
	}
	
	/* getters y setters */
	
	public function get_id(){
		return $this->data["id"];
	}
	
	public function get_rotulo(){
		return $this->data["rotulo"];
	}
	
	public function get_valor($corregir = true){
		
		//20111006 - agrego la posibilidad de corregir los datos.
		//A veces los datetimes devuelven "0000-00-00 00:00:00".
		//En lugar de eso, devuelvo sólo data útil, o un string vacío.
		//20120810 - Daniel Cantarín 
		//Agrego tratamiento para valores que sean arrays.
		$tmp = implode($this->data["valor"]);
		
		if ($corregir){
			if (strpos(strtolower($this->data["tipoSQL"]),"date") > -1 ){
				$tmp = str_replace("00:00:00","",$tmp);
				$tmp = trim(str_replace("0000-00-00","",$tmp));
			}
			
			//También agrego la misma lógica de corrección para los int = 0
			if (strpos(strtolower($this->data["tipoSQL"]),"int") !== false ){
				$tmp = ((int)trim($tmp) == 0) ? "" : $tmp;
			}
		}
		
		return $tmp;
	}
	
	//20120810 - Daniel Cantarín 
	//Agrego tratamiento para valores que sean arrays.
	public function get_valores($corregir = true){
		
		$tmp = $this->data["valor"];
		
		if ($corregir){
			for ($i = 0; $i < count($tmp); $i++){
				if (strpos(strtolower($this->data["tipoSQL"]),"date") > -1 ){
					$tmp[$i] = str_replace("00:00:00","",$tmp[$i]);
					$tmp[$i] = trim(str_replace("0000-00-00","",$tmp[$i]));
				}
				
				//También agrego la misma lógica de corrección para los int = 0
				if (strpos(strtolower($this->data["tipoSQL"]),"int") !== false ){
					$tmp[$i] = ((int)trim($tmp[$i]) == 0) ? "" : $tmp[$i];
				}
			}
		}
		
		return $tmp;
	}
	
	//20120522 - Daniel Cantarín
	//Agrego un método útil para la construcción de sentencias SQL.
	public function get_valor_para_sql(){
		$ret = $this->get_valor(false);
		$def = $this->get_valor_default();;
		$requerido = $this->get_requerido();
		
		if (!$requerido && strlen($ret) <= 0) {
			$ret = 'null';
		} else {
			$ret = (strlen($ret) > 0) ? $ret : $def;
		}
		
		$tipo = $this->get_tipo_sql();
		if (strpos(strtolower($tipo),"timestamp") !== false && ($ret == "now()" || $ret == "0")){
			//No agrego las comillas
			//Esto porque en caso de timestamp, el valor default es una función.
			//Si la pongo entre comillas, se convierte en un string.
		} else if ($ret == 'null'){
			//Idem con el valor NULL
		} else {
			//Para cualquier otro caso, el valor va entre comillas.
			$ret = "'".$ret."'";
		}
		
		return $ret;
	}
	
	public function get_tipo_HTML(){
		return $this->data["tipoHTML"];
	}
	
	public function get_events(){
		return $this->data["events"];
	}
	
	public function get_activado(){
		return $this->data["activado"];
	}
	
	public function get_requerido(){
		return (boolean)$this->data["requerido"];
	}
	
	public function get_largo(){
		return (int)$this->data["largo"];
	}
	
	public function get_primary_key(){
		return (boolean)$this->data["primaryKey"];
	}
	
	
	public function get_tipo_sql(){
		return $this->data["tipoSQL"];
	}
	
	public function get_regex_validacion($auto = true){
		// El flag "auto" determina si este getter automáticamente va a 
		// buscar la regex que corresponde al tipo SQL del Field. 
		// Eso lo haría sólo en caso de que $regexValidacion sea "".
		// Pero le pongo flag para, precisamente, poder obtener "" como valor.
		
		if (($auto === true) && ($this->data["regexValidacion"] == "")){
			$this->data["regexValidacion"] = $this->sql2regex();
		} 
		
		return $this->data["regexValidacion"];
	}
	
	public function set_id($valor){
		$this->data["id"] = $valor;
	}
	
	public function set_rotulo($valor){
		$this->data["rotulo"] = $valor;
	}
	public function set_valor($valor){
		//20120810 - Daniel Cantarín 
		//Agrego tratamiento para valores que sean arrays.
		$this->data["valor"] = Array($valor);
	}
	
	//20120810 - Daniel Cantarín 
	//Agrego tratamiento para valores que sean arrays.
	public function set_valores($arr){
		if (!is_array($arr)){
			throw new Exception("<b class=\"exception_text\">Clase ".get_class($this).", método set_valores(): se esperaba un Array.</b>");
		}
		$this->data["valor"] = $arr;
	}
	
	public function set_tipo_HTML($valor){
		$this->data["tipoHTML"] = $valor;
	}
	
	public function set_events($arr){
		$this->data["events"] = $arr;
	}
	
	public function set_activado($val){
		$this->data["activado"] = (boolean)$val;
	}
	
	public function set_requerido($val){
		$this->data["requerido"] = (boolean)$val;
	}
	
	public function set_largo($val){
		$this->data["largo"] = (int)$val;
	}
	
	public function set_primary_key($val){
		$this->data["primaryKey"] = (boolean)$val;
	}
	
	public function set_tipo_sql($valor){
		$this->data["tipoSQL"] = $valor;
	}
	
	public function set_regex_validacion($valor){
		$this->data["regexValidacion"] = $valor;
	}
	
	public function set_clase_CSS(){
		$return = "Field";
		
		if ($this->get_tipo_HTML() == "enum"){
			$return .= " enum";
		}
		
		return $return;
	}
	
	//20120522 - Daniel Cantarín
	//De acuerdo a problemas de implementación en múltiples motores de bases de datos,
	//voy a cambiar el modo en que se generan los formularios HTML, y llevar todo hacia algún modelo de ORM.
	//Para el caso, en lugar de manipular Fields desde afuera con una función externa y procedural, hago que los Field sepan dibujarse a sí mismos en tanto que clase.
	//De este modo, implemento un método render(), que se puede heredar y sobreescribirse de ser necesario.
	public function render(){
		$ret = "";
		//De acuerdo al tipo de campo, corresponde un diferente tag HTML
		//20120523 - Cuando es Primary Key, siempre es un hidden.
		$tmp = ($this->get_primary_key() === true) ? "hidden" : $this->get_tipo_HTML() ;
		
		$stily = "style=\"";
		if ($this->data["columnas"] > 0){
			$stily .= "width:".(100 / $this->data["columnas"] / 2)."%; ";
		}
		if ($tmp == "hidden"){
			$stily .= "display: none; ";
		}
		$stily .= "\" ";
		
		
		$ret .= "<span class=\"Field_rotulo\" ".$stily.">".(($this->get_rotulo() == "" && $this->get_primary_key() === false) ? $this->get_id() : $this->get_rotulo()) ."&nbsp;</span><span class=\"Field_input\" ".$stily.">";
		$ret2 = "";
		$valores = $this->get_valores();
		
		for ($v = 0; $v < count($valores); $v++){
		
			if 	(( $tmp == "text")  
				|| ( $tmp == "hidden") 
				|| ( $tmp == "password")
				|| ( $tmp == "button")
				|| ( $tmp == "submit")
				|| ( $tmp == "checkbox")
				|| ( $tmp == "radio")){
				
				$autoregex = (boolean)($this->get_regex_validacion(false) == ""); 
				
				$datetime  = (boolean)(strpos(strtolower($this->get_tipo_sql()),"date") > -1);
				
				$type = ($this->get_primary_key() === true) ? "hidden" : $this->get_tipo_HTML() ;
				$type = ($type=="select") ? "hidden" : $type;
				$type = str_replace("enum","text",$type);
				$clase_css = $this->set_clase_CSS();
				
				$ret2 .= "<input class='".$clase_css."' id='".$this->get_id()."' name='".$this->get_HTML_name()."' type='".$type."' value='".$valores[$v]."' pattern='".$this->get_regex_validacion($autoregex)."' alt='".str_replace("'","`",$this->get_rotulo())."' ";
				
				foreach ($this->get_events() as $key => $value) {
					$ret2 .= " ".$key." =\"". str_replace('"','\\"',$value)."\" ";
				}
				
				if ($this->get_activado() !== TRUE && $type != "hidden"){
					//20120523 - Se agrega chequeo de que no sea tipo hidden.
					//Los hidden, cuando disabled, no se pasan por el formulario al postear.
					//Típicamente, un primary key se manda como hidden, y por ser primary key se establece disabled.
					//Pero si establezco esa combinacíon de propiedades, pierdo el campo en el próximo post.
					//De modo que sacrifico una de las dos cuando se da la combinación: sacrifico el disabled.
					$ret2 .= " disabled ";
				}
				
				if ($this->get_largo() > 0){
					$ret2 .= " maxlength=".$this->get_largo()." ";
				}
				
				if ($this->get_requerido() === TRUE){
					$ret2 .= " required ";
				}
				
				if ($datetime === TRUE){
					$ret2 .= " datetime ";
				}
				
				$ret2 .=  "/> ";
				
			}
			
			if ($tmp == "textarea"){
				$ret2 .= "<textarea id='".$this->get_id()."' name='".$this->get_id()."' ";
				
				foreach ($this->get_events() as $key => $value) {
					$ret2 .= " ".$key." =\"". str_replace('"','\\"',$value)."\" ";
				}
				
				if ($this->get_largo() > 0){
					$ret2 .= " maxlength=".$this->get_largo()." ";
				}
				
				$ret2 .= ">".$valores[$v]."</textarea>";
			}
			
		}
		
		
		$ret .=  $ret2."</span>\n";
		
		return $ret;
	}
	
	public function set_columnas($cols = 0){
		$this->data["columnas"] = $cols;
	}
	
	//20120810 - Daniel Cantarín 
	//Agrego tratamiento para valores que sean arrays.
	//En este caso, el "name" de un input HTML.
	public function get_HTML_name(){
		$tmp = $this->get_id(); 
		if (count($this->get_valores()) > 1){
			$tmp .= "[]";
		}
		return $tmp;
	}
	
	//20120815 - Daniel Cantarín 
	//Establezco una función genérica para obtener, dado un 
	//tipo de datos de la base de datos, un tipo de input en HTML.
	public static function sqltype2htmltype($val){
		switch(strtolower(trim($val))){
			case "blob":
				$return = "textarea";
				break;
			case "boolean":
				$return = "checkbox";
				break;
			case "text":
				$return = "textarea";
				break;
			case "bool":
				$return = "checkbox";
				break;
			default:
				$return = "text";
				break;
		}
		
		return $return;
	}
	
	private function sql2regex(){
		// Función que, de acuerdo a un tipo de datos SQL, devuelve
		// un string con una expresión regular para validarlo en el cliente.
		$return = "";
		
		switch(strtolower(trim($this->get_tipo_sql()))){
			case "string":
				$return = "^.*$";
				break;
			case "varchar":
				$return = "^.*$";
				break;
			case "int":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "int2":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "int4":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "int8":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "numeric":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "real":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "datetime":
				//$return = "^([0-9]{4})[-/]([0-1][0-9])[-/]([0-3][0-9])(\s[0-9]{2,2}:[0-5][0-9]:[0-5][0-9])?$"; //aaaaMMdd hh:mm:ss
				$return = "^([0-3][0-9])[-/]([0-1][0-9])[-/]([0-9]{4})(\s[0-9]{2,2}:[0-5][0-9]:[0-5][0-9])?$"; //ddMMaaaa hh:mm:ss
				break;
			case "date":
				//$return = "^([0-9]{4})[-/]([0-1][0-9])[-/]([0-3][0-9])$"; //aaaammdd
				$return = "^([0-3][0-9])[-/]([0-1][0-9])[-/]([0-9]{4})$"; //ddmmaaaa
				break;
			case "time":
				$return = "([0-9]{2,2}:[0-5][0-9]:[0-5][0-9])$";
				break;
			case "timestamp":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "timestamptz":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "integer":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "timestamp without time zone":
				$return = "^[0-9\\.\\,]*$";
				break;
			case "character varying":
				$return = "^.*$";
				break;
			case "smallint":
				$return = "^[0-9\\.\\,]*$";
				break;
			default:
				echo "sql2regex: No encontré este tipo: ".strtolower(trim($this->get_tipo_sql()))."<br/>";
				break;
		}
		
		if ($return == ""){
			//20120521 - Daniel Cantarín
			//No se encontró ningún caso.
			//Agrego algunas consultas para casos vinculados a otros motores.
			//Por ejemplo, en Posgree me devuelve int2 o int4 para algunos int.
			//Más información acá: http://ar2.php.net/manual/en/function.pg-field-type.php
			$tmp_tipo = strtolower(trim($this->get_tipo_sql()));
			if ($tmp_tipo == "int2" || $tmp_tipo == "int4" || $tmp_tipo == "int8" || $tmp_tipo == "timestamp" || $tmp_tipo == "integer"){
				$return = "^[0-9]*$";
			}
		}
		
		
		return $return;
	}
	
	public function get_valor_default(){
		
		//Si se trata de un campo requerido, pero el valor por defecto es NULL,
		//me manejo con otra lógica vinculada al tipo de datos.
		switch(strtolower(trim($this->get_tipo_sql()))){
			case "string":
				$ret = "";
				break;
			case "varchar":
				$ret = "";
				break;
			case "int":
				$ret = "0";
				break;
			case "int2":
				$ret = "0";
				break;
			case "int4":
				$ret = "0";
				break;
			case "int8":
				$ret = "0";
				break;
			case "numeric":
				$ret = "0";
				break;
			case "real":
				$ret = "0";
				break;
			case "datetime":
				$ret = "1900-01-01 00:00:00";
				break;
			case "date":
				$ret = "1900-01-01";
				break;
			case "time":
				$ret = "00:00:00";
				break;
			case "timestamp":
				$ret = "now()";
				break;
			case "timestamptz":
				$ret = "now()";
				break;
			case "integer":
				$ret = "0";
				break;
			case "timestamp without time zone":
				$ret = "now()";
				break;
			case "character varying":
				$ret = "";
				break;
			case "smallint":
				$ret = "0";
				break;
			default:
				$ret = "";
				break;
		}
		
		//Si se estableció manualmente un valor default, usa ese valor e ignora el automático.
		$ret = (isset($this->data["valor_default"]) && !is_null($this->data["valor_default"])) ? $this->data["valor_default"] : $ret;
		
		return $ret;
	}
	
	public function set_valorDefault($val = "null"){
		$this->data["valor_default"] = $val;
	}
	
}

//20120817 - Daniel Cantarín 
//Agrego un tipo de Field especial para timestamps, de modo que 
//los timestamps se comporten como se pretende en la aplicación.
class TimestampField extends Field{
	
	public function __construct($id="", $rotulo="", $valor="", $tipoHTML=""){
		parent::__construct($id, $rotulo, $valor, $tipoHTML);
		$this->set_activado(false); 
		$this->data["valor_default"] = "now()";
	}
	
	public function render(){
		return "";
	}
	
	public function get_valor_para_sql(){
		$ret = parent::get_valor_para_sql();
		$ret = ($ret == '0') ? "now()" : $ret;
		return $ret;
	}
	
}

class SelectField extends Field {
	
	public function __construct($id="", $rotulo="", $valor="", $items = null){
		parent::__construct($id, $rotulo, $valor);
		
		if (is_null($items) || !is_array($items)){
			$items = Array();
		}
		$this->data["items"] = $items;
		$this->set_tipo_HTML("select");
		$this->set_tipo_sql("varchar");
		$this->data["campo_indice"] = 0;
		$this->data["campo_descriptivo"] = 1;
	}
	
	public function set_campo_indice($val){
		$this->data["campo_indice"] = $val;
	}
	
	public function set_campo_descriptivo($val){
		$this->data["campo_descriptivo"] = $val;
	}
	
	public function get_items(){
		$arr = is_array($this->data["items"]) ? $this->data["items"] : Array();
		
		if ($this->get_requerido() !== true){
			$arr2 =  Array($this->get_campo_indice() => "", $this->get_campo_descriptivo() => "Nulo / Sin datos");
			array_unshift($arr, $arr2);
		}
		return $arr;
	}
	
	public function get_campo_descriptivo(){
		return $this->data["campo_descriptivo"];
	}
	
	public function get_campo_indice(){
		return $this->data["campo_indice"];
	}
	
	public function get_descripcion_valor($valor = null){
		$valor = (is_null($valor)) ? $this->getValor() : $valor;
		$ret = "";
		foreach ($this->get_items() as $item){
			if (strtolower($item[$this->get_campo_indice()]) == strtolower($valor)){
				$ret = $item[$this->get_campo_descriptivo()];
				break;
			}
		}
		return $ret;
	}
	
	public function get_valor($corregir = true){
		
		//$v = parent::getValor($corregir);
		
		//20121025 - Daniel Cantarín 
		//Pequeño fix: cuando el campo es int, que el valor por defecto sea cero, no un string vacío.
		//Esto lo implemento porque algunos Enum tienen en su lista de items uno con valor "0",
		//y al estar guardado en la base como "0" y corregir el valor en parent::get_valor(), ese
		//"0" que era válido se convierte en un "" inválido.
		$tipo = strtolower($this->get_tipo_sql());
		if (strpos($tipo,"int") !== false ){
			$corregir = false;
		} 
		
		$v = parent::get_valor($corregir);
		
		if ($corregir !== false){
			$ret = null;
			foreach ($this->get_items() as $item){
				if (isset($item[$this->get_campo_indice()]) && strtolower($item[$this->get_campo_indice()]) == strtolower($v)){
					$ret = $item[$this->get_campo_indice()];
					break;
				}
			}
			
			if (is_null($ret)){
				$ret = isset($this->data["items"][0][$this->get_campo_indice()]) ? $this->data["items"][0][$this->get_campo_indice()] : "";
			}
			
			return $ret;
		} else {
			return $v;
		}
	}
	
	
	public function render(){
		$ret = "";
		
		$tmp = ($this->get_primary_key() === true) ? "hidden" : $this->get_tipo_HTML() ;
		
		$stily = "style=\"";
		if ($this->data["columnas"] > 0){
			$stily .= "width:".(100 / $this->data["columnas"] / 2)."%; ";
		}
		
		if ($tmp == "hidden" ){
			$stily .= "display: none; ";
		}
		
		$stily .= "\" ";
		
		$ret .= "<span class=\"Field_rotulo\" ".$stily.">".(($this->get_rotulo() == "" && $this->get_primary_key() === false) ? $this->get_id() : $this->get_rotulo()) ."&nbsp;</span><span class=\"Field_input\" ".$stily.">";
		$ret2 = "";
		$valores = $this->get_valores();
		
		for ($v = 0; $v < count($valores); $v++){
		
			$autoregex = (boolean)($this->get_regex_validacion(false) == ""); 
			$type = ($this->get_primary_key() === true) ? "hidden" : $this->get_tipo_HTML() ;
			$type = ($type=="select") ? "hidden" : $type;
			$type = str_replace("enum","text",$type);
			$clase_css = $this->set_clase_CSS();
			
			$ret2 .= "<input class='".$clase_css."' id='".$this->get_id()."' name='".$this->get_HTML_name()."' type='".$type."' value='".$valores[$v]."' pattern='".$this->get_regex_validacion($autoregex)."' alt='".str_replace("'","`",$this->get_rotulo())."' ";
			
			foreach ($this->get_events() as $key => $value) {
				$ret2 .= " ".$key." =\"". str_replace('"','\\"',$value)."\" ";
			}
			
			if ($this->get_activado() !== TRUE && $type != "hidden"){
				//20120523 - Se agrega chequeo de que no sea tipo hidden.
				//Los hidden, cuando disabled, no se pasan por el formulario al postear.
				//Típicamente, un primary key se manda como hidden, y por ser primary key se establece disabled.
				//Pero si establezco esa combinacíon de propiedades, pierdo el campo en el próximo post.
				//De modo que sacrifico una de las dos cuando se da la combinación: sacrifico el disabled.
				$ret2 .= " disabled ";
			}
			
			if ($this->get_largo() > 0){
				$ret2 .= " maxlength=".$this->get_largo()." ";
			}
			
			if ($this->get_requerido() === TRUE){
				$ret2 .= " required ";
			}
			
			$ret2 .= " enum /> ";
			
			$ret2 .=  "<select id=\"desc_".$this->get_id()."\" enum_desc class=\"enum_desc\" >";
			$tmp_items = $this->get_items();
			foreach ($tmp_items as $item){
				$ret2 .=  "<option value=\"".$item[$this->get_campo_indice()]."\">(".$item[$this->get_campo_indice()].") - \"".$item[$this->get_campo_descriptivo()]."\"</option>";
			}
			$ret2 .= "</select>";
			
		}
		
		$ret .=  $ret2."</span>\n";
		
		return $ret;
	}
	
}


class EnumField extends SelectField{
	public function __construct($id="", $rotulo="", $valor="", $items = null){
		parent::__construct($id, $rotulo, $valor, $items);
		$this->set_tipo_HTML("enum");
	}
}

class SiNoEnumField extends EnumField{
	public function __construct($id="", $rotulo="", $valor="", $items = null){
		parent::__construct($id, $rotulo, $valor);
		
		$this->data["items"] = Array(Array("S", "Si"), Array("N", "No"));
		$this->set_tipo_HTML("enum");
		$this->set_tipo_sql("varchar");
		
	}
}

class QueryEnumField extends EnumField{
	
	public function __construct($id="", $rotulo="", $valor="", $query = null){
		
		if (is_null($query)){
			throw new Exception("Clase QueryEnumField: se esperaba un String.");
		}
		
		parent::__construct($id, $rotulo, $valor);
		
		$this->data["items"] = Array();
		$this->set_tipo_HTML("enum");
		$this->set_tipo_sql("varchar");
		$this->data["campo_descriptivo"] = "";
		$this->data["campo_indice"] = "";
		$this->data["query"] = $query;
		$this->data["valores"] = Array(); //fix para ConditionalQueryEnumField
		
		$data=new Query();
		$data->executeQuery($this->get_query()); 
		
		$this->data["items"] = $data->get_data();
	}
	
	public function get_query($val = null){
		return $this->data["query"];
	}
}

class ConditionalQueryEnumField extends QueryEnumField{
	
	public function __construct($id="", $rotulo="", $valor="", $data = null){
		if (is_null($data)){
			throw new Exception("Clase ConditionalQueryEnumField: se esperaba un array asociativo con datos.");
		}
		if (!isset($data["valores"]) || !is_array($data["valores"]) ){
			throw new Exception("Clase ConditionalQueryEnumField: se esperaba un array con valores en el índice \"valores\".");
		}
		if (!isset($data["query"])){
			throw new Exception("Clase ConditionalQueryEnumField: se esperaba un string con una consulta SQL en el índice \"query\".");
		}
		
		parent::__construct($id, $rotulo, $valor, "select 0 as id, 0 as descripcion;");
		
		$this->data["items"] = Array();
		$this->set_tipo_HTML("enum");
		$this->set_tipo_sql((isset($data["tipo_sql"])) ? $data["tipo_sql"] : "varchar");
		$this->data["campo_descriptivo"] = (isset($data["campo_descriptivo"])) ? $data["campo_descriptivo"] : "";
		$this->data["campo_indice"] = (isset($data["campo_indice"])) ? $data["campo_indice"] : "";
		$this->data["valores"] = $data["valores"];
		$this->data["query"] = $data["query"];
		
		$data=new Query();
		$data->executeQuery($this->get_query()); 
		
		$this->data["items"] = $data->getData();
	}
	
	public function get_query($val = null){
		$vals = (is_null($val)) ? $this->get_valores() : $val;
		$q = $this->data["query"];
		
		for ($i = 0; $i < count($vals); $i++){
			$q = str_replace("%".($i+1), $vals[$i], $q);
		}
		
		return $q;
	}
	
	public function get_valores($corregir = true) {
		return $this->data["valores"];
	}
	
	public function set_valores($val=null){
		$this->data["valores"] = $val;
	}
}

?>
