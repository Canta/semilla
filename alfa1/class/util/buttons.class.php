<?php
require_once ("fields.class.php");

/*
 * 20120523 - Daniel Cantarín - Commsur S.R.L.
 * Clase FormButton, para gestionar botones arbitrarios en formularios de ABMs.
 * 
 */


class FormButton extends Field {
	
	const FB_TIPO_BOTON = "button";
	const FB_TIPO_SUBMIT = "submit";
	//private $tipo_boton;
	
	public function __construct($id="", $rotulo="", $value = "", $tipo = "button", $eventos = null){
		parent::__construct($id, $rotulo, $value);
		$this->set_tipo_boton($tipo);
		
		if (!is_null($eventos) && is_array($eventos) ){
			$this->set_events($eventos);
		}
		
	}
	
	public function set_tipo_boton($tipo = "button"){
		
		if ($tipo != self::FB_TIPO_BOTON && $tipo != self::FB_TIPO_SUBMIT){
			throw new Exception("Clase FormButton, método set_tipo_boton(): Tipo inválido.");
		}
		
		$this->data["tipo_boton"] = $tipo;
	}
	
	public function get_tipo_boton(){
		return $this->data["tipo_boton"];
	}
	
	//sobrecarga del método render, para que dibuje un botón.
	public function render(){
		
		$ret = "";
		if ($this->get_rotulo() != ""){
			$ret .= "<span class=\"FormButton_rotulo\">".$this->get_rotulo()."</span> <span class=\"FormButton_boton\">";
		} else {
			$ret .= "<span class=\"FormButton_boton\">";
		}
		
		
		$type = $this->get_tipo_boton();
		
		$ret .= "<input id='".$this->get_id()."' name='".$this->get_id()."' type='".$type."' value='".$this->get_valor()."' alt='".str_replace("'","`",$this->get_rotulo())."' ";
		
		foreach ($this->get_events() as $key => $value) {
			$ret .= " ".$key." =\"". str_replace('"','\\"',$value)."\" ";
		}
		
		$ret .= " /></span>";
		
		return $ret;
	}
}
