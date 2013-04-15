$(document).ready(function(){
	
	$('body.blog h3.accessibility').css({cursor:'pointer'}).click(function () {
		$(this).next().slideToggle();
	});
	
	// clear spip_photo size, let it be responsive
	$('.spip_photo img').attr({'width':'','height':'','style':''});

});