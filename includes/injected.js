// @project XTranslate (injected.js)
// @url https://github.com/extensible/XTranslate 

+function()
{
	var postMsg = function __( message ){
		__.port.postMessage( message )
	};
	
	function handleSelection( evt )
	{
		var 
			selection = window.getSelection(),
			
			position = selection
				.getRangeAt(0)
				.getBoundingClientRect(),
				
			text = selection
				.toString().trim()
				.replace(/\s{2,}/g, ' ');
		
		if( text )
		{
			switch(evt.type)
			{
				case 'mouseup':
					postMsg(text);
				break;
			}
		}
	}
	
	function handleMessage( evt )
	{
		if( !evt.data ){
			postMsg.port = evt.source;
		}
		else {
			alert( evt.data )
		}
	};
	
	opera.extension.addEventListener('message', handleMessage, false);
	window.addEventListener('mouseup', handleSelection, false);
	
}();

