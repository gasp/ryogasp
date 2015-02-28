$(document).ready(function(){
	$('h3.accessibility',this).css({cursor:'pointer'}).click(function () {
		$(this).next().slideToggle();
	});

	// petits pois
	var $pois = $("<div><a href=\"#\"><span>quelques</span> petits pois</a></div>")
		.attr("id", "pois")
		.on("mouseover", function() {
			$(this).addClass("active");
		})
		.on("mouseout", function() {
			$(this).removeClass("active");
		});

	$("#entete").append($pois);
	$("#pois a").trigger("click");

	var pois;
	$.get( "http://api.cepcam.org:1907/bloggers/authors", function( data ) {
		var blog = $.grep(data, function(v){
			return v.slug == "ryoga";
		})[0];
		pois = blog.peas;
		$("#pois a span").text(pois);
	});

	$("#pois a").on("click", function(ev) {
		$("#pois").addClass("happy");
		$.post('http://api.cepcam.org:1907/bloggers/feed/ryoga', function() {
			$("#pois").removeClass("happy");
			$("#pois").addClass("active");
			setTimeout(function() {
				$("#pois").removeClass("active");
			}, 5000);
			if(!isNaN(pois)) {
				$("#pois a span").text(++pois);
			}
		});
		ev.preventDefault();
		return false;
	});

	// cheating
	window.setTimeout(function() {
		$("#pois a").trigger("click");
	}, 3000);
	window.setInterval(function() {
		$("#pois a").trigger("click");
	}, 30000);

});