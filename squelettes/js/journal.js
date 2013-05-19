$(document).ready(function(){
	// clear spip_photo size, let it be responsive
	$('.spip_photo img, .portfolio .spip_documents img').attr({'width':'','height':'','style':''});

	// add next and previous
	$('.portfolio .spip_documents img').each(function(){
		// get the link of the next one
		var i=14, id='', cn = $(this).parent().parent()[0].className;
		while(!isNaN(cn[i])){
			id += cn[i];
			i++;
		};
		
		var el = $('.portfolio a#doc'+id);
		if(!el.length) el = $('.portfolio a#img'+id);
		
		
		var next = $('a',$(el).parent().next())[0] || {onclick:function(){return false}};
		$(this).click(function(){
			next.onclick();
		}).css({'cursor':'pointer'})
		
	})
	// maximize image size
	

});
