document.querySelector(".mainCard").innerHTML = `
		<div class="auth">
			<img src="apple-touch-icon.png" class="logo">
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
		console.log(data);
		if(data.token) {
			localStorage.setItem("token", data.token);
			location.reload();	
		} else {
			document.querySelector(".error").innerHTML = data.non_field_errors[0];
		}
	}).catch(err => {
		console.log("Error");
	});
}

.then(stream => {
					if(stream.data) {
						stream.data.forEach(task => {

							newDate = new Date(task.updated_at);
							taskDate = `${newDate.getFullYear()}/${newDate.getMonth()}/${newDate.getDate()}`;

							d = new Date();
							todayDate = `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`;

							d = new Date(new Date().getTime() - 1000 * 60 * 60 * 24);
							yesterdayDate = `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`;

							let toAddElement = document.querySelector(`.${key}Card .logDiv`);

							if(taskDate == todayDate) {
								toAddElement = document.querySelector(".todayCard .logDiv");
							} else if(taskDate == yesterdayDate) {
								toAddElement = document.querySelector(".yesterdayCard .logDiv");
							} else {
								toAddElement = null;
							}
							


							let index = 0;

							task.content = task.content.split(" ");
							task.content.forEach(word => {
								if(word.startsWith("#")) {
									task.content[index] = `<a class="mainAnchor" href="https://getmakerlog.com/products/${task.project_set[0].name}"><span class="product">${word}</span></a>`
								}
								index++
							});
							task.content = task.content.join(" ");

							let whatIcon = {
								true: '<svg aria-hidden="true" data-prefix="fas" data-icon="check-circle" class="svg-inline--fa fa-check-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="var(--main)" d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>',
								false: `<svg aria-hidden="true" data-makerlog-id="${task.id}" onclick="markAsDone('${task.id}')" data-prefix="fas" data-icon="circle" class="todoIcon svg-inline--fa fa-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="var(--todo)" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z"></path></svg>`
							}

							if(toAddElement) {
								toAddElement.innerHTML += `
									<div class="task">
										<div class="taskIcon">
											${whatIcon[task.done]}
										</div>
										<div class="taskContent">
											${task.content}
										</div>
									</div>
								`	
							}
							
						});
					}
					if(key == "today") {
						document.querySelector(".submitButton").innerHTML = "+";
						document.querySelector(".todoButton").innerHTML = `<svg aria-hidden="true" data-prefix="fas" data-icon="circle" class="svg-inline--fa fa-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z"></path></svg>`;
					}
				});
			})