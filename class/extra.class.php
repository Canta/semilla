<?php
/**
 * extra.class.php
 * This file holds some little helper files
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20120813
 */


//Clase Condicion.
//Se utiliza para la generación dinámica de cláusulas WHERE en sql.
class Condicion {
	//Constantes para los tipos de comparaciones
	const TIPO_IGUAL 		= 0;
	const TIPO_MAYOR_IGUAL 	= 1;
	const TIPO_MENOR_IGUAL 	= 2;
	const TIPO_LIKE 		= 3;
	const TIPO_IN 			= 4;
	const TIPO_NOT_IN 		= 5;
	const TIPO_DISTINTO		= 6;
	//Constantes para las variables involucradas
	const ENTRE_VALORES 			= 0;
	const ENTRE_CAMPO_Y_VALOR 		= 1;
	const ENTRE_CAMPO_Y_CAMPO 		= 2;
	const ENTRE_CAMPO_Y_DEFAULT 	= 3;
	
	private $datos;
	
	//Constructor.
	//Por defecto, asume una condición entre un campo y un valor.
	public function __construct($tipo = 0, $entre = 1){
		$this->datos = Array();
		$this->datos["comparando"] = null;
		$this->datos["comparador"] = null;
		$this->datos["tipo"] = $tipo;
		$this->datos["entre"] = $entre;
	}
	
	public function set_comparador($val = ""){
		$this->datos["comparador"] = $val;
	}
	
	public function set_comparando($val = ""){
		$this->datos["comparando"] = $val;
	}
	
	public function set_tipo($val = 0){
		$this->datos["tipo"] = $val;
	}
	
	public function set_entre($val = 1){
		$this->datos["entre"] = $val;
	}
	
	public function toString(){
		$ret  = " ";
		//comparando
		$ret .= ($this->datos["entre"] == self::ENTRE_VALORES) ? "'".$this->datos["comparando"]."'" : $this->datos["comparando"] ;
		//operador
		switch ($this->datos["tipo"]){
			case self::TIPO_IGUAL:
				$ret .= " = ";
				break;
			case self::TIPO_MAYOR_IGUAL:
				$ret .= " >= ";
				break;
			case self::TIPO_MENOR_IGUAL:
				$ret .= " <= ";
				break;
			case self::TIPO_LIKE:
				$ret .= " like ";
				break;
			case self::TIPO_IN:
				$ret .= " in ";
				break;
			case self::TIPO_NOT_IN:
				$ret .= " not in ";
				break;
			case self::TIPO_DISTINTO:
				$ret .= " != ";
				break;
			default:
				trigger_error("Clase Condicion: No se puede definir un operador de tipo '".$this->datos["tipo"]."'", E_USER_ERROR);
				die("");
		}
		//comparador
		
		switch ($this->datos["entre"]){
			case self::ENTRE_CAMPO_Y_CAMPO:
				$ret .= $this->datos["comparador"] ;
				break;
			case self::ENTRE_CAMPO_Y_DEFAULT:
				$ret .= 'default('.$this->datos["comparando"].')';
				break;
			default:
				$ret .= "'".$this->datos["comparador"]."'" ;
		}
		
		return $ret;
	}
}

//Clase MensajeOperacion
//Se utiliza para mostrar mensajes en los formularios.
class MensajeOperacion{
	private $mensaje;
	private $nro_error;
	
	public function __construct($texto, $error = 0){
		$this->mensaje = $texto;
		$this->nro_error = $error;
	}
	
	public function isError(){
		return ($this->nro_error != 0);
	}
	
	public function getNumeroError(){
		return $this->nro_error;
	}
	
	public function getMensaje(){
		return $this->mensaje;
	}
	
	public function render(){
		$ret  = "";
		$clase  = "mensaje";
		$clase .= ($this->isError()) ? " error" : " exito";
		$ret .= "<div class=\"".$clase."\"><span class=\"boton-cerrar-mensaje\" onclick=\"$(this).parent().fadeOut(500);\" title=\"Cerrar\"></span><span class=\"texto-mensaje\">".$this->mensaje."</span></div>\n";
		return $ret;
	}
	
}


//Clase Lista.
//Se utiliza para gestionar resultados de una búsqueda.
//Es renderizable a HTML.
class Lista {
	
	protected $datos;
	
