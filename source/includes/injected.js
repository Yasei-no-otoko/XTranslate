// @project XTranslate (injected.js)
// @url https://github.com/extensible/XTranslate 

window.top == window.self &&
document.toString() == '[object HTMLDocument]' && 
window.addEventListener('DOMContentLoaded', function()
{
	var 
		port, settings, 
		popup, selection;
	
	function css( name, value )
	{
		if( name && value ){
			this.style[name] = value;
		}
		else {
			for(var i in name){
				this.style[i] = name[i];
			}
		}
		return this;
	}
	
	function handleSelection( evt )
	{
		selection = window.getSelection();
		
		var text = selection.toString().trim();
		if( text )
		{
			evt.type == settings.trigger.type && 
			popup.compareDocumentPosition(selection.anchorNode) !== (
				document.DOCUMENT_POSITION_FOLLOWING | 
				document.DOCUMENT_POSITION_CONTAINED_BY
			) &&
			port.postMessage( text );
		}
	}
	
	function showPopup( htmlText )
	{
		var
			first = popup.firstChild,
			range = selection.getRangeAt(0),
			pos = range.getBoundingClientRect(),
			html = range.createContextualFragment( htmlText );
		
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
			};
		if( pos.left + popup_size.width > win_size.width ) {
			popup.css('marginLeft', -popup_size.width + 'px')
		}
		if( pos.bottom + popup_size.height > win_size.height ) {
			popup.css('marginTop', -(popup_size.height + pos.height ) + 'px')
		}
	}
	
	opera.extension.onmessage = function( evt )
	{
		if( evt.data.action == 'init' )
		{
			port = evt.source;
			
			popup = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			popup.css = css;
			popup.padding = 5;
			popup.className = 'XTranslate';
			popup.onclick = function( evt ){ evt.stopPropagation() }
			document.documentElement.appendChild(popup);
			
			var style = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
			style.type = 'text/css';
			style.textContent = evt.data.css;
			document.documentElement.appendChild(style);
		}

		evt.data.settings && (settings = evt.data.settings);
		evt.data.userCSS && popup.setAttribute('style', evt.data.userCSS);
		evt.data.html && showPopup( evt.data.html );
	};
	
	window.addEventListener('mouseup', handleSelection, false);
	window.addEventListener('keypress', function( evt )
	{
		var key = [];
		
		evt.ctrlKey && key.push('Ctrl');
		evt.shiftKey && key.push('Shift');
		evt.which && key.push(String.fromCharCode(evt.which));
		
		if( settings.trigger.hotkey == key.join('+') ){
			handleSelection(evt);
			evt.preventDefault();
		}
	}, false);
	
	window.addEventListener('click', function(){
		popup.css('display', 'none');
	}, false);
	
}, false);
