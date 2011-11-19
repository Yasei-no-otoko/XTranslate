// @project XTranslate (injected.js)
// @url https://github.com/extensible/XTranslate 

document.toString() == '[object HTMLDocument]' && 
window.addEventListener('DOMContentLoaded', function()
{
	var 
		top_level = window.top == window.self,
		port, settings, 
		popup, selection;
		
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
	
	function handleSelection( evt )
	{
		selection = window.getSelection();
		
		var text = selection.toString().trim();
		if( text )
		{
			(
				evt.type == settings.trigger.type || 
				(evt.type == 'message' && settings.button.trigger)
			) && 
			popup.compareDocumentPosition(selection.anchorNode) !== (
				document.DOCUMENT_POSITION_FOLLOWING | 
				document.DOCUMENT_POSITION_CONTAINED_BY
			) &&
			port.postMessage(
				text
					.replace(/(\n\s+){2,}/g, '\n\n')
					.replace(/^.*$/gm, function( line ){
						return line.trim()
					})
			);
		}
	}
	
	function showPopup( html, position )
	{
		var 
			first = popup.firstChild,
			pos = position || selection.getRangeAt(0).getBoundingClientRect(),
			html = function()
			{
				var node = document.createElement('div');
				node.innerHTML = html;
				return node;
			}();
		
		first ? popup.replaceChild(html, first) : popup.appendChild(html);
		
		settings.user.css.position.type == 'auto' && popup.css({
			left: pos.left + 'px',
			top: (pos.bottom + popup.padding) + 'px',
			margin: 0
		});
		popup.css('display', 'block');
		
		// fix position
		var
			win_size = {
				width: window.innerWidth,
				height: window.innerHeight
			},
			popup_size = {
				width: popup.offsetWidth,
				height: popup.offsetHeight
			};
		if( pos.left + popup_size.width > win_size.width ) {
			popup.css('marginLeft', -popup_size.width + 'px')
		}
		if( pos.bottom + popup_size.height > win_size.height ) {
			popup.css('marginTop', -(popup_size.height + pos.height ) + 'px')
		}
	}
	
	function hidePopup() {
		!top_level && window.top.postMessage('hide', '*');
		!settings.user.css.position.visible && popup.css('display', 'none');
	}
	
	opera.extension.onmessage = function( evt )
	{
		switch(evt.data.action)
		{
			case 'init':
				port = evt.source;
				
				popup = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
				popup.className = 'XTranslate';
				popup.padding = 5;
				popup.onclick = function( evt ){ evt.stopPropagation() }
	
				popup.css = css;
				popup.show = showPopup;
				popup.hide = hidePopup;
				
				document.documentElement.appendChild(popup);
				
				var style = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
				style.type = 'text/css';
				style.textContent = evt.data.css;
				document.documentElement.appendChild(style);
			break;
			
			case 'translate':
				handleSelection(evt);
			break;
		}

		evt.data.settings && (settings = evt.data.settings);
		evt.data.userCSS && popup.setAttribute('style', evt.data.userCSS);
		
		evt.data.html && (
			top_level 
				? popup.show( evt.data.html ) 
				: window.top.postMessage(
				{
					name : window.name,
					pos  : extend({}, selection.getRangeAt(0).getBoundingClientRect()),
					html : evt.data.html
				}, '*')
		);
	};
	
	// add handling for iframes
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
	
	window.addEventListener('mouseup', handleSelection, false);
	window.addEventListener('keypress', function( evt )
	{
		var key = [];
		
		evt.ctrlKey && key.push('Ctrl');
		evt.shiftKey && key.push('Shift');
		evt.which && key.push(String.fromCharCode(evt.which));
		
		settings.trigger.hotkey == key.join('+') &&
		settings.trigger.type == evt.type && (
			handleSelection(evt),
			evt.preventDefault()
		);
	}, false);
	
	window.addEventListener('click', hidePopup, false);
	window.addEventListener('keyup', function( evt ){
		evt.which == 27 && hidePopup(evt); // <ESCAPE>-key
	}, false);
	
	
}, false);
