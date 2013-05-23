$(document).ready(function(){
	// clear spip_photo size, let it be responsive
	$('.spip_photo img, .portfolio .spip_documents img').attr({'width':'','height':'','style':''});

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
		
		var next = $('a',$(el).parent().next())[0] || {onclick:function(){return false},href:false};
		$(this).click(function(){
			next.onclick();
		}).css({'cursor':'pointer'})
	
		// maximize image size
		var h = $(this).css({'position':'absolute','max-width':'90%', 'z-index':2}).height();
		$(this).parent().css({'height':h});

//		console.log(next.href);
		if(next.href){
			var raquo = $('<div>&raquo;</div>').addClass('raquo').click(function(){
				next.onclick();
			});
			$(this).parent().mouseover(function(){
				raquo.css({'visibility':'visible'});
			}).mouseout(function(){
				raquo.css({'visibility':'hidden', 'height':h});
			}).append(raquo);
			
		}// there is no next
	});
});
