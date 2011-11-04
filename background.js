// @project XTranslate (background.js)
// @url https://github.com/extensible/XTranslate 

var 
	settings = observable('settings'),
	css = [].slice.call(document.styleSheets[0].cssRules).filter(function(rule){
		return rule.selectorText == '.XTranslate';
	})[0].style;

settings(
{
	vendor: 'Google',
	trigger: {
		type: 'keypress',
		hotkey: 'Ctrl+Shift+X'
	},
	lang: {
		from: 'en',
		to: navigator.userLanguage.split('-')[0]
	},
	button: {
		show: true
	},
	user: {
		css: {
			background: {
				color: [css.backgroundColor, css.borderColor],
				linear: true
			},
			border: {
				color: css.borderColor,
				width: parseInt(css.borderWidth),
				radius: parseInt(css.borderTopLeftRadius)
			},
			text: {
				font: css.fontFamily.replace(/"/g, ''),
				color: css.fontColor,
				size: parseInt(css.fontSize)
			},
			shadow: {
				color: css.backgroundColor,
				size: parseInt(css.boxShadow.split(' ').pop()),
				inset: css.boxShadow.indexOf('inset') > -1
			}
		}
	}
}, true);

settings.follow('lang.from lang.to', function( value, prop, lang ){
	XTranslate.updateButton(lang);
});

settings.follow('button.show', function( value )
{
	value
	? opera.contexts.toolbar.addItem(XTranslate.button)
	: opera.contexts.toolbar.removeItem(XTranslate.button);
});

window.XTranslate = 
{
	vendors: {
		get current(){
			var vendor = settings('vendor');
			return this.all[vendor]; 
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
settings('button.show') && opera.contexts.toolbar.addItem( XTranslate.button );
XTranslate.updateButton( settings('lang') );

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
