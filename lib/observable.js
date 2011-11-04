// @project XTranslate (lib/observable.js)
// @url https://github.com/extensible/XTranslate 

function observable( name, defvalue )
{
	var storage = widget.preferences;
	
	if( typeof defvalue == 'object' ){
		storage[name] = JSON.stringify(defvalue);
	}
	
	var obs = function __( chain, value )
	{
		var 
			prop,
			obj = JSON.parse(__.toString()),
			path = chain ? chain.split('.') : [],
			parent = obj;

		switch( arguments.length )
		{
			case 1:
				while( prop = path.shift() )
				{
					if( prop && parent[prop] !== undefined ){
						parent = parent[prop];
					}
					else return null
				}
				return parent;
			break;
			
			case 2:
				while( prop = path.shift() )
				{
					if( path.length == 0 )
					{
						var changed = parent[prop] !== value;
						parent[prop] = value;
						
						if( __.subscribes[chain] && changed ){
							__.subscribes[chain].forEach(function( callback ){
								callback(value, prop, parent, obj);
							});
						}
					}
					else {
						!parent[prop] && (parent[prop] = {});
						parent = parent[prop];
					}
				}
				storage[name] = JSON.stringify(obj);
			break;
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
