// @project XTranslate (vendors/google.js)
// @url https://github.com/extensible/XTranslate  

XTranslate.vendors.set('google', function(evt){
	evt.source.postMessage( '--'+ evt.data + '--' );
});
