// @project XTranslate (injected.js)
// @url https://github.com/extensible/XTranslate 

document.toString() == '[object HTMLDocument]' && function()
{
	var type = document.location.protocol == 'file:' ? 'load' : 'DOMContentLoaded';
	window.addEventListener(type, function()
	{
		var 
			top_level = window.top == window.self,
			show_in_frame = window.innerWidth >= 200 && window.innerHeight >= 200,
			port, settings, 
			popup, selection, overnode;
			
		function extend( source )
		{
			[].slice.call(arguments,1).forEach(function( obj ){
				for(var i in obj){
					obj.hasOwnProperty(i) && (source[i] = obj[i]);
				}
			});
			return source;
		}
		
		function css( name, value )
		{
			if( name && value ) this.style[name] = value;
			else extend(this.style, name);
			return this;
		}
		
		function handle_selection( evt )
		{
			selection = window.getSelection();
			
			var 
				type = evt.type,
				range = document.createRange(),
				autoselect = selection.rangeCount == 0 && type == 'keypress';
				
			(type == settings.trigger.type || 
			(type == 'message' && settings.button.trigger)) && 
			function()
			{
				var text = function( text ) {
					if( autoselect && overnode )
					{
						var name = overnode.nodeName;
						
						text = name.match(/input|textarea/i)
							? overnode.value || overnode.placeholder
							: [].slice.call( overnode.selectNodes('.//text()') )
								.map(function( node ){ return node.textContent })
								.join(' ');
						
						range.selectNode( overnode );
						selection.addRange( range );
					}
					return text || String(selection).trim();
				}();
				
				if( text )
				{
					popup.compareDocumentPosition(selection.anchorNode || overnode) !== (
						document.DOCUMENT_POSITION_FOLLOWING | 
						document.DOCUMENT_POSITION_CONTAINED_BY
					) &&
					port.postMessage(
						text
							.replace(/(\s*\n\s*){2,}/g, '\n\n')
							.replace(/^.*$/gm, function( line ){
								return line.trim()
							})
					);
				}
			}();
		}
		
		function show_popup( html, position )
		{
			var 
				first = popup.firstChild,
				pos = position || function(){
					try {
						return selection.getRangeAt(0).getBoundingClientRect()
					} catch(e){
						return {left: 0, top: 0, bottom: 0, right: 0}
					}
				}(),
				html = function() {
					var node = document.createElement('div');
					node.innerHTML = html;
					return node;
				}();
			
			first ? popup.replaceChild(html, first) : popup.appendChild(html);
			popup.css({
				left: pos.left + 'px',
				top: (pos.bottom + popup.padding) + 'px',
				margin: 0,
				display: 'block'
			});
			
			// fix position
			var
				win_size = {
					width: window.innerWidth,
					height: window.innerHeight
				},
				popup_size = {
					width: popup.offsetWidth,
					height: popup.offsetHeight
				},
				offset = {
					x: pos.left + popup_size.width - win_size.width,
					y: pos.bottom + popup_size.height - win_size.height,
					padding: 20
				};
			
			offset.x > 0 && popup.css('marginLeft', -(offset.x + offset.padding) + 'px');
			offset.y > 0 && popup.css('marginTop', -(offset.y + offset.padding) + 'px');
		}
		
		function hide_popup() {
			!top_level && window.top.postMessage('hide', '*');
			popup.css('display', 'none');
		}
		
		function url_is_excluded( urls )
		{
			var location = String(window.location).replace(/https?:\/\/(www\.)?/, '');
			
			return !! urls.split('\n')
				.filter(function( url )
				{
					var
						url = url.trim()
							.replace(/[.]/g, '[.]')
							.replace(/\*/g, '.*?'),
						checker = RegExp('^(https?://)?(www[.])?' + url, 'mi');
					
					return location.match(checker);
				}).shift();
		}
		
		// Messaging handler
		opera.extension.onmessage = function( evt )
		{
			evt.data.settings && (settings = evt.data.settings);
			
			// Don't execute the extension from the excluded URL list
			if( url_is_excluded(settings.exclude.urls) ) return;
			
			var root = document.documentElement;
			switch(evt.data.action)
			{
				case 'init':
					port = evt.source;
					
					popup = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
					popup.className = 'XTranslate';
					popup.onclick = function( evt )
					{
						var elem = evt.target;
						
						elem.className == 'XTranslate_sound_play' &&
						port.postMessage({
							action: "get-sound",
							url: elem.getAttribute('data-url')
						});
						
						evt.stopPropagation();
					};
		
					popup.padding = 5;
					popup.css = css;
					popup.show = show_popup;
					popup.hide = hide_popup;
					
					var style = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
					style.id = 'XTranslate_CSS';
					style.textContent = evt.data.css;
					
					DOM_apply_bindings();
					(document.head || root).appendChild(style);
					(document.body || root).appendChild(popup);
				break;
				
				case 'translate':
					handle_selection(evt);
				break;
				
				case 'audio':
					var sound = popup.querySelector('object, embed');
					sound.src = sound.data = evt.data.track;
				break;
			}

			evt.data.userCSS && popup.setAttribute('style', evt.data.userCSS);
			
			// Update custom CSS
			var 
				id = 'XTranslate_custom_CSS',
				css_rules = evt.data.customCSS,
				custom_css = document.getElementById(id);
			
			if( css_rules ) {
				custom_css = custom_css || document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
				custom_css.id = id;
				custom_css.textContent = css_rules;
				(document.head || root).appendChild(custom_css);
			}
			
			if( custom_css && css_rules !== undefined && !css_rules ){
				custom_css.parentNode.removeChild( custom_css );
			}
			
			// Update popup's HTML-content
			evt.data.html && (
				top_level || show_in_frame
					? popup.show( evt.data.html ) 
					: window.top.postMessage(
					{
						name : window.name,
						pos  : extend({}, selection.getRangeAt(0).getBoundingClientRect()),
						html : evt.data.html
					}, '*')
			);
		};
		
		// Extra handling for iframes
		if( top_level )
		{
			var frames = [].slice.call(document.querySelectorAll('iframe'));
			frames.forEach(function( frame ) {
				if( !frame.getAttribute('name') ){
					var uniq_id = 'iframe-'+ String(Math.random()).replace('.', '');
					frame.name = uniq_id;
				}
			});
			
			window.addEventListener('message', function( evt )
			{
				if( evt.data.html && evt.data.pos && evt.data.name )
				{
					var 
						frame = document.querySelector('iframe[name="'+ evt.data.name +'"]'),
						pos = {
							left: frame.offsetLeft - window.scrollX,
							top: frame.offsetTop - window.scrollY
						},
						position = extend({}, evt.data.pos, {
							left	: evt.data.pos.left + pos.left,
							top		: evt.data.pos.left + pos.top,
							bottom	: evt.data.pos.bottom + pos.top,
							right	: evt.data.pos.right + pos.left
						});
					
					popup.show(evt.data.html, position);
				}
				
				evt.data == 'hide' && popup.hide();
			}, false)
		}
		
		function DOM_apply_bindings()
		{
			[
				['mouseup', handle_selection],
				
				['keypress', function( evt ) {
					var key = [];
					
					evt.ctrlKey && key.push('Ctrl');
					evt.shiftKey && key.push('Shift');
					evt.which && key.push( String.fromCharCode(evt.which).toUpperCase() );
					
					settings.trigger.hotkey == key.join('+') &&
					settings.trigger.type == evt.type && (
						handle_selection(evt),
						evt.preventDefault()
					);
				}],
				
				['click', hide_popup],
				
				['keyup', function( evt ){
					evt.which == 27 && hide_popup(evt); // <ESCAPE>-key
				}],
				
				['mouseover', function( evt ) {
					overnode = evt.target;
				}]
			].forEach(function(p){
				window.addEventListener(p.shift(), p.shift(), false);
			})
		}
		
	}, false);
	
}();
