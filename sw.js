const CACHE_NAME = "today-v0.2";
const urlsToCache= [
	"/",
	"style.css",
	"main.js",
	"apple-touch-icon.png",
	"icon-big.png",
	"icon-big-green.png",
	"index.html",
	"manifest.json",
	"tabs.js"
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
	);
	self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
	event.respondWith(async function() {
		try {
			return await fetch(event.request,
			{
				cache: "no-cache"
			});
		} catch (err) {
			return caches.match(event.request);
		}
	}());
});

let urlVars = {};
let url = location.href;
url = url.split("?");
if(url[1]) {
	url[1] = url[1].split(/&|=/);
	runUrl();
}

function runUrl() {
	if(url[1].length > 0) {
		urlVars[url[1][0]] = url[1][1];
		url[1].splice(0, 2);
		runUrl();
	}
}

const userInfo = JSON.parse(decodeURIComponent(urlVars.obj));

let tokenIndex = 0;
let tokens = [];
let sockets = [];
userInfo.tokens.forEach(() => {
	
	let token = userInfo.tokens[tokenIndex];
	let type = userInfo.types[tokenIndex];
	const wss = `wss://api.getmakerlog.com/notifications/?${type}=${token}`;
	sockets[tokenIndex] = new WebSocket(wss);

	let whatUser = tokenIndex;

	sockets[tokenIndex].onmessage = evt => {
		clients.matchAll({includeUnctrolled: true, type: "window"}).then(clients => {
			fetch(`https://api.getmakerlog.com/notifications/`, {
				headers: {
					"Content-Type": "application/json;charset=UTF-8",
					"Accept": "application/json, text/plain, */*",
					"Authorization": type + " " + token
				}
			}).then(d => {
				return d.json();				
			}).then(d => {
				d = d.sort((a, b) => {
					aDate = new Date(a.created).getTime();
					bDate = new Date(b.created).getTime();
					return b - a;
				});
				d = d[0];
				// self.registration.showNotification(`@${d.actor.username} ${d.verb}`, {
				// 	body: `${d.actor.first_name} ${d.actor.last_name} ${d.verb}: ${d.target.content}`
				// });
			});
		});
	}

	tokenIndex++
});