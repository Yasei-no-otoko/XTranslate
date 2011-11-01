// @project XTranslate (background.js)
// @url https://github.com/extensible/XTranslate 

var lang = {
	from: 'en',
	to: navigator.userLanguage.split('-')[0]
};

window.XTranslate = 
{
	vendors: {},
	button: opera.contexts.toolbar.createItem(
	{
		title: 'XTranslate ('+ [lang.from, '→', lang.to].join(' ') + ')',
		icon: 'icons/flags/'+ lang.to +'.png',
		popup: {
			href: 'options.html',
			width: 350,
			height: 450
		},
		onclick: function(){
			//this.icon = 'icons/flags/uk.png';
		}
	})
};

function ajax(opt) {
	var
		xhr 		= new XMLHttpRequest,
		async 		= opt.async || true,
		url 		= opt.url || location.href,
		method 		= opt.method || 'GET',
		complete 	= opt.complete || function(){},
		type 		= opt.type || 'text/plain';
		binary 		= opt.binary || false;
		data 		= opt.data ? encodeURIComponent(opt.data) : null;
	
	xhr.open(method, url, async);
	binary && xhr.overrideMimeType('text/plain; charset=x-user-defined'); // some magic
	xhr.onreadystatechange = function() {
		if( this.readyState == 4 )
		{
			var response = this.responseText;
			binary && (this.dataURL = 'data:'+ type + ';base64,'+ btoa(response));
			complete.call(this, response);
		}
	};
	xhr.send(data);
	
	return ajax;
}

// add button
opera.contexts.toolbar.addItem(
	XTranslate.button
);

// save message port
opera.extension.addEventListener('connect', function(evt) {
	evt.source.postMessage('');
}, false );

// messages handling
opera.extension.addEventListener('message', function(evt)
{
	//evt.source.postMessage( '--'+ evt.data +'--' );
}, false );

