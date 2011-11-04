// @project XTranslate (background.js)
// @url https://github.com/extensible/XTranslate 

var settings = observable('settings');

window.XTranslate = 
{
	vendors: {
		get current(){
			var vendor = settings('vendor') || 'Google';
			return this.all[vendor] 
		},
		add: function( vendor ) {
			this.all[ vendor.name ] = vendor;
			vendor.loadData();
		},
		all: []
	},
	button: opera.contexts.toolbar.createItem(
	{
		popup: {
			href: 'options.html',
			width: 400,
			height: 550
		}
	}),
	updateButton: function( lang ){
		this.button.title = 'XTranslate ('+ [lang.from.toUpperCase(), '→', lang.to.toUpperCase()].join(' ') + ')';
		this.button.icon = 'icons/flags/'+ lang.to +'.png';
	}
};

// add button
opera.contexts.toolbar.addItem( XTranslate.button );

settings.follow('lang lang.from lang.to', function( value, prop, lang ){
	XTranslate.updateButton( typeof value == 'object' ? value : lang );
});

settings('lang', {
	from: settings('lang.from') || 'en',
	to: settings('lang.to') || navigator.userLanguage.split('-')[0]
});

// init
opera.extension.addEventListener('connect', function(evt)
{
	evt.source.postMessage(
	{
		action: 'init',
		css: function()
		{
			return [].slice.call(document.styleSheets[0].cssRules).map(function( rule ){
				return rule.cssText;
			}).join('\n');
		}(),
		widget: JSON.stringify(widget)
	});
}, false );

// messages handling
opera.extension.addEventListener('message', function(evt)
{
	try {
		var vendor = XTranslate.vendors.current.handler(evt.data);
		when( vendor ).then(function( data )
		{
			data.settings = settings.toJSON();
			evt.source.postMessage(data);
		});
	}
	catch(e){
		opera.postError(e)
	}
}, false );

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
