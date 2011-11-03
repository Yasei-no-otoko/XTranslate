// @project XTranslate (options.js)
// @url https://github.com/extensible/XTranslate  

window.addEventListener('DOMContentLoaded', function( evt )
{
	var 
		bg = opera.extension.bgProcess,
		$ = function( selector, ctx )
		{
			var result = (ctx || document).querySelectorAll(selector);
			return result.length > 2
				? [].slice.call[result]
				: result[0]
			;
		};
	
	$('h1').innerHTML = document.title;
	
	/*window.onclick = function()
	{
		bg.settings('lang.from', 'en');
		bg.settings('lang.to', 'ru');
		
		alert( bg.settings.toJSON() )
	};*/
	
}, false);
