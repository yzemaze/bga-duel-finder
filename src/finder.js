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

let style = document.createElement("style");
style.innerHTML = `
	.drag-handle {
		cursor: pointer;
	}
	.dragging{
		cursor: move !important;
	}
	#finderBox {
		box-sizing: border-box;
		display: grid;
		grid-template-rows: max-content 1fr;
		position: absolute;
		left: 0px;
		bottom: 0px;
		width: max-content;
		min-width: fit-content;
		height: max-content;
		min-height: 110px;
		background: #f0f0f0;
		box-shadow: 0 3px 8px rgba(0,0,0,.3);
		border-radius: 8px;
		z-index: 10000;
		resize: both;
		overflow: hidden;
	}
	#finderBox * {
		box-sizing: border-box;
	}
	#finderBox .duel a {
		color: rgb(72, 113, 182);
		text-decoration: none;
	}
	#finderBox.horizontal {
		grid-auto-flow: column;
		grid-template-columns: max-content 1fr max-content;
		grid-template-rows: none;
		min-height: 62px;
	}
	.horizontal #finderHead {
		padding: 10px;
	}
	.horizontal #finderBody {
		grid-template-rows: none;
		grid-auto-flow: column;
		grid-template-columns: 1fr auto;
		padding: 10px;
	}
	.horizontal #gamesList {
		grid-auto-flow: column;
		grid-gap: 10px;
	}
	#finderBox.horizontal h2.matchHeader {
		margin: 0;
	}
	.horizontal .dfComment {
		min-width: 10em;
	}
	.horizontal .fixtureScore, .horizontal .duelScore {
		grid-column-start: 2;
	}
	#finderBox h2 {
		font-weight: normal;
		margin: 0;
	}
	#finderBox .bga-link {
		font-weight: normal;
	}
	#finderBox h2.dfComment {
		font-weight: bold;
	}
	#finderHead {
		background: #4871b6;
		color: #fff;
		padding: 5px 10px;
		user-select: none;
	}
	#finderBody {
		display: grid;
		grid-template-rows: 1fr max-content;
		grid-gap: 10px;
		overflow: auto;
		padding: 5px 10px 10px 10px;
	}
	#inputForm {
		display: grid;
		grid-template-rows: repeat(3, max-content) 1fr;
	}
	#inputForm input {
		width: fit-content;
		border-radius: 5px;
	}
	.duelsView #inputForm {
		display: none;
	}
	#duelsConfig, #duelsConfigLabel {
		grid-column: span 2;
	}
	#duelsConfig {
		width: 100%;
		border-radius: 5px;
	}
	#buttonDiv {
		display: grid;
		grid-template-columns: repeat(3, max-content);
		grid-gap: 10px;
	}
	#buttonDiv .bgabutton {
		margin: 0;
		height: fit-content;
		width: fit-content;
	}
	#findButton, #closeButton {
		display: block;
	}
	#backButton, #reloadButton, #toggleDatesButton {
		display: none;
	}
	.duelsView #backButton, .duelsView #reloadButton, .duelsView #toggleDatesButton {
		display: block;
	}
	.duelsView #findButton, .duelsView #closeButton, .horizontal #toggleDatesButton {
		display: none;
	}
	#gamesList {
		display: none;
		overflow: auto;
		grid-auto-rows: max-content;
		grid-gap: 2px;
	}
	.duelsView #gamesList {
		display: grid;
	}
	.matchHeader, .duelHeader {
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: 1fr;
		grid-gap: 0.4em;
	}
	#finderBox .matchHeader {
		margin: 10px 0 5px 0;
	}
	.fixtureScore, .duelScore {
		grid-column-start: 3;
	}
	.duel {
		display: grid;
		grid-template-rows: max-content 1fr;
	}
	#gamesList.noDates .resultDate {
		display: none;
	}
	#gamesList.noDates ul.duelGamesList > li {
		display: inline;
	}
	#gamesList.noDates ul.duelGamesList > li:not(:last-child)::after {
		content: " • ";
		color: #888;
	}
	li.result {
		display: grid;
		grid-template-columns: repeat(3, max-content);
		grid-gap: 5px;
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
 `;
