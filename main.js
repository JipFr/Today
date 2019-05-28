const sw = true;
if(localStorage.getItem("token")) {
	const toAdd = JSON.stringify({
		tokens: JSON.parse(localStorage.getItem("token")),
		types: JSON.parse(localStorage.getItem("token_type"))
	});
	if (sw && navigator.onLine) {
		
		if ('serviceWorker' in navigator) {

			window.addEventListener('load', function() {
				navigator.serviceWorker.register("sw.js").then(reg => {}, err => {
					console.log(err);
				});
			});

		}
	} else if (!sw && navigator.onLine) {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then(function(registrations) {
				for (let registration of registrations) {
					registration.unregister();
				}
			});
		}
	}	
}


function rld() {
	if(navigator.onLine) {
		navigator.serviceWorker.getRegistrations().then(function(registrations) {
			for (let registration of registrations) {
				registration.unregister();
			}
		});	
	}
	setTimeout(function() {
		location.reload();
	}, 500);
}

let user = [];
let notifs = [];
let productLinks = {}
const API = "https://api.getmakerlog.com/";
const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const noInfoForThisDay = `
<div class="emptyWrapper">
	<div class="empty">
		<h1>¯\\_(ツ)_/¯</h1>
		<h3 class="thin">No tasks were found.</h3>
	</div>
</div>
`

function f(url, options) {
	return new Promise((resolve, reject) => {
		fetch(url, options).then(data => {
			if(data.ok) {
				return data.json();
			} else {
				return null
			}
			
		}).then(data => {
			if(data) {
				resolve(data);	
			} else {
				reject(null);
			}
			
		});
	});
}

function updateIDs() {
	newEls = document.querySelectorAll(".moreCardsDiv")
	for(let i = 0; i < newEls.length; i++) {
		newEls[i].setAttribute("data-cardID", i);
		newEls[i].querySelectorAll(".updateID").forEach(el => {
			el.setAttribute("data-cardID", i);
		});
	}
}

let urlVars = {};
let url = location.href;
url = url.split("#");
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