	public function __construct($data = null){
		if (is_null($data)){
			$data = Array();
		}
		
		$this->datos["campos"] = (isset($data["campos"])) ? $data["campos"] : Array();
		$this->datos["exclude"] = (isset($data["exclude"])) ? $data["exclude"] : Array();
		$this->datos["items"] = (isset($data["items"])) ? $data["items"] : Array();
		$this->datos["campo_id"] = (isset($data["campo_id"])) ? $data["campo_id"] : "id";
		$this->datos["tabla"] = (isset($data["tabla"])) ? $data["tabla"] : "";
		$this->datos["opciones"] = (isset($data["opciones"])) ? $data["opciones"] : Array();
		$this->datos["acciones"] = (isset($data["acciones"])) ? $data["acciones"] : Array("activar","modificar", "eliminar");
		
		$this->datos["paginado"] = (isset($data["paginado"])) ? $data["paginado"] : false;
		$this->datos["pagina_actual"] = (isset($data["pagina_actual"])) ? $data["pagina_actual"] : null;
		$this->datos["itemsxpagina"] = (isset($data["itemsxpagina"])) ? $data["itemsxpagina"] : null;
		$this->datos["max_pages"] = (isset($data["max_pages"])) ? $data["max_pages"] : null;
		$this->datos["max_items"] = (isset($data["max_items"])) ? $data["max_items"] : null;
		
		$this->datos["form_mode"] = (isset($data["form_mode"])) ? $data["form_mode"] : "post";
		
		$this->datos["query"] = (isset($data["query"])) ? $data["query"] : null;
		$this->datos["caller"] = (isset($data["caller"])) ? $data["caller"] : "";
	}
	
	public function set_campos($arr){
		if (!is_array($arr)){
			throw new Exception("Clase Lista, método set_campos: se esperaba un array; se utilizó \"".gettype($arr)."\".<br/>\n");
		}
		$this->datos["campos"] = $arr;
	}
	
	public function set_excluidos($arr){
		if (!is_array($arr)){
			throw new Exception("Clase Lista, método set_excluidos: se esperaba un array; se utilizó \"".gettype($arr)."\".<br/>\n");
		}
		$this->datos["exclude"] = $arr;
	}
	
	public function set_items($arr){
		if (!is_array($arr)){
			throw new Exception("Clase Lista, método set_items: se esperaba un array; se utilizó \"".gettype($arr)."\".<br/>\n");
		}
		$this->datos["items"] = $arr;
	}
	
	public function get_tabla(){         
		return $this->datos["tabla"];
	}
	
	public function render(){
		
		$ret = "<table class=\"Lista";
		foreach($this->datos["opciones"] as $opcion){
			$ret .= " ".$opcion;
		}
		$ret .= "\">\n<thead><tr>";
		
		if (count($this->datos["items"]) > 0){
			foreach($this->datos["campos"] as $nombre => $item){
				
				if (array_search($nombre, $this->datos["exclude"]) === false){
					if ($item instanceOf Field ){
						if (trim(strtolower($this->datos["campo_id"])) != trim(strtolower($nombre)) ){
							if ($item->get_rotulo() != ""){
								$ret .= "<td>".$item->get_rotulo()."</td>";
							}else {
								$ret .= "<td>".$item->get_id()."</td>";
							}
						}
					} else {
						//Si no es un Field, se asume String
						if (trim(strtolower($this->datos["campo_id"])) != trim(strtolower($item)) ){
							$ret .= "<td>".$item."</td>";
						}
					}
				}
			}
			$ret .= $this->render_opciones_headers();
			//Agrego un td para el campo ID
			$ret .= "<td class=\"lista_item_id\"></td>";
		}
		$ret .= "</tr>\n</thead>\n<tbody>\n";
		
		$i = 0;
		
		$campos = $this->datos["campos"];
		
		foreach($this->datos["items"] as $row){
			if (count($row) > 0){
				$tmp = ($i % 2 === 0) ? "par" : "impar";
				$ret .= "<tr class=\"".$tmp."\">\n";
				
				foreach ($row as $nombre=>$valor){
					if (
						trim(strtolower($this->datos["campo_id"])) != trim(strtolower($nombre)) 
						&& isset($campos[$nombre])
						&& (
							(
								is_string($campos[$nombre])
								&& trim(strtolower($this->datos["campo_id"])) != trim(strtolower($campos[$nombre]))
							) || !is_string($campos[$nombre])
						)
						&& array_search($nombre, $this->datos["exclude"]) === false 
					){
						//echo(get_class($campos[$nombre]));
						if ($campos[$nombre] instanceOf SelectField){
							$ret .= "<td>".$campos[$nombre]->get_descripcion_valor($valor)."</td>\n";
						} else if ($campos[$nombre] instanceOf BitField){
							$ret .= "<td>".hexdec(bin2hex($valor))."</td>\n";
						} else {
							$ret .= "<td>".$valor."</td>\n";
						}
					}
				}
				$ret .= $this->render_opciones($row);
				//Agrego un td para el campo ID
				$ret .= "<td class=\"lista_item_id\"><input type=\"checkbox\" id=\"campo_id_".$row[$this->datos["campo_id"]]."\" name=\"".$this->datos["campo_id"]."[]\" value=\"".$row[$this->datos["campo_id"]]."\" /></td>";
				
				$ret .= "</tr>\n";
				$i++;
			} 
		}
		
		if (count($this->datos["items"]) <= 0){
			$ret .= "<tr class=\"impar\"><td>No se encontraron datos</td></tr>";
		}
		$ret .= "</tbody>\n";
		
		if ($this->datos["paginado"] !== false && count($this->datos["items"]) > 0){
			
			$boton_siguiente = "<input type=\"submit\" name=\"boton_siguiente\" value=\" siguiente -> \" onclick=\"accion_siguiente();\" ".(($this->datos["pagina_actual"] < $this->datos["max_pages"]) ? "" : " disabled ")." />";
			$boton_anterior = "<input type=\"submit\" name=\"boton_anterior\" value=\" <- anterior \" onclick=\"accion_anterior();\" ".(($this->datos["pagina_actual"] > 1) ? "" : " disabled ")." />";
			$itemsxpagina = "";
			$select_pagina = "";
			if ((int)$this->datos["max_pages"] > 2) {
				$itemsxpagina = " - Items por página: <input class=\"cantidad_items\" type=\"number\" value=\"".$this->datos["itemsxpagina"]."\" name=\"itemsxpagina\" maxlength=\"3\" min=\"10\" max=\"100\" pattern=\"^[0-9]*$\" onchange=\"accion_lista();\" />";
				$select_pagina = " - Ir a página: <select class=\"selector_pagina\" onchange=\"accion_ir_a_pagina(this.value);\">\n";
				for ($i = 1; $i <= (int)$this->datos["max_pages"]; $i++){
					$selected = ($i == (int)$this->datos["pagina_actual"]) ? " selected " : "";
					$select_pagina .= "<option value=\"".$i."\" ".$selected.">".$i."</option>\n";
				}
				$select_pagina .= "</select>";
			}
			
			
			$ret .= "<tfoot>\n";
			$cols = count($this->datos["campos"]) + count($this->datos["acciones"]);
			$ret .= "<tr><td colspan=\"".$cols."\">".$boton_anterior." P&aacute;gina ".$this->datos["pagina_actual"]." de ".$this->datos["max_pages"]." ".$boton_siguiente."
			".$itemsxpagina."
			<input type=\"hidden\" name=\"pagina_actual\" value=\"".$this->datos["pagina_actual"]."\" />
			<input type=\"hidden\" name=\"max_pages\" value=\"".$this->datos["max_pages"]."\" />
			<input type=\"hidden\" name=\"max_items\" value=\"".$this->datos["max_items"]."\" />
			".$select_pagina."
			</td></tr>";
			$ret .= "</tfoot>";
		}
		
		$ret .= "</table>";
		
		return $ret;
	}
	
