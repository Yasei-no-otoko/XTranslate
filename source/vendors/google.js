// @project XTranslate (vendors/google.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
	name: 'Google',
	url: 'http://translate.google.com',
	
	handler: function( text )
	{
		var 
			vendor = this,
			lang = settings('lang'),
			text = encodeURIComponent(text),
			sound_lang = lang.from != 'auto' ? lang.from : '',
			sound_url = this.url + 
			[
				'/translate_tts?ie=UTF-8',
				'&q='+ text,
				'&tl='+ sound_lang
			].join('');
			
		return deferred(function(dfr)
		{
			ajax({
				url: vendor.url + [
					'/translate_a/t?client=t',
					'&sl='+ lang.from,
					'&hl='+ lang.to,
					'&tl='+ lang.to,
					'&text='+ text
				].join(''),
				
				complete: function( response )
				{
					var 
						data = eval('('+ response +')'),
						lang_iso_detected = data[2],
						lang = vendor.langs.filter(function( lang ){
							return lang.iso == lang_iso_detected;
						}).shift() || {};
					
					// add language iso-value, if lang.from is auto
					!sound_lang && (sound_url += lang.iso);
					
					var html = [
						'<div class="XTranslate_result Powered_by_Google" title="Translated from '+ lang.name +' ('+ data[2] +')">',
							'<div class="XTranslate_result_main">',
								'<span class="XTranslate_sound">',
									'<img src="'+ images.volume +'" data-url="'+ sound_url +'" class="XTranslate_sound_play" alt="" />',
									'<object width="1" height="1"></object>',
								'</span>',
								data[0].map(function( line ){ return line.shift() })
								.join('')
								.replace(/</g, '&lt;'),
							 '</div>',
							function()
							{
								return data[1]
									? data[1].map(function( wordtype )
									{
										return [
											'<dl class="XTranslate_wordtype">',
												'<dt>'+ wordtype[0] +'</dt>',
												'<dd>'+ wordtype[1].join(', ') +'</dd>',
											'</dl>'
										].join('')
									}).join('')
									: '';
							}(),
						'</div>'
					].join('');
					
					dfr.resolve({
						html: html,
						response: response,
						json: JSON.stringify(data, null, 5)
					});
				}
			});
		});
	},
	
	loadData: function()
	{
		ajax({
			context: this,
			url: 'vendors/google.lang',
			complete: function( text )
			{
				this.langs = text.trim().split(/\r?\n+/).map(function( line ){
					var lang = line.split(/\s*=\s*/);
					return {
						name: lang[0].trim(),
						iso: lang[1].trim()
					}
				});
			}
		});
	},
	
	'get-sound': function( params )
	{
		return deferred(function(dfr)
		{
			ajax({
				url: params.url + '&t='+ Date.now(),
				binary: true,
				type: 'audio/mpeg',
				complete: function()
				{
					dfr.resolve({
						action: 'audio',
						track: this.dataURL // base64
					});
				}
			});
		});
	}
});



