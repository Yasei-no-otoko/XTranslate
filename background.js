// @project XTranslate (background.js)
// @url https://github.com/extensible/XTranslate 

var lang = {
	get from(){
		return (widget.preferences['lang.from'] || 'en');
	},
	set from( value ){
		widget.preferences['lang.from'] = value;
		XTranslate.updateButton();
	},
	get to(){
		return (
			widget.preferences['lang.to'] || 
			navigator.userLanguage.split('-')[0]
		);
	},
	set to( value ){
		widget.preferences['lang.to'] = value;
		XTranslate.updateButton();
	}
};

window.XTranslate = 
{
	vendors: {
		get current(){ return this.all[this.active || 'google'] },
		'set': function( name, handler ){ this.all[name] = handler },
		'all': []
	},
	button: opera.contexts.toolbar.createItem(
	{
		popup: {
			href: 'options.html',
			width: 350,
			height: 450
		},
		onclick: function(){
			//opera.contexts.toolbar.removeItem(this)
		}
	}),
	updateButton: function(){
		this.button.title = 'XTranslate ('+ [lang.from.toUpperCase(), '→', lang.to.toUpperCase()].join(' ') + ')';
		this.button.icon = 'icons/flags/'+ lang.to +'.png';
	}
};

// add button
opera.contexts.toolbar.addItem( XTranslate.button );
XTranslate.updateButton();

// save message port
opera.extension.addEventListener('connect', function(evt) {
	evt.source.postMessage('');
}, false );

// messages handling
opera.extension.addEventListener('message', function(evt)
{
	//XTranslate.vendors.current(evt);
	dev('vendors/google.js', function(){
		XTranslate.vendors.current(evt);
	});
}, false );

function ajax(opt) {
	var
		xhr 		= new XMLHttpRequest,
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
			complete.call(this, response);
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


// development mode
function dev( filepath, callback ){
	ajax({
		url: filepath +'?'+ Date.now(),
		complete: function( code ){
			eval(code);
			callback();
		}
	});
}
