// @project XTranslate (background.js)
// @url https://github.com/extensible/XTranslate 

var settings = observable('settings');
var configure = function __( callback )
{
	settings(
	{
		vendor: 'Google',
		trigger: {
			type: 'keypress',
			hotkey: 'Ctrl+Shift+X'
		},
		lang: {
			from: 'auto',
			to: navigator.userLanguage.split('-')[0],
			ui: {
				current: 'en'
			}
		},
		button: {
			show: true,
			trigger: false,
			popup: {
				href: 'options.html',
				width: 420,
				height: 550
			}
		},
		user: {
			css: userCSSDefault(),
			theme: "Default"
		}
	}, true);
	
	// new settings
	settings({
		'button.voice': 'visible',
		'blocks.shut': {
			"hotkey": false,
			"vendor": false,
			"other": false,
			"customization": true
		}
	}, true);
	
	// loading json files
	when(
		deferred(function( dfr )
		{
			ajax({
				url: 'json/themes',
				complete: function( json )
				{
					var themes = eval('('+ json +')');
					settings('user.themes', function()
					{
						return [{
							name: this.theme,
							css: this.css
						}].concat(themes);
					}, true);
					dfr.resolve();
				}
			});
		}),
		deferred(function( dfr )
		{
			ajax({
				url: 'json/langs',
				complete: function( langs )
				{
					var ui = JSON.parse(langs.replace(/\/\*[\s\S]+?\*\//g, ''));
					settings('lang.ui', function(v){
						ui.current = v.current;
						return ui;
					});
					dfr.resolve();
				}
			});
		})
	).then(callback || function(){});
	
	return __;
}();

var images = {};
ajax({
	binary: true,
	type: 'image/png',
	url: 'icons/volume.png',
	complete: function(){
		images.volume = this.dataURL; // base64
	}
});

settings.follow('lang.from lang.to', function( value, prop, lang ){
	XTranslate.updateButton(lang);
});

settings.follow('button.show', function( value )
{
	value
	? opera.contexts.toolbar.addItem(XTranslate.button)
	: opera.contexts.toolbar.removeItem(XTranslate.button);
});

settings.follow('button.trigger', function()
{
	settings('button.show', function()
	{
		setTimeout(function()
		{
			XTranslate.button = button();
			XTranslate.updateButton();
			settings('button.show', true);
		}, 10);
		return false;
	});
});

window.XTranslate = 
{
	vendors: function()
	{
		var vendors = [];
		
		vendors.__defineGetter__('current', function()
		{
			var vendor = settings('vendor');
			return this.filter(function(v){
				return v.name == vendor;
			}).shift();
		});
		
		vendors.add = function( vendor ){
			this.push( vendor );
			vendor.loadData();
		};
		
		return vendors;
	}(),
	button: button(),
	updateButton: function( lang ){
		var 
			lang = lang || settings('lang'),
			arrow = String.fromCharCode(8594);
		this.button.title = 'XTranslate ('+ [lang.from.toUpperCase(), arrow, lang.to.toUpperCase()].join(' ') + ')';
		this.button.icon = 'icons/flags/'+ lang.to.split('-').shift() +'.png';
	}
};

function button()
{
	var config = {
		popup: settings('button.popup'),
		onclick: function( evt ){
			opera.extension.broadcastMessage({
				action: 'translate'
			});
		}
	};
	delete config[
		settings('button.trigger') ? 'popup' : 'onclick'
	];
	return opera.contexts.toolbar.createItem(config);
}

// add button
settings('button.show') && opera.contexts.toolbar.addItem( XTranslate.button );
XTranslate.updateButton();

// init
opera.extension.addEventListener('connect', function(evt)
{
	evt.source.postMessage(
	{
		action: 'init',
		css: function() {
			return [].slice.call(document.styleSheets[0].cssRules).map(function( rule ){
				return rule.cssText;
			}).join('\n');
		}(),
		userCSS: userCSS(),
		customCSS: settings('user.custom.css'),
		settings: settings(),
		widget: JSON.stringify(widget)
	});
}, false );

// messages handling
opera.extension.addEventListener('message', function(evt)
{
	try {
		var 
			params = evt.data,
			handler = params.action || 'handler';
		when( XTranslate.vendors.current[ handler ]( params ) )
			.then(function( data ) {
				evt.source.postMessage(data)
			});
	}
	catch(e){
		opera.postError(e)
	}
}, false );

function userCSSDefault()
{
	var	
		css = [].slice.call(document.styleSheets[0].cssRules).filter(function(rule){
			return rule.selectorText == '.XTranslate';
		})[0].style,
		
		colors = {
			bgc		: color( css.backgroundColor ),
			border	: color( css.borderColor ),
			text	: color( css.color )
		};
	
	return {
		background: {
			color: [colors.bgc, colors.border],
			linear: true,
			opacity: 100
		},
		border: {
			color: colors.border,
			width: parseInt(css.borderWidth),
			radius: parseInt(css.borderTopLeftRadius)
		},
		text: {
			color: colors.text,
			font: css.fontFamily.split(/\s*,\s*/)[0].replace(/"/g, ''),
			size: parseInt(css.fontSize),
			shadow: {
				offset: [1,1],
				radius: 0,
				color: colors.border
			}
		},
		shadow: {
			size: 10,
			color: colors.bgc,
			inset: css.boxShadow.indexOf('inset') > -1
		}
	};
}

function userCSS()
{
	var 
		user = settings('user'),
		theme = user.themes.filter(function( theme ) {
			return theme.name == user.theme;
		}).shift(),
		css = theme ? theme.css : user.css,
		opacity = css.background.opacity / 100,
		background = [
			color(css.background.color[0], opacity),
			color(css.background.color[1], opacity)
		],
		style = [];
	
	style.push(
		'background-color: '+ background[0],
		'background-image: '+ ( css.background.linear 
			? '-o-linear-gradient(top, '+ background[0] +' 0%, '+ background[1] +' 70%)' 
			: 'none'
		)
	);
	
	style.push(
		'border: '+ css.border.width + 'px solid '+ css.border.color,
		'border-radius: '+ css.border.radius + 'px'
	);
	
	style.push(
		'color: '+ css.text.color,
		'font-family: '+ css.text.font,
		'font-size: '+ css.text.size + 'px'
	);
	
	style.push(
		'box-shadow: 0 0 '+ (css.shadow.inset ? 'inset ' : '') + css.shadow.size + 'px '+ css.shadow.color,
		'text-shadow: '
			+ css.text.shadow.offset[0] + 'px '
			+ css.text.shadow.offset[1] + 'px '
			+ css.text.shadow.radius + 'px '
			+ css.text.shadow.color
	);
	
	return style.join('; ');
}

function color( color, opacity )
{
	var color = color.indexOf('rgb') == 0
		? '#'+ color.match(/\d+/g).slice(0,3).map(function( color )
		{
			var hex = Number(color).toString(16);
			return hex.length == 1 ? hex + hex : hex;
		}).join('')
		: color;
	
	if( opacity != null )
	{
		color = 'rgba(' + color.slice(1).replace(/([0-9a-f]{2})/gi, function(S,$1){
			return parseInt($1, 16) + ', ';
		}) + opacity + ')';
	}

	return color;
}