token = localStorage.getItem("token");
if(token !== "undefined" && token !== "null" && token && navigator.onLine) {

	if(urlVars.access_token) {
		try {
			currentTokens = JSON.parse(token);
			if(!currentTokens.includes(urlVars.access_token)) {
				currentTokens.push(urlVars.access_token)
				localStorage.setItem("token", JSON.stringify(currentTokens));

				currentTypes = JSON.parse(localStorage.getItem("token_type"));
				currentTypes.push(urlVars.token_type);
				localStorage.setItem("token_type", JSON.stringify(currentTypes));
			}
			
		} catch(err) {
			localStorage.removeItem("token");
			localStorage.removeItem("token_type");
		} 
		
		location.href = location.href.split("#")[0];
	}

	emptyCard = document.querySelector(".cardDiv").innerHTML;
	try {
		newToken = JSON.parse(token);
	} catch(err) {
		localStorage.removeItem("token");
		localStorage.removeItem("token_type");
		location.reload();
	}
	
	for(let i = 0; i < newToken.length - 1; i++) {
		document.querySelector(".cardDiv").innerHTML += emptyCard;
	}

	updateIDs();

	function newTask(tasks, isDone = true, whatUser = 0) {
		
		document.querySelector(`[data-cardID="${whatUser}"] .inputInput`).value = "";

		let task = tasks + "";
		let data;

		if(task.length > 0) {

			data = new FormData();

			typeof attach !== "undefined" ? data.append("attachment", attach) : null;
		   
			data.append("done", isDone);
			data.append("content", task);
			removeAttachment();

		}


		token = JSON.parse(localStorage.getItem("token"))[whatUser];
		token_type = JSON.parse(localStorage.getItem("token_type"))[whatUser];
		if(token && typeof data !== "undefined") {

			loadingEl = document.querySelector(`[data-cardID="${whatUser}"] .submitButton`)
			if(!isDone) {
				loadingEl = document.querySelector(`[data-cardID="${whatUser}"] .todoButton`);
			}

			loadingEl.innerHTML = `<div class="loading white"></div>`;	

			let request = new XMLHttpRequest();
			request.open("POST", `${API}tasks/`);
			request.setRequestHeader("Authorization", token_type + " " + token);
			request.send(data);

			request.onload = () => {
				loadUser(whatUser);
			}

		} else if(!token) {
			signIn();
		}
	}

	function loadUser(whatUser = 0) {

		updateUserCount();

		d = new Date();
		els = document.querySelectorAll(".todayCard .date");
		for(let i = 0; i < els.length; i++) {
			els[i].innerHTML = `${d.getDate()} ${firstToUpper(months[d.getMonth()])} ${new Date().getFullYear()}`	
		}

		d = new Date(new Date().getTime() - 1000 * 60 * 60 * 24);
		els = document.querySelectorAll(".yesterdayCard .date");
		for(let i = 0; i < els.length; i++) {
			els[i].innerHTML = `${d.getDate()} ${firstToUpper(months[d.getMonth()])} ${new Date().getFullYear()}`
		}

		token = JSON.parse(localStorage.getItem("token"))[whatUser];
		token_type = JSON.parse(localStorage.getItem("token_type"))[whatUser];
		f(`${API}me/`, {
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
				"Accept": "application/json, text/plain, */*",
				"Authorization": token_type + " " + token
			}
		}).then(data => {

			user[whatUser] = data;

			updateUserCount();
			updateNotifications();
			
			document.querySelector(`[data-cardID="${whatUser}"] .toProfileAnchor`).href = "https://getmakerlog.com/@" + data.username;
			
			dates = {
				"today": new Date(),
				"yesterday": new Date(new Date().getTime() - (1000 * 60 * 60 * 24)),
				"yesterdayBefore": new Date(new Date().getTime() - (1000 * 60 * 60 * 24 * 2))
			}

			urls = [];

			Object.keys(dates).forEach(key => {
				date = dates[key];
				urls.push(`${API}users/${data.id}/stream/${date.getFullYear()}/${months[date.getMonth()]}/${date.getDate()}`);
			});
			promises = [];
			urls.forEach(url => {
				promises.push(getDate(url, token, token_type));
			});

			Promise.all(promises).then(data => {

				// Fixed empty days breaking everything

				data.forEach(e => {
					if(!e.data) {
						e = {
							data: []
						}
					}
				});

				document.querySelector(`[data-cardID="${whatUser}"] .header`).style = `backgound-color: var(--main); background-image: url("${user[whatUser].header}"); background-size: cover; background-position: center;`;
				document.querySelector(`[data-cardID="${whatUser}"] .profile_picture`).src = user[whatUser].avatar;

				document.querySelector(`[data-cardID="${whatUser}"] .yesterdayCard .logDiv`).innerHTML = "";
				document.querySelector(`[data-cardID="${whatUser}"] .todayCard .logDiv`).innerHTML = "";

				let newArr = [...data[1].data, ...data[0].data, ...data[2].data];

				newArr = newArr.sort((a, b) => {
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				});

				// console.log(newArr);
				
				newArr.forEach(task => {

					newDate = new Date(task.created_at);
					taskDate = `${newDate.getFullYear()}/${newDate.getMonth()}/${newDate.getDate()}`;

					d = new Date();
					let todayDate = `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`;

					d = new Date(new Date().getTime() - 1000 * 60 * 60 * 24);
					let yesterdayDate = `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`;

					if(taskDate == todayDate) {
						toAddElement = document.querySelector(`[data-cardID="${whatUser}"] .todayCard .logDiv`);
					} else if(taskDate == yesterdayDate) {
						toAddElement = document.querySelector(`[data-cardID="${whatUser}"] .yesterdayCard .logDiv`);
					} else {
						toAddElement = null;
					}
					
					let index = 0;

					task.project_set.forEach(project => {
						let id = project.id;
						if(!productLinks[id]) {
							f(`${API}projects/${id}/related/`, {
								headers: {
									"Content-Type": "application/json;charset=UTF-8",
									"Accept": "application/json, text/plain, */*",
									"Authorization": localStorage.getItem("token_type") + " " + token
								}
							}).then(data => {
								if(data.products && data.products[0]) {
									product = data.products[0];
									productLinks[id] = product.slug;
									Object.values(product.projects).forEach(tag => {
										tag = tag.name.toLowerCase();
										productLinks[tag] = product.slug;
									});
								} else {
									delete productLinks[id];
								}
							});	
						}
						
						productLinks[id] = "WAITING";

					});

					task.content = task.content.split(" ");
					task.content.forEach(word => {
						if(word.startsWith("#") && word.length > 1) {
							task.content[index] = `<a class="mainAnchor" onclick="newProjectWindow('${word}')"><span class="product">${word}</span></a>`
						}
						if(word.startsWith("http://") || word.startsWith("https://")) {
							task.content[index] = `<a target="_blank" class="linkAnchor" href="${word}"><span class="link">${word}</span></a>`
						}
						index++
					});
					task.content = task.content.join(" ");

					let whatIcon = {
						true: '<svg aria-hidden="true" data-prefix="fas" data-icon="check-circle" class="svg-inline--fa fa-check-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="var(--main)" d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>',
						false: `<svg aria-hidden="true" data-makerlog-id="${task.id}" onclick="markAsDone('${task.id}', '${whatUser}')" data-prefix="fas" data-icon="circle" class="todoIcon svg-inline--fa fa-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="var(--todo)" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z"></path></svg>`
					}

					task.content = `<div class="taskContentDiv">${task.content}</div>` + getTaskExtra(task);

					if(toAddElement) {
						toAddElement.innerHTML += `
							<div class="task">
								<div class="taskMain">
									<div class="taskIcon">
										${whatIcon[task.done]}
									</div>
									<div class="taskContent">
										${task.content}
									</div>
								</div>
								<div class="taskAttachment">
									${task.attachment && task.attachment.length > 0 ? '<img class="taskImage" src="' + task.attachment + '">' : ""}
								</div>
								<div class="taskComments" data-for-comments-task-id="${task.id}">
									${getCommentHTML(task)}
								</div>
							</div>
						`	
					}
				});

				if(document.querySelector(`[data-cardID="${whatUser}"] .todayCard .logDiv`).innerHTML.length == 0) {
					document.querySelector(`[data-cardID="${whatUser}"] .todayCard .logDiv`).innerHTML = noInfoForThisDay;
				}
				if(document.querySelector(`[data-cardID="${whatUser}"] .yesterdayCard .logDiv`).innerHTML.length == 0) {
					document.querySelector(`[data-cardID="${whatUser}"] .yesterdayCard .logDiv`).innerHTML = noInfoForThisDay;
				}
				
				document.querySelector(`[data-cardID="${whatUser}"] .submitButton`).innerHTML = "+";
				document.querySelector(`[data-cardID="${whatUser}"] .todoButton`).innerHTML = `<svg aria-hidden="true" data-prefix="fas" data-icon="circle" class="svg-inline--fa fa-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z"></path></svg>`;
			
			});
		}).catch(err => {
			localStorage.removeItem("token");
			localStorage.removeItem("token_type");
			location.reload();
		});
	}

	function newProjectWindow(project) {
		project = project.slice(1);
		if(productLinks[project.toLowerCase()]) {
			window.open(`https://getmakerlog.com/products/${productLinks[project.toLowerCase()]}`, "_blank")
		}
	}

	window.onload = () => {
		let users = JSON.parse(localStorage.getItem("token"));
		for(let i = 0; i < users.length; i++) {
			loadUser(i);	
		}
	}

	function markAsDone(id, whatUser) {

		token = JSON.parse(localStorage.getItem("token"))[whatUser];
		token_type = JSON.parse(localStorage.getItem("token_type"))[whatUser];

		document.querySelector(`[data-makerlog-id="${id}"]`).outerHTML = `<div class="loading todo"></div>`;
		f(`${API}tasks/${id}/`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
				"Accept": "application/json, text/plain, */*",
				"Authorization": token_type + " " + token
			},
			body: JSON.stringify({
				done: true,
				in_progress: false
			})
		}).then(data => {
			loadUser(whatUser);
		})
	}

} else if(navigator.onLine) {
	document.querySelector(".todayCard").remove();
	document.querySelector(".yesterdayCard").remove();

	if(urlVars.access_token) {
		localStorage.setItem("token", JSON.stringify([urlVars.access_token]));
		localStorage.setItem("token_type", JSON.stringify([urlVars.token_type]));
		location.href = location.href.split("#")[0];
	} else {
		document.querySelector(".mainCard").innerHTML = `
		<div class="auth">
			<img src="apple-touch-icon.png" class="logo" alt="App logo">
			<div class="inputs">

				<h2 class="subtitle">Today is a simplified version of Makerlog, designed for your productivity.</h2>

				<div class="newInputDivWrapper">
					<div class="newInputDiv">
						<button class="authButton" onclick='location.href = "https://api.getmakerlog.com/oauth/authorize/?client_id=aNUnFRAa6Y4NZP4GfX7BgVEFELNY2aVgRIInPmh2&scope=user:read%20notifications:write%20notifications:read%20tasks:read%20tasks:write&response_type=token"'>Sign in with Makerlog</button>
					</div>
				</div>

				<p class="subtitle customLoginPar">If that doesn't work, <span class="logDirectly" onclick="customLogin()">log in directly.</span> (Not recommended)</p>
				<div class="customLoginDiv"></div>
				
			</div>
			<div class="adDiv">
				<iframe title="Ad"
					style="border:0;width:320px;height:144px;"
					src="https://makerads.xyz/ad"
				></iframe>
			</div>
		</div>
	`
	}
} else if(!navigator.onLine) {
	document.querySelector(".todayCard").remove();
	document.querySelector(".yesterdayCard").remove();
	document.querySelector(".mainCard").innerHTML = `
		<div class="auth">
			<img src="apple-touch-icon.png" class="logo" alt="App logo">
			<div class="inputs">
				<h2 class="subtitle">¯\\_(ツ)_/¯</h2>
				<h3>Hey, sorry! You need an internet connection to use this app!</h3>
			</div>
		</div>
	`
}


