// @project XTranslate (injected.js)
// @url https://github.com/extensible/XTranslate 

document.toString() == '[object HTMLDocument]' && function()
{
    var type = document.location.protocol == 'file:' ? 'load' : 'DOMContentLoaded';
    window.addEventListener(type, function()
    {
        var
            top_level = window.top == window.self,
            show_in_frame = window.innerWidth >= 200 && window.innerHeight >= 200,
            port, settings, icon_trigger,
            popup, selection, overNode, range, autoSelected;

        function extend( source )
        {
            [].slice.call(arguments,1).forEach(function( obj ){
                for(var i in obj){
                    obj.hasOwnProperty(i) && (source[i] = obj[i]);
                }
            });
            return source;
        }

        function css( name, value )
        {
            if( name && value ) this.style[name] = value;
            else if(typeof name == 'object') extend(this.style, name);
            else if(name) return this.currentStyle[name];
            return this;
        }

        function handle_selection( evt )
        {
            var
                type = evt.type,
                selection = selection || window.getSelection();

            if(popup.css('display') !== 'none') return;
            autoSelected = selection.isCollapsed && type == 'keydown';
            hide_icon_trigger();

            if(
               (type == 'keydown' && settings.trigger.type == 'keypress') ||
               (type == 'click' && settings.translate.easyclick) ||
               (type == 'dblclick' && settings.translate.dblclick) ||
               (type == 'mouseup' && settings.button.icon_trigger_popup))
            {
                var text = autoSelected && overNode
                    ? overNode.value || overNode.placeholder || overNode.textContent
                    : selection.toString();

                text && port.postMessage({action: 'translate', text: prepare_text(text)});
            }
        }

        function show_popup( html, position )
        {
            var
                first = popup.firstChild,
                pos = position || function(){
                    selection = selection || window.getSelection();

                    if(!selection.isCollapsed){
                        return selection.getRangeAt(0).getBoundingClientRect();
                    }

                    if(autoSelected && overNode){
                        if(overNode.hasChildNodes()) {
                            selection.selectAllChildren(overNode);
                        }
                        else {
                            // textarea, input
                            var range = document.createRange();
                            range.selectNode(overNode);
                            selection.addRange(range);
                        }

                        // calculate correct rectangle
                        var nodeRect = overNode.getBoundingClientRect();
                        var selRects = selection.getRangeAt(0).getClientRects();

                        var validRects = [].slice.call(selRects).filter(function (rect) {
                            return (
                                rect.left >= nodeRect.left &&
                                rect.right <= nodeRect.right &&
                                rect.top >= nodeRect.top &&
                                rect.bottom <= nodeRect.bottom
                            );
                        });

                        var rect = validRects.reduce(function (val, rect) {
                            val.left = val.left == null ? rect.left : Math.min(val.left, rect.left);
                            val.top = val.top == null ? rect.top : Math.min(val.top, rect.top);
                            val.right = val.right == null ? rect.right : Math.max(val.right, rect.right);
                            val.bottom = val.bottom == null ? rect.bottom : Math.max(val.bottom, rect.bottom);
                            return val;
                        }, {});

                        rect.width = rect.right - rect.left;
                        rect.height = rect.bottom - rect.top;

                        return validRects.length > 0 ? rect : selRects[0] || nodeRect;
                    }

                    return {left: 0, top: 0, bottom: 0, right: 0};
                }();

            html = function() {
                var node = document.createElement('div');
                node.innerHTML = html;
                return node;
            }();

            first ? popup.replaceChild(html, first) : popup.appendChild(html);
            popup.css({
                left   : pos.left + 'px',
                top    : (pos.bottom + popup.padding) + 'px',
                margin : 0,
                display: 'block'
            });

            if(settings.button.autoplay){
                var play_sound = html.querySelector('.XTranslate_sound_play');
                play_sound && play_sound.click();
            }

//            !selection.isCollapsed &&
//            [].slice.call(selection.getRangeAt(0).getClientRects()).forEach(function (pos, i){
//                // debug
//                window.$('<div/>').css({
//                    position  : 'fixed',
//                    background: 'rgba(255,0,0,.4)',
//                    left      : pos.left,
//                    top       : pos.top,
//                    width     : pos.width,
//                    height    : pos.height,
//                    zIndex    : 1000
//                }).appendTo(document.body).text(i);
//            });

            // fix position
            var
                win_size = {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                popup_size = {
                    width: popup.offsetWidth,
                    height: popup.offsetHeight
                },
                offset = {
                    x: pos.left + popup_size.width - win_size.width,
                    y: pos.bottom + popup_size.height - win_size.height,
                    padding: 20
                };

            offset.x > 0 && popup.css('marginLeft', -(offset.x + offset.padding) + 'px');
            offset.y > 0 && popup.css('marginTop', -(offset.y + offset.padding) + 'px');
        }

        function hide_popup() {
            !top_level && window.top.postMessage('hide', '*');
            popup.css('display', 'none');
            hide_icon_trigger();
        }

        function url_is_excluded( urls )
        {
            var location = window.location.href;

            return !! urls.split('\n')
                .filter(function( url )
                {
                    url = url.trim()
                        .replace(/^https?:\/\/(www\.)?/, '')
                        .replace(/[.]/g, '[.]')
                        .replace(/\*/g, '.*?'),
                    checker = new RegExp('^(https?://(www[.])?)?' + url, 'mi');

                    return checker.test(location);
                }).shift();
        }

        function hide_icon_trigger() {
            if(icon_trigger.parentNode){
                icon_trigger.parentNode.removeChild(icon_trigger);
            }
        }

        function save_selected_text() {
            try {
                port.postMessage({
                    action: 'save-selected-text',
                    text: prepare_text(window.getSelection().toString())
                });
            } catch(e){
                window.location.reload(true);
            }
        }

        function prepare_text(text) {
            return text
                .replace(/(\s*\n\s*){2,}/g, '\n\n')
                .replace(/^.*$/gm, function( line ){
                    return line.trim()
                });
        }

        // Messaging handler
        opera.extension.onmessage = function( evt )
        {
            evt.data.settings && (settings = evt.data.settings);

            // Don't execute the extension from the excluded URL list
            if( url_is_excluded(settings.exclude.urls) ) return;

            var root = document.documentElement;
            switch(evt.data.action)
            {
                case 'init':
                    port = evt.source;

                    popup = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                    popup.className = 'XTranslate';
                    popup.onclick = function( evt )
                    {
                        var elem = evt.target;

                        if( elem.className == 'XTranslate_sound_play' ){
                            var
                                parent_ = elem.parentNode,
                                obj = parent_.querySelector('object');

                            if(!obj.src){
                                port.postMessage({
                                    action: "get-sound",
                                    url: elem.getAttribute('data-url')
                                });
                            } else {
                                parent_.removeChild(obj);
                                parent_.appendChild(obj);
                            }
                        }

                        evt.stopPropagation();
                    };

                    popup.padding = 5;
                    popup.css = css;
                    popup.show = show_popup;
                    popup.hide = hide_popup;

                    var style = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
                    style.id = 'XTranslate_CSS';
                    style.textContent = evt.data.css;

                    DOM_apply_bindings();
                    (document.head || root).appendChild(style);
                    (document.body || root).appendChild(popup);

                    icon_trigger = new Image;
                    icon_trigger.src = evt.data.images.update;
                    icon_trigger.className = 'XTranslate_icon_trigger';
                    icon_trigger.title = 'XTranslate: get the translation';
                break;

                case 'translate':
                    handle_selection(evt);
                break;

                case 'audio':
                    var sound = popup.querySelector('object');
                    sound.src = sound.data = evt.data.track;
                break;
            }

            evt.data.userCSS && popup.setAttribute('style', evt.data.userCSS);

            // Update custom CSS
            var
                id = 'XTranslate_custom_CSS',
                css_rules = evt.data.customCSS,
                custom_css = document.getElementById(id);

            if( css_rules ) {
                custom_css = custom_css || document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
                custom_css.id = id;
                custom_css.textContent = css_rules;
                (document.head || root).appendChild(custom_css);
            }

            if( custom_css && css_rules !== undefined && !css_rules ){
                custom_css.parentNode.removeChild( custom_css );
            }

            // Update popup's HTML-content
            evt.data.html && (
                top_level || show_in_frame
                    ? popup.show( evt.data.html )
                    : window.top.postMessage(
                    {
                        name : window.name,
                        pos  : extend({}, selection.getRangeAt(0).getBoundingClientRect()),
                        html : evt.data.html
                    }, '*')
            );
        };

        // Extra handling for iframes
        if( top_level )
        {
            var frames = [].slice.call(document.querySelectorAll('iframe'));
            frames.forEach(function( frame ) {
                if( !frame.getAttribute('name') ){
                    var uniq_id = 'iframe-'+ String(Math.random()).replace('.', '');
                    frame.name = uniq_id;
                }
            });

            window.addEventListener('message', function( evt )
            {
                if( evt.data.html && evt.data.pos && evt.data.name )
                {
                    var
                        frame = document.querySelector('iframe[name="'+ evt.data.name +'"]'),
                        pos = {
                            left: frame.offsetLeft - window.scrollX,
                            top: frame.offsetTop - window.scrollY
                        },
                        position = extend({}, evt.data.pos, {
                            left	: evt.data.pos.left + pos.left,
                            top		: evt.data.pos.left + pos.top,
                            bottom	: evt.data.pos.bottom + pos.top,
                            right	: evt.data.pos.right + pos.left
                        });

                    popup.show(evt.data.html, position);
                }

                evt.data == 'hide' && popup.hide();
            }, false)
        }

        function DOM_apply_bindings()
        {
            [
                ['mouseup', function __(evt) {
                    save_selected_text();
                    selection = selection || window.getSelection();

                    if(__.icon_trigger_clicked){
                        __.icon_trigger_clicked = false;
                        return false;
                    }

                    if(settings.button.icon_trigger_popup){
                        var text = selection.toString().trim();
                        if( text ){
                            var range = selection.getRangeAt(0);
                            var pos = [].slice.call(range.getClientRects()).pop();

                            icon_trigger.style.left = pos.right + 'px';
                            icon_trigger.style.top = pos.bottom + window.pageYOffset + 'px';
                            icon_trigger.onmousedown = function (e) {
                                __.icon_trigger_clicked = true;
                                handle_selection(evt);
                                e.preventDefault();
                            };
                            document.body.appendChild(icon_trigger);
                        }
                    }
                    else {
                        handle_selection(evt);
                    }
                }],

                ['keydown', function( evt ) {
                    var hotKey = [
                        evt.ctrlKey && 'Ctrl',
                        evt.altKey && 'Alt',
                        evt.shiftKey && 'Shift',
                        String.fromCharCode(evt.which).toUpperCase()
                    ]
                    .filter(function (v) { return v })
                    .join('+');

                    settings.trigger.hotkey == hotKey &&
                    settings.trigger.type == 'keypress' && (
                        handle_selection(evt),
                        evt.preventDefault()
                    );
                }],

                ['mousedown', function (e) {
                    var s = window.getSelection();
                    range = s.rangeCount ? s.getRangeAt(0) : null;
                }],

                ['click', function (evt) {
                    var
                        x = evt.clientX,
                        y = evt.clientY,
                        popup_is_hidden = popup.css('display') == 'none';

                    if(settings.translate.easyclick && range && popup_is_hidden){
                        var rect,
                            rects = Array.prototype.slice.call(range.getClientRects());

                        while(rect = rects.shift()){
                            if(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom){
                                window.getSelection().addRange(range);
                                handle_selection(evt);
                                evt.preventDefault();
                                return false;
                            }
                        }
                    }

                    hide_popup();
                }],

                ['dblclick', function (evt) {
                    if(settings.translate.dblclick){
                        handle_selection(evt);
                        dblclick = function () {};
                        evt.preventDefault();
                    }
                }],

                ['keyup', function( evt ){
                    save_selected_text();
                    evt.which == 27 && hide_popup(evt); // <ESCAPE>-key
                }],

                ['mouseover', function( evt ) {
                    overNode = evt.target;
                }]
            ].forEach(function(p){
                var evtName = p.shift();
                var handler = p.shift();
                document.addEventListener(evtName, handler, false);
            })
        }

    }, false);

}();