document.head.appendChild(style);

createUi();

/**
 * Check if a date is today
 */
function isToday(unixTimestamp) {
	const today = new Date();
	const date = new Date(unixTimestamp * 1000);
	return (
		date.setHours(0,0,0,0) == today.setHours(0,0,0,0)
	);
}

/**
 * Create ui for user interaction.
 *
 */
function createUi() {
	const finderId = "finderBox";
	let finderBox = document.getElementById(finderId);
	if (finderBox) {
		finderBox.style.display = "grid";
		return;
	}

	finderBox = document.createElement("div");
	finderBox.id = finderId;
	finderBox.setAttribute("data-draggable", true);
	finderBox.setAttribute("data-resizable", true);
	let finderHead = document.createElement("h2");
	finderHead.id = "finderHead";
	finderHead.setAttribute("data-drag-handle", true);
	finderHead.innerText = "Duel Finder 2";
	finderHead.classList.add("drag-handle");
	let finderBody = document.createElement("div");
	finderBody.id = "finderBody";
	finderBox.appendChild(finderHead);
	finderBox.appendChild(finderBody);

	const inputForm = document.createElement("form");
	inputForm.id = "inputForm";
	const datePicker = document.createElement("input");
	datePicker.id = "datePicker";
	datePicker.type = "date";
	datePicker.valueAsDate = new Date();
	const datePickerLabel = document.createElement("label");
	datePickerLabel.htmlFor = "datePicker";
	datePickerLabel.textContent = "Date";
	const dateShow = document.createElement("input");
	dateShow.type = "checkbox";
	dateShow.id = "dateShow";
	dateShow.checked = false;
	const dateShowLabel = document.createElement("label");
	dateShowLabel.htmlFor = "dateShow";
	dateShowLabel.textContent = "Show dates";
	const textArea = document.createElement("textArea");
	textArea.id = "duelsConfig";
	const textAreaLabel = document.createElement("label");
	textAreaLabel.id = "duelsConfigLabel";
	textAreaLabel.htmlFor = "duelsConfig";
	textAreaLabel.textContent = "Matches & duels";

	inputForm.appendChild(datePickerLabel);
	inputForm.appendChild(datePicker);
	inputForm.appendChild(dateShowLabel);
	inputForm.appendChild(dateShow);
	inputForm.appendChild(textAreaLabel);
	inputForm.appendChild(textArea);

	const gamesList = document.createElement("ul");
	gamesList.id = "gamesList";

	const buttonDiv = document.createElement("div");
	buttonDiv.id = "buttonDiv";
	const findButton = document.createElement("a");
	findButton.id = "findButton";
	findButton.classList = "bgabutton bgabutton_blue";
	findButton.innerText = "Find Duels";
	const backButton = document.createElement("a");
	backButton.id = "backButton";
	backButton.classList = "bgabutton bgabutton_red";
	backButton.innerText = "Back";
	const closeButton = document.createElement("a");
	closeButton.id = "closeButton";
	closeButton.classList = "bgabutton bgabutton_red";
	closeButton.innerText = "Close";
	const reloadButton = document.createElement("a");
	reloadButton.id = "reloadButton";
	reloadButton.classList = "bgabutton bgabutton_green";
	reloadButton.innerText = "Reload";
	const toggleDatesButton = document.createElement("a");
	toggleDatesButton.id = "toggleDatesButton";
	toggleDatesButton.classList = "bgabutton bgabutton_blue";
	toggleDatesButton.innerText = "Toggle Dates";
	buttonDiv.appendChild(closeButton);
	buttonDiv.appendChild(findButton);
	buttonDiv.appendChild(backButton);
	buttonDiv.appendChild(reloadButton);
	buttonDiv.appendChild(toggleDatesButton);

	finderBody.appendChild(inputForm);
	finderBody.appendChild(gamesList);
	finderBody.appendChild(buttonDiv);

	document.body.appendChild(finderBox);
	applyBoxLayout(finderBox);

	finderHead.ondblclick = function() { applyBoxLayout(finderBox, "toggle") };

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
	resizeObserver.observe(finderBox);

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
		const transformedText = matches.join("\n");

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
		document.getElementById("finderBody").classList.toggle("duelsView");
		gamesList.classList = dateShow.checked ? "" : "noDates";
		await getAllDuels(duelsText, unixTimestamp, gameId);
		findButton.disabled = false;
	};

	backButton.onclick = function () {
		document.getElementById("finderBody").classList.toggle("duelsView");
		gamesList.innerHTML = "";
		textArea.disabled = false;
	};

	closeButton.onclick = function () {
		document.body.removeChild(finderBox);
	}

	reloadButton.onclick = async function () {
		const gameId = 1; // Carcassonne
		const date = new Date(datePicker.value);
		const unixTimestamp = Math.floor(date.getTime() / 1000);
		const duelsText = textArea.value;
		gamesList.innerHTML = "";
		await getAllDuels(duelsText, unixTimestamp, gameId);
	}

	toggleDatesButton.onclick = function () {
		document.getElementById("gamesList").classList.toggle("noDates");
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

/**
 * Return games for two players in a given day
 *
 */
async function getGames(player0, player1, day, gameId) {
	const tables = [];
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
			params.end_date = day + 86400;
		}

		const response = dojo.xhrGet({
			url: "https://boardgamearena.com/gamestats/gamestats/getGames.html",
			content: params,
			handleAs: "json",
			headers: { "X-Request-Token": bgaConfig.requestToken },
			sync: true
		});
		for (const table of response.results[0].data.tables) {
			const tableUrl = `https://boardgamearena.com/table?table=${table.table_id}`;
			const tablePlayers = table.players.split(",");
			// remove mutually abandoned tables
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

			tables.push({
				id: table.table_id,
				url: tableUrl,
				score0: (tablePlayers[0] == player0Id) ? `${tableScores[0]}` : `${tableScores[1]}`,
				score1: (tablePlayers[0] == player0Id) ? `${tableScores[1]}` : `${tableScores[0]}`,
				rank0: (tablePlayers[0] == player0Id) ? `${tableRanks[0]}` : `${tableRanks[1]}`,
				startDate: tableStartDate.toISOString().substr(0, 16).replace("T", " "),
				endDate: tableEndDate.toISOString().substr(0, 16).replace("T", " "),
				timestamp: table.start,
				flags: tableFlags
			});
		}
		tables.sort((a, b) => a.timestamp - b.timestamp);
		let playersUrl = `https://boardgamearena.com/gamestats?player=${player0Id}&opponent_id=${player1Id}&game_id=${gameId}&finished=0`;
		if (day) {
			playersUrl += `&start_date=${day}&end_date=${day + 86400}`;
		}

		if (!day || isToday(day)) {
			const table = await getGameInProgress(player0Id, player1Id);
			if (table) {
				tables.push({
					id: table.id,
					url: `https://boardgamearena.com/table?table=${table.id}`,
					progress: `${table.progression}`,
					timestamp: table.gamestart,
					startDate: (new Date(table.gamestart * 1000)).toISOString().substr(0, 16).replace("T", " "),
					endDate: `${(new Date(table.gamestart * 1000)).toISOString().substr(0, 10)} __:__`,
					flags: " 🔥 "
				});
			}
		}
		console.debug(`Got ${tables.length} tables`);

		return { player0Id, player1Id, playersUrl, tables };
	}
	catch (error) {
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
	const gamesList = document.getElementById("gamesList");
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
			let vals = duelTxt.substring(1).split(",");
			if (vals.length == 1) {
				const comment = document.createElement("h2");
				comment.classList = "dfComment";
				comment.innerText = vals[0].trim();
				gamesList.appendChild(comment);
			} else {
				if (vals[2]) {
					nGames = vals[2].trim();
				}
				if (vals[3]) {
					nMatches = vals[3].trim();
				}
				if (vals[0] != "" && vals[1] != "") {
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
					home.innerText = vals[0].trim();
					away.innerText = vals[1].trim();
					matchHeader.appendChild(matchFixture);

					const matchScore = document.createElement("span");
					matchScore.classList.add("fixtureScore");
					const homeTeamScore = document.createElement("span");
					const awayTeamScore = document.createElement("span");
					homeTeamScore.id = `${matchIndex}-homeScore`;
					awayTeamScore.id = `${matchIndex}-awayScore`;

					matchScore.appendChild(homeTeamScore);
					matchScore.appendChild(document.createTextNode("-"));
					matchScore.appendChild(awayTeamScore);
					homeTeamScore.innerText = teamWins[0];
					awayTeamScore.innerText = teamWins[1];
					matchHeader.appendChild(matchScore);
					gamesList.appendChild(matchHeader);
				}
			}
		} else {
			// Get players
			let players = duelTxt.split(" - ");
			if (players.length !== 2) {
				players = duelTxt.split(vsRegex);
			}
			if (players.length !== 2) {
				players = duelTxt.split("-");
			}
			if (players.length !== 2) {
				console.error(`Could not get players for "${duelTxt}"`);
				continue;
			}

			players = [players[0].trim(), players[1].trim()];

			await sleep(REQUEST_INTERVAL);
			const gamesData = await getGames(players[0], players[1], day, gameId);
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
					} else  {
						awayScore.classList = "win";
						wins[1]++;
					}
					gameLink.appendChild(homeScore);
					gameLink.appendChild(document.createTextNode("-"));
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
			const duelAway = document.createElement("span");
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
			duelScore.appendChild(document.createTextNode("-"));
			duelScore.appendChild(awayScore);
			homeScore.innerText = wins[0];
			awayScore.innerText = wins[1];

			if (wins[0] >= nGames/2 && wins[0] > wins[1]) {
				duelHome.classList = "win";
				homeScore.classList = "win";
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
				duelAway.classList = "win";
				awayScore.classList = "win";
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
			gamesList.appendChild(duel);
		}
	}
	return true;
}

