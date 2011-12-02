// @project XTranslate (options.js)
// @url https://github.com/extensible/XTranslate  

window.addEventListener('DOMContentLoaded', function( evt )
{
	var 
		bg = opera.extension.bgProcess,
		header = [
			document.title,
			'<span class="version"> v.',
				widget.version,
			'</span>'
		].join('');
	
	$('h1').innerHTML = header;
	$('button[name="reset-globals"]').onclick = function(evt)
	{
		delete widget.preferences.settings;
		bg.configure(function()
		{
			bg.settings('button.trigger', true);
			bg.settings('button.trigger', false);
			location.reload();
		});
	};
	
	// vendors-list
	var vendors = function()
	{
		var 
			vendors = bg.XTranslate.vendors,
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
		return vendors;
	}();
	
	// ui language
	var langs = function()
	{
		var 
			langs = $('select[name="lang.ui.current"]'),
			ui = bg.settings('lang.ui'),
			current = ui.current;
		
		ui.langs.forEach(function( lang ) {
			langs.innerHTML += parse('<option value="${code}">${title}</option>', lang);
		});
		
		ui['default'] != current && changeUILanguage({
			from: ui['default'],
			to: current
		});
		
		return langs;
	}();
	
	// load themes
	var updateThemes = function __()
	{
		var 
			themes = $('select[name="user.theme"]'),
			theme = bg.settings('user.theme');
		
		themes.innerHTML = '<option value="">Custom</option>'
			+ 
			bg.settings('user.themes').map(function( theme )
			{
				theme.name = theme.name
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;");
				return parse('<option value="${name}">${name}</option>', theme);
			}).join('');
		
		themes.value = theme;
		theme == '' && ($('button[name="theme.delete"]').disabled = true);
			
		return __;
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
		
		$('select[name="lang.from"], select[name="lang.to"]').forEach(function( elem )
		{
			var value = bg.settings(elem.name);
			elem.innerHTML = options;
			elem.value = value;
			elem.value != value && bg.settings(elem.name, elem.value); // fix, if lang not exists (when we change vendor)
			elem.name == 'lang.to' && function()
			{
				var auto = $('option[value="auto"]', elem);
				auto && elem.removeChild(auto);
			}();
			updateIcon(elem);
		});
		
		return __;
	}();
	
	function updateIcon( elem )
	{
		var value = elem.value;
		var icon = $('img[name="'+ elem.name +'"]');
		icon.src = 'icons/flags/'+ value.split('-').shift() +'.png';
		icon.alt = value;
	}
	
	var updateState = function __( filter )
	{
		$('dd input, dd select')
			.filter(filter || function(){ return true })
			.forEach(function( elem )
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
			});
		
		return __;
	}();
	
	function save( evt, custom_val )
	{
		var value = this.type == 'checkbox'
			? this.checked
			: this.value;
		
		this.title = custom_val || value;
		bg.settings(this.name, custom_val || value);
		
		bg.opera.extension.broadcastMessage({
			settings: bg.settings(),
			userCSS: bg.userCSS()
		});
		
		this.name == 'vendor' && updateLangs();
		this.name.match(/lang\.(from|to)/) && updateIcon(this);
		this.name.match(/user\.css/) && function()
		{
			bg.settings('user.theme', '');
			$('select[name="user.theme"]').value = '';
		}();
		
		preview();
	}
	
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
		
		if( lang.from != 'auto' )
		{
			from.value = lang.to;
			from.onchange(evt);
			to.value = lang.from;
			to.onchange(evt);
		}
	};
	
	bg.settings.unfollow('user.theme'); // clear
	bg.settings.follow('user.theme', function( value, prop, user )
	{
		var drop_btn = $('button[name="theme.delete"]');
		
		if( value )
		{
			var 
				theme = user.themes.filter(function( theme ){
					return theme.name == value;
				}).shift().css;
			
			bg.settings('user.css', theme);
			
			updateState(function( input ){
				return input.name.match(/^user\.css/);
			});
			
			drop_btn.removeAttribute('disabled');
		}
		else {
			drop_btn.disabled = true;
		}
	});
	
	// saving theme
	$('*[name="theme.save"]').onclick = function(evt)
	{
		var 
			save_btn = this,
			name = $('input[name="theme.name"]', this.parentNode),
			error = $('div.error', this.parentNode),
			hint = "Enter theme's name",
			value = name.value.trim(),
			restore = function()
			{
				name.value = '';
				name.className = 'hidden';
				error.className = 'error hidden';
			};
		
		if( !value ){
			name.value = hint;
			name.className = 'hint';
		}
		else if( value == hint ){
			restore();
		}
		else {
			var theme_exists = bg.settings('user.themes').some(function( theme ){
				return theme.name == value;
			});
			
			if( theme_exists  ) {
				error.className = 'error';
				name.className = 'error';
				name.focus();
			}
			else {
				bg.settings('user.themes', function( themes ){
					return themes.concat({
						name: value,
						css: bg.settings('user.css')
					});
				});
				bg.settings('user.theme', value);
				updateThemes();
				restore();
			}
		}
		
		name.onfocus = name.onblur = function(evt) {
			evt.type == 'focus' && this.value == hint && (this.value = '', this.className = '');
			evt.type.match(/blur|keypress/) && (this.value == hint || !this.value.trim()) && 
			(
				this.value = hint, 
				this.className = 'hint',
				error.className = 'error hidden'
			);
		};
		
		name.onkeypress = function(evt){
			evt.which == 13 && save_btn.onclick();
		};
	};
	
	$('button[name="theme.delete"]').onclick = function(evt)
	{
		bg.settings('user.themes', function( themes ){
			return themes.filter(function( theme ){
				return theme.name != this.theme;
			}, this);
		});
		bg.settings('user.theme', "");
		updateThemes();
	};
		
	function changeUILanguage( lang )
	{
		var 
			texts = bg.settings('lang.ui.texts'),
			textNodes = [].slice.call(document.selectNodes('//text()')).filter(function( node ){
				return node.textContent.trim();
			}),
			valid = function( node ){
				var status = true;
				node.parentNode.nodeName.toLowerCase() == 'option' && (status = false);
				return status;
			};
		
		texts.forEach(function( text, index )
		{
			textNodes.forEach(function( node )
			{
				var 
					content = node.textContent,
					data = text[lang.from];
				
				content.indexOf(data) > -1 && valid(node) && text[lang.to] && (
					node.textContent = content.replace(function()
					{
						var expr = data.replace(/[\[\]\(\)\.\*\+\\\{\}\^\$]/g, '\\$&');
						return new RegExp(expr, 'g');
					}(), text[lang.to])
				);
			});
		});
	}
	
	bg.settings.unfollow('lang.ui.current'); // clear for options page only
	bg.settings.follow('lang.ui.current', function( value, prop, ui, settings, old ){
		changeUILanguage({
			from: old,
			to: value
		});
	});
	
	$('button[name="check-updates"]').onclick = function()
	{
		var 
			button = this,
			block = button.parentNode,
			loader = block.querySelector('img'),
			latest = block.querySelector('.latest');
			
		button.disabled = true;
		loader.style.display = '';
		
		checkUpdates(function( version, node )
		{
			loader.style.display = 'none';
			version
				? block.appendChild(node)
				: (latest.style.display = 'inline');
		});
	};
	
}, false);

function checkUpdates( callback )
{
	var addons_url = 'https://addons.opera.com';
	opera.extension.bgProcess.ajax(
	{
		url: addons_url + '/en/addons/extensions/details/xtranslate/'+ widget.version,
		complete: function( response )
		{
			var 
				data = [],
				node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
				content = response.match(/<body\s?.*?>([\s\S]+)<\/body>/i),
				latest = 
					content && 
					(node.innerHTML = content[1]) && 
					node.querySelector('.latest');
			if( latest )
			{
				var 
					a = latest.querySelector('a'),
					url = addons_url + a.getAttribute('href'),
					version = url.match(/\d(\.\d)+/).shift();
				a.setAttribute('href', url);
				data.push(version, latest);
			}
			callback.apply(this, data);
		}
	});
}

function $( selector, ctx ){
	var nodes = [].slice.call((ctx || document).querySelectorAll(selector));
	return nodes.length > 1 ? nodes : nodes.shift();
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
