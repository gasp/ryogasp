$(document).ready(function(){
	
	$('body.blog h3.accessibility').css({cursor:'pointer'}).click(function () {
		$(this).next().slideToggle();
	});
	
});