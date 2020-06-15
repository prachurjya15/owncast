const SocketMessageTypes = {
	CHAT: "CHAT",
	PING: "PING"
}

class Message {
	constructor(model) {
		this.author = model.author;
		this.body = model.body;
		this.image = model.image || "https://robohash.org/" + model.author;
		this.id = model.id;
		this.type = model.type;
	}

	addNewlines(str) {
		return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
	}
	formatText() {
		var linked = autoLink(this.body, { embed: true });
		return this.addNewlines(linked);
	}
	userColor() {
		return colorForString(this.author);
	}

	toModel() {
		return {
			author: this.author(),
			body: this.body(),
			image: this.image(),
			id: this.id
		};
	}
}


// convert newlines to <br>s

class Messaging {
	constructor() {
		this.chatDisplayed = false;
		this.username = "";
		this.avatarSource = "https://robohash.org/";

		this.messageCharCount = 0;
		this.maxMessageLength = 500;
		this.maxMessageBuffer = 20;

		this.keyUsername = "owncast_username";
		this.keyChatDisplayed = "owncast_chat";

		this.tagAppContainer = document.querySelector("#app-container");

		this.tagChatToggle = document.querySelector("#chat-toggle");

		this.textUserInfoDisplay = document.querySelector("#user-info-display");
		this.tagUserInfoChanger = document.querySelector("#user-info-change");

		this.tagUsernameDisplay = document.querySelector("#username-display");
		this.imgUsernameAvatar = document.querySelector("#username-avatar");

		this.inputMessageAuthor = document.querySelector("#self-message-author");

		this.tagMessageFormWarning = document.querySelector("#message-form-warning");
		

		this.inputChangeUserName = document.querySelector("#username-change-input"); 
		this.btnUpdateUserName = document.querySelector("#button-update-username"); 
		this.btnCancelUpdateUsername = document.querySelector("#button-cancel-change"); 
		this.btnSubmitMessage = document.querySelector("#button-submit-message");

		this.formMessageInput = document.querySelector("#message-body-form");
	}
	init() {
		this.tagChatToggle.addEventListener("click", this.handleChatToggle.bind(this));
		this.textUserInfoDisplay.addEventListener("click", this.handleShowChangeNameForm.bind(this));
		
		this.btnUpdateUserName.addEventListener("click", this.handleUpdateUsername.bind(this));
		this.btnCancelUpdateUsername.addEventListener("click", this.handleHideChangeNameForm.bind(this));
		
		this.inputChangeUserName.addEventListener("keydown", this.handleUsernameKeydown.bind(this));
		this.formMessageInput.addEventListener("keydown", this.handleMessageInputKeydown.bind(this));
		this.btnSubmitMessage.addEventListener("click", this.handleSubmitChatButton.bind(this));
		if (isAndroidMobile && window.screen.width < 860) {
			this.formMessageInput.addEventListener("focus", this.handleKeyboardAppear.bind(this));
			this.formMessageInput.addEventListener("blur", this.handleKeyboardOut.bind(this));
		}
		this.initLocalStates();

	}

	initLocalStates() {
		this.username = getLocalStorage(this.keyUsername) || "User" + (Math.floor(Math.random() * 42) + 1);
		this.updateUsernameFields(this.username);

		this.chatDisplayed = getLocalStorage(this.keyChatDisplayed) || false;
		this.displayChat();
	}
	updateUsernameFields(username) {
		this.tagUsernameDisplay.innerText = username;
		this.inputChangeUserName.value = username;
		this.inputMessageAuthor.value = username;
		this.imgUsernameAvatar.src = this.avatarSource + username;
	}
	displayChat() {
		this.tagAppContainer.className = this.chatDisplayed ?  "flex" : "flex no-chat";
	}

	handleKeyboardAppear() {
		this.tagAppContainer.classList.add("android-message-focus");
		setVHvar();
	}
	handleKeyboardOut() {
		this.tagAppContainer.classList.remove("android-message-focus");
		setVHvar();
	}

	handleChatToggle() {
		this.chatDisplayed = !this.chatDisplayed;
		if (this.chatDisplayed) {
			setLocalStorage(this.keyChatDisplayed, this.chatDisplayed);
		} else {
			clearLocalStorage(this.keyChatDisplayed);
		}
		this.displayChat();
	}
	handleShowChangeNameForm() {
		this.textUserInfoDisplay.style.display = "none";
		this.tagUserInfoChanger.style.display = "flex";
	}
	handleHideChangeNameForm() {
		this.textUserInfoDisplay.style.display = "flex";
		this.tagUserInfoChanger.style.display = "none";
	}
	handleUpdateUsername() {
		var newValue = this.inputChangeUserName.value;
		newValue = newValue.trim();
		// do other string cleanup?

		if (newValue) {
			this.username = newValue;
			this.updateUsernameFields(newValue);
			setLocalStorage(this.keyUsername, newValue);
		}
		this.handleHideChangeNameForm();
	}

	handleUsernameKeydown(event) {
		if (event.keyCode === 13) { // enter
			this.handleUpdateUsername();
		} else if (event.keyCode === 27) { // esc
			this.handleHideChangeNameForm();
		}
	}

	handleMessageInputKeydown(event) {
		var okCodes = [37,38,39,40,16,91,18,46,8];
		var value = this.formMessageInput.value.trim();
		var numCharsLeft = this.maxMessageLength - value.length;

		if (event.keyCode === 13) { // enter
			if (!this.prepNewLine) {
				this.submitChat(value);
				event.preventDefault();
				
				return;
			}
			this.prepNewLine = false;
		} else {
			this.prepNewLine = false;
		}
		if (event.keyCode === 16 || event.keyCode === 17) { // ctrl, shift
			this.prepNewLine = true;
		}

		if (numCharsLeft <= this.maxMessageBuffer) {
			this.tagMessageFormWarning.innerText = numCharsLeft + " chars left";
			if (numCharsLeft <= 0 && !okCodes.includes(event.keyCode)) {
				event.preventDefault();
				return;
			}
		} else {
			this.tagMessageFormWarning.innerText = "";
		}
	}
	handleSubmitChatButton(event) {
		var value = this.formMessageInput.value.trim();
		if (value) {
			this.submitChat(value);
			event.preventDefault();
		return false;
		}
		event.preventDefault();
		return false;
	}
	submitChat(content) {
		if (!content) {
			return;
		}
		var message = new Message({
			body: content,
			author: this.username,
			id: uuidv4(),
		});
		const messageJSON = JSON.stringify(message);
		window.ws.send(messageJSON);

		// clear out things.
		this.formMessageInput.value = "";
		this.tagMessageFormWarning.innerText = "";
	}
}