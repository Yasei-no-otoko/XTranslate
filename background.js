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

// init
opera.extension.addEventListener('connect', function(evt)
{
	evt.source.postMessage({
		action: 'init',
		css: document.querySelector('style').textContent,
		widget: JSON.stringify(widget)
	});
}, false );

// messages handling
opera.extension.addEventListener('message', function(evt)
{
	//XTranslate.vendors.current(evt);
	dev('vendors/google.js', function(){
		XTranslate.vendors.current(evt);
	});
}, false );

