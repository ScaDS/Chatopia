document.addEventListener('DOMContentLoaded', function() {
	let currentSlide = 0;
	const slides = document.querySelectorAll('.slide');
	const navDots = document.querySelectorAll('.nav-dot');
	const progressBar = document.getElementById('progressBar');
	const slideNumber = document.getElementById('slideNumber');
	const backToLastBtn = document.getElementById('backToLastBtn');
	const imageOverlay = document.getElementById('imageOverlay');
	const overlayImage = document.getElementById('overlayImage');
	const closeBtn = document.querySelector('.close-btn');
	
	// Define slide names for URL fragments
	const slideNames = [
		'overview',
		'what-is-chatopia',
		'how-it-works',
		'environment',
		'agent-behavior',
		'innovation',
		'demo'
	];
	
	// Update progress bar
	function updateProgress() {
		const progress = ((currentSlide + 1) / slides.length) * 100;
		progressBar.style.width = progress + '%';
		slideNumber.textContent = (currentSlide + 1) + ' / ' + slides.length;
		
		// Update active dot
		navDots.forEach((dot, index) => {
			if (index === currentSlide) {
				dot.classList.add('active');
			} else {
				dot.classList.remove('active');
			}
		});
	}
	
	// Navigate to slide
	function goToSlide(slideIndex) {
		if (slideIndex >= 0 && slideIndex < slides.length) {
			// Hide all slides
			slides.forEach(slide => {
				slide.style.display = 'none';
			});
			
			// Show target slide
			slides[slideIndex].style.display = 'flex';
			currentSlide = slideIndex;
			updateProgress();
			
			// Update URL fragment
			updateURLFragment();
		}
	}
	
	// Update URL fragment
	function updateURLFragment() {
		if (window.location.hash !== '#' + slideNames[currentSlide]) {
			history.pushState(null, null, '#' + slideNames[currentSlide]);
		}
	}
	
	// Handle hash change
	function handleHashChange() {
		const hash = window.location.hash.substring(1);
		const slideIndex = slideNames.indexOf(hash);
		
		if (slideIndex !== -1 && slideIndex !== currentSlide) {
			goToSlide(slideIndex);
		}
	}
	
	// Initialize first slide
	goToSlide(0);
	
	// Navigation dots
	navDots.forEach(dot => {
		dot.addEventListener('click', function() {
			const slideIndex = parseInt(this.getAttribute('data-slide'));
			goToSlide(slideIndex);
		});
	});
	
	// Keyboard navigation
	document.addEventListener('keydown', function(e) {
		if (e.key === 'ArrowRight') {
			goToSlide(currentSlide + 1);
		} else if (e.key === 'ArrowLeft') {
			goToSlide(currentSlide - 1);
		} else if (e.key === 'Escape' && imageOverlay.style.display === 'flex') {
			imageOverlay.style.display = 'none';
		}
	});
	
	// Scroll wheel navigation
	let scrollTimeout;
	document.addEventListener('wheel', function(e) {
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			if (e.deltaY > 0) {
				// Scroll down
				goToSlide(currentSlide + 1);
			} else {
				// Scroll up
				goToSlide(currentSlide - 1);
			}
		}, 100);
	});
	
	// Touch swipe navigation
	let touchStartY = 0;
	document.addEventListener('touchstart', function(e) {
		touchStartY = e.touches[0].clientY;
	});
	
	document.addEventListener('touchmove', function(e) {
		e.preventDefault();
	});
	
	document.addEventListener('touchend', function(e) {
		const touchEndY = e.changedTouches[0].clientY;
		const diff = touchStartY - touchEndY;
		
		if (Math.abs(diff) > 50) {
			if (diff > 0) {
				// Swipe up
				goToSlide(currentSlide + 1);
			} else {
				// Swipe down
				goToSlide(currentSlide - 1);
			}
		}
	});
	
	// Back to last slide button
	backToLastBtn.addEventListener('click', function() {
		goToSlide(slides.length - 1);
	});
	
	// Listen for hash changes
	window.addEventListener('hashchange', handleHashChange);
	
	// Handle initial hash
	handleHashChange();
	
	// Add click event to all images to show overlay
	document.querySelectorAll('img').forEach(img => {
		img.addEventListener('click', function() {
			overlayImage.src = this.src;
			imageOverlay.style.display = 'flex';
		});
	});
	
	// Close overlay when clicking on it
	imageOverlay.addEventListener('click', function(e) {
		if (e.target === imageOverlay) {
			imageOverlay.style.display = 'none';
		}
	});
	
	// Close overlay with close button
	closeBtn.addEventListener('click', function() {
		imageOverlay.style.display = 'none';
	});
});