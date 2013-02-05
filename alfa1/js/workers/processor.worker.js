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

self.running = false;
self.data = {};
self.ret = {};

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
	self.running = true;
	
	// From audio files, i need the duration.
	// TODO: implement a good audio library for this task.
	self.data.file.extra_data.duration = NaN;
	try{
		/*
		var a = window.URL.createObjectURL($file);
		var b = new Audio(a);
		b.index = app.contents.files.length;
		b.load();
		b.addEventListener("durationchange", function(event) {
			app.contents.files[this.index].extra_data.duration = event.target.duration;
		});
		*/
		
		a = FileReader();
		a.readAsDataURL(self.data.file);
		a.onloadend = function(evt){
			if (evt.target.readyState == FileReader.DONE) { // DONE == 2
				
				b = soundManager.createSound({
					id: 'test',
					url: evt.target.result,
					autoLoad: true,
					autoPlay: false,
					index: app.contents.files.length,
					onload: function() {
						alert("sasa");
						console.log([this.duration, this.durationEstimate, this]);
						app.contents.files[this.index].extra_data.duration = this.duration;
						this.destruct();
					},
					volume: 50
				});
				
				/*
				var b = new Audio(evt.target.result);
				b.index = app.contents.files.length;
				b.load();
				b.addEventListener("load", function(event) {
					console.debug([this.duration]);
					app.contents.files[this.index].extra_data.duration = event.target.duration;
				});
				*/
			}
		}
		
	} catch($e){
		// nothing
	}
	
	self.running = false;
};

self.process_text = function(){
	self.running = true;
	
	self.data.file.extra_data.pages = [];
	a = FileReader();
	
	a.readAsArrayBuffer(self.data.file);
	a.onloadend = function(evt){
		if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			//var c = convertDataURIToBinary(evt.target.result);
			var c = Uint8Array(evt.target.result);
			PDFJS.getDocument(c).then(function(pdf) {
				//console.debug(pdf.pdfInfo.numPages);
				self.ret.raw_in_process = pdf;
				$("#content-create-process-output").html("");
				self.processed_pages = [];
				for (var $i=0; $i < pdf.pdfInfo.numPages; $i++){
					pdf.getPage($i +1).then(function(page){
						var scale = 1.5;
						var viewport = page.getViewport(scale);
						var canvas = document.createElement("canvas");
						$("#content-create-process-output").append(canvas)
						var context = canvas.getContext('2d');
						canvas.height = viewport.height;
						canvas.width = viewport.width;
						var renderContext = {
							canvasContext: context,
							viewport: viewport
						};
						page.render(renderContext).then(
							function(){
								self.processed_pages.push(true);
								if (self.ret.raw_in_process.pdfInfo.numPages == self.processed_pages.length){
									self.postMessage(self.ret);
									self.terminate();
								}
							}
						);
						
					});
				}
			});
		}
		
	}
	
	self.running = false;
};

self.process_video = function(){
	self.running = true;
	
	
	self.running = false;
};
