var topHeightThing = 0;
var scrollV = {};
var prevTab;
shouldAni = false;

setTimeout(function() {
	if(document.querySelector(".container")) {
		topHeightThing = document.querySelector('.container.shown').offsetTop;
	}
}, 200);

if(typeof defaultTab == 'undefined') {
	defaultTab = "home";
}

tabFrame();
function tabFrame() {
	requestAnimationFrame(tabFrame);
	scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
	scrollV[localStorage.getItem('tab')] = scrollTop;
}

if(localStorage.getItem('tab') == null) {
	localStorage.setItem('tab', defaultTab)
	localStorage.setItem('backupTab', defaultTab)
	prevTab = '';
} else {
	localStorage.setItem('tab', localStorage.getItem('backupTab'))
}

document.querySelector('body').innerHTML += `
	<style class="tabStyle">
		.containers {
			width: 100%;
			overflow-x: hidden;
		}
		.container {
			display: none;
			position: absolute;
			width: 100%; min-width: 100%; max-width: 100%;
			flex-wrap: wrap; 
			align-items: flex-start;
			min-height: calc(100vh - 72px - (52px + env(safe-area-inset-top)));
		}
		.slideIn {
			position: fixed;
			display: flex;
			align-items: flex-start;
			animation: slideInAni 500ms 1;
		}
		@keyframes slideInAni {
			from {
				transform: translate3d(100vw, 0, 0);
			}
			to {
				transform: translate3d(0, 0, 0);
			}
		}
		.container.shown {
			display: flex;
		}
	</style>
`

updateTab(false);
function updateTab(shouldAni) {

	var els = document.querySelectorAll("li.selected");
	for(var i = 0; i < els.length; i++) {
		els[i].classList.remove("selected");
	}

	var el = document.querySelector(`[data-page="${localStorage.getItem('tab')}"]`);
	if(el) {
		el.classList.add("selected");
	}

	var navItems = document.querySelectorAll('.navItem');
	for(var i = 0; i < navItems.length; i++) {
		if(navItems[i].getAttribute('data-dest') == localStorage.getItem('backupTab')) {
			navItems[i].classList.add('selected');
		} else {
			navItems[i].classList.remove('selected');
		}
	}

	var tab = localStorage.getItem('tab');
	var backup = localStorage.getItem('backupTab');
	var containers = document.querySelectorAll('.container');

	window.scrollTo(0, 0);

	if(shouldAni) {
		var containers = document.querySelectorAll('.container');
		for(var i = 0; i < containers.length; i++) {
			containers[i].style.zIndex--
			containers[i].style.position = "fixed";
			containers[i].style.top = `calc(52px + env(safe-area-inset-top) - ${scrollV[prevTab]}px)`;
		}
		document.querySelector(`.${tab}`).style.top = "calc(env(safe-area-inset-top) + 52px)";
		document.querySelector(`.${tab}`).style.zIndex = "400";
		document.querySelector(`.${tab}`).classList.add('slideIn');
		
		document.querySelector(`.${tab}`).addEventListener("webkitAnimationEnd", cssEnd);
		document.querySelector(`.${tab}`).addEventListener("animationend", cssEnd);
	} else {
		hideAll();
		document.querySelector(`.${tab}`).style.position = "initial";
		document.querySelector(`.${tab}`).style.top = "calc(env(safe-area-inset-top) + 52px)";
		document.querySelector(`.${tab}`).style = "z-index: 400";
		document.querySelector(`.${localStorage.getItem('tab')}`).classList.add('shown');
	}
	if(localStorage.getItem("tab") !== prevTab) {
		localStorage.setItem("prevTab", prevTab);
		prevTab = localStorage.getItem('tab');	
	}
	
}

function setTab(whatfor, to, ani) {

	topHeightThing = document.querySelector('.container.shown').offsetTop;

	whatfor.forEach(function(f) {
		localStorage.setItem(f, to);
	});
	updateTab(ani);
}

function cssEnd() {
	var tab = localStorage.getItem('tab');
	tab = document.querySelector(`.${tab}`);
	if(tab && JSON.stringify(tab.classList).indexOf("slideIn") > -1) {
		hideAll();
		tab.classList.remove('slideIn');
		tab.style.position = "initial";
		tab.classList.add('shown');
		tab.style = "z-index: 400";
	}
}

function hideAll() {
	var containers = document.querySelectorAll('.container');
	for(var i = 0; i < containers.length; i++) {
		containers[i].classList.remove('shown'); 
		containers[i].style.zIndex--;
		containers[i].style.position = "fixed";
		containers[i].style.top = topHeightThing + -scrollV[prevTab] + "px"
	}
}