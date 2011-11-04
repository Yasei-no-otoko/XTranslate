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
				? [].slice.call(result)
				: result[0]
			;
		};
	
	$('h1').innerHTML = document.title;
	
	// $('input[name^="user-css"]')
	// alert( $('.XTranslate').currentStyle.backgroundImage )
	
	alert( bg.settings )
	bg.settings.clear();
	
}, false);
