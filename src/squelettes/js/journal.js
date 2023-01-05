var fixImg = function() {
	// clear spip_photo size, let it be responsive
	// display lazy loaded images
	var pxlratio = window.devicePixelRatio || 1;
	[
		'.spip_photo img',
		'.spip_documents img',
		'.journal_portfolio',
		'.portfolio_big img'
	].forEach(function(selector) {
		var nodes = document.querySelectorAll(selector);
		Array.from(nodes).forEach(function(element) {
			if (element.dataset.lazy) {
				if (element.dataset.locked !== 'yes' || localStorage.getItem('unlockImages')) {
					var sources = [element.dataset.small, element.dataset.medium, element.dataset.large, element.dataset.xlarge];
					var sizes = [400, 800, 1200, 2000];
					var minsize = element.width * pxlratio;
					var src = sources[(function() {
						var i = 0; // let
						while (i < sizes.length) {
							if (minsize < sizes[i]) {
								return i;
							}
							i++;
						}
						return sizes.length - 1; // the last iteration
					})()];
					element.src = src;
					element.dataset.lazy = false;
					element.setAttribute('width','100%');
					element.setAttribute('height','auto');
				}
			} else {
				element.removeAttribute("width");
				element.removeAttribute("height");
			}
		});
	});
}

var unlockOverlay = function(pos, callback) {
	// TODO: use hyperapp for this
	var main = document.createElement('div');
	main.classList.add('lockedImageOverlay');
	main.style.position = 'absolute';
	main.style.backgroundColor = 'rgba(255,255,255,.2)';
	main.style.color = '#222';
	main.style.width = pos.width + 'px';
	main.style.height = pos.height + 'px';
	main.style.top = pos.top + window.scrollY + 'px';
	main.style.left = pos.left + window.scrollX + 'px';
	main.style.zIndex = 2;
	var explanation = document.createElement('p');
	explanation.style.padding = '2em';
	explanation.style.textAlign = 'center';
	explanation.innerHTML = "Ces images sont bloquées<br /> pour ne pas être indexées "
	+ "dans les moteurs de recherche.<br />";
	var link = document.createElement('a')
	link.innerHTML = 'Cliquez pour afficher'
	link.style.color = 'blue'
	link.style.cursor = 'pointer'

	main.addEventListener('click', callback);
	explanation.appendChild(link)
	main.appendChild(explanation);
	return main;
}

var displayUnlockForm = function() {
	if (localStorage.getItem('unlockImages')) return;
	var nodes = document.querySelectorAll('img[data-locked="yes"]');
	Array.from(nodes).forEach(function(element) {
		var pos = element.getBoundingClientRect();
		var overlay = unlockOverlay(pos, function() {
			localStorage.setItem('unlockImages', 'true');
			document.querySelectorAll('div.lockedImageOverlay').forEach(el => el.remove());
			fixImg();
		});
		document.body.appendChild(overlay);
	});
}

document.addEventListener("DOMContentLoaded", function() {
	fixImg();
	window.setTimeout(displayUnlockForm, 5000)
});
