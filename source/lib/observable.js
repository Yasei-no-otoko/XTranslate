// @project XTranslate (lib/observable.js)
// @url https://github.com/extensible/XTranslate 

function observable( name, defvalue )
{
	var storage = widget.preferences;
	
	if( typeof defvalue == 'object' ){
		storage[name] = JSON.stringify(defvalue);
	}
	
	var obs = function __( chain, value, if_not_defined )
	{
		var 
			prop,
			args = [].slice.call(arguments),
			obj = JSON.parse(__.toJSON()),
			path = typeof chain == 'string' ? chain.split('.') : [],
			parent = obj;
		
		function getter()
		{
			while( prop = path.shift() )
			{
				if( prop && parent[prop] !== undefined ){
					parent = parent[prop];
				}
				else return null
			}
			return parent;
		}
		
		function setter()
		{
			while( prop = path.shift() )
			{
				if( path.length == 0 )
				{
					var 
						current = parent[prop],
						new_value = typeof value == 'function' ? value.call(parent, current) : value;
					if( current !== new_value )
					{
						if( !if_not_defined || current === undefined )
						{
							if( new_value !== undefined ){
								parent[prop] = new_value;
							}
							else {
								delete parent[prop];
							}
						}
						
						storage[name] = JSON.stringify(obj);
						
						if( __.subscribes[chain] ){
							__.subscribes[chain].forEach(function( callback ){
								callback(new_value, prop, parent, obj);
							});
						}
					}
				}
				else {
					!parent[prop] && (parent[prop] = {});
					parent = parent[prop];
				}
			}
		}
		
		// behavior
		if( typeof chain == 'object' ){
			for(var i in chain){
				chain.hasOwnProperty(i) && __(i, chain[i], args[1]);
			}
		}
		else if( args.length == 1 ){
			return getter();
		}
		else if( args.length >= 2 ){
			setter();
		}
		
		return obj;
	}
	
	// extend
	obs.prototype = {
		subscribes: {},
		
		clear: function(){
			delete storage[name];
		},
		toString: function(){
			return storage[name] || '{}';
		}
	};
	
	[observable.prototype, obs.prototype].forEach(function( obj ){
		for(var i in obj) {
			obj.hasOwnProperty(i) && (obs[i] = obj[i]);
		}
	});
	
	return obs;
}

observable.prototype = {
	follow: function( path, callback )
	{
		path.trim().split(/\s+/).forEach(function( path )
		{
			!this.subscribes[path] && (this.subscribes[path] = []);
			this.subscribes[path].push(callback);
		}, this);
	},
	
	unfollow: function( path, callback )
	{
		path.trim().split(/\s+/).forEach(function( path )
		{
			if( callback ) {
				var index = (this.subscribes[path] || []).indexOf(callback);
				index > -1 && this.subscribes[path].splice(index, 1);
			}
			else if( this.subscribes[path] ){
				delete this.subscribes[path];
			}
		}, this);
	},
	
	toJSON: function(){ return this.toString() }
};