dragElement(document.getElementById("finderBox"));

function dragElement(el) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	document.getElementById("finderHead").onmousedown = dragMouseDown;

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
		document.onmouseup = null;
		document.onmousemove = null;
		saveBoxLayoutToLocalStorage();
	}
}

function saveDataToLocalStorage() {
	let dfData = new Map();
	dfData.set("datePicker", document.getElementById("datePicker").value);
	dfData.set("dateShow", document.getElementById("dateShow").checked);
	dfData.set("duelsConfig", document.getElementById("duelsConfig").value);
	dfData.set("lastSaved", Date.now());
	localStorage.setItem("dfData", JSON.stringify([...dfData]));
	console.debug("Data saved to localStorage");
}

function retrieveDataFromLocalStorage() {
	const dfData = new Map(JSON.parse(localStorage.dfData));
	if (dfData) {
		document.getElementById("datePicker").value = dfData.get("datePicker");
		document.getElementById("dateShow").checked = eval(dfData.get("dateShow"));
		const duelData = dfData.get("duelsConfig") ?? "";
		document.getElementById("duelsConfig").value = duelData;
		console.debug("Data retrieved from localStorage");
		const lastSaved = dfData.get("lastSaved");
		if (Date.now() - lastSaved < DATA_CACHE_DURATION) {
			console.debug("Reloading retrieved data")
			document.getElementById("findButton").click();
			applyBoxLayout();
		}
	} else {
		console.debug("Could not retrieve data from localStorage");
	}
}

function saveBoxLayoutToLocalStorage(box) {
	const el = box ?? document.getElementById("finderBox");
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
	});
	dfBoxAttrs.set("savedOrientation", orientation);
	localStorage.setItem("dfBoxAttrs", JSON.stringify([...dfBoxAttrs]));
	console.debug("Layout saved to localStorage");
}

function applyBoxLayout(box, mode) {
	const el = box ?? document.getElementById("finderBox");
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
	const finderHead = document.getElementById("finderHead");
	finderHead.innerText = orientation == "h" ? "DF2" : "Duel Finder 2";
	if (localStorage.dfBoxAttrs) {
		const dfBoxAttrs = new Map(JSON.parse(localStorage.dfBoxAttrs));
		el.style.height = dfBoxAttrs.get(orientation)["height"];
		el.style.width = dfBoxAttrs.get(orientation)["width"];
		el.style.top = dfBoxAttrs.get(orientation)["top"];
		el.style.left = dfBoxAttrs.get(orientation)["left"];
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
