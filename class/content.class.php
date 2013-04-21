<?php

class Content {
	
	public $data;
	
	public function __construct($str = ""){
		
		$this->data["id"] = 0;
		$this->data["properties"] = Array(
			Array("name" => "Content's name"),
			Array("description" => "Content's description")
		);
		$this->data["external_links"] = Array();
		$this->data["references"] = Array();
		$this->data["fragments"] = Array();
		$this->data["kind"] = "text"; //text, audio, or video. Default text.
		$this->data["origin"] = Array( 
			//This property is intended to save the full serialized raw 
			//input file in Base64.
			Array("raw" => ""),
			Array("content_type" => ""),
			Array("file_name" => "")
		);
		
		if (!is_null($str) && $str !== ""){
			$this->load_json($str);
		}
		
	}
	
	public function load_json($str){
		$this->data = json_decode($str,true);
		
		if (is_null($this->data)){
			$this->data = json_decode(stripslashes($str),true);
		}
		
		if (is_null($this->data)){
			throw new Exception("Content->load: Could not parse JSON string.");
		}
	}
	
	public function get_fragment_stats(){
		
		$ready = 0;
		$parsed = 0;
		$empty = 0;
		
		for ($i = 0; $i < count($this->data["fragments"]); $i++){
			if (!isset($this->data["fragments"][0])){
				die(var_dump($this->data));
			}
			if (isset($this->data["fragments"][$i]["ready"]) && $this->data["fragments"][$i]["ready"] === true){
				$ready++;
			} else if (count($this->data["fragments"][$i]["corrections"]) > 0){
				$c = $this->data["fragments"][$i]["corrections"][count($this->data["fragments"][$i]["corrections"])-1];
				if (isset($c["ready"]) && $c["ready"]===true){
					$ready++;
					$this->data["fragments"][$i]["ready"] = true;
				}else{
					$parsed++;
					$this->data["fragments"][$i]["parsed"] = true;
				}
			} else if (isset($this->data["fragments"][$i]["parsed"]) && $this->data["fragments"][$i]["parsed"] === true){
				$parsed++;
			} else {
				$empty++;
			}
		}
		
		$ret = Array("ready"=>$ready, "parsed"=>$parsed, "empty"=>$empty, "total"=>($ready+$parsed+$empty));
		return $ret;
	}
	
	public function to_json(){
		return json_encode($this->data);
	}
	
}


?>
