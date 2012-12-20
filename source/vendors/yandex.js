// @project XTranslate (vendors/yandex.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
	name: 'Yandex',
	url: 'http://translate.yandex.net',

	handler: function(params)
	{
		var selection = params.text,
			lang = settings('lang'),
			text = encodeURIComponent( selection ),
			
			type = selection.split(' ').length > 1 ? 'common' : 'dictionary',
			translation = {
				common: {
					url: this.url + [
						'/tr/translate',
						'?lang='+ lang.from +'-'+ lang.to,
						'&text='+ text
					].join(''),
					
					data: function( response ){
						return this.responseXML.documentElement.textContent.replace(/</g, '&lt;');
					},
					content: function( data ){
						return data;
					}
				},

				dictionary: {
					url: this.url + [
						'/dicservice.json/lookup',
						'?callback=',
						'&ui='+ lang.to,
						'&lang='+ lang.from +'-'+ lang.to,
						'&text='+ text
					].join(''),
					
					data: function( response ){
						return Function('return '+ response)();
					},
					
					content: function( data )
					{
						if( ! data.def.length ) return selection;
						else return data.def.map(function( wordtype )
						{
							return [
								'<dl class="XTranslate_wordtype">',
									'<dt>'+ wordtype.pos +'</dt>',
									'<dd>',
										wordtype.tr.map(function( translate )
										{
											return translate.text + (
												translate.syn && translate.syn.length 
													? ', '+ translate.syn.map(function(s){ return s.text }).join(', ')
													: ''
											);
										}).join(', '),
									'</dd>',
								'</dl>'
							].join('')
						}).join('')
					}
				}
			},
			
			action = translation[type];
		
		return deferred(function(dfr)
		{
			ajax({
				url: action.url,
				complete: function( response )
				{
					try {
						var error = this.status != 200,
							data = !error ? action.data.call(this, response) : response,
							content = !error ? action.content.call(this, data) : response;
							
						var html = [
							'<div class="XTranslate_result Powered_by_Yandex" tabindex="-1">',
								content,
							'</div>'
						].join('');
						
						dfr.resolve({
							html: html,
							response: response
						});
					}
					catch(e) {
						console.error(
							[
								'---',
								'XTranslate: not correct response from Yandex or something nasty happens.',
								'URL: '+ action.url,
								'Status: '+ this.status,
								'Response: '+ response,
								'Error: '+ e.message,
								'---'
							].join('\n')
						);
					}
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
	},
	
	getTranslateThePageURL: function( tab_url )
	{
		var 
			url = this.url + '/tr-start?',
			lang = settings('lang'),
			query = [
				'lang='+ [lang.from, lang.to].join('-'),
				'url='+ tab_url
			].join('&');
			
		return url + query;
	}
});
