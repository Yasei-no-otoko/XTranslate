// @project XTranslate (injected.js)
// @url https://github.com/extensible/XTranslate 

(function()
{
	var port, widget, popup, selection;
	
	function handleSelection( evt )
	{
		selection = window.getSelection();
		
		var text = selection.toString().trim();
		if( text )
		{
			switch(evt.type)
			{
				case 'mouseup':
					port.postMessage( text );
				break;
			}
		}
	}
	
	function showPopup( htmlText )
	{
		var
			padding = 5,
			range = selection.getRangeAt(0),
			pos = range.getBoundingClientRect(),
			html = range.createContextualFragment( htmlText );
		
		popup.replaceChild(html, popup.firstChild)
		popup.style.left = pos.left + 'px';
		popup.style.top = (pos.top + pos.height + padding) + 'px';
		popup.style.display = 'block';
	}
	
	opera.extension.onmessage = function( evt )
	{
		if( evt.data.action == 'init' )
		{
			port = evt.source;
			widget = JSON.parse(evt.data.widget);
			
			popup = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			popup.className = popup.innerHTML = 'XTranslate';
			popup.onclick = function( evt ){ evt.stopPropagation() }
			document.documentElement.appendChild(popup);
			
			var style = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
			style.type = 'text/css';
			style.textContent = evt.data.css;
			document.documentElement.appendChild(style);
		}
		
		// show popup
		if( evt.data.html ){
			showPopup( evt.data.html );
		}
	};
	
	window.addEventListener('mouseup', handleSelection, false);
	window.addEventListener('click', function(){
		popup.style.display = 'none';
	}, false);
	
})();

