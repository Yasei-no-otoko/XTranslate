// @project XTranslate (options.js)
// @url https://github.com/extensible/XTranslate  

function $( selector, ctx ){
	var nodes = [].slice.call((ctx || document).querySelectorAll(selector));
	return nodes.length == 1 ? nodes[0] : nodes;
}

function parse( tmpl, data )
{
	return tmpl.replace(/\$\{([\w.]+)\}/g, function(S, prop)
	{
		var props = prop.split('.');
		return function()
		{
			var value = data[ props.shift() ];
			while( prop = props.shift() ){
				value = value[prop];
			}
			return value;
		}();
	});
}

window.addEventListener('DOMContentLoaded', function( evt )
{
	var 
		bg = opera.extension.bgProcess,
		vendors = bg.XTranslate.vendors;

	+function()
	{
		var 
			elem = $('#vendors'),
			tmpl = elem.innerHTML,
			html = '';
		
		vendors.forEach(function( vendor )
		{
			html += parse(tmpl, 
			{
				vendor: vendor.name,
				url: vendor.url,
				text: vendor.url.replace(/^http[s]?:\/\/([^\/]*)\/?/gi, '$1')
			});
		});
		
		elem.innerHTML = html;
	}();

	var preview = function()
	{
		var popup = $('.XTranslate');
		return function __(){
			popup.setAttribute('style', bg.userCSS());
			return __;
		}();
	}();
	
	var updateLangs = function __()
	{
		var options = '';
		
		vendors.current.langs.forEach(function( lang ){
			options += parse('<option value="${iso}">${name}</option>', lang);
		});
		
		$('select[name^="lang."]').forEach(function( elem )
		{
			var value = bg.settings(elem.name);
			elem.innerHTML = options;
			elem.value = value;
			elem.value != value && bg.settings(elem.name, elem.value); // fix, if lang not exists (when we change vendor)
			updateIcon(elem);
		});
		
		return __;
	}();
	
	function updateIcon( elem )
	{
		var value = elem.value;
		var icon = $('img[name="'+ elem.name +'"]');
		icon.src = 'icons/flags/'+ value +'.png';
		icon.alt = value;
	}
	
	function updateState( elem )
	{
		var 
			type = elem.type,
			value = bg.settings(elem.name);
		
		elem.title = value;
		elem.name == 'trigger.hotkey' && (value = value.split('+').slice(1).join('+'));
		
		if( type == 'checkbox' ) {
			value 
				? elem.setAttribute('checked', true)
				: elem.removeAttribute('checked');
		}
		else if( type == 'radio' ){
			elem.value == value && (elem.checked = true);
		}
		else {
			elem.value = value;
		}
		
		// bind handler
		type == 'range'
			? (elem.onmouseup = elem.onkeyup = save)
			: (elem.onchange = save)
	}	
	
	function save( evt, custom_val )
	{
		var value = this.type == 'checkbox'
			? this.checked
			: this.value;
		
		this.title = custom_val || value;
		bg.settings(this.name, custom_val || value);
		preview();
		
		bg.opera.extension.broadcastMessage({
			settings: bg.settings(),
			userCSS: bg.userCSS()
		});
		
		this.name == 'vendor' && updateLangs();
		this.name.match(/lang\.(from|to)/) && updateIcon(this);
	}

	$('h1').innerHTML = document.title;
	
	$('input, select').forEach(updateState);
	
	$('button[type=reset]').onclick = function()
	{
		bg.settings('user.css', bg.userCSSDefault());
		$('*[name^="user.css"]').forEach(updateState);
		preview();
	};
	
	$('input[name="trigger.hotkey"]').onkeypress = function( evt )
	{
		var 
			key = ['Ctrl'],
			code = evt.which,
			tabKey = code == 9;
		
		if( !tabKey )
		{
			if( evt.ctrlKey ) {
				evt.shiftKey && key.push('Shift');
				code && key.push(String.fromCharCode(code));
			}
			
			if( key.length > 1 ){
				var hotkey = key.join('+');
				this.value = key.slice(1).join('+');
				this.onchange(evt, hotkey);
			}
			
			evt.preventDefault();
		}
	};
	
	$('span.arrow').onclick = function( evt )
	{
		var 
			lang = bg.settings('lang'),
			from = $('select[name="lang.from"]'),
			to = $('select[name="lang.to"]');
			
		from.value = lang.to;
		from.onchange(evt);
		to.value = lang.from;
		to.onchange(evt);
	};
	
}, false);
