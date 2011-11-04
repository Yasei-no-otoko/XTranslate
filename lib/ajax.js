// @project XTranslate (lib/ajax.js)
// @url https://github.com/extensible/XTranslate 

function ajax(opt) {
	var
		xhr 		= new XMLHttpRequest,
		context 	= opt.context || xhr,
		async 		= opt.async || true,
		url 		= opt.url || location.href,
		method 		= opt.method || 'GET',
		complete 	= opt.complete || function(){},
		type 		= opt.type || 'text/plain';
		binary 		= opt.binary || false;
		data 		= opt.data ? encodeURIComponent(opt.data) : null;
	
	xhr.open(method, url, async);
	binary && xhr.overrideMimeType('text/plain; charset=x-user-defined'); // some magic
	xhr.onreadystatechange = function() {
		if( this.readyState == 4 )
		{
			var response = this.responseText;
			binary && (this.dataURL = 'data:'+ type + ';base64,'+ btoa(response));
			complete.call(context, response);
		}
	};
	xhr.send(data);
	
	return ajax;
}

function deferred( callback )
{
	var _deferred = {
		resolved: false,
		resolve: function( result )
		{
			this.resolved = true;
			if( arguments.length ){
				this.returnValue = function(){
					return result;
				}
			}
		},
		data: function __( name, value ){
			__.storage = __.storage || {};
			return (
				arguments.length == 2
				? (__.storage[name] = value)
				: __.storage[name]
			);
		}
	};
	
	callback(_deferred);
	
	return function( ready ){
		return ready 
			? (_deferred.returnValue ? _deferred.returnValue() : _deferred)
			: _deferred.resolved;
	};
}

function when()	{
	var 
		_this = {
			then: function( callback ){
				this.callback = callback;
			}
		},
		args = [].slice.call(arguments);
	var checking = setInterval(function()
	{
		_this.cond = args.every(function(obj) {
			 var result = obj instanceof Function ? obj() : obj;
			 return result;
		});
		if( _this.cond )
		{
			clearInterval(checking);
			_this.callback.apply(_this, args.map(function(obj){
				return obj instanceof Function ? obj(true) : obj;
			}));
		}
	}, 10);
	
	return _this;
}
