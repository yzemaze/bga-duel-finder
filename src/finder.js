/**
 * BGA Duel Finder 2
 *
 * Find and display duels from a list of fixtures.
 * Highlight winnning scores, calculate duel and team match results.
 * cf. README.md or https://github.com/yzemaze/bga-duel-finder
 */

(function() {
"use strict";

	const REQUEST_INTERVAL = 250; // ms
	const CACHE_DURATION = 7*24*60*60*1000; // 7d in ms
	const DATA_CACHE_DURATION = 2*60*60*1000; // 2h in ms
	const ENDGAME_THRESHOLD = 70;
	let flags = new Map([
		["Afghanistan", "🇦🇫"],
		["Albania", "🇦🇱"],
		["Algeria", "🇩🇿"],
		["Andorra", "🇦🇩"],
		["Angola", "🇦🇴"],
		["Antigua and Barbuda", "🇦🇬"],
		["Argentina", "🇦🇷"],
		["Armenia", "🇦🇲"],
		["Australia", "🇦🇺"],
		["Austria", "🇦🇹"],
		["Azerbaijan", "🇦🇿"],
		["Bahamas", "🇧🇸"],
		["Bahrain", "🇧🇭"],
		["Bangladesh", "🇧🇩"],
		["Barbados", "🇧🇧"],
		["Belarus", "🇧🇾"],
		["Belgium", "🇧🇪"],
		["Belize", "🇧🇿"],
		["Benin", "🇧🇯"],
		["Bhutan", "🇧🇹"],
		["Bolivia", "🇧🇴"],
		["Bosnia and Herzegovina", "🇧🇦"],
		["Botswana", "🇧🇼"],
		["Brazil", "🇧🇷"],
		["Brunei", "🇧🇳"],
		["Bulgaria", "🇧🇬"],
		["Burkina Faso", "🇧🇫"],
		["Burundi", "🇧🇮"],
		["Cabo Verde", "🇨🇻"],
		["Cambodia", "🇰🇭"],
		["Cameroon", "🇨🇲"],
		["Canada", "🇨🇦"],
		["Catalonia", ""],
		["Central African Republic", "🇨🇫"],
		["Chad", "🇹🇩"],
		["Chile", "🇨🇱"],
		["China", "🇨🇳"],
		["Colombia", "🇨🇴"],
		["Comoros", "🇰🇲"],
		["Congo-Brazzaville", "🇨🇬"],
		["Congo (Democratic Republic)", "🇨🇩"],
		["Costa Rica", "🇨🇷"],
		["Croatia", "🇭🇷"],
		["Cuba", "🇨🇺"],
		["Cyprus", "🇨🇾"],
		["Czechia", "🇨🇿"],
		["Czech Republic", "🇨🇿"],
		["Denmark", "🇩🇰"],
		["Djibouti", "🇩🇯"],
		["Dominica", "🇩🇲"],
		["Dominican Republic", "🇩🇴"],
		["Ecuador", "🇪🇨"],
		["Egypt", "🇪🇬"],
		["El Salvador", "🇸🇻"],
		["Equatorial Guinea", "🇬🇶"],
		["Eritrea", "🇪🇷"],
		["Estonia", "🇪🇪"],
		["Eswatini", "🇸🇿"],
		["Ethiopia", "🇪🇹"],
		["Fiji", "🇫🇯"],
		["Finland", "🇫🇮"],
		["France", "🇫🇷"],
		["Gabon", "🇬🇦"],
		["Gambia", "🇬🇲"],
		["Georgia", "🇬🇪"],
		["Germany", "🇩🇪"],
		["Ghana", "🇬🇭"],
		["Greece", "🇬🇷"],
		["Grenada", "🇬🇩"],
		["Guatemala", "🇬🇹"],
		["Guinea", "🇬🇳"],
		["Guinea-Bissau", "🇬🇼"],
		["Guyana", "🇬🇾"],
		["Haiti", "🇭🇹"],
		["Honduras", "🇭🇳"],
		["Hong Kong", "🇭🇰"],
		["Hungary", "🇭🇺"],
		["Iceland", "🇮🇸"],
		["India", "🇮🇳"],
		["Indonesia", "🇮🇩"],
		["Iran", "🇮🇷"],
		["Iraq", "🇮🇶"],
		["Ireland", "🇮🇪"],
		["Israel", "🇮🇱"],
		["Italy", "🇮🇹"],
		["Jamaica", "🇯🇲"],
		["Japan", "🇯🇵"],
		["Jordan", "🇯🇴"],
		["Kazakhstan", "🇰🇿"],
		["Kenya", "🇰🇪"],
		["Kiribati", "🇰🇮"],
		["North Korea", "🇰🇵"],
		["South Korea", "🇰🇷"],
		["Kuwait", "🇰🇼"],
		["Kyrgyzstan", "🇰🇬"],
		["Laos", "🇱🇸"],
		["Latvia", "🇱🇻"],
		["Lebanon", "🇱🇧"],
		["Lesotho", "🇱🇸"],
		["Liberia", "🇱🇷"],
		["Libya", "🇱🇾"],
		["Liechtenstein", "🇱🇮"],
		["Lithuania", "🇱🇹"],
		["Luxembourg", "🇱🇺"],
		["Madagascar", "🇲🇬"],
		["Malawi", "🇲🇼"],
		["Malaysia", "🇲🇾"],
		["Maldives", "🇲🇻"],
		["Mali", "🇲🇱"],
		["Malta", "🇲🇹"],
		["Marshall Islands", "🇲🇭"],
		["Mauritania", "🇲🇷"],
		["Mauritius", "🇲🇺"],
		["Mexico", "🇲🇽"],
		["México", "🇲🇽"],
		["Micronesia", "🇫🇲"],
		["Moldova", "🇲🇩"],
		["Monaco", "🇲🇨"],
		["Mongolia", "🇲🇳"],
		["Montenegro", "🇲🇪"],
		["Morocco", "🇲🇦"],
		["Mozambique", "🇲🇿"],
		["Myanmar", "🇲🇲"],
		["Namibia", "🇳🇦"],
		["Nauru", "🇳🇷"],
		["Nepal", "🇳🇵"],
		["Netherlands", "🇳🇱"],
		["New Zealand", "🇳🇿"],
		["Nicaragua", "🇳🇮"],
		["Niger", "🇳🇪"],
		["Nigeria", "🇳🇬"],
		["North Macedonia", "🇲🇰"],
		["Norway", "🇳🇴"],
		["Oman", "🇴🇲"],
		["Pakistan", "🇵🇰"],
		["Palau", "🇵🇬"],
		["Panama", "🇵🇦"],
		["Papua New Guinea", "🇵🇬"],
		["Paraguay", "🇵🇾"],
		["Peru", "🇵🇪"],
		["Philippines", "🇵🇭"],
		["Poland", "🇵🇱"],
		["Portugal", "🇵🇹"],
		["Qatar", "🇶🇦"],
		["Romania", "🇷🇴"],
		["Russia", "🇷🇺"],
		["Rwanda", "🇷🇼"],
		["Saint Kitts and Nevis", "🇰🇳"],
		["Saint Lucia", "🇱🇨"],
		["Saint Vincent and the Grenadines", "🇻🇨"],
		["Samoa", "🇼🇸"],
		["San Marino", "🇸🇲"],
		["Sao Tome and Principe", "🇸🇹"],
		["Saudi Arabia", "🇸🇦"],
		["Senegal", "🇸🇳"],
		["Serbia", "🇷🇸"],
		["Seychelles", "🇸🇨"],
		["Sierra Leone", "🇸🇱"],
		["Singapore", "🇸🇬"],
		["Slovakia", "🇸🇰"],
		["Slovenia", "🇸🇮"],
		["Solomon Islands", "🇸🇧"],
		["Somalia", "🇸🇴"],
		["South Africa", "🇿🇦"],
		["South Sudan", "🇸🇸"],
		["Spain", "🇪🇸"],
		["Sri Lanka", "🇱🇰"],
		["Sudan", "🇸🇩"],
		["Suriname", "🇸🇷"],
		["Sweden", "🇸🇪"],
		["Switzerland", "🇨🇭"],
		["Syria", "🇸🇾"],
		["Taiwan", "🇹🇼"],
		["Tajikistan", "🇹🇯"],
		["Tanzania", "🇹🇿"],
		["Thailand", "🇹🇭"],
		["Timor-Leste", "🇹🇱"],
		["Togo", "🇹🇬"],
		["Tonga", "🇹🇴"],
		["Trinidad and Tobago", "🇹🇹"],
		["Tunisia", "🇹🇳"],
		["Turkey", "🇹🇷"],
		["Turkmenistan", "🇹🇲"],
		["Tuvalu", "🇹🇻"],
		["Uganda", "🇺🇬"],
		["Ukraine", "🇺🇦"],
		["United Arab Emirates", "🇦🇪"],
		["United Kingdom", "🇬🇧"],
		["United States", "🇺🇸"],
		["USA", "🇺🇸"],
		["Uruguay", "🇺🇾"],
		["Uzbekistan", "🇺🇿"],
		["Vanuatu", "🇻🇺"],
		["Vatican City", "🇻🇦"],
		["Venezuela", "🇻🇪"],
		["Vietnam", "🇻🇳"],
		["Yemen", "🇾🇪"],
		["Zambia", "🇿🇲"],
		["Zimbabwe", "🇿🇼"]
	]);

	let style = document.createElement("style");
	style.innerHTML = `
		.drag-handle {
			cursor: pointer;
		}
		.dragging{
			cursor: move !important;
		}
		#dfBox {
			box-sizing: border-box;
			display: grid;
			grid-template-rows: max-content 1fr;
			position: absolute;
			left: 0;
			bottom: 0;
			width: max-content;
			min-width: fit-content;
			height: max-content;
			min-height: 110px;
			font-size: 1em;
			background: #f0f0f0;
			box-shadow: 0 0.2em 0.5em rgba(0, 0, 0, 0.3);
			border-radius: 0.5em;
			z-index: 10000;
			resize: both;
			overflow: hidden;
		}
		#dfBox .duel a {
			color: rgb(72, 113, 182);
			text-decoration: none;
		}
		#dfBox h2 {
			font-size: 1.1em;
			font-weight: normal;
			margin: 0;
		}
		#dfBox .bga-link {
			font-weight: normal;
		}
		#dfBox h2.dfComment {
			font-weight: bold;
		}
		#dfHead {
			background: #4871b6;
			color: #fff;
			padding: 0.2em 0.4em;
			user-select: none;
		}
		#dfBody {
			display: grid;
			grid-template-rows: 1fr max-content;
			overflow: auto;
			grid-gap: 0.5em;
			padding: 0.2em 0.4em 0.4em 0.4em;
		}
		#dfInputForm {
			display: grid;
			grid-template-rows: repeat(3, max-content) 1fr;
			grid-template-columns: max-content 1fr;
			grid-gap: 0 0.5em;
		}
		#dfInputForm input {
			width: fit-content;
			border-radius: 0.3em;
		}
		.duelsView #dfInputForm {
			display: none;
		}
		#dfConfig, #dfConfigLabel {
			grid-column: span 2;
		}
		#dfConfig {
			width: 100%;
			border-radius: 0.3em;
		}
		#dfButtonDiv {
			display: grid;
			grid-template-columns: repeat(3, max-content);
			grid-gap: 0.5em;
			font-size: 1em;
		}
		#dfBox .bgabutton {
			margin: 0;
			height: fit-content;
			width: fit-content;
			padding: 0.4em 0.8em;
		}
		#dfFindButton, #dfCloseButton {
			display: block;
		}
		#dfBackButton, #dfReloadButton, #dfToggleDatesButton {
			display: none;
		}
		.duelsView #dfBackButton, .duelsView #dfReloadButton, .duelsView #dfToggleDatesButton {
			display: block;
		}
		.duelsView #dfFindButton, .duelsView #dfCloseButton, .horizontal #dfToggleDatesButton {
			display: none;
		}
		#dfGamesList {
			display: none;
			overflow: auto;
			grid-auto-rows: max-content;
			grid-gap: 0.1em;
			padding-right: 0.4em;
		}
		.duelsView #dfGamesList {
			display: grid;
		}
		.matchHeader, .duelHeader {
			display: grid;
			grid-template-columns: max-content 1fr;
			grid-template-rows: 1fr;
			grid-gap: 0.4em;
		}
		#dfBox .matchHeader {
			margin: 0.3em 0 0.2em 0;
		}
		#dfBox .matchHeader:first-of-type {
			margin-top: 0;
		}
		.fixtureScore, .duelScore {
			grid-column-start: 3;
		}
		.duel {
			display: grid;
			grid-template-rows: max-content 1fr;
		}
		.break {
			display: none;
		}
		.duel ~ .break {
			display: grid;
			width: 100%;
		}
		#dfGamesList.noDates .resultDate {
			display: none;
		}
		#dfGamesList.noDates ul.duelGamesList > li {
			display: inline;
		}
		#dfGamesList.noDates ul.duelGamesList > li:not(:last-child)::after {
			content: " • ";
			color: #888;
		}
		li.result {
			display: grid;
			grid-template-columns: repeat(3, max-content);
			grid-gap: 0.3em;
			align-items: end;
		}
		li.result .resultDate {
			font-size: 0.9em;
		}
		li.result .bga-link {
			display: grid;
			grid-template-columns: 1.8em .4em 1.8em;
			justify-items: end;
		}
		.noDates li.result .bga-link {
			display: inline;
		}
		span.win {
			font-weight: bold;
		}
		span.progress {
			grid-column: 3 span;
		}
		#dfBox.horizontal {
			grid-auto-flow: column;
			grid-template-columns: max-content 1fr max-content;
			grid-template-rows: none;
			min-height: 3em;
			min-width: 20em;
		}
		.horizontal #dfHead {
			padding: 0.5em 0.2em;
			writing-mode: tb;
		}
		.horizontal #dfBody {
			grid-template-rows: none;
			grid-auto-flow: column;
			grid-template-columns: 1fr auto;
			padding: 0.5em;
		}
		.horizontal #dfGamesList {
			display: flex;
			flex-wrap: wrap;
			gap: 0.15em 1em;
		}
		.horizontal #dfButtonDiv {
			grid-template-columns: 1fr;
			grid-template-rows: repeat(3, max-content);
		}
		#dfBox.horizontal .duelsView .bgabutton {
			padding: 0.2em 0.4em;
		}
		#dfBox.horizontal h2.matchHeader {
			margin: 0;
		}
		.horizontal .fixtureScore, .horizontal .duelScore {
			grid-column-start: 2;
		}
	 `;
	document.head.appendChild(style);

	createUi();

	/**
	 * Check if a date is equal to today or yesterday
	 */
	function isToday(unixTimestamp) {
		const today = new Date();
		const date = new Date(unixTimestamp * 1000);
		return (
			date.setHours(0,0,0,0) == today.setHours(0,0,0,0)
		);
	}

	function isYesterday(unixTimestamp) {
		const yesterday = new Date(Date.now - 24*60*60*1000);
		const date = new Date(unixTimestamp * 1000);
		return (
			date.setHours(0,0,0,0) == yesterday.setHours(0,0,0,0)
		);
	}

	/**
	 * Create ui for user interaction.
	 *
	 */
	function createUi() {
		const finderId = "dfBox";
		let dfBox = document.getElementById(finderId);
		if (dfBox) {
			dfBox.style.display = "grid";
			return;
		}

		dfBox = document.createElement("div");
		dfBox.id = finderId;
		dfBox.setAttribute("data-draggable", true);
		dfBox.setAttribute("data-resizable", true);
		const dfHead = document.createElement("div");
		dfHead.setAttribute("data-drag-handle", true);
		dfHead.id = "dfHead";
		dfHead.classList.add("drag-handle");
		const dfHeader = document.createElement("h2");
		dfHeader.id = "dfHeader";
		dfHeader.innerText = "Duel Finder 2";
		const dfBody = document.createElement("div");
		dfBody.id = "dfBody";

		dfHead.appendChild(dfHeader);
		dfBox.appendChild(dfHead);
		dfBox.appendChild(dfBody);

		const dfInputForm = document.createElement("form");
		dfInputForm.id = "dfInputForm";
		const datePicker = document.createElement("input");
		datePicker.id = "datePicker";
		datePicker.type = "date";
		datePicker.valueAsDate = new Date();
		const datePickerLabel = document.createElement("label");
		datePickerLabel.htmlFor = "datePicker";
		datePickerLabel.textContent = "Date";
		const hidePremature = document.createElement("input");
		hidePremature.type = "checkbox";
		hidePremature.id = "hidePremature";
		hidePremature.checked = true;
		const hidePrematureLabel = document.createElement("label");
		hidePrematureLabel.htmlFor = "hidePremature";
		hidePrematureLabel.textContent = "Hide premature games";
		const textArea = document.createElement("textArea");
		textArea.id = "dfConfig";
		const textAreaLabel = document.createElement("label");
		textAreaLabel.id = "dfConfigLabel";
		textAreaLabel.htmlFor = "dfConfig";
		textAreaLabel.textContent = "Matches & duels";

		dfInputForm.appendChild(datePickerLabel);
		dfInputForm.appendChild(datePicker);
		dfInputForm.appendChild(hidePrematureLabel);
		dfInputForm.appendChild(hidePremature);
		dfInputForm.appendChild(textAreaLabel);
		dfInputForm.appendChild(textArea);

		const dfGamesList = document.createElement("ul");
		dfGamesList.id = "dfGamesList";

		const dfButtonDiv = document.createElement("div");
		dfButtonDiv.id = "dfButtonDiv";
		const findButton = document.createElement("a");
		findButton.id = "dfFindButton";
		findButton.classList = "bgabutton bgabutton_green";
		findButton.innerText = "➡";
		const backButton = document.createElement("a");
		backButton.id = "dfBackButton";
		backButton.classList = "bgabutton bgabutton_red";
		backButton.innerText = "⬅";
		const closeButton = document.createElement("a");
		closeButton.id = "dfCloseButton";
		closeButton.classList = "bgabutton bgabutton_red";
		closeButton.innerText = "✖";
		const reloadButton = document.createElement("a");
		reloadButton.id = "dfReloadButton";
		reloadButton.classList = "bgabutton bgabutton_green";
		reloadButton.innerText = "↻";
		const toggleDatesButton = document.createElement("a");
		toggleDatesButton.id = "dfToggleDatesButton";
		toggleDatesButton.classList = "bgabutton bgabutton_blue";
		toggleDatesButton.innerText = "📅";
		dfButtonDiv.appendChild(closeButton);
		dfButtonDiv.appendChild(findButton);
		dfButtonDiv.appendChild(backButton);
		dfButtonDiv.appendChild(reloadButton);
		dfButtonDiv.appendChild(toggleDatesButton);

		dfBody.appendChild(dfInputForm);
		dfBody.appendChild(dfGamesList);
		dfBody.appendChild(dfButtonDiv);

		document.body.appendChild(dfBox);
		applyBoxLayout(dfBox);

		dfHead.ondblclick = function() { applyBoxLayout(dfBox, "toggle") };

		function zoom(event) {
			event.preventDefault();
			let scale = 1;
			if (dfBox.style.transform) {
				scale = parseFloat(dfBox.style.transform.match(/scale\(([^)]+)\)/)[1]);
			}
			scale += event.deltaY * -0.001 / 9;
			scale = Math.min(Math.max(0.5, scale), 2);
			dfBox.style.transform = `scale(${scale})`;
			saveBoxLayoutToLocalStorage(dfBox);
		}
		dfBox.onwheel = zoom;

		let timeout;
		const resizeObserver = new ResizeObserver(entries => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				requestAnimationFrame(() => {
					for (const entry of entries) {
						saveBoxLayoutToLocalStorage(entry.target);
					}
				});
			}, 1000);
		});
		resizeObserver.observe(dfBox);

		textArea.addEventListener("paste", (event) => {
			// Just check if pasted text is in the form of:
			//
			//   player1
			//   vs
			//   player2
			//   player3
			//   vs
			//   player4
			//   ...
			//
			// and format it.
			const pastedData = (event.clipboardData || window.clipboardData).getData("text");
			event.preventDefault();

			// transform non-empty lines separated by a "vs"-line into one-liners
			const regex = /([^\r\n]+)\s*\n\s*vs\s*\n\s*([^\r\n]+)/g;
			let matches = [];
			let match;
			while ((match = regex.exec(pastedData)) !== null) {
				matches.push(`${match[1].trim()} vs ${match[2].trim()}`);
			}
			const transformedText = matches.length > 0 ? matches.join("\n") : pastedData;

			// Get the current cursor position or selection
			const start = textArea.selectionStart;
			const end = textArea.selectionEnd;
			// Insert the transformed text at the cursor position
			textArea.value = textArea.value.slice(0, start) + transformedText + textArea.value.slice(end);
			// Move the cursor to the end of the inserted text
			textArea.selectionStart = textArea.selectionEnd = start + transformedText.length;
		});

		findButton.onclick = async function () {
			const gameId = 1; // Carcassonne
			const date = new Date(datePicker.value);
			const unixTimestamp = Math.floor(date.getTime() / 1000);
			const duelsText = textArea.value;
			textArea.disabled = true;
			findButton.disabled = true;
			saveDataToLocalStorage();
			document.getElementById("dfBody").classList.toggle("duelsView");
			dfGamesList.classList = "noDates";
			await getAllDuels(duelsText, unixTimestamp, gameId);
			findButton.disabled = false;
		};

		backButton.onclick = function () {
			document.getElementById("dfBody").classList.toggle("duelsView");
			dfGamesList.innerHTML = "";
			textArea.disabled = false;
		};

		closeButton.onclick = function () {
			document.body.removeChild(dfBox);
		}

		reloadButton.onclick = async function () {
			const gameId = 1; // Carcassonne
			const date = new Date(datePicker.value);
			const unixTimestamp = Math.floor(date.getTime() / 1000);
			const duelsText = textArea.value;
			dfGamesList.innerHTML = "";
			await getAllDuels(duelsText, unixTimestamp, gameId);
		}

		toggleDatesButton.onclick = function () {
			document.getElementById("dfGamesList").classList.toggle("noDates");
		}

		retrieveDataFromLocalStorage();
	}

	/**
	 * Returns a player id given its username.
	 *
	 */
	function getPlayerId(name) {
		const currentTime = new Date().getTime();
		const cacheKey = `playerId-${name.toLowerCase()}`;
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			const data = JSON.parse(cached);
			if (currentTime - data.timestamp < CACHE_DURATION) {
				console.debug(`Using cached id ${data.id} for ${name}`);
				return data.id;
			}
		}

		try {
			const response = dojo.xhrGet({
				url: "https://boardgamearena.com/player/player/findplayer.html",
				content: { q: name, start: 0, count: Infinity },
				sync: true,
				handleAs: "json"
			});

			for (const currentUser of response.results[0].items) {
				if (currentUser.q.toLowerCase() === name.toLowerCase()) {
					console.debug(`Found id ${currentUser.id} for ${name}`);
					localStorage.setItem(cacheKey, JSON.stringify({ id: currentUser.id, timestamp: currentTime }));
					return currentUser.id;
				}
			}
			console.error(`Could not find user ${name}`);
			throw "Player not found";
		}
		catch (error) {
			console.error(`Could not find user ${name}`);
			throw error;
		}
	}

	function clearExpiredCache() {
		const now = new Date().getTime();
		const lastCleared = localStorage.getItem("dfClearedCacheTimestamp");
		if (lastCleared && now - lastCleared < 24 * 60 * 60 * 1000) {
			console.debug("Table cache was cleared within last 24 hours");
			return;
		}

		let dfTableInfo = JSON.parse(localStorage.getItem("dfTableInfo")) || {};
		Object.keys(dfTableInfo).forEach(tableId => {
			const cachedData = dfTableInfo[tableId];
			if (cachedData && now - cachedData.timestamp > 7 * 24 * 60 * 60 * 1000) {
				delete dfTableInfo[tableId];
				console.debug(`Removed expired cache for table ${tableId}`);
			}
		});

		localStorage.setItem("dfTableInfo", JSON.stringify(dfTableInfo));
		localStorage.setItem("dfClearedCacheTimestamp", now);
	}

	clearExpiredCache();

	async function getTableInfo(tableId) {
		let dfTableInfo = JSON.parse(localStorage.getItem("dfTableInfo")) || {};
		if (dfTableInfo[tableId]) {
			console.debug(`Using cached data for table ${tableId}`);
			const cachedObject = dfTableInfo[tableId];
			return cachedObject.data;
		}

		const params = { id: tableId };
		try {
			const response = await dojo.xhrGet({
				url: "https://boardgamearena.com/table/table/tableinfos.html",
				content: params,
				handleAs: "json",
				headers: { "X-Request-Token": bgaConfig.requestToken },
				sync: true
			});
			if (response && response.data) {
				const data = response.data;
				const timestamp = new Date().getTime();

				dfTableInfo[tableId] = {
					timestamp: timestamp,
					data: data
				};
				localStorage.setItem("dfTableInfo", JSON.stringify(dfTableInfo));
				console.debug(`Loaded data for table ${tableId} and stored in localStorage`);

				return data;
			} else {
				throw new Error("Failed to fetch table info");
			}
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Return games for two players in a given day
	 *
	 */
	async function getGames(player0, player1, day, gameId, hidePremature) {
		let tables = [];
		try {
			const player0Id = getPlayerId(player0);
			const player1Id = getPlayerId(player1);
			const params = {
				game_id: gameId,
				player: player0Id,
				opponent_id: player1Id,
				updateStats: 1
			};
			if (day) {
				params.start_date = day;
				params.end_date = day + 86400 * 2; // include games played after midnight UTC
			}

			const response = await dojo.xhrGet({
				url: "https://boardgamearena.com/gamestats/gamestats/getGames.html",
				content: params,
				handleAs: "json",
				headers: { "X-Request-Token": bgaConfig.requestToken },
				sync: true
			});

			for (const table of response.data.tables) {
				const tableUrl = `https://boardgamearena.com/table?table=${table.table_id}`;
				const tablePlayers = table.players.split(",");
				if (table.scores === null) {
					continue;
				}
				const tableScores = table.scores ? table.scores.split(",") : ["?", "?"];
				const tableRanks = table.ranks ? table.ranks.split(",") : ["?", "?"];
				const tableStartDate = new Date(table.start * 1000);
				const tableEndDate = new Date(table.end * 1000);
				let tableFlags = "";
				if (table.concede == 1) {
					tableFlags += " 🏳️ ";
				}
				if (table.arenaWin) {
					tableFlags += " 🏟️ ";
				}

				let tableClockViolations = [];
				try {
					const tableInfo = await getTableInfo(table.table_id);
					for (const penalty of Object.entries(tableInfo.result.penalties)) {
						if (penalty[1].clock == "1") {
							tableClockViolations.push(penalty[0]);
						}
					}
					if (tableClockViolations.length > 0) {
						tableFlags += ` ${"⏰".repeat(tableClockViolations.length)} `;
						if (tableClockViolations.length == 2) {
							tableRanks[0] = 0;
							tableRanks[1] = 0;
						} else {
							if (tableClockViolations[0] == tablePlayers[0]) {
								tableRanks[0] = 2;
								tableRanks[1] = 1;
							} else {
								tableRanks[0] = 1;
								tableRanks[1] = 2;
							}
						}
					}
				} catch (error) {
					console.error(`Error fetching table info for table ${table.table_id}:`, error);
				}

				tables.push({
					id: table.table_id,
					url: tableUrl,
					score0: (tablePlayers[0] == player0Id) ? `${tableScores[0]}` : `${tableScores[1]}`,
					score1: (tablePlayers[0] == player0Id) ? `${tableScores[1]}` : `${tableScores[0]}`,
					rank0: (tablePlayers[0] == player0Id) ? `${tableRanks[0]}` : `${tableRanks[1]}`,
					startDate: tableStartDate.toISOString().substr(0, 16).replace("T", " "),
					endDate: tableEndDate.toISOString().substr(0, 16).replace("T", " "),
					timestamp: table.start,
					flags: tableFlags,
					clockViolations: tableClockViolations
				});
				tables.sort((a, b) => a.timestamp - b.timestamp);
			}

			// remove tables played earlier on match day
			if (hidePremature && day && tables.length > 0) {
				const lastTimestamp = tables[tables.length - 1].timestamp;
				const thresholdTime = lastTimestamp - ((tables.length + 1) * 60 * 60);
				tables = tables.filter(table => table.timestamp >= thresholdTime);
			}

			let playersUrl = `https://boardgamearena.com/gamestats?player=${player0Id}&opponent_id=${player1Id}&game_id=${gameId}&finished=0`;
			if (day) {
				playersUrl += `&start_date=${day}&end_date=${day + 86400}`;
			}

			if (!day || isToday(day) || isYesterday(day)) {
				const table = await getGameInProgress(player0Id, player1Id);
				if (table) {
					tables.push({
						id: table.id,
						url: `https://boardgamearena.com/table?table=${table.id}`,
						progress: `${table.progression}`,
						timestamp: table.gamestart,
						startDate: (new Date(table.gamestart * 1000)).toISOString().substr(0, 16).replace("T", " "),
						endDate: `${(new Date(table.gamestart * 1000)).toISOString().substr(0, 10)} __:__`,
						flags: `${table.progression >= ENDGAME_THRESHOLD ? " 🔥 " : ""}`
					});
				}
			}
			console.debug(`Got ${tables.length} tables`);

			return { player0Id, player1Id, playersUrl, tables };
		} catch (error) {
			console.error(`Could not get games for ${player0} – ${player1}: ${error}`);
			return {
				playersUrl: "#",
				tables: []
			};
		}
	}

	/**
	 * Return game in progress, if any, for the given players.
	 */
	async function getGameInProgress(player0Id, player1Id) {
		console.debug("Searching for game in progress");
		const response = await dojo.xhrPost({
			url: "https://boardgamearena.com/tablemanager/tablemanager/tableinfos.html",
			postData: `playerfilter=${player0Id}&turninfo=false&matchmakingtables=false`,
			handleAs: "json",
			headers: { "X-Request-Token": bgaConfig.requestToken }
		});
		for (const table of Object.values(response.data.tables)) {
			if (table.status === "play") {
				const foundSecondPlayer = Object.keys(table.players).filter(id => id == player1Id);
				if (foundSecondPlayer.length > 0) {
					return table;
				}
			}
		}
		return undefined;
	}

	async function sleep(ms) {
		await new Promise(resolve => setTimeout(resolve, ms));
	}

	async function getAllDuels(allDuelsTxt, day, gameId) {
		const hidePremature = document.getElementById("hidePremature").checked;
		const dfGamesList = document.getElementById("dfGamesList");
		const duelsTxt = allDuelsTxt.split("\n");
		const vsRegex = new RegExp(" vs ", "i");
		let matchIndex = -1;
		let nMatches = 5;
		let nGames = 3;
		let teamWins = [0,0];

		for (const [index, duelTxt] of duelsTxt.entries()) {
			if (!duelTxt) {
				continue;
			}

			// Check for Comments
			if (duelTxt.startsWith("#")) {
				let vals = duelTxt.substring(1).split(/,| vs | - | – /);
				if (vals.length == 1) {
					const comment = document.createElement("h2");
					comment.classList = "dfComment";
					comment.innerHTML = vals[0].trim();
					dfGamesList.appendChild(comment);
				} else {
					if (vals[2]) {
						nGames = vals[2].trim();
					}
					if (vals[3]) {
						nMatches = vals[3].trim();
					}
					if (vals[0] != "" && vals[1] != "") {
						const breakItem = document.createElement("li");
						breakItem.classList = "break";
						dfGamesList.appendChild(breakItem);

						let homeTeam = vals[0].trim();
						let awayTeam = vals[1].trim();
						if (flags.get(homeTeam)) {
							homeTeam = `${flags.get(homeTeam)} ${homeTeam}`;
						}
						if (flags.get(awayTeam)) {
							awayTeam = `${flags.get(awayTeam)} ${awayTeam}`;
						}
						const matchHeader = document.createElement("h2");
						matchHeader.classList = "matchHeader";
						matchIndex = index;
						teamWins = [0, 0];
						const matchFixture = document.createElement("span");
						matchFixture.classList.add("fixture");
						const home = document.createElement("span");
						const away = document.createElement("span");
						home.id = `${matchIndex}-home`;
						away.id = `${matchIndex}-away`;
						matchFixture.appendChild(home);
						matchFixture.appendChild(document.createTextNode(" – "));
						matchFixture.appendChild(away);
						home.innerText = homeTeam;
						away.innerText = awayTeam;
						matchHeader.appendChild(matchFixture);

						const matchScore = document.createElement("span");
						matchScore.classList.add("fixtureScore");
						const homeTeamScore = document.createElement("span");
						const awayTeamScore = document.createElement("span");
						homeTeamScore.id = `${matchIndex}-homeScore`;
						awayTeamScore.id = `${matchIndex}-awayScore`;

						matchScore.appendChild(homeTeamScore);
						matchScore.appendChild(document.createTextNode(":"));
						matchScore.appendChild(awayTeamScore);
						homeTeamScore.innerText = teamWins[0];
						awayTeamScore.innerText = teamWins[1];
						matchHeader.appendChild(matchScore);
						dfGamesList.appendChild(matchHeader);
					}
				}
			} else {
				// Get players
				let players = duelTxt.split(/\d+\.\s+| vs | - | – /);
				players = players.filter(e => e);
				if (players.length !== 2) {
					console.error(`Could not get players for "${duelTxt}"`);
					continue;
				}
				players = [players[0].trim(), players[1].trim()];

				await sleep(REQUEST_INTERVAL);
				const gamesData = await getGames(players[0], players[1], day, gameId, hidePremature);
				const games = gamesData.tables;

				const duelGamesList = document.createElement("ul");
				duelGamesList.classList.add("duelGamesList");
				// Get games info
				let wins = [0, 0];
				for (const game of games) {
					const result = document.createElement("li");
					result.classList = "result";
					const gameLink = document.createElement("a");
					const dateSpan = document.createElement("span");
					dateSpan.classList.add("resultDate");
					let dateText = ""
					if (isToday(day)) {
						dateText = `${game.startDate.substring(11)}–${game.endDate.substring(11)}`;
					} else if (day || (game.startDate.substring(0,10) == game.endDate.substring(0,10))) {
						dateText = `${game.startDate}–${game.endDate.substring(11)}`;
					} else {
						dateText = `${game.startDate}–${game.endDate}`;
					}
					dateSpan.innerText = dateText;
					result.appendChild(dateSpan);
					gameLink.classList = "bga-link";
					if (game.progress) {
						const progressSpan = document.createElement("span");
						progressSpan.classList.add("progress");
						if (game.progress >= 70) { progressSpan.classList.add("endgame"); }
						progressSpan.innerText = `${game.progress}%`;
						gameLink.appendChild(progressSpan);
					} else {
						const homeScore = document.createElement("span");
						const awayScore = document.createElement("span");
						homeScore.innerText = game.score0;
						awayScore.innerText = game.score1;
						if (game.rank0 == 1) {
							homeScore.classList = "win";
							wins[0]++;
						} else {
							awayScore.classList = "win";
							wins[1]++;
						}
						gameLink.appendChild(homeScore);
						gameLink.appendChild(document.createTextNode(":"));
						gameLink.appendChild(awayScore);
					}
					gameLink.href = game.url;
					result.appendChild(gameLink);
					if (game.flags) {
						const flagsSpan = document.createElement("span");
						flagsSpan.classList.add("flags");
						flagsSpan.innerText = game.flags;
						result.appendChild(flagsSpan);
					}
					duelGamesList.appendChild(result);
				}
				const duel = document.createElement("li");
				duel.classList = "duel";
				const duelHeader = document.createElement("h2");
				duelHeader.classList = "duelHeader";

				const duelLink = document.createElement("a");
				const duelHome = document.createElement("span");
				duelHome.classList.add("duelHome");
				const duelAway = document.createElement("span");
				duelAway.classList.add("duelAway");
				duelLink.appendChild(duelHome);
				duelLink.appendChild(document.createTextNode(" – "));
				duelLink.appendChild(duelAway);
				duelLink.href = gamesData.playersUrl;
				duelHome.innerText = players[0];
				duelAway.innerText = players[1];

				const duelScore = document.createElement("span");
				duelScore.classList.add("duelScore");
				const homeScore = document.createElement("span");
				const awayScore = document.createElement("span");
				duelScore.appendChild(homeScore);
				duelScore.appendChild(document.createTextNode(":"));
				duelScore.appendChild(awayScore);
				homeScore.innerText = wins[0];
				awayScore.innerText = wins[1];

				if (wins[0] >= nGames/2 && wins[0] > wins[1]) {
					duelHome.classList.add("win");
					homeScore.classList.add("win");
					if (matchIndex > -1) {
						teamWins[0]++;
						let homeTeamScoreEl = document.getElementById(`${matchIndex}-homeScore`);
						homeTeamScoreEl.innerText = teamWins[0];
						if (teamWins[0] >= nMatches/2) {
							document.getElementById(`${matchIndex}-home`).classList.add("win");
							homeTeamScoreEl.classList.add("win");
						}
					}
				} else if (wins[1] >= nGames/2 && wins[1] > wins[0]) {
					duelAway.classList.add("win");
					awayScore.classList.add("win");
					if (matchIndex > -1) {
						teamWins[1]++;
						let awayTeamScoreEl = document.getElementById(`${matchIndex}-awayScore`);
						awayTeamScoreEl.innerText = teamWins[1];
						if (teamWins[1] >= nMatches/2) {
							document.getElementById(`${matchIndex}-away`).classList.add("win");
							awayTeamScoreEl.classList.add("win");
						}
					}
				}
				duelHeader.appendChild(duelLink);
				duelHeader.appendChild(duelScore);
				duel.appendChild(duelHeader);
				duel.appendChild(duelGamesList);
				dfGamesList.appendChild(duel);
			}
		}
		saveHomePlayersToLocalStorage();
		return true;
	}

	function saveHomePlayersToLocalStorage() {
		const homePlayers = Array.from(document.querySelectorAll("#dfBox .duelHome")).map(el => el.innerText);
		localStorage.setItem("dfHomePlayers", JSON.stringify(homePlayers));
		console.debug("Home players’ names saved to localStorage");
	}

	dragElement(document.getElementById("dfBox"));

	function dragElement(el) {
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		document.getElementById("dfHead").onmousedown = dragMouseDown;

		const onmouseupBackup = document.onmouseup;
		const onmousemoveBackup = document.onmousemove;

		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
		}

		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			el.style.top = (el.offsetTop - pos2) + "px";
			el.style.left = (el.offsetLeft - pos1) + "px";
		}

		function closeDragElement() {
			document.onmouseup = onmouseupBackup;
			document.onmousemove = onmousemoveBackup;
			saveBoxLayoutToLocalStorage();
		}
	}

	function saveDataToLocalStorage() {
		let dfData = new Map();
		dfData.set("datePicker", document.getElementById("datePicker").value);
		dfData.set("hidePremature", document.getElementById("hidePremature").checked);
		dfData.set("dfConfig", document.getElementById("dfConfig").value);
		dfData.set("lastSaved", Date.now());
		localStorage.setItem("dfData", JSON.stringify([...dfData]));
		console.debug("Data saved to localStorage");
	}

	function retrieveDataFromLocalStorage() {
		if (localStorage.dfData) {
			const dfData = new Map(JSON.parse(localStorage.dfData));
			document.getElementById("datePicker").value = dfData.get("datePicker");
			document.getElementById("hidePremature").checked = eval(dfData.get("hidePremature"));
			const duelData = dfData.get("dfConfig") ?? "";
			document.getElementById("dfConfig").value = duelData;
			console.debug("Data retrieved from localStorage");
			const lastSaved = dfData.get("lastSaved");
			if (Date.now() - lastSaved < DATA_CACHE_DURATION) {
				console.debug("Reloading retrieved data")
				document.getElementById("dfFindButton").click();
				applyBoxLayout();
			}
		} else {
			console.debug("Could not retrieve data from localStorage");
		}
	}

	function saveBoxLayoutToLocalStorage(box) {
		const el = box ?? document.getElementById("dfBox");
		const orientation = el.classList.contains("horizontal") ? "h" : "v";
		let dfBoxAttrs = new Map();
		if (localStorage.dfBoxAttrs) {
			dfBoxAttrs = new Map(JSON.parse(localStorage.dfBoxAttrs));
		}
		dfBoxAttrs.set(orientation, {
			"height": el.style.height,
			"width": el.style.width,
			"top": el.style.top,
			"left": el.style.left,
			"transform": el.style.transform,
		});
		dfBoxAttrs.set("savedOrientation", orientation);
		localStorage.setItem("dfBoxAttrs", JSON.stringify([...dfBoxAttrs]));
		console.debug("Layout saved to localStorage");
	}

	function applyBoxLayout(box, mode) {
		const el = box ?? document.getElementById("dfBox");
		let orientation = "";
		if (mode == "toggle") {
			el.classList.toggle("horizontal");
			orientation = el.classList.contains("horizontal") ? "h" : "v";
		}	else if (["h", "v"].includes(mode)) {
			orientation = mode;
		} else if (localStorage.dfBoxAttrs) {
			const dfBoxAttrs = new Map(JSON.parse(localStorage.dfBoxAttrs));
			orientation = dfBoxAttrs.get("savedOrientation") ?? "v";
		} else {
			orientation = "v";
		}
		el.classList = orientation == "h" ? "horizontal" : "";
		const dfHeader = document.getElementById("dfHeader");
		dfHeader.innerText = orientation == "h" ? "DF2" : "Duel Finder 2";
		if (localStorage.dfBoxAttrs) {
			const dfBoxAttrs = new Map(JSON.parse(localStorage.dfBoxAttrs));
			el.style.height = dfBoxAttrs.get(orientation)["height"];
			el.style.width = dfBoxAttrs.get(orientation)["width"];
			el.style.top = dfBoxAttrs.get(orientation)["top"];
			el.style.left = dfBoxAttrs.get(orientation)["left"];
			el.style.transform = dfBoxAttrs.get(orientation)["transform"];
		} else if (orientation == "h") {
			el.style.height = "62px";
			el.style.width = "max-content";
			el.style.width = `calc(${el.offsetWidth}px + 100px)`;
			el.style.top = "0px";
			el.style.bottom = "unset";
			el.style.left = "176px";
		} else {
			el.style.height = "max-content";
			el.style.width = "max-content";
			el.style.top = "unset";
			el.style.bottom = "0px";
			el.style.left = "0px";
		}
		saveBoxLayoutToLocalStorage(el);
	}

})();
