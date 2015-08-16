$(document).ready(function(){
	$('h3.accessibility',this).css({cursor:'pointer'}).click(function () {
		$(this).next().slideToggle();
	});
});
