// @project XTranslate (options.js)
// @url https://github.com/extensible/XTranslate  

window.addEventListener('DOMContentLoaded', function( evt )
{
	var 
		bg = opera.extension.bgProcess,
		dom = function( selector, ctx )
		{
			var result = (ctx || document).querySelectorAll(selector);
			return result.length > 2
				? [].slice.call[result]
				: result[0]
			;
		};
	
	dom('h1').innerHTML = document.title;
	
}, false);

