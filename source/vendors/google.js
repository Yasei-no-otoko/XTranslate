// @project XTranslate (vendors/google.js)
// @url https://github.com/extensible/XTranslate

XTranslate.vendors.add(
{
    name: 'Google',
    url: 'http://translate.google.com',

    handler: function( text, show_similars )
    {
        var
            vendor = this,
            lang = settings('lang'),
            text = encodeURIComponent(text),
            url = vendor.url +
            [
                '/translate_a/t?client=t',
                'sl='+ lang.from,
                'hl='+ lang.to,
                'tl='+ lang.to,
                'text='+ text
            ].join('&'),

            sound_lang = lang.from != 'auto' ? lang.from : '',
            sound_url = vendor.url +
            [
                '/translate_tts?ie=UTF-8',
                '&q='+ text,
                '&tl='+ sound_lang
            ].join(''),
            sound_display = ! settings('button.voice') ? 'display:none' : '';

        return deferred(function(dfr)
        {
            ajax({
                url: url,
                complete: function( response )
                {
                    try {
                        response = eval('('+ response +')');
                    } catch(e){
                        opera.postError("Can't parse JSON-response from the Google: ", response);
                        throw e;
                    }

                    var
                        data = response,
                        lang_iso_detected = data[2],
                        lang = vendor.langs.filter(function( lang ){
                            return lang.iso == lang_iso_detected;
                        }).shift() || {};

                    // add language iso-value, if lang.from is auto
                    !sound_lang && (sound_url += lang.iso);

                    var html = [
                        '<div class="XTranslate_result Powered_by_Google" title="Translated from '+ lang.name +' ('+ data[2] +')" tabindex="-1">',
                            '<div class="XTranslate_result_main">',
                                '<span class="XTranslate_sound" style="'+ sound_display +'">',
                                    '<img src="'+ images.volume +'" data-url="'+ sound_url +'" class="XTranslate_sound_play" alt="" />',
                                    '<object width="1" height="1"></object>',
                                '</span>',

                                data[4].map(function( chunk ) {
                                    chunk = chunk.shift();
                                    /^[A-ZА-Я0-9]/i.test(chunk) && chunk.length > 1 && (chunk = " "+ chunk);
                                    return chunk;
                                }).join('')
                                .replace(/</g, '&lt;'),

                             '</div>',
                            function()
                            {
                                return data[1]
                                    ? data[1].map(function( wordtype )
                                    {
                                        return (
                                            ! wordtype[0]
                                            ? ''
                                            : [
                                                '<dl class="XTranslate_wordtype">',
                                                    '<dt>'+ wordtype[0] +'</dt>',

                                                    ! show_similars
                                                    ? '<dd>'+ wordtype[1].join(', ') +'</dd>'
                                                    : [
                                                        '<table class="XTranslate_words_list">',
                                                            wordtype[2].map(function( word ){
                                                                return [
                                                                    '<tr>',
                                                                        '<td class="XTranslate_word">'+ word[0] +'</td>',
                                                                        '<td class="XTranslate_similars">',
                                                                            word[1]
                                                                                ? word[1].map(function( similar ){
                                                                                    return '<span class="XTranslate_sim_word">'+ similar +'</span>'
                                                                                }).join(', ')
                                                                                : '',
                                                                        '</td>',
                                                                    '</tr>'
                                                                ].join('')
                                                            }).join(''),
                                                        '</table>'
                                                    ].join(''),

                                                '</dl>'
                                            ].join('')
                                        );
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
    },

    getTranslateThePageURL: function( tab_url )
    {
        var
            url = this.url + '/translate?',
            lang = settings('lang'),
            query = [
                'sl='+ lang.from,
                'hl='+ lang.to,
                'tl='+ lang.to,
                'u='+ tab_url
            ].join('&');

        return url + query;
    }
});
