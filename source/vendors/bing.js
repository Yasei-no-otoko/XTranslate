// @project XTranslate (vendors/bing.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
	name: 'Bing',
	url: 'http://microsofttranslator.com/',

	handler: function( text )
	{
		var 
			id = 'C99C654F52B9010F7B789D98343831212B58CB34',
			url = 'http://api.microsofttranslator.com/v2/ajax.svc/Translate',
			lang = settings('lang'),
			text = encodeURIComponent(text);
		
		// for bing's auto-detecting language we have to send empty string
		lang.from == 'auto' && (lang.from = '');
		
		return deferred(function(dfr)
		{
			ajax({
				url: url +'?'+ 
				[
					'appId='+ id,
					'text='+ text,
					'from='+ lang.from,
					'to='+ lang.to
				].join('&'),
				
				complete: function( response )
				{
					var html = [
						'<div class="XTranslate_result Powered_by_Bing">',
							String(JSON.parse(response)).replace(/</g, '&lt;'),
						'</div>'
					].join('');
					
					dfr.resolve({
						html: html,
						response: response
					});
				}
			});
		});
	},
	
	loadData: function()
	{
		ajax({
			context: this,
			url: 'vendors/bing.lang',
			complete: function( text )
			{
				this.langs = text.trim().split(/\r?\n+/).map(function( line ){
					var lang = line.trim().split(/\s*--\s*/);
					return {
						name: lang[0].trim(),
						iso: lang[1].trim()
					}
				});
			}
		});
	}
});
