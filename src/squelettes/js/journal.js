var pxlratio = window.devicePixelRatio || 1;

function imageResponsive() {
	const figures = document.querySelectorAll('.image_responsive.image_private');

	Array.from(figures).forEach(function (figure) {
		const width = figure.offsetWidth;
		const image = figure.querySelector('img');

		image.width = width;
		image.height = width * 1 / image.dataset.ratio

		if (localStorage.getItem('unlockImages')) {
			const sources = [image.dataset.small, image.dataset.medium, image.dataset.large, image.dataset.xlarge];
			const sizes = [400, 1200, 1530, 2000];
			const minsize = width * pxlratio;
			const index = sizes.findIndex(size => size >= minsize);
			image.src = unobfuscate(sources[index]);
		}

		// const caption = figure.querySelector('figcaption');
		// const debug = document.createElement('div');
		// debug.innerHTML = `width: ${width}px pixelratio: ${pxlratio} optimalresolution: ${width * pxlratio}px src: ${image.src}`;
		// caption.appendChild(debug);

	});

	const figures2 = document.querySelectorAll('.image_responsive.image_public');
	Array.from(figures2).forEach(function (figure) {
		const image = figure.querySelector('img');
		const width = figure.offsetWidth;
		// const caption = figure.querySelector('figcaption');
		// const debug = document.createElement('div');
		image.width = width;
		image.height = width * 1 / image.dataset.ratio
		// debug.innerHTML = `width: ${width}px currentSrc: ${image.currentSrc}`;
		// caption.appendChild(debug);
	});
}


var unlockOverlay = function (pos, callback) {
	// TODO: use hyperapp or mythriljs for this
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
	explanation.innerHTML = "Ces images sont bloquées pour ne pas être indexées "
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

var displayUnlockForm = function () {
	if (localStorage.getItem('unlockImages')) return;
	var nodes = document.querySelectorAll('img[data-locked="yes"]');
	Array.from(nodes).forEach(function (element) {
		var pos = element.getBoundingClientRect();
		var overlay = unlockOverlay(pos, function () {
			localStorage.setItem('unlockImages', 'true');
			document.querySelectorAll('div.lockedImageOverlay').forEach(el => el.remove());
			imageResponsive();
		});
		document.body.appendChild(overlay);
	});
}


function unobfuscate(s) {
	if (s === 'mismatch') throw new Error('mismatch')
	const [, largeur, extc, noext, hauteur, ts] = s.match(/([0-9]{1,4})([a-z]{1})(.*)\/([0-9]{1,4})\/([0-9]+)/)
	if (extc === 'z') throw new Error('Unknown extc')
	const ext = [['a', 'jpg'], ['b', 'jpeg'], ['c', 'gif'], ['d', 'png'], ['e', 'bmp'], ['f', 'apng'], ['g', 'svg'], ['h', 'webp']].find(([c, r]) => c === extc)[1]
	return `local/cache-vignettes/L${largeur}xH${hauteur}/${reverse(unrot13(noext))}.${ext}?${ts}`
}

function reverse(str) {
	return str.split('').reverse().join('');
}

function unrot13(s) {
	return s.replace(/[a-zA-Z]/g, function (c) {
		return String.fromCharCode(
			(c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
		);
	})
}

document.addEventListener("DOMContentLoaded", function () {
	imageResponsive()
	window.setTimeout(displayUnlockForm, 50)
});
