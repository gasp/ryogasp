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
				&& $(".portfolio_big", this.env.obj).data("id")
				|| null;
		this.env.bigImage = 
			(this.env.isActive) 
				&& $(".portfolio_big img", this.env.obj)
				|| null;
		this.env.isPano = false;
		this.env.screenHeight = null;
		this.env.wrapperWidth = null;

		// call after a short delay, don't block the threadt
		window.setTimeout(function(){
			this.clean();
			this.bind();

			console.dir(this.env)
		}.bind(this),50);

		// these can't wait
		$(".portfolio_big img",this.env.obj).css({'visibility':'hidden'});


		$(window).on("resize",function(){
			portfolio.refresh();

			portfolio._setBigImageSize(function(){});
		})
	},
	refresh: function(){
		this.env.wrapperWidth = null;
		this.env.screenHeight = null;
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
			this.env.thumbs = $('.portfolio_thumbs a');
			this.env.thumbs.each(function(){

				if(this == active){

					var next = $($('a',$(active).parent().next())[0]).data("redirect") 
						|| false;

					if(next)
						!that.env.isPano && that._makeRaquo()

					that.env.bigImage.on("click", function(){
						if(next)
							window.location.href = next;
					});
				}
				else{ // this is not the active thumbnail
					$(this).css({'opacity':'0.8'}).on('mouseover',function(){
						$(this).animate({'opacity':'1'},'fast')
					}).on('mouseout',function(){
						$(this).animate({'opacity':'0.8'},'fast')
					})
				}
			});
		}
	},
	clean: function(){
		var env = this.env;
		// remove width and height
		if(this.env.isActive){
			this._setBigImageSize(function(){
				window.scrollTo(0, Math.floor(this.env.activeDocument.offset().top));
				$(".portfolio_big img",this.env.obj).css({'visibility':'visible'});
			});

		}
	},
	
	// utils
	_getWrapperWidth : function () {
		if(this.env.wrapperWidth == null)
			this.env.wrapperWidth = $("#main.wrapper").width();
		return this.env.wrapperWidth;
	},
	_getScreenHeight : function () {
		this.env.screenHeight = $(window).height() * .8;
		return this.env.screenHeight;
	},
	_setBigImageSize : function (callback) {

		var that = this;
		that.callback = callback;

		$('<img/>').attr('src', this.env.bigImage.attr('src')).on("load",function(){
			var real = this,
				width = Math.min(that._getWrapperWidth(),real.width),
				height =  Math.ceil(real.height / real.width * width);
/*
				todo later?
				console.log(real.width,real.height,width,height);
*/
			var ratio = real.width/real.height;
			if(ratio >= 3){
				that.env.isPano =  true;
				// should be somewhere else...
				// but bind is faster because it doesn't load all these images
				$(".raquo",that.env.obj).hide()
				console.log('ratio w/h', ratio, 'panoramique picture');
				var panoheight = Math.min(that._getScreenHeight(), 700),
					panowidth = that._getScreenHeight() * ratio;

//				console.log("panoheight",panoheight,"panowidth",panowidth);

				var src = $(".portfolio_big .spip_doc_descriptif a.hd",that.env.obj).attr("href"),
					panopict = $("<img />").attr({
						"src":src
					}).css({
						'width': panowidth,
						'height': panoheight,
						'max-width': panowidth
					}),
					pano = $("<div/>").css({
						'width': that._getWrapperWidth(),
						'max-width': that._getWrapperWidth(),
						'height': that._getScreenHeight()+20, // 20px for the scroll bar
						'position':'absolute',
						'background': '#fff',
						'overflow-x': 'scroll'
					}).addClass("pano").append(panopict);
				that.env.bigImage.parent().append(pano)

				that.env.bigImage.css({
					"display":"none"
				});

				that.env.bigImage.parent().css({
					'position': 'relative',
					'height': that._getScreenHeight()+20 // same 20px for the scroll bar
				})

				return;
			}


			that.env.bigImage.css({
				'max-width': width,
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

			that.callback()
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