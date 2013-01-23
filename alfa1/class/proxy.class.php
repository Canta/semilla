<?php

/**
 * Proxy Class.
 * Redirects a request to one or many destinations.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20120611
 * 
 **/

require_once("util.class.php");

class Proxy{
	
	protected $datos;
	
	public function __construct($args = null){
		$this->datos = Array();
		$args = (is_null($args)) ? Array() : $args;
		
		//Gestión de destinos. 
		$this->clear_destinos();
		if (isset($args["destinos"])){
			foreach ($args["destinos"] as $des){
				$this->add_destino($des);
			}
		}
		if (isset($args["destino"])){
			$this->add_destino($args["destino"]);
		}
		
		//Gestión de eventos
		$this->datos["eventos"] = Array("on_origin_request" => Array(), "on_destination_response" => Array(), "on_destination_request" => Array(), "on_origin_response" => Array());
		
	}
	
	public function add_destino($des){
		$this->datos["destinos"][] = $des;
	}
	
	public function get_destinos(){
		return $this->datos["destinos"];
	}
	
	public function set_referer($val){
		$this->datos["referer"] = $val;
	}
	
	public function get_referer(){
		return isset($this->datos["referer"]) ? $this->datos["referer"] : "";
	}
	
	//Función add_handler()
	//Agrega un item a la lista de eventos.
	public function add_handler($nombre_evento, $callback = ""){
		//"callback" puede ser un objeto Evento o un string a ejecutar mediante eval()
		if (!(is_string($callback) || get_class($callback) == "Evento")){
			throw new Exception("Clase Proxy, método add_handler: se esperaba un string o un objeto de tipo Evento.");
		}
		
		if (!isset($this->datos["eventos"][$nombre_evento])){
			$this->datos["eventos"][$nombre_evento] = Array();
		}
		
		$this->datos["eventos"][$nombre_evento][] = $callback;
	}
	
	//Función resend_data()
	//Dada una URL, toma la dirección y los parámetros GET, para luego 
	//reenviar ese request a todos los servidores registrados (típicamente, uno solo).
	//$data debería contener información cruda posteable; se envía directamente vía POST cuando no es null. 
	public function resend_data($url, $data = null){
		//Detono el evento on_origin_request
		foreach ($this->datos["eventos"]["on_origin_request"] as $e){
			if (is_string($e)){
				eval($e);
			} else if (get_class($e) == "Evento"){
				$e->raise(Array("url"=>$url, "data"=>$data));
			}
		}
		
		$res = Array();
		$tmp_url = "";
		
		//Trabajo con los servidores cargados
		foreach ($this->datos["destinos"] as $d){
			$tmp_url = rtrim($d . "?" . parse_url($url, PHP_URL_QUERY),"?");
			//die(var_dump($tmp_url));
			//Ahora abro una conexión y establezco los parámetros.
			$c = curl_init();
			curl_setopt($c, CURLOPT_URL, $tmp_url);
			curl_setopt($c, CURLOPT_RETURNTRANSFER, True);
			curl_setopt($c, CURLOPT_FOLLOWLOCATION, true);
			curl_setopt($c, CURLOPT_FRESH_CONNECT, true);
			//curl_setopt($c, CURLOPT_HEADER, true);
			
			//referer
			if ($this->get_referer() != ""){
				curl_setopt($c, CURLOPT_REFERER, $this->get_referer());
			} else {
				curl_setopt($c, CURLOPT_AUTOREFERER, True);
			}
			
			//Si hay data, se asume post, caso contrario, se asume get.
			if (!is_null($data) && $data != ""){
				curl_setopt($c, CURLOPT_POST, TRUE);
				curl_setopt($c, CURLOPT_POSTFIELDS, $data);
			} else {
				curl_setopt($c, CURLOPT_HTTPGET, TRUE);
			}
			
			//Envío, cierro la conexión, y devuelvo el resultado
			$res[] = Array("url"=>$tmp_url,"respuesta"=>curl_exec($c));
			curl_close($c);
			//Detono el evento on_origin_request
			foreach ($this->datos["eventos"]["on_destination_response"] as $e){
				if (is_string($e)){
					eval($e);
				} else if (get_class($e) == "Evento"){
					$e->raise();
				}
			}
		}
		
		return $res;
		
	}
	
	
	public function clear_destinos(){
		$this->datos["destinos"] = Array();
	}
	
}

?>
