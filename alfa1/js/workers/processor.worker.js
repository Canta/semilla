/**
 * processor.worker.js
 * Web Worker for binary blobs client-side processing
 * 
 * It generates a Semilla's processed object.
 * 
 * @author Daniel Cantarín <omega_canta@yahoo.com>
 * @version 1.0
 * @date 20130129
 */
self.onmessage = function(evt){
	if (typeof evt.data == "object" && evt.data.kind !== undefined){
		self.data = evt.data;
		
		if (self.data.kind.toLowerCase() == "audio"){
			self.process_audio()
		} else if (self.data.kind.toLowerCase() == "text"){
			self.process_text()
		} else if (self.data.kind.toLowerCase() == "video"){
			self.process_video()
		} else {
			self.terminate();
		}
		
	} else {
		self.terminate();
	}
};


self.process_audio = function(){
	
};

self.process_text = function(){
	
};

self.process_video = function(){
	
};
