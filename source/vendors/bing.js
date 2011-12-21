// @project XTranslate (vendors/bing.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
	name: 'Bing',
	url: 'http://microsofttranslator.com/',

	handler: function( text )
	{
		var 
			api_url = 'http://api.microsofttranslator.com/V2/Ajax.svc/Translate',
			app_id  = 'TgcvviSQpCimHXnDOpbbKHqNCdH0zAwItzpoEHnMh3h0*',
			lang    = settings('lang'),
			text    = encodeURIComponent(text);
		
		// for bing's auto-detecting language we have to send empty string
		lang.from == 'auto' && (lang.from = '');
		
		return deferred(function(dfr)
		{
			ajax({
				url: api_url +'?'+ 
				[
					'appId=' + app_id,
					'text=' + text,
					'from=' + lang.from,
					'to=' + lang.to
				].join('&'),
				
				complete: function( response )
				{
					var html = [
						'<div class="XTranslate_result Powered_by_Bing">',
							JSON.parse(response),
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
