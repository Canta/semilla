<?php
/**
 * API Class 
 * A generic encapsulator for random API calls.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @date 20130125
 */ 
class API {
	
	/**
	 * public $data
	 * Associative array holding class properties.
	 * It's used an associative array instead of autonomous variables 
	 * because of an issue regarding data serialization and PHP version.
	 * That is, PHP 5.4 has an interfase for use with json_encode(); but
	 * in 5.3 and previous, json_enconde() has access to the object public
	 * properties. So... it's much more easier to just state a public
	 * associative array than trying to serialize a thousand custom vars.
	 * So far, hadn't any trouble with this pattern in real life.
	 */ 
	public $data;
	
	public function __construct(){
		// data array initialization.
		$this->data = Array();
		// by default, the response is successful.
		// it is expected that the API scripts change that on error.
		$this->data["response"] = new APIResponse();
		// sets the default error handler for all api calls
		//set_error_handler(create_function("\$errno, \$errstr, \$errfile, \$errline", "die(json_encode(APIResponse::fail(\"Error #\".\$errno.\": \".\$errstr)));"));
		//set_error_handler("API::errorHandler");
	}
	
	/** 
	 * error_handler function 
	 * Little error handler function in order for warnings to behave like errors.
	 * This is important when working on an api, as warning texts in the 
	 * output breaks the desired output format. 
	 * 
	 * @param int $errno The error number.
	 * @param string $errstr Error's description.
	 * @param string $errfile Filename where the error happened.
	 * @param int $errline Line number where the error happened.
	 */
	public static function errorHandler($errno, $errstr, $errfile, $errline) {
		$ret = APIResponse::fail("Error #".$errno.": ".$errstr."\n\n".$errfile.", línea ".$errno);
		die(json_encode($ret));
	}
	
	/**
	 * public function do_your_stuff
	 * This function is intended to be overloaded by any class inheriting 
	 * API. It's the API main entry.
	 * 
	 * @param Array $arr An associative array of arbitrary structure.
	 * @returns APIResponse
	 */ 
	public function do_your_stuff($arr){
		return $this->data["response"];
	}
	
}

/**
 * APIResponse class
 * A class to manage API responses in a generic way
 */ 
class APIResponse{
	
	public $success;
	// Same as API's $data
	public $data;
	
	public function __construct($suc = true, $msg = "Operation finished."){
		$this->success = ($suc === true);
		$this->data = Array("message"=>$msg);
	}
	
	public static function fail($msg = "Operation failed."){
		return new APIResponse(false, $msg); 
	}
	
}

?>
