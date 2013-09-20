// Guardamos la función hasOwnProperty porque es posible
// crear una propiedad con el mismo nombre

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Funciones de utilidad general.
 */
lang = {
	
	/**
	 * Asegura que las expresiones sean verdaderas
	 */
	assert: function() {
		
		Array.prototype.forEach.call(arguments, function(arg) {
		
			if(!arg)
				throw new Error("Assertion failed.");
		});
	},
	
	/**
	 * Indica si un objeto tiene una propiedad no heredada.
	 * @param Object object
	 * @param string prop
	 * @return boolean Verdadero si la propiedad existe en el objeto y
	 * no es heredada.
	 */
	has: function(object, prop) {
		
		return hasOwnProperty.call(object, prop);
	},

	/**
	 * Recorre las propiedades no heredadas de un objeto usando una función.
	 * @param Object object Objeto.
	 * @param Function callback Función a ejecutar por propiedad.
	 * El primer argumento para la función es el valor de la propiedad y el segundo
	 * es el nombre.
	 * Si retorna falso el ciclo es interrumpido.
	 * @param Object scope Contexto de la función.
	 * @return boolean Verdadero si el ciclo fue interrumpido.
	 */
	each: function(object, callback, scope) {
	
		for(var prop in object) {
			
			if(!this.has(object, prop))
				continue;
			
			if(callback.call(scope, object[prop], prop) === false) {
				
				return false;
			}
		}
		
		return true;
	},

	/**
	 * Copia todas las propiedades no heredadas de object en target.
	 * @param Object target
	 * @param Object object
	 */
	mixin: function(target, object) {
		
		if(!object)
			return;

		this.each(object, function(value, name) {

			target[name] = value;
		});
	},
	
	/**
	 * Crea una función con un contexto fijado.
	 * @param Object scope Objeto this a fijar.
	 * @param Function fn Función a ejecutar.
	 * @return Function Función que ejecuta fn con el contexto scope.
	 */
	hitch: function(scope, fn) {
		
		return function() {
			fn.apply(scope, arguments);
		};
	},

	/**
	 * Crea una clase.
	 * @param Function base Constructor de la clase base, o null.
	 * @param Object proto Objeto con propiedades a copiar en el prototipo de la nueva clase.
	 * Si el objeto tiene una propiedad no heredada "constructor" se usa como el constructor de la clase;
	 * en caso contrario se crea uno que por defecto toma un objeto de configuración,
	 * o si hay una clase base, se usa el de la clase base.
	 * @return Function Constructor de la clase creada.
	 */
	declare: function(base, proto) {
		
		this.assert(
			!base || base instanceof Function,
			proto instanceof Object);

		var ctor;
		
		if(this.has(proto, "constructor")) {
			
			ctor = proto.constructor;
			
		} else {
			
			// siempre creamos un objeto de función nuevo para que
			// instanceof funcione bien
			
			ctor = base ?
				function() {
					
					// si hay una clase base, creamos un constructor
					// que lo reutilice: igual que PHP
					base.apply(this, arguments);
				} :
				function(options) {
					
					lang.mixin(this, options);
				};
			
		}

		if(base) {
			ctor.prototype = new base;
			
			ctor.prototype.super = function(method) {
				
				base.prototype[method].apply(
					this,
					Array.prototype.slice.call(arguments, 1));
			};
		}

		this.mixin(ctor.prototype, proto);
		return ctor;
	}

};
