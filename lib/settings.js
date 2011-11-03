// @project XTranslate (lib/settings.js)
// @url https://github.com/extensible/XTranslate 

var settings = function __( chain, value )
{
	var 
		prop,
		storage = widget.preferences,
		settings = JSON.parse(storage.settings || '{}'),
		parent = settings,
		path = chain ? chain.split('.') : [];
	
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
							callback(value, prop, parent, settings);
						});
					}
				}
				else {
					!parent[prop] && (parent[prop] = {});
					parent = parent[prop];
				}
			}
			storage.settings = JSON.stringify(settings);
		break;
	}
	
	return settings;
}

settings.subscribes = {};

settings.follow = function( path, callback )
{
	path.trim().split(/\s+/).forEach(function( path )
	{
		!settings.subscribes[path] && (settings.subscribes[path] = []);
		settings.subscribes[path].push(callback);
	});
};

settings.unfollow = function( path, callback )
{
	path.trim().split(/\s+/).forEach(function( path )
	{
		if( callback ) {
			var index = (settings.subscribes[path] || []).indexOf(callback);
			index > -1 && settings.subscribes[path].splice(index, 1);
		}
		else if( settings.subscribes[path] ){
			delete settings.subscribes[path];
		}
	});
};

settings.clear = function(){
	delete widget.preferences.settings;
};

settings.toJSON = function(){
	return JSON.stringify(settings());
};
