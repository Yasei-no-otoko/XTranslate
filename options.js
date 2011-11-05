// @project XTranslate (options.js)
// @url https://github.com/extensible/XTranslate  

window.addEventListener('DOMContentLoaded', function( evt )
{
	var 
		bg = opera.extension.bgProcess,
		$ = function( selector, ctx ){
			var nodes = [].slice.call((ctx || document).querySelectorAll(selector));
			return nodes.length == 1 ? nodes[0] : nodes;
		};

	var preview = function()
	{
		var popup = $('.XTranslate');
		return function __(){
			popup.setAttribute('style', bg.userCSS());
			return __;
		}();
	}();
	
	$('h1').innerHTML = document.title;
	$('input, select').forEach(updateState);

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
	}

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
	
}, false);
