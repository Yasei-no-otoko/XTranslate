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
	
	$('h1').innerHTML = document.title;
	
	$('input, select').forEach(function( elem )
	{
		var 
			type = elem.type,
			value = bg.settings(elem.name);
		
		// hooks
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
		
		elem.title = value;
		elem.onchange = save;
	});
	
	function save()
	{
		var value = this.type == 'checkbox'
			? this.checked
			: this.value;
		
		this.title = value;	
		bg.settings(this.name, value);
		
	}
	
	//alert( bg.settings )
	//bg.settings.clear();
	
}, false);
