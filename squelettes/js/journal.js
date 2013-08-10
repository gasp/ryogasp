$(document).ready(function(){

	// clear spip_photo size, let it be responsive
	$('.spip_photo img, .portfolio .spip_documents img').attr({'width':'','height':'','style':''});

	// reset form size
	$('.formulaire_forum input, .formulaire_forum textarea').not('.boutons input').attr({'size':null,'cols':null}).css({'width':'100%'});
	$('.formulaire_forum').show(); /// is hidden by css

	// portfolio
	// portfolio.init();


	// add next and previous
	$('.portfolio .spip_documents img').each(function(){
		// get the link of the next one

		var i=14, // position of the number
			id='', // empty string
			cn = $(this).parent().parent()[0].className;

		// go and fetch !
		while(!isNaN(cn[i]))
			id += cn[i++];

		var el = $('.portfolio a#doc'+id);
		if(!el.length) el = $('.portfolio a#img'+id);

		// create next that selects next element or a fake one
		var next = $('a',$(el).parent().next())[0] || {onclick:function(){return false},href:false};
		$(this).click(function(){
			next.onclick();
		}).css({'cursor':'pointer'})

		if(!maximage(this))
			$(this).load(function(){
				maximage(this);
			});

	//		console.log(next.href);
		if(next.href){
			var ww = $("#main.wrapper").width();
				raquo = $('<div>&raquo;</div>').addClass('raquo').click(function(){
				next.onclick();
			});
			$(this).parent().mouseover(function(){
				var h = $(this).height();
				raquo.css({'visibility':'visible', 'height':h, left: (ww - raquo.width())});
			}).mouseout(function(){
				raquo.css({'visibility':'hidden'});
			}).append(raquo);
		}// there is no next
	});
});

var maximage = function(el){
	// maximize image size
	
	// get wrapper size
	var ww = $("#main.wrapper").width();
	
	var h = $(el).css({'position':'absolute','max-width':ww, 'z-index':2}).height();
	$(el).parent().css({'height':h, 'position':'relative'});
	return h;
}