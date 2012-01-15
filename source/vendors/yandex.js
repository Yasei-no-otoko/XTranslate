// @project XTranslate (vendors/yandex.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
	name: 'Yandex',
	url: 'http://translate.yandex.ru',

	handler: function( text )
	{
		var url = this.url;
		return deferred(function(dfr)
		{
			ajax({
				url: url + [
					'/tr/translate?lang=', settings('lang.from') +'-'+ settings('lang.to'),
					'&text='+ encodeURIComponent(text)
				].join(''),
				
				complete: function()
				{
					var html = [
						'<div class="XTranslate_result Powered_by_Yandex">',
							this.responseXML.documentElement.textContent.replace(/</g, '&lt;'),
						'</div>'
					].join('');
					
					dfr.resolve({
						html: html,
						response: this.responseText
					});
				}
			});
		});
	},
	
	loadData: function()
	{
		ajax({
			context: this,
			url: 'vendors/yandex.lang',
			complete: function( text )
			{
				this.langs = text.trim().split(/\r?\n+/).map(function( line ){
					var lang = line.split(/\s*-\s*/);
					return {
						name: lang[0].trim(),
						iso: lang[1].trim()
					}
				});
			}
		});
	}
});
