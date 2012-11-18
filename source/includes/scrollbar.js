// @project XTranslate (scrollbar.js)
// @url https://github.com/extensible/XTranslate

function XTranslate_scrollBarCreate() {
    var scrollTimer, scrollKeyPressed;
    var popup = document.querySelector('.XTranslate_result');

    if(popup.offsetHeight < popup.scrollHeight)
    {
        popup.classList.add('XTranslate_result_scrolled');
        popup.tabIndex = -1;

        // init
        var scrollBar = document.createElement('div');
        scrollBar.className = 'XTranslate_scroll';
        scrollBar.innerHTML += '<div class="XTranslate_scroll_arrow_up" tabindex="-1"/>';
        scrollBar.innerHTML += '<div class="XTranslate_scroll_arrow_down" tabindex="-1"/>';
        scrollBar.innerHTML += '<div class="XTranslate_scroll_bar" tabindex="-1"/>';
        popup.appendChild(scrollBar);

        var scroll = {
            parent: scrollBar,
            bar: scrollBar.querySelector('.XTranslate_scroll_bar'),
            arrow: {
                up: scrollBar.querySelector('.XTranslate_scroll_arrow_up'),
                down: scrollBar.querySelector('.XTranslate_scroll_arrow_down')
            },
            get top(){ return parseInt(scroll.bar.style.top || 0) }
        };

        var height = {
            offset: popup.offsetHeight,
            scroll: popup.scrollHeight,
            parent: scroll.parent.offsetHeight,
            arrow : parseInt(scroll.arrow.up.currentStyle.height),
            arrows: parseInt(scroll.bar.currentStyle.marginTop) * 2, // arrows + margins
            get bar(){
                var h = Math.round(height.offset / height.scroll * height.offset) - height.arrows;
                return Math.max(20 /*min-height*/, h);
            }
        };

        scroll.bar.style.height = height.bar + 'px';
        setTimeout(function () {
            scroll.parent.classList.add('XTranslate_scroll_autohide');
        }, 500);

        // build
        var max_popup_top = height.scroll - height.offset;
        var max_scroll_top = height.parent - height.bar - height.arrows;
        var k = max_popup_top / max_scroll_top;
        var arrows_scroll_step = Math.round(height.offset *.1 / k);
        var page_scroll_step = Math.round(height.offset * .9 / k);
        var wheel_scroll_step = Math.round(height.offset *.2 / k);

        function mouseDown(e) {
            this.mousepos = { x: e.clientX, y: e.clientY };
            this.mousemove = mouseMove.bind(this);
            document.addEventListener('mouseup', mouseUp, false);
            document.addEventListener('mousemove', scroll.bar.mousemove, false);
        }

        function mouseUp(){
            document.removeEventListener('mouseup', mouseUp, false);
            document.removeEventListener('mousemove', scroll.bar.mousemove, false);
        }

        function mouseMove(e){
            window.getSelection().removeAllRanges();
            var mouse = { x: e.clientX, y: e.clientY };
            var offset = mouse.y - this.mousepos.y;
            var before = scroll.top;
            var after = scrollBarUpdate(offset);
            if(before != after) this.mousepos.y = mouse.y;
        }

        function scrollBarUpdate(offset) {
            var scrollTop = scroll.top;
            if(offset < 0) scrollTop = Math.max(0, scrollTop + offset);
            else scrollTop = Math.min(max_scroll_top, scrollTop + offset);

            scroll.bar.style.top = scrollTop + 'px';
            popup.scrollTop = scrollTop * k;
            scroll.parent.style.top = Math.floor(scrollTop * k) + 'px';

            return scrollTop;
        }

        function scrollHandler(e, dir, step) {
            dir = dir || (this == scroll.arrow.up ? -1 : 1);
            step = dir * (step || arrows_scroll_step);

            scrollBarUpdate(step);
            scrollTimer = setInterval(function () {
                scrollBarUpdate(step);
                step += dir * 10;
            }, 200);

            e.preventDefault();
            e.stopPropagation();
        }

        function scrollKeyManager(e) {
            if(!scrollKeyPressed) {
                var stop = true;
                switch(e.which){
                    case 38: // ARROW UP
                        scrollHandler(e, -1, arrows_scroll_step);
                        break;
                    case 40: // ARROW DOWN
                        scrollHandler(e, +1, arrows_scroll_step);
                        break;
                    case 36: // HOME
                        scrollBarUpdate(-max_scroll_top);
                        break;
                    case 35: // END
                        scrollBarUpdate(+max_scroll_top);
                        break;
                    case 33: // PAGE UP
                        scrollHandler(e, -1, page_scroll_step);
                        break;
                    case 34: // PAGE DOWN
                        scrollHandler(e, +1, page_scroll_step);
                        break;
                    default:
                        stop = false;
                }
                stop && e.preventDefault();
                scrollKeyPressed = true;
            }
            else e.preventDefault();
        }

        function scrollTimerClear() {
            clearInterval(scrollTimer);
            scrollKeyPressed = false;
        }

        function mouseWheel(e) {
            var step = e.wheelDelta / -120 * wheel_scroll_step;
            if(popup.contains(e.target)){
                scrollBarUpdate(step);
                e.preventDefault();
            }
        }

        function scrollClick(e) {
            if(e.target == scroll.parent){
                var mouse = e.offsetY - height.arrow;
                var top = scroll.top;
                var bottom = top + height.bar;
                mouse < top && scrollHandler(e, -1, page_scroll_step);
                mouse > bottom && scrollHandler(e, +1, page_scroll_step);
                scrollTimerClear();
            }
        }

        scroll.bar.addEventListener('mousedown', mouseDown, false);
        scroll.arrow.up.addEventListener('mousedown', scrollHandler, false);
        scroll.arrow.down.addEventListener('mousedown', scrollHandler, false);
        scroll.parent.addEventListener('click', scrollClick, false);
        popup.addEventListener('keydown', scrollKeyManager, false);
        popup.addEventListener('keyup', scrollTimerClear, false);
        document.addEventListener('mouseup', scrollTimerClear, false);
        document.addEventListener('mousewheel', mouseWheel, false);
    }
};