function firstToUpper(str) {
	str = str.split("");
	str[0] = str[0].toUpperCase();
	return str.join("");
}

function attemptSignIn(username, password) {
	f(`${API}api-token-auth/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Accept": "application/json, text/plain, */*"
		},
		body: JSON.stringify({
			username: username,
			password: password
		})
	}).then(data => {
		localStorage.setItem("token_type", JSON.stringify(["token"]))
		console.log(data);
		if(data.token) {
			localStorage.setItem("token", JSON.stringify([data.token]));
			location.reload();	
		} else {
			document.querySelector(".error").innerHTML = data.non_field_errors[0];
		}
	}).catch(err => {
		console.log("Error");
		document.querySelector(".error").innerHTML = "Your credentials are not recognized.";
	});
}

function customLogin() {
	document.querySelector(".customLoginPar").remove();
	document.querySelector(".customLoginDiv").innerHTML = `
		<div class="auth">
			<div class="inputs">
				<div class="newInputDivWrapper">
					<div class="newInputDiv">
						<h3>Username</h3>
						<input type="text" class="usernameInput" placeholder="John Doe">
					</div>
				</div>
				<div class="newInputDivWrapper">
					<div class="newInputDiv">
						<h3>Password</h3>
						<input type="password" class="passwordInput" placeholder="Your password">
					</div>
				</div>
				
				<div class="errorDiv">
					<span class="error"></span>
				</div>

				<div class="newInputDivWrapper">
					<div class="newInputDiv">
						<button onclick='attemptSignIn(document.querySelector(".usernameInput").value, document.querySelector(".passwordInput").value)'>Attempt sign in!</button>
					</div>
				</div>
				
				
			</div>
		</div>
	`
	document.querySelector(".passwordInput").addEventListener("keyup", evt => {
		evt.key == "Enter" ? attemptSignIn(document.querySelector(".usernameInput").value, document.querySelector(".passwordInput").value) : "";
	});
}

function openSettings() {
	removeOverlays();
	document.body.innerHTML += `
	<div class="overlayWrapper">
		<div class="overlay card settingsCard">
			<h1 class="spread">
				<span>Settings</span>
				<div class="closeSettings" onclick="removeOverlays();">X</div>
			</h1>
			<div class="setting">
				<h2>Theme:</h2>
				<select class="theme" onchange="setTheme(this.value)">
					<option value="current">Select theme</option>
					<option value="light">Light theme</option>
					<option value="dark">Dark theme</option>
				</select>
			</div>

			<div class="setting">
				<h2>General settings:</h2>
				<div class="settingSpan"><input type="checkbox" ${getSetting("display-rld") == true ? "checked" : ""} data-setting="display-rld" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Display reload button</span></div>
				<div class="settingSpan"><input type="checkbox" ${getSetting("display-gear") == true ? "checked" : ""} data-setting="display-gear" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Always show settings button</span></div>
			</div>

			<div class="setting">
				<h2>Tasks:</h2>
				<div class="settingSpan"><input type="checkbox" ${getSetting("display-praise") == true ? "checked" : ""} data-setting="display-praise" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">If any, display praise</span></div>
				<div class="settingSpan"><input type="checkbox" ${getSetting("display-comments") == true ? "checked" : ""} data-setting="display-comments" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">If any, display comments</span></div>
			</div>

			<div class="setting">
				<h2>Notifications:</h2>
				<div class="settingSpan"><input type="checkbox" ${getSetting("display-notification-bell") == true ? "checked" : ""} data-setting="display-notification-bell" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Display notification bell</span></div>
				<div class="settingSpan"><input type="checkbox" ${getSetting("display-notification-bell-count") == true ? "checked" : ""} data-setting="display-notification-bell-count" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">When there are unread notifications, animate the bell</span></div>
			</div>

			<div class="setting">
				<h2>Mobile visuals:</h2>
				<div class="settingSpan"><input type="checkbox" ${getSetting("center-profile") == true ? "checked" : ""} data-setting="center-profile" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Center profile picture</span></div>
				<div class="settingSpan"><input type="checkbox" ${getSetting("input-padding-right") == true ? "checked" : ""} data-setting="input-padding-right" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Hide padding to the right of the input</span></div>
				<div class="settingSpan"><input type="checkbox" ${getSetting("hide-header") == true ? "checked" : ""} data-setting="hide-header" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Hide header image</span></div>
				<div class="settingSpan"><input type="checkbox" ${getSetting("compact-mode") == true ? "checked" : ""} data-setting="compact-mode" onchange="alterSetting(this.getAttribute('data-setting'), this.checked)"> <span class="settingInnerSpan">Compact visuals</span></div>
			</div>
			<div class="setting">
				<h2>Account(s):</h2>
				${getAccountsCode()}
				<button class="authButton" onclick='location.href = "https://api.getmakerlog.com/oauth/authorize/?client_id=aNUnFRAa6Y4NZP4GfX7BgVEFELNY2aVgRIInPmh2&scope=user:read%20tasks:read%20tasks:write&response_type=token"'>Add another account via Makerlog</button>
			</div>
		</div>
	</div>
	`
	document.querySelector(".overlayWrapper").addEventListener("click", evt => {
		if(!evt.path.includes(document.querySelector(".overlay.card"))) {
			removeOverlays();
		}
	});
}

function getAccountsCode() {
	str = "";
	let userIndex =0;
	user.forEach(user => {
		str += `
			<div class="miniUserDiv" data-whatUser-mini="${userIndex}">
				<img src="${user.avatar}">
				<p>
					${user.first_name} ${user.last_name}
				</p>
				<div class="signOut" onclick="signOut('${userIndex}');">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user-x"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
				</div>
			</div>
		`
		userIndex++
	});
	return str;
}

function signOut(id) {
	if(confirm(`Are you sure you want to sign out of "${user[id].first_name} ${user[id].last_name}"?`)) {
		user.splice(id, 1);
		if(document.querySelector(`[data-whatUser-mini="${id}"]`)) {
			document.querySelector(`[data-whatUser-mini="${id}"]`).remove();
		}
		if(document.querySelector(`.moreCardsDiv[data-cardID="${id}"]`)) {
			document.querySelector(`.moreCardsDiv[data-cardID="${id}"]`).remove();
		}

		token_types = JSON.parse(localStorage.getItem("token_type"));
		token_types.splice(id, 1);
		localStorage.setItem("token_type", JSON.stringify(token_types));

		tokens = JSON.parse(localStorage.getItem("token"));
		tokens.splice(id, 1);
		if(tokens.length == 0) {
			localStorage.removeItem("token");
			localStorage.removeItem("token_type");
			location.reload();
		} else {
			localStorage.setItem("token", JSON.stringify(tokens));
		}

		updateIDs();
		updateUserCount();
	}
}

function getDate(url, token_type, token) {
	return new Promise((resolve, reject) => {
		f(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
				"Accept": "application/json, text/plain, */*",
				"Authorization": token_type + " " + token
			}
		}).then(data => {
			resolve(data);		
		}).catch(err => {
			resolve({
				data: []
			});
		});
	});
}

const default_settings = {"dark_theme":false,"display-rld":true,"display-praise":true,"display-comments":true,"display-notification-bell":true,"display-notification-bell-count":true,"input-padding-right":true,"hide-header":true,"compact-mode":true,"display-gear":true}

if(!localStorage.getItem("settings")) {
	localStorage.setItem("settings", JSON.stringify(default_settings));
}

function alterSetting(setting, to) {
	if(localStorage.getItem("settings")) {
		settings = JSON.parse(localStorage.getItem("settings"));
	} else {
		settings = default_settings;
	}
	settings[setting] = to;
	localStorage.setItem("settings", JSON.stringify(settings));
	updateSettings();
}

updateSettings();
function updateSettings() {
	if(localStorage.getItem("settings")) {
		settings = JSON.parse(localStorage.getItem("settings"));
	} else {
		settings = default_settings;
	}

	Object.keys(settings).forEach(key => {
		document.body.setAttribute(`data-setting-${key}`, settings[key]);
	});

}

function getSetting(setting) {
	if(localStorage.getItem("settings")) {
		settings = JSON.parse(localStorage.getItem("settings"));
		if(settings[setting]) {
			return settings[setting];
		} else {
			return null;
		}
	} else {
		return null;
	}
}

function removeOverlays() {
	document.querySelectorAll(".overlayWrapper").forEach(el => {
		el.remove();
	});
}

function setTheme(theme) {
	if(theme !== "current") {
		localStorage.setItem("force-theme", theme);	
	}
	updateTheme();
}

function getTaskExtra(data) {
	if(data.praise && data.praise > 0) {
		return `<div class="praiseBadgeWrapper"><div class="praiseBadge"><div class="praiseHand">👏</div><span>${data.praise}</span></div></div>`
	}
	return "";
}

function getCommentHTML(task) {
	if(task.comment_count > 0) {
		
		f(`${API}tasks/${task.id}/comments`).then(data => {

			newEl = document.querySelector(`[data-for-comments-task-id="${task.id}"]`);
			newEl.innerHTML = "";

			data = data.sort((a, b) => {
				return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			});
			
			data.forEach(comment => {

				c = comment.content;

				if(c.startsWith("![gif](")) {
					c = c.slice(7, c.length - 1);
					c = `<img src="${c}" class="commentMedia commentGif">`
				}

				newEl.innerHTML += `
					<div class="comment">
						<div class="commentLeft">
							<img src="${comment.user.avatar}">
						</div>
						<div class="commentMain">
							<h4>${comment.user.first_name} ${comment.user.last_name}</h4>
							<p>${c}</p>
						</div>
					</div>
				`
			});

			if(data.length > 0) {

				let userIndex = 0;
				user.forEach(u => {
					if(u.id == task.user.id) {
						whatUser = userIndex;
					}
					userIndex++
				});
				
				newEl.innerHTML += `
					<div class="commentInput">
						<input class="newComment" onkeyup="keyupComment(event)" type="text" placeholder="New comment..." data-task-id="${task.id}" data-whatUser="${whatUser}">
					</div>
				`
				
			}
		
		});
		
		return `<div class="bigLoadingDiv">
			<div class="loading main"></div>
		</div>`

	} else {
		return "";
	}

}

function keyupComment(evt) {
	
	console.log(evt);

	if(evt.key == "Enter") {

		v = evt.srcElement.value;
		evt.srcElement.value = "";

		evt.srcElement.parentNode.innerHTML += `<div class="loading main"></div>`

		whatUser = evt.srcElement.getAttribute("data-whatuser");

		token = JSON.parse(localStorage.getItem("token"))[whatUser];
		token_type = JSON.parse(localStorage.getItem("token_type"))[whatUser];
						
		f(`${API}tasks/${evt.srcElement.getAttribute("data-task-id")}/comments/`, {
			method: "POST",
			body: JSON.stringify({
				content: v
			}),
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
				"Accept": "application/json, text/plain, */*",
				"Authorization": token_type + " " + token
			}
		}).then(d => {
			loadUser(whatUser);
		});
	}
				
}

function dropHandler(evt) {
	evt.preventDefault();
	if (evt.dataTransfer.items) {
		for (var i = 0; i < evt.dataTransfer.files.length; i++) {
			file = evt.dataTransfer.files[i];
			let imageType = /image.*/
			if(file.type.match(imageType)) {

				let img = document.createElement("img");
				img.classList.add("objectFile");
				img.file = file;

				let reader = new FileReader();
				reader.onload = (function(aImg) {
					return function(e) {
						aImg.onload = function() {

							let canvas = document.createElement("canvas");
							let ctx = canvas.getContext("2d");
							canvas.width = aImg.width;
							canvas.height = aImg.height;
							ctx.drawImage(aImg, 0, 0);

							let newImg = new Image();
							newImg.onload = function() {

								removeAttachment();

								attach = file;
								
								newImg.id = "newest";
								newImg.classList.add("attachment");
								document.querySelector(".inputDiv.taskInputDiv .attachmentDiv").appendChild(newImg);
								document.querySelector(".inputDiv.taskInputDiv .attachmentDiv").innerHTML += `
									<div class="removeAttachment" onclick="removeAttachment();">X</div>
								`
							
							}
							newImg.src = canvas.toDataURL("image/png");
						}
						aImg.src = e.target.result;
					};
				})(img);
				reader.readAsDataURL(file);
			}
		}
	}
}

function removeAttachment() {
	document.querySelector(".inputDiv .attachmentDiv").innerHTML = "";
	delete attach;
}

let droppableElement = document.querySelector(".droppable");

droppableElement.addEventListener('dragenter', handlerFunction0);
droppableElement.addEventListener('dragleave', handlerFunction1);
// droppableElement.addEventListener('dragover', handlerFunction2);
droppableElement.addEventListener('drop', handlerFunction3);

function handlerFunction0() {
	this.classList.add("fileHover");
}

function handlerFunction1() {
	this.classList.remove("fileHover");
}

function handlerFunction2() {
	console.log(2);
}

function handlerFunction3() {
	this.classList.remove("fileHover");
}

function updateUserCount() {
	document.querySelector("body").setAttribute("data-user-count", "plus");
	if(user.length == 0 || user.length == 1) {
		document.querySelector("body").setAttribute("data-user-count", user.length);
	}
}

function sendNotification(msg) {
	navigator.serviceWorker.controller.postMessage(msg);
}

if("serviceWorker" in navigator) {
	navigator.serviceWorker.addEventListener("message", evt => {
		console.log(evt);
		if(evt.data == "getLatestNotification") {
			
		} else if(evt.data == "getUser") {
			console.log("User requested");
			evt.ports[0].postMessage(JSON.parse(localStorage.getItem("token_type"))[0] + " " + JSON.parse(localStorage.getItem("token"))[0]);
		}
	});
}

function updateNotifications(userID = "all") {

	// document.querySelector(".bell").innerHTML = `<div class="loading white"></div>`

	if(userID == "all") {
		u = [];
		for(let i = 0; i < user.length; i++) {
			u.push(i);
		}
	} else {
		u = [userID];
	}

	u.forEach(id => {
		let token = JSON.parse(localStorage.getItem("token"))[id];
		let type = JSON.parse(localStorage.getItem("token_type"))[id];
		f(`https://api.getmakerlog.com/notifications/`, {
			headers: {
				"Content-Type": "application/json;charset=UTF-8",
				"Accept": "application/json, text/plain, */*",
				"Authorization": type + " " + token	
			}
		}).then(d => {
			d = d.sort((a, b) => {
				aDate = new Date(a.created).getTime();
				bDate = new Date(b.created).getTime();
				return bDate - aDate;
			});
			
			let newArr = [];
			for(let i = 0; i < d.length; i++) {
				if(d[i]) {
					newArr.push(d[i]);
				}
			}

			document.querySelectorAll(".profileRightDiv")[id].classList.remove("hasNotifs");	
			d.forEach(notif => {
				if(!notif.read) {
					document.querySelectorAll(".profileRightDiv")[id].classList.add("hasNotifs");	
				}
			});

			notifs[id] = newArr;

			document.querySelector(".bell").innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bell"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
			`

		});
	});
}

function showNotification(id = 0) {

	if(!document.querySelector(".bell").innerHTML.includes("bell")) return null;

	if(id == null) {
		id = 0;
	}

	let token = JSON.parse(localStorage.getItem("token"))[id];
	let type = JSON.parse(localStorage.getItem("token_type"))[id];
	f(`${API}notifications/mark_all_read/`, {
		method: "OPTIONS",
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Accept": "application/json, text/plain, */*",
			"Authorization": type + " " + token
		}
	}).then(d => {
		document.querySelectorAll(".hasNotifs").forEach(el => {
			el.classList.remove("hasNotifs");
		});
	});

	notifications = notifs[Number(id)]; 
	if(!notifications) {
		notifications = [];
	}
	document.body.innerHTML += `
	<div class="overlayWrapper">
		<div class="overlay card notifsCard">
			<h1 class="spread">
				<span>Notifications</span>
				<div class="closeSettings" onclick="removeOverlays();">X</div>
			</h1>

			<div class="notifDiv">
				${getNotifHTML(notifications)}
			</div>
		</div>
	</div>
	`
	if(document.querySelector(".notifDiv").innerHTML.length < 10) {
		document.querySelector(".notifDiv").innerHTML = `
			<div class="emptyWrapper">
				<div class="empty">
					<h1>¯\\_(ツ)_/¯</h1>
					<h3 class="thin">No notifications were loaded. If there <i>are</i> notifications, try clicking the icon again.</h3>
				</div>
			</div>
		`
	}
	document.querySelector(".overlayWrapper").addEventListener("click", evt => {
		if(!evt.path.includes(document.querySelector(".overlay.card"))) {
			removeOverlays();
		}
	});
}

function getNotifHTML(notifs) {
	let str = "";
	notifs.forEach(notif => {

		notif.verb = notif.verb.replace(/you are/g, "you're");

		let par = `${notif.actor.first_name} ${notif.actor.last_name} ${notif.verb}`;
		let key = notif.key;
		if(notif.target) {
			if(key == "received_praise") {
				par = `${notif.actor.first_name} ${notif.actor.last_name} <a target="_blank" href="https://getmakerlog.com/tasks/${notif.target.id}">${notif.verb}</a>`;
			} else if(key == "followed") {
				par = `${notif.actor.first_name} ${notif.actor.last_name} ${notif.verb}`;
			} else if(key == "user_joined") {
				par = `Welcome to Makerlog!`;
			} else if(key == /*"thread_threaded"*/"thread_created") {
				par = `${notif.actor.first_name} ${notif.actor.last_name} <a target="_blank" href="https://getmakerlog.com/discussions/${notif.target.slug}">${notif.verb}</a>`;
			} else if(key == "thread_replied") {
				par = `${notif.actor.first_name} ${notif.actor.last_name} <a target="_blank" href="https://getmakerlog.com/discussions/${notif.target.slug}">${notif.verb}</a>`;
			} else if(key == "task_commented") {
				if(notif.target) {
					id = notif.target.id;
				} else {
					id = 1;
				}
				par = `${notif.actor.first_name} ${notif.actor.last_name} <a target="_blank" href="https://getmakerlog.com/tasks/${id}">${notif.verb}</a>`;
			} else if(key == "product_launched") {
				par = `${notif.actor.first_name} ${notif.actor.last_name} <a target="_blank" href="https://getmakerlog.com/products/${notif.target.slug}">${notif.verb}</a>`;
			} else if(key == "product_created") {
				par = `${notif.actor.first_name} ${notif.actor.last_name} <a target="_blank" href="https://getmakerlog.com/products/${notif.target.slug}">${notif.verb}</a>`;
			} else if(key == "user_mentioned") {
				par = `@${notif.actor.username} <a target="_blank" href="https://getmakerlog.com/tasks/${notif.target.id}">${notif.verb}</a>`;
			} else if(key == "mention_discussion") {
				par = `@${notif.actor.username} <a target="_blank" href="https://getmakerlog.com/task/${notif.actor.username}">${notif.verb}</a>`;
			}
		} else {
			par = "Content deleted.";
		}
		

		str += `
			<div class="notification">
				<div class="notifMain">
					<div class="notificationLeft">
						<img src="${notif.actor.avatar}" class="notifIcon">
					</div>
					<div class="notificationRight commentMain">
						<h4><a target="_blank" href="https://getmakerlog.com/@${notif.actor.username}">${notif.actor.username}</a></h4>
						<p>${par}</p>
					</div>
				</div>
				<div class="notifButtons">
					<!-- <a target="_blank" href="https://getmakerlog.com/tasks/{notif.target.id}">Task</a> -->
				</div>
			</div>
		`
	});
	return str;
}

