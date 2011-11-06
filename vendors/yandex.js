// @project XTranslate (vendors/yandex.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
	name: 'Yandex',
	url: 'http://translate.yandex.ru',
	
	handler: function( text ){
		/*
			JSONP: http://translate.yandex.ru/tr.json/translate?callback=json.c(0)&lang=en-ru&text=message
			XML: http://translate.yandex.ru/tr/translate?lang=en-ru&text=message
		*/
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
