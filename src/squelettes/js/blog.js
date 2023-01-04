addEventListener('DOMContentLoaded', function() {
	document.querySelectorAll('h3.accessibility').forEach(function(element) {
		element.style.cursor = 'pointer'

		element.addEventListener('click', function(ev){
			ev.target.nextElementSibling.classList.toggle('h');
		})
	})
});
