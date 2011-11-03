// @project XTranslate (background.js)
// @url https://github.com/extensible/XTranslate 

window.XTranslate = 
{
	vendors: {
		get current(){ return this.all[this.active || 'Google'] },
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
		},
		onclick: function(){
			//opera.contexts.toolbar.removeItem(this)
		}
	}),
	updateButton: function( lang ){
		this.button.title = 'XTranslate ('+ [lang.from.toUpperCase(), '→', lang.to.toUpperCase()].join(' ') + ')';
		this.button.icon = 'icons/flags/'+ lang.to +'.png';
	}
};

settings.follow('lang lang.from lang.to', function( value, prop, lang ){
	XTranslate.updateButton( typeof value == 'object' ? value : lang );
});

// add button
opera.contexts.toolbar.addItem( XTranslate.button );
settings('lang', {
	from: settings('lang.from') || 'en',
	to: settings('lang.to') || navigator.userLanguage.split('-')[0]
});

// init
opera.extension.addEventListener('connect', function(evt)
{
	evt.source.postMessage({
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
	dev('vendors/google.js', function(){
		XTranslate.vendors.current.handler(evt);
	});
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
