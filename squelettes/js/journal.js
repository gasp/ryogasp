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

//			console.dir(this.env)
		}.bind(this),50);

// debug
		window.setTimeout(function(){
			console.dir(this.env)
		}.bind(this),350);


		$(window).on("resize",function(){
			portfolio.refresh();

			portfolio._setBigImage(function(){});
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
			this._setBigImage(function(){
				window.scrollTo(0, Math.floor(this.env.activeDocument.offset().top));
				$(".portfolio_big img",this.env.obj).css({'visibility':'visible'});
			});

		}
	},
	
	// utils
	_getWrapperWidth : function () {
		if(this.env.wrapperWidth == null)
			this.env.wrapperWidth = Math.floor($("#main.wrapper").width());
		return this.env.wrapperWidth;
	},
	_getScreenHeight : function () {
		this.env.screenHeight = Math.floor($(window).height() * .8);
		return this.env.screenHeight;
	},
	_setBigImage : function (callback) {

		var that = this;
		that.callback = callback;

		$('<img/>').attr('src', this.env.bigImage.attr('src')).on("load",function(){
			that.env.imageObject = this;
			that.env.real = {
				width: that.env.imageObject.width,
				height: that.env.imageObject.height
			}
			that.env.ratio = that.env.real.width / that.env.real.height;

			if(that.env.ratio >= 3){
				that.env.isPano =  true;
				// should be somewhere else...
				// but bind is faster because it doesn't load all these images
				$(".raquo",that.env.obj).hide()
				console.log('ratio w/h', that.env.ratio, 'panoramique picture');
				that._makePano();
			}

			else{
				that._makeBig();
			}



			that.callback()
		});
	},
	_makePano: function() {
		var that = this;
		var panoheight = Math.min(that._getScreenHeight(), 700),
			panowidth = Math.floor(that._getScreenHeight() * that.env.ratio);

//				console.log("panoheight",panoheight,"panowidth",panowidth);

		// remove any previous elements:
		$(".portfolio_big .pano",that.env.obj).remove();
		var src = $(".portfolio_big .spip_doc_descriptif a.hd",that.env.obj).attr("href"),
			panopict = $("<img />").attr({
				"src":src
			}).css({
				'width': panowidth,
				'height': panoheight,
				'max-width': panowidth,
				'visibility': 'visible'
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
		});
	},
	_makeBig: function() {
		var that = this;
		
		var width = Math.min(that._getWrapperWidth(),that.env.imageObject.width),
			height =  Math.ceil(width / that.env.ratio);

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

var search = {
	initialized: false,
	opened: false,
	init: function() {
		this.create();
		this.hide();
		this.listen();
		this.initialized = true;
	},
	listen: function() {
		var that = this;
		$(document).on("keypress", function(ev) {
			if ($(ev.target).is('input, textarea'))
				return;
			if(ev.which==102 && (ev.ctrlKey || ev.metaKey)) {
				that.show();
				console.log(ev);
				return false;
			}
		});
		$("#search").on("keypress", function(ev) {
			console.log(ev);
			if(ev.keyCode == 27)
				that.hide();
		});
	},
	create: function() {
		var div = document.createElement("div"), // fastest way
			form = document.createElement("form"),
			label = document.createElement("label"),
			input = document.createElement("input");
		$(input).attr({"type": "search", "id": "search", "name": "recherche","autocorrect":"off","autocapitalize":"off"});
		$(label).attr("for","search").text("search");
		$(form).attr("action","/journal/").append(label,input);
		$(div).addClass("search").append(form)
		$("body").append(div);
	},
	show: function() {
		$(".search").show();
		$("#search").focus();
		this.opened = true;
	},
	hide: function() {
		$(".search").hide();
//		$(document).focus();
		this.opened = false;
	}
};

search.init();