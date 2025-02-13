/**
 * BGA Duel Finder 2
 *
 * Find and display duels from a list of fixtures.
 * Highlight winnning scores, calculate duel and team match results.
 *
 * Usage:
 *  1. Copy and paste this code to the developer console
 *     or use a bookmarklet https://caiorss.github.io/bookmarklet-maker/
 *  2. Pick date and paste/edit duel list.
 *     " - " or " vs " are valid separators between usernames.
 *     Lines starting with # are treated as headers/comments between duels.
 *     There are some configuration options (# and , are essential!):
 *     #Team A,Team B,games per duel,duels per match
 *     If gpd or dpm are left blank, they default to WTCOC-/CCL-standard:
 *     - games per duel: 3
 *     - duels per match: 5
 *     Just leave team names blank if you only need to change gpd.
 *
 *     Multiple matches can be displayed, e.g.:
 *     - Date: 21-04-2024
 *     - Show date: blank/false
 *     - Matches & duels:
 *       #WTCOC 2024 Group D - Round 1
 *       #Belgium,Peru
 *       CraftyRaf vs Eymicienta04
 *       JinaJina vs spakune
 *       Carcharoth 9 vs Sparklehorsee-
 *       Sicarius Lupus vs -Nari-
 *       Nicedicer vs AndreeMC
 *       #Germany,Vietnam
 *       Meami vs portgard
 *       Medusahope vs Wolf Ren
 *       kostra vs Mùng0910
 *       MeepleWizard vs Bii1208
 *       Leuschi vs Wiseman from Arcadia
 *
 *  3. Click button "Find Duels".
 *  4. Drag (header only) and resize the box as you like.
 *  5. Doubleclick the header to toggle the layout.
 */

(function() {
"use strict";

const REQUEST_INTERVAL = 250;     // 250ms between requests, give BGA a break
const CACHE_DURATION = 7*24*60*60*1000; // ms
const DATA_CACHE_DURATION = 2*60*60*1000;

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
		min-width: 210px;
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
	.horizontal #gameList {
		grid-auto-flow: column;
		grid-gap: 10px;
	}
	#finderBox.horizontal h2.matchHeader {
		margin: 0;
	}
	.horizontal .comment {
		min-width: 10em;
	}
	.horizontal .fixtureScore, .horizontal .duelScore {
		grid-column-start: 2;
	}
	#finderBox h2 {
		font-weight: normal;
		margin: 0;
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
	#duelsConfig, #duelsConfigLabel {
		grid-column: span 2;
	}
	#duelsConfig {
		width: 100%;
		border-radius: 5px;
	}
	#buttonDiv {
		display: grid;
		grid-template-columns: max-content max-content;
		grid-gap: 10px;
	}
	#buttonDiv .bgabutton {
		margin: 0;
		height: fit-content;
		width: fit-content;
	}
	#backButton, #reloadButton {
		display: none;
	}
	#gameList {
		display: none;
		overflow: auto;
		/*grid-template-rows: repeat(100, min-content);*/
		grid-auto-rows: max-content;
		grid-gap: 2px;
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
	ul.resultlist > li {
		display: inline;
	}
	ul.resultlist > li:not(:last-child)::after {
		content: " • ";
		color: #888;
	}
	li.result span.resultDate {
		font-size: 0.9em;
		padding-right: 5px;
	}
	span.win {
		font-weight: bold;
	}
 `;
document.head.appendChild(style);

createUi();

/**
 * Check if a date is today
 */
function isToday(unixTimestamp) {
	const today = new Date();
	const todayYear = today.getFullYear();
	const todayMonth = today.getMonth();
	const todayDay = today.getDate();

	const date = new Date(unixTimestamp * 1000);
	const givenYear = date.getFullYear();
	const givenMonth = date.getMonth();
	const givenDay = date.getDate();

	return (
		todayYear === givenYear &&
		todayMonth === givenMonth &&
		todayDay === givenDay
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

	const gameList = document.createElement("ul");
	gameList.id = "gameList";

	const buttonDiv = document.createElement("div");
	buttonDiv.id = "buttonDiv";
	const findButton = document.createElement("a");
	findButton.id = "findButton";
	findButton.classList = "bgabutton bgabutton_blue";
	findButton.innerText = "Find Duels";
	const backButton = document.createElement("a");
	backButton.id = "backButton";
	backButton.classList = "bgabutton bgabutton_blue";
	backButton.innerText = "Back";
	const closeButton = document.createElement("a");
	closeButton.id = "closeButton";
	closeButton.classList = "bgabutton bgabutton_red";
	closeButton.innerText = "Close";
	const reloadButton = document.createElement("a");
	reloadButton.id = "reloadButton";
	reloadButton.classList = "bgabutton bgabutton_green";
	reloadButton.innerText = "Reload";
	buttonDiv.appendChild(findButton);
	buttonDiv.appendChild(backButton);
	buttonDiv.appendChild(closeButton);
	buttonDiv.appendChild(reloadButton);

	finderBody.appendChild(inputForm);
	finderBody.appendChild(gameList);
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
		const lines = pastedData.split("\n");
		const selectedElements = lines.filter((_, index) => (index - 1) % 3 === 0);
		const vsElements = selectedElements.filter(element => element.trim() === "vs");

		if (selectedElements.length === 0 || selectedElements.length !== vsElements.length) {
			return;
		}
		event.preventDefault();

		const pairs = [];
		for (let i = 0; i < lines.length; i += 3) {
			const player0 = lines[i];
			const player1 = lines[i + 2];
			if (player0.trim() && player1.trim()) {
				pairs.push(`${player0.trim()} vs ${player1.trim()}`);
			}
		}
		const transformedText = pairs.join("\n");

		// Get the current cursor position or selection
		const start = textArea.selectionStart;
		const end = textArea.selectionEnd;

		// Insert the transformed text at the cursor position
		textArea.value = textArea.value.slice(0, start) + transformedText + textArea.value.slice(end);

		// Move the cursor to the end of the inserted text
		textArea.selectionStart = textArea.selectionEnd = start + transformedText.length;
	});

	findButton.onclick = async function () {
		const game_id = 1; // Carcassonne
		const date = new Date(datePicker.value);
		const unixTimestamp = Math.floor(date.getTime() / 1000);
		const duelsText = textArea.value;
		textArea.disabled = true;
		findButton.disabled = true;
		saveDataToLocalStorage();
		await getAllDuels(duelsText, unixTimestamp, game_id);

		findButton.disabled = false;
		inputForm.style.display = "none";
		gameList.style.display = "grid";
		findButton.style.display = "none";
		closeButton.style.display = "none";
		backButton.style.display = "block";
		reloadButton.style.display = "block";
	};

	backButton.onclick = function () {
		inputForm.style.display = "grid";
		gameList.style.display = "none";
		gameList.innerHTML = "";
		textArea.disabled = false;
		findButton.style.display = "block";
		closeButton.style.display = "block";
		backButton.style.display = "none";
		reloadButton.style.display = "none";
	};

	closeButton.onclick = function () {
		finderBox.style.display = "none";
	}

	reloadButton.onclick = async function () {
		const game_id = 1; // Carcassonne
		const date = new Date(datePicker.value);
		const unixTimestamp = Math.floor(date.getTime() / 1000);
		const duelsText = textArea.value;
		gameList.style.display = "grid";
		gameList.innerHTML = "";
		await getAllDuels(duelsText, unixTimestamp, game_id);
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
async function getGames(player0, player1, day, game_id) {
	const tables = [];
	try {
		const player0_id = getPlayerId(player0);
		const player1_id = getPlayerId(player1);
		const params = {
			game_id: game_id,
			player: player0_id,
			opponent_id: player1_id,
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
			const table_url = `https://boardgamearena.com/table?table=${table.table_id}`;
			const table_players = table.players.split(",");
			const table_scores = table.scores ? table.scores.split(",") : ["?", "?"];
			const table_ranks = table.ranks ? table.ranks.split(",") : ["?", "?"];
			const table_start_date = new Date(table.start * 1000);
			const table_end_date = new Date(table.end * 1000);
			let table_flags = "";
			// if (table_scores[0] == table_scores[1]) {
			// 	if (table_ranks[0] == 1) {
			// 		table_scores[0] += "*";
			// 	} else {
			// 		table_scores[1] += "*";
			// 	}
			// }
			if (table.concede == 1) {
				table_flags += " 🏳️ ";
			}
			if (table.arena_win) {
				table_flags += " 🏟️ ";
			}

			tables.push({
				id: table.table_id,
				url: table_url,
				score0: (table_players[0] == player0_id) ? `${table_scores[0]}` : `${table_scores[1]}`,
				score1: (table_players[0] == player0_id) ? `${table_scores[1]}` : `${table_scores[0]}`,
				rank0: (table_players[0] == player0_id) ? `${table_ranks[0]}` : `${table_ranks[1]}`,
				startDate: table_start_date.toISOString().substr(0, 16).replace("T", " "),
				endDate: table_end_date.toISOString().substr(0, 16).replace("T", " "),
				timestamp: table.start,
				flags: table_flags
			});
		}
		tables.sort((a, b) => a.timestamp - b.timestamp);
		let players_url = `https://boardgamearena.com/gamestats?player=${player0_id}&opponent_id=${player1_id}&game_id=${game_id}&finished=0`;
		if (day) {
			players_url += `&start_date=${day}&end_date=${day + 86400}`;
		}

		if (!day || isToday(day)) {
			const table = await getGameInProgress(player0_id, player1_id);
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

		return { player0_id, player1_id, players_url, tables };
	}
	catch (error) {
		console.error(`Could not get games for ${player0} – ${player1}: ${error}`);
		return {
			players_url: "#",
			tables: []
		};
	}
}

/**
 * Return game in progress, if any, for the given players.
 */
async function getGameInProgress(player0_id, player1_id) {
	console.debug("Searching for game in progress");
	const response = await dojo.xhrPost({
		url: "https://boardgamearena.com/tablemanager/tablemanager/tableinfos.html",
		postData: `playerfilter=${player0_id}&turninfo=false&matchmakingtables=false`,
		handleAs: "json",
		headers: { "X-Request-Token": bgaConfig.requestToken }
	});
	for (const table of Object.values(response.data.tables)) {
		if (table.status === "play") {
			const foundSecondPlayer = Object.keys(table.players).filter(id => id == player1_id);
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

async function getAllDuels(all_duels_txt, day, game_id) {
	const showDates = document.getElementById("dateShow").checked;
	const gameList = document.getElementById("gameList");
	const duels_txt = all_duels_txt.split("\n");
	const vsRegex = new RegExp(" vs ", "i");
	let matchIndex = -1;
	let nMatches = 5;
	let nGames = 3;
	let teamWins = [0,0];

	for (const [index, duel_txt] of duels_txt.entries()) {
		if (!duel_txt) {
			continue;
		}

		// Check for Comments
		if (duel_txt.startsWith("#")) {
			let vals = duel_txt.substring(1).split(",");
			if (vals.length == 1) {
				const comment = document.createElement("h2");
				comment.classList = "comment";
				comment.innerText = vals[0].trim();
				gameList.appendChild(comment);
			} else {
				if (vals[2]) {
					nGames = vals[2].trim();
					console.debug(`Games: ${nGames}`);
				}
				if (vals[3]) {
					nMatches = vals[3].trim();
					console.debug(`Matches: ${nMatches}`);
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
					console.debug(`SCORES: ${homeTeamScore.innerText} – ${awayTeamScore.innerText}`);
					matchHeader.appendChild(matchScore);
					gameList.appendChild(matchHeader);
				}
			}
		} else {
			// Get players
			let players = duel_txt.split(" - ");
			if (players.length !== 2) {
				players = duel_txt.split(vsRegex);
			}
			if (players.length !== 2) {
				players = duel_txt.split("-");
			}
			if (players.length !== 2) {
				console.error(`Could not get players for "${duel_txt}"`);
				continue;
			}

			players = [players[0].trim(), players[1].trim()];

			await sleep(REQUEST_INTERVAL);
			const games_data = await getGames(players[0], players[1], day, game_id);
			const games = games_data.tables;

			const duelGameList = document.createElement("ul");
			if (!showDates) {
				duelGameList.classList.add("resultlist");
			}
			// Get games info
			let wins = [0, 0];
			for (const game of games) {
				const result = document.createElement("li");
				result.classList = "result";
				const gameLink = document.createElement("a");
				const dateSpan = document.createElement("span");
				dateSpan.classList.add("resultDate");
				let dateText = ""
				if (showDates) {
					if (isToday(day)) {
						dateText = `${game.startDate.substring(11)}–${game.endDate.substring(11)}`;
					} else if (day || (game.startDate.substring(0,10) == game.endDate.substring(0,10))) {
						dateText = `${game.startDate}–${game.endDate.substring(11)}`;
					} else {
						dateText = `${game.startDate}–${game.endDate}`;
					}
					dateSpan.innerText = `${dateText} `;
					result.appendChild(dateSpan);
				}
				gameLink.classList = "bga-link";
				if (game.progress) {
					gameLink.innerHTML = `${game.progress}%`;
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
					result.appendChild(document.createTextNode(game.flags));
				}
				duelGameList.appendChild(result);
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
			duelLink.href = games_data.players_url;
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
			duel.appendChild(duelGameList);
			gameList.appendChild(duel);
		}
	}
	return true;
}

let dragEl;
let dragHandleEl
const lastPosition = {};

setupDraggable();

function setupDraggable(){
	dragHandleEl = document.querySelector("[data-drag-handle]");
	dragHandleEl.addEventListener("mousedown", dragStart);
	dragHandleEl.addEventListener("mouseup", dragEnd);
	dragHandleEl.addEventListener("mouseout", dragEnd);
}

function dragStart(event){
	dragEl = getDraggableAncestor(event.target);
	dragEl.style.setProperty("position","absolute");
	lastPosition.left = event.target.clientX;
	lastPosition.top = event.target.clientY;
	dragHandleEl.classList.add("dragging");
	dragHandleEl.addEventListener("mousemove", dragMove);
}

function dragMove(event){
	const dragElRect = dragEl.getBoundingClientRect();
	const newLeft = dragElRect.left + event.clientX - lastPosition.left;
	const newTop = dragElRect.top + event.clientY - lastPosition.top;
	dragEl.style.setProperty("left", `${newLeft}px`);
	dragEl.style.setProperty("top", `${newTop}px`);
	lastPosition.left = event.clientX;
	lastPosition.top = event.clientY;
	window.getSelection().removeAllRanges();
}

function getDraggableAncestor(element){
	if (element.getAttribute("data-draggable")) return element;
	return getDraggableAncestor(element.parentElement);
}

function dragEnd(){
	dragHandleEl.classList.remove("dragging");
	dragHandleEl.removeEventListener("mousemove",dragMove);
	dragEl = null;
	saveBoxLayoutToLocalStorage();
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
	console.debug(el);
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
