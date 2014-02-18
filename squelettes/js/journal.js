$(document).ready(function(){

	// clear spip_photo size, let it be responsive
	$('.spip_photo img, .journal_portfolio .portfolio_big img').attr({'width':'','height':'','style':''});

	// clear spip_documents_center size, let it be responsive
	$('.spip_photo img').attr({'width':'','height':'','style':''});

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
		this.env.thumbs = $('.portfolio_thumbs a',this.env.obj);

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
		this.env.wrapperWidth = null;
		this.env.contentWidth = null;
		this.env.screenHeight = null;

		// call after a short delay, don't block the threadt
		window.setTimeout(function(){
			this.clean();
			this.bind();
		}.bind(this),50);

		if(this.env.isActive) {
			this.env.active = $('.portfolio_thumbs .active',this.env.obj).get(0);
			this.env.next = this.get.next(this.env.active);
			this.env.previous = this.get.previous(this.env.active);

			// listen to key press
			this.listen();
		}

// debug
//		window.setTimeout(function(){
//			console.dir(this.env)
//		}.bind(this),350);


		$(window).on("resize",function(){
			portfolio.refresh();

			portfolio._setBigImage(function(){});
		});
	},
	refresh: function(){
		this.env.wrapperWidth = null;
		this.env.contentWidth = null;
		this.env.screenHeight = null;
	},
	listen: function() {
		var that = this;
		var previous = that.get.previous(this.env.active);
		var next = that.get.next(this.env.active);

		$(document).on("keypress", function(ev) {
			if ($(ev.target).is('input, textarea'))
				return;
			if(ev.keyCode==37) {
				if(previous)
					window.location.href = previous;
			}
			if(ev.keyCode==39) {
				if(next)
					window.location.href = next;
			}
		});
	},
	bind: function(){
		var that = this;

		// bind links
		this.env.thumbs.each(function() {
			$(this).attr("href", $(this).data("redirect"));
		});

		// apply css
		this.env.thumbs.css({'opacity':'0.8'});
		// bind mouse over
		this.env.thumbs.on('mouseover',function(){
			$(this).animate({'opacity':'1'},'fast')
		}).on('mouseout',function(){
			$(this).animate({'opacity':'0.8'},'fast')
		});


		// special behavior for the active thumbnail
		if(this.env.isActive){
			// get the value of "next" link
			var next = that.env.next;

			// this should not be a Pano and raquo should be added
			if(next)
				!that.env.isPano && that._makeRaquo();

			// when click on the bigImage, proceed
			that.env.bigImage.on("click", function(){
				if(next)
					window.location.href = next;
			});

			// active thumb does not fade
			$(that.env.active).off('mouseover mouseout').css({'opacity':'1'});
		}
	},
	get: {
		next: function(active) {
			return $($('a',$(active).parent().next())[0]).data("redirect") || false;
		},
		previous: function(active) {
			return $($('a',$(active).parent().prev())[0]).data("redirect") || false;
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
	_getContentWidth : function () {
		if(this.env.contentWidth == null)
			this.env.contentWidth = Math.floor($("#main.wrapper > .content").width());
		return this.env.contentWidth;
	},
	_getScreenHeight : function () {
		this.env.screenHeight = Math.floor($(window).height() * .8);
		return this.env.screenHeight;
	},
	// calculate ratio and call to display big image
	_setBigImage : function (callback) {

		var that = this;
		that.callback = callback;

		// if there is no big image selected (ie we are not in an article page)
		if(!this.env.bigImage) return;

		if(typeof(that.env.real) !== "undefined") { // should this be testing ratio instead of real ?
			that._makeImage();
			that.callback();
		}
		else {
			$('<img/>').attr('src', this.env.bigImage.attr('src')).on("load",function(){
				that.env.imageObject = this;
				that.env.real = {
					width: that.env.imageObject.width,
					height: that.env.imageObject.height
				};
				that.env.ratio = that.env.real.width / that.env.real.height;
				that._makeImage();
				that.callback();
			});
		}

	},
	// makes either Pano or Big
	_makeImage: function() {
		if(this.env.ratio >= 3){
			this.env.isPano =  true;
			// should be somewhere else...
			// but bind is faster because it doesn't load all these images
			$(".raquo",this.env.obj).hide()
			console.log('ratio w/h', this.env.ratio, 'panoramic picture');
			this._makePano();
		}

		else{
			this._makeBig();
		}
	},
	_makePano: function() {
		var that = this;

		that.env.pano = {}; // main panoramic container
		that.env.pano.height = Math.min(that._getScreenHeight(), 700)
		that.env.pano.width = Math.floor(that._getScreenHeight() * that.env.ratio);
		that.env.mini = {}; // mini map
		that.env.mini.width =  300; 
		that.env.mini.height = that.env.mini.width / that.env.ratio;
		that.env.frame = {}; // frame selector on the mini map
		that.env.frame.width = that._getWrapperWidth() / that.env.pano.width * that.env.mini.width;

//		console.log(that.env);

		// remove any previous elements:
		$(".portfolio_big .pano",that.env.obj).remove();
		$(".portfolio_big .minimap",that.env.obj).remove();
		var src = $(".portfolio_big .spip_doc_descriptif a.hd",that.env.obj).attr("href"),
			panopict = $("<img />").attr({
				"src":src
			}).css({
				'width': that.env.pano.width,
				'height': that.env.pano.height,
				'max-width': that.env.pano.width,
				'visibility': 'visible'
			}),
			pano = $("<div/>").css({
				'width': that._getWrapperWidth(),
				'max-width': that._getWrapperWidth(),
				'height': that._getScreenHeight()+20, // 20px for the scroll bar
				'position':'absolute',
				'background': '#fff',
				'overflow-x': 'scroll'
			}).addClass("pano").append(panopict).on('scroll', function(ev) {

				var scrollratio = $(this).scrollLeft() / that.env.pano.width ;


				// change miniframe position
				$(".minimap > div", that.env.obj).css({'left': scrollratio * that.env.mini.width -1});
			}),
			minimap = $("<div/>").addClass('minimap').css({
				'width': that.env.mini.width,
				'height': that.env.mini.height + 50,
				'position': 'absolute',
				'top': that.env.pano.height + 20, // want the map up ?'-115px',
				'left': that._getWrapperWidth() - that.env.mini.width,
			}).on("click", function(ev) {
				var map = this;
				// click pos = cursor pos - left of the click area - the half of the frame
				var clickpos = ev.clientX - $(map).offset().left - that.env.frame.width/2;
				var clickratio = clickpos / that.env.mini.width;

				// console.log("clicked",ev.clientX, $(map).offset().left,that.env.mini.width,clickratio, '%', clickratio * that.env.pano.width, that.env.frame.width/2);
				$(".pano").scrollLeft(clickratio * that.env.pano.width);
			}),
			minipict = $("<img />").attr({
				"src":src
			}).css({
				'width': that.env.mini.width,
				'height': that.env.mini.height,
				'visibility': 'visible',
				'cursor': 'crosshair'
			}),
			miniframe = $("<div/>").css({
				'border': '1px solid #333',
				'background-color': 'rgba(255,255,255,.5)',
				'position': 'absolute',
				'top': '-1px',
				'left': '-1px',
				'height': that.env.mini.height,
				'width': that.env.frame.width,
				'cursor': 'ew-resize'
			}),
			minihelp = $("<div/>").html("Photo panoramique, scrollez &rarr;").css({
				'text-shadow': '0 1px 0 #fff',
				'text-shadow': '0 1px 0 rgba(255,255,255,0.5)'
			});

		that.env.bigImage.parent().append(pano);
		minimap.append(minipict, minihelp, miniframe);

		// if there is enough space to display it, append it
		if(that._getContentWidth() + that.env.mini.width < that._getWrapperWidth())
			that.env.bigImage.parent().append(minimap);
		else
			that.env.bigImage.parent().append(minimap.css({'top':0}));

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