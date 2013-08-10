$(document).ready(function(){

	// clear spip_photo size, let it be responsive
	$('.spip_photo img, .journal_portfolio .portfolio_big img').attr({'width':'','height':'','style':''});

	// reset form size
	$('.formulaire_forum input, .formulaire_forum textarea').not('.boutons input').attr({'size':null,'cols':null}).css({'width':'100%'});
	$('.formulaire_forum').show(); /// is hidden by css

	// portfolio
	portfolio.init();

});



var portfolio = {
	env: {},
	init: function(){
		
		// set env variables
		this.env.obj = $(".journal_portfolio"); // cache the object
		this.env.isArticle = $("body").hasClass("article");
		this.env.activeDocument = $(".spip_documents",this.env.obj);
		this.env.isActive = (this.env.activeDocument.length > 0);

		// id is a number or null
		this.env.id = 
			(this.env.isActive) 
				&& this._getActiveIdFromClassName(
					this.env.activeDocument[0].className
				)
				|| null;
		this.env.bigImage = 
			(this.env.isActive) 
				&& $(".portfolio_big img", this.env.obj)
				|| null;


		this.env.wrapperWidth = null;

		console.dir(this.env);
		
		
		
		// call after a short delay, don't block the threadt
		window.setTimeout(function(){
			this.clean();
			this.bind();
		}.bind(this),50);

		
	},
	refresh: function(){
		this.env.wrapperWidth = null;
	},
	
	bind: function(){
		var that = this;

		// bind thumbnails 
		$("a.thumb",this.env.obj).on("click", function(e){
			location.href = $(this).data("redirect");
			e.preventDefault();
		});

		if(this.env.isArticle){
		}
		if(this.env.isActive){
			var active = $('.portfolio_thumbs .active',this.env.obj).get(0);
//			console.log(active,' is active');
			
			this.env.thumbs = $('.portfolio_thumbs a');
			this.env.thumbs.each(function(){
//				console.log(this,active)
				if(this == active){

					console.log($(this).data("redirect"));
					var next = $($('a',$(active).parent().next())[0]).data("redirect") 
						|| false;

					if(next)
						that._makeRaquo()

					that.env.bigImage.on("click", function(){
						if(next)
							window.location.href = next;
					});
				}
			});
		}
		console.log('bind')
	},
	clean: function(){
		
		// remove width and height
		if(this.env.isActive){

			this._setBigImageSize();

		}
	},
	
	// utils
	_getActiveIdFromClassName : function(cn){
		/*
			TODO get it from data-id
		*/
		var i=14, // position of the number
			id=''; // empty string
		// go and fetch !
		while(!isNaN(cn[i]))
			id += cn[i++];
		return id;
	},
	_getWrapperWidth : function () {
		if(this.env.wrapperWidth == null)
			this.env.wrapperWidth = $("#main.wrapper").width();
		return this.env.wrapperWidth;
	},
	_setBigImageSize : function (callback) {

		var that = this;
		console.log('making a copy of',this.env.bigImage.attr('src'),callback);
		
		$('<img/>').attr('src', this.env.bigImage.attr('src')).on("load",function(){
			var real = this,
				width = Math.min(that._getWrapperWidth(),real.width),
				height =  Math.ceil(real.height / real.width * width);
/*
				todo later?
				console.log(real.width,real.height,width,height);
				
				var ratio = real.width/real.height;
				if(ratio > 3)
					console.log('ratio w/h', ratio, 'panoramique ?');
*/
			console.log("modifs des css de",that.env.bigImage);
				
			that.env.bigImage.css({
				'width': width,
				'height': height,
				'position':'absolute'
			});
			
			that.env.bigImage.parent().css({
				'position': 'relative',
				'height': height
			})
			
			that.env.bigImageWidth = width;
			that.env.bigImageHeight = height;
		});
	},
	_makeRaquo: function () {
		var env = this.env;
		var raquo = $('<div>&raquo;</div>').addClass('raquo');
		$(this.env.bigImage).parent().on('mouseover',function(){
			raquo.css({
				'visibility': 'visible',
				'height': env.bigImageHeight,
				'left': (env.bigImageWidth - raquo.width()),
				'top': 0
			});
		}).mouseout(function(){
			raquo.css({'visibility':'hidden'});
		}).append(raquo);
	}
};