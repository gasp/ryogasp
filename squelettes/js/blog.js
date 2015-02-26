$(document).ready(function(){
	$('h3.accessibility',this).css({cursor:'pointer'}).click(function () {
		$(this).next().slideToggle();
	});

	// petits pois
	var $peas = $("<div><a href=\"#\"><span></span> petits pois</a></div>")
		.attr("id", "peas");

	$("#entete").append($peas);
	$("#peas a").trigger("click");

	var peas;
	$.get( "http://api.cepcam.org:1907/bloggers/authors", function( data ) {
		var blog = $.grep(data, function(v){
			return v.slug == "ryoga";
		})[0];
		peas = blog.peas;
		$("#peas a span").text(blog.peas);
	});

	$("#peas a").on("click", function(ev) {
		$.post('http://api.cepcam.org:1907/bloggers/feed/ryoga', function() {
			$("#peas a span").text(++peas);
		});
		ev.preventDefault();
		return false;
	});



});