// @project XTranslate (options.js)
// @url https://github.com/extensible/XTranslate  

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

function XTranslate_options()
{
	var 
		bg = opera.extension.bgProcess,
		header = document.title +' '+ parse('<span class="version">${version}</span>', widget);
	
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

	// Tabs
	var toolbar = $('.toolbar');
	
	toolbar.chain = toolbar.getAttribute('data-chain');
	toolbar.active_tab = $('[data-target = "'+ bg.settings(toolbar.chain) +'"]', toolbar) || $('.active', toolbar);
	toolbar.onclick = function( evt )
	{
		var 
			target = evt.target || this,
			is_tab = target.className.indexOf('tab') > -1;
		
		if( is_tab )
		{
			var active_parent_cssview = target.getAttribute('data-target');
			$('.XTranslate_options').className = 'XTranslate_options '+ active_parent_cssview;
			bg.settings(toolbar.chain, active_parent_cssview);
			
			user_input && 
			active_parent_cssview == 'XTranslate_tab_user_input' && 
			user_input.area.focus();
			
			$('.tab', toolbar).forEach(function( tab ){
				tab.className = 'tab ' + (tab === target ? 'active' : '');
			});
		}
	};
	
	toolbar.onclick.call(toolbar.active_tab, {});
	
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
		return function __() {
			popup.setAttribute('style', bg.userCSS());
			return __;
		}();
	}();
	
	var updateLangs = function __()
	{
		var 
			options = '',
			from = $('select[name="lang.from"]'),
			to = $('select[name="lang.to"]');
		
		vendors.current.langs.forEach(function( lang ){
			options += parse('<option value="${iso}">${name}</option>', lang);
		});
		
		[from, to].forEach(function( elem )
		{
			var value = bg.settings(elem.name);
			elem.innerHTML = options;
			elem.value = value;
			elem.value != value && bg.settings(elem.name, elem.value); // fix, if lang not exists (when we change vendor)
			updateIcon(elem);
		});
		
		// remove auto from "lang.to" if exists
		var auto = $('option[value="auto"]', to);
		auto && to.removeChild(auto);
		
		// fixes when languages are the same
		if( from.value == to.value )
		{
			var next = to[to.selectedIndex + 1];
			next && (
				next.selected = true,
				bg.settings(to.name, to.value),
				updateIcon(to)
			);
		}
		
		// lock mirror language
		[
			$('option[value="'+ to.value +'"]', from),
			$('option[value="'+ from.value +'"]', to)
		].forEach(function( option ){
			if( option ) option.disabled = true;
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
		this.name.match(/user\.css/) && function()
		{
			bg.settings('user.theme', '');
			$('select[name="user.theme"]').value = '';
		}();
		
		// update the icon and disabling translation from same to same
		if( this.name.match(/lang\.(from|to)/) )
		{
			var 
				list = ['lang.to', 'lang.from'],
				active = list.splice(list.indexOf(this.name), 1),
				passive = list.shift();
			
			$('select[name="'+ passive +'"] option').forEach(function( elem )
			{
				elem.value == value
					? (elem.disabled = true)
					: elem.removeAttribute('disabled')
			});
			updateIcon(this);
		}
		
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
				code && key.push( String.fromCharCode(code).toUpperCase() );
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
						return RegExp(expr, 'g');
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
	
	// Custom CSS-rules support (for advanced users)
	var custom_css = $('.custom_css textarea');
	custom_css.onkeyup = custom_css.update = function __(evt)
	{
		var 
			id = 'XTranslate_custom_css',
			style = $('#'+ id),
			css_rules = bg.settings(custom_css.name) || '',
			value = custom_css.value;

		if( !style ) {
			style = document.createElement('style');
			style.id = id;
			style.textContent = custom_css.value = css_rules;
			document.head.appendChild(style);
		}
		else {
			bg.settings(custom_css.name, custom_css.value);
			bg.opera.extension.broadcastMessage({
				action: 'update_custom_css',
				customCSS: value
			});
			style.textContent = value;
		}
		
		return __;
	}();

	$('.custom_css').onclick = function(evt)
	{
		var elem = evt.target;
		switch( elem.className )
		{
			case 'custom_css_trigger':
				var content = $('.custom_css_content', this.parentNode);
				content.style.display = (content.currentStyle.display == 'none' ? 'inline' : 'none');
			break;
			
			case 'sample':
				custom_css.value = elem.title;
				custom_css.update();
			break;
		}
	};
	
	// User input (additional tab in the settings)
	var user_input = 
	{
		area: $('.XTranslate_user_input_area'),
		result: $('.XTranslate_user_input_result'),
		translate: function(evt, self)
		{
			var 
				value = this.value,
				scroll_height = this.scrollHeight,
				has_scroll = this.offsetHeight - 4 /*border*/ < scroll_height,
				nl = {
					min: self.params.rowsNum - 1,
					was: ((self.prev || '').match(/\n/g) || []).length,
					now: (value.match(/\n/g) || []).length
				};
			
			// change box's height dependent on the content
			nl.was !== nl.now && (this.style.height = ((nl.now < nl.min ? nl.min : nl.now) + 1) * self.params.lineHeight + 'px');
			has_scroll && (this.style.height = scroll_height + 'px');
			
			// translation
			if( self.prev !== value )
			{
				if( value ){
					var response = bg.XTranslate.vendors.current.handler(value, true);
					
					bg.when( response ).then(function( result ) {
						user_input.result.innerHTML = result.html;
					});
				}
				else {
					user_input.result.innerHTML = '';
				}

				self.prev = value;
			}
		}
	};
	
	// User input's typing handler
	user_input.area.onkeypress = function( evt )
	{
		var timer = 'XTranslate_user_typing_timer';
		clearTimeout( this[timer] );
		this[timer] = setTimeout(user_input.translate.bind(this, evt, user_input), 400);
		
		if( !user_input.params )
		{
			var bS = this.offsetHeight, 
				rN = this.getAttribute('rows');
			
			user_input.params = {
				boxSize: bS,
				rowsNum: rN,
				lineHeight: bS / rN
			};
		}
	};
	
	user_input.result.onclick = function( evt )
	{
		var 
			self = this,
			target = evt.target;
		
		// sound play
		target.className == 'XTranslate_sound_play' && function()
		{
			var get_sound = bg.XTranslate.vendors.current['get-sound']({
				url: this.getAttribute('data-url')
			});
			
			bg.when( get_sound ).then(function( data ) {
				var sound = $('.XTranslate_sound object');
				sound.src = sound.data = data.track;
			});
		}.call(target);
		
		// similar words in the result
		target.className == 'XTranslate_sim_word' && function()
		{
			user_input.area.value = this.innerHTML;
			user_input.translate.call(user_input.area, evt, user_input)
			user_input.area.focus();
		}.call(target);
	};
	
	// Expand/collapse blocks
	$('dl[data-name]').forEach(function( block )
	{
		var key = block.getAttribute('data-name');
		bg.settings('blocks.shut.'+ key) && (block.className += ' shut');
		
		$('.toggle', block).onclick = function()
		{
			var is_shut = block.className.split(' ').indexOf('shut') > -1;
			block.className = is_shut ? 'option' : 'option shut';
			bg.settings('blocks.shut.'+ key, !is_shut);
		};
	});
	
	// Show reset-button
	$('.reset-settings .expand').onclick = function(){
		this.parentNode.removeChild(this);
	};
	
	// Misc: throw out from the flow
	setTimeout(function() {
		user_input.area.focus();
	}, 10);
}