	public function get_items(){
		return $this->datos["items"];
	}
	
	public function get_campos(){
		return $this->datos["campos"];
	}
	
	public function render_opciones_headers(){
		$ret = "";
		foreach($this->datos["acciones"] as $nombre){
			$renderizar = true;
			//La acción "activar" tiene un comportamiento especial,
			//determinado por el campo "activo".
			if ($nombre == "activar"){
				$renderizar = (isset($row["activo"])) ? true : false;
			}
			//las acciones eliminar y modificar están determinadas por los permisos del usuario
			if ($nombre == "modificar"){
				$nombre = (isset($_SESSION["user"]) && $_SESSION["user"]->puede($this->get_tabla(), "UPDATE")) ? "modificar" : "ver";
			}
			if ($nombre == "eliminar"){
				$renderizar = (isset($_SESSION["user"]) && $_SESSION["user"]->puede($this->get_tabla(), "DELETE")) ? true : false;
			}
			if ($renderizar === true){
				$ret .= "<td class=\"lista_accion\">".$nombre."</td>";
			}
		}
		return $ret;
	}
	
	public function render_opciones($row){
		$ret = "";
		foreach($this->datos["acciones"] as $nombre){
			$tmp_item_id = isset($row[$this->datos["campo_id"]]) ? $row[$this->datos["campo_id"]] : null;
			if (is_null($tmp_item_id)){
				$tmp_item_id = isset($row[strtoupper($this->datos["campo_id"])]) ? $row[strtoupper($this->datos["campo_id"])] : null;
				$tmp_item_id = (is_null($tmp_item_id) && isset($row[strtolower($this->datos["campo_id"])])) ? $row[strtolower($this->datos["campo_id"])] : "";
			}
			
			$renderizar = true;
			//La acción "activar" tiene un comportamiento especial, determinado por el campo "activo".
			if ($nombre == "activar"){
				$nombre = (isset($row["activo"]) && $row["activo"] == "0") ? "activar" : "desactivar";
				$renderizar = (isset($row["activo"])) ? true : false;
			}
			
			//Las acciones "modificar" y "eliminar" están determinadas por los permisos del usuario.
			if ($nombre == "modificar"){
				$nombre = (isset($_SESSION["user"]) && $_SESSION["user"]->puede($this->get_tabla(), "UPDATE")) ? "modificar" : "ver";
			}
			if ($nombre == "eliminar"){
				$renderizar = (isset($_SESSION["user"]) && $_SESSION["user"]->puede($this->get_tabla(), "DELETE")) ? true : false;
			}
			
			if ($renderizar === true){
				$type = (strtolower($this->datos["form_mode"]) == "post") ? "submit" : "button";
				$ret .= "<td class=\"lista_accion\"><input type=\"".$type."\" value=\"".$nombre."\" name=\"boton_".$nombre."\" item_id=\"".$tmp_item_id."\" onclick=\"accion_".$nombre."(this);\" /></td>";
			}
		}
		return $ret;
	}
	
}

?>
