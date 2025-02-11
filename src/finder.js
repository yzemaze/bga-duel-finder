/**
 * BGA Duel Finder.
 *
 * Script to find duels from a list of players.
 *
 * Usage:
 *  1. Copy and paste this code to the developer console
 *     (or put it as a bookmarklet https://caiorss.github.io/bookmarklet-maker/)
 *  2. Pick game, date, and introduce duel list. For example:
 *        Game: Carcassonne
 *        Date: 08/04/2024
 *        Duel list:
 *          estroncio - 71st
 *          texe1 - TheCreep74
 *          2020Rafa - DexterLogan
 *          MadCan - isloun
 *          Loku_elo - Tarakanov28
 *          oscaridis - Annenmay
 *          thePOC - Glinka
 *
 *  3. Click 'Find Games'.
 */

(function() {
'use strict';

const REQUEST_INTERVAL = 250;     // 250ms between requests, give BGA a break
const CACHE_DURATION = 604800000; // One week in milliseconds

let style = document.createElement('style');
style.innerHTML = `
  #bgaDuelFinderUi {
  	position: fixed;
  	left: -16px;
  	bottom: -16px;
  	margin: 1em 1em;
  	min-width: 250px;
  	max-height: 750px;
  	padding: 10px;
  	background: #f0f0f0;
  	box-shadow: 0 3px 8px rgba(0,0,0,.3);
  	z-index: 10000;
  }
  #finderDuelListTxt {
  	display: block;
		width: 100%;
		height: 310px;
  }
  #buttonDiv {
	 	display: flex;
	 	justify-content: space-between;
		margin-top: 1em;
  }
  #findButton, #backButton, #closeButton, #reloadButton {
		margin: 0;
	}
	#backButton, #reloadButton {
		display: none;
	}
	#gameList {
		height: 100%;
		max-height: 700px;
		overflow-y: auto;
	}
	#gameList > h3.duelHeader:first-child {
		margin-top: 0px;
	}
	h3.duelHeader {
		display: flex;
		justify-content: space-between;
		margin-bottom: 2px;
		font-weight: normal;
	}
	h3.duelHeader > a {
		text-decoration: none;
	}
	ol.resultlist > li {
		display: inline;
	}
	ol.resultlist > li:not(:last-child)::after {
		content: " • ";
		color: #888;
	}
	li.result {
		font-size: 0.8em;
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
  const uiId = "bgaDuelFinderUi";
  let ui = document.getElementById(uiId);
  if (ui) {
    ui.style.display = "block";
    return;
  }

  ui = document.createElement("div");
  ui.id = uiId;

  const dateDiv = document.createElement("div");
  dateDiv.id = "dateDiv";
  const datePicker = document.createElement("input");
  datePicker.id = "finderDatePicker";
  datePicker.type = "date";
  datePicker.valueAsDate = new Date();
  const datePickerLabel = document.createElement("label");
  datePickerLabel.htmlFor = "finderDatePicker";
  datePickerLabel.textContent = "Date: ";
  dateDiv.appendChild(datePickerLabel);
  dateDiv.appendChild(datePicker);

  const textArea = document.createElement("textArea");
  textArea.id = "finderDuelListTxt";
  const textAreaLabel = document.createElement("label");
  textAreaLabel.htmlFor = "finderDuelListTxt";
  textAreaLabel.textContent = "Duels: ";

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

	ui.appendChild(dateDiv);
  ui.appendChild(textAreaLabel);
  ui.appendChild(textArea);
  ui.appendChild(buttonDiv);

  document.body.appendChild(ui);
  let duelsDiv;

  textArea.addEventListener("paste", (event) => {
    // Just check if pasted text was in the form of:
    //
    //   player1
    //   vs
    //   player2
    //   player3
    //   vs
    //   player4
    //   ...
    //
    // and fixed the text.
    const pastedData = (event.clipboardData || window.clipboardData).getData('text');
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
    const transformedText = pairs.join('\n');

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
    duelsDiv = await getAllDuels(duelsText, unixTimestamp, game_id);

    textArea.disabled = false;
    findButton.disabled = false;
    dateDiv.style.display = "none";
    textArea.style.display = "none";
    textAreaLabel.style.display = "none";
    ui.insertBefore(duelsDiv, buttonDiv);
    findButton.style.display = "none";
    closeButton.style.display = "none";
    backButton.style.display = "block";
    reloadButton.style.display = "block";
  };

  backButton.onclick = function () {
    textArea.style.display = "block";
    textAreaLabel.style.display = "block";
    dateDiv.style.display = "block";
    ui.removeChild(duelsDiv);
    findButton.style.display = "block";
    closeButton.style.display = "block";
    backButton.style.display = "none";
    reloadButton.style.display = "none";
  };

  closeButton.onclick = function () {
    ui.style.display = "none";
  }

  reloadButton.onclick = async function () {
  	const game_id = 1; // Carcassonne
    const date = new Date(datePicker.value);
    const unixTimestamp = Math.floor(date.getTime() / 1000);
  	const duelsText = textArea.value;
  	document.getElementById("gameList").remove();
	  duelsDiv = await getAllDuels(duelsText, unixTimestamp, game_id);
	  ui.insertBefore(duelsDiv, buttonDiv);
  }
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
      url: 'https://boardgamearena.com/player/player/findplayer.html',
      content: { q: name, start: 0, count: Infinity },
      sync: true,
      handleAs: 'json'
    });

    for (const currentUser of response.results[0].items) {
      if (currentUser.q.toLowerCase() === name.toLowerCase()) {
        console.debug(`Found id ${currentUser.id} for ${name}`);
        localStorage.setItem(cacheKey, JSON.stringify({ id: currentUser.id, timestamp: currentTime }));
        return currentUser.id;
      }
    }
    console.error(`Couldn't find user ${name}`);
    throw "Player not found";
  }
  catch (error) {
    console.error(`Couldn't find user ${name}`);
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
      url: 'https://boardgamearena.com/gamestats/gamestats/getGames.html',
      content: params,
      handleAs: 'json',
      headers: { 'X-Request-Token': bgaConfig.requestToken },
      sync: true
    });
    for (const table of response.results[0].data.tables) {
      const table_url = `https://boardgamearena.com/table?table=${table.table_id}`;
      const table_players = table.players.split(",");
      const table_scores = table.scores ? table.scores.split(",") : ["?", "?"];
      const table_ranks = table.ranks ? table.ranks.split(",") : ["?", "?"];
      const table_date = new Date(table.start * 1000);
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
        date: table_date.toISOString().substr(0, 16).replace("T", " "),
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
          date: (new Date(table.gamestart * 1000)).toISOString().substr(0, 16).replace("T", " ")
        });
      }
    }
    console.debug(`Got ${tables.length} tables`);

    return { player0_id, player1_id, players_url, tables };
  }
  catch (error) {
    console.error(`Couldnt get games for ${player0} - ${player1}: ${error}`);
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
    handleAs: 'json',
    headers: { 'X-Request-Token': bgaConfig.requestToken }
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
  const gameListDiv = document.createElement('div');
  gameListDiv.id = "gameList";
  const duels_txt = all_duels_txt.split("\n");
  const vsRegex = new RegExp(" vs ", 'i');

  for (const duel_txt of duels_txt) {
    if (!duel_txt) {
      continue;
    }

    let players = duel_txt.split(" - ");
    if (players.length !== 2) {
      players = duel_txt.split(vsRegex);
    }
    if (players.length !== 2) {
      players = duel_txt.split("-");
    }
    if (players.length !== 2) {
      console.error(`Couldn't get players for "${duel_txt}"`);
      continue;
    }

    players = [players[0].trim(), players[1].trim()];

    await sleep(REQUEST_INTERVAL);
    const games_data = await getGames(players[0], players[1], day, game_id);
    const games = games_data.tables;

    const duelGameList = document.createElement("ol");
  	if (isToday(day)) {
    	duelGameList.classList.add("resultlist");
    }
    // Get games info
    let wins = [0, 0];
    for (const game of games) {
      const liItem = document.createElement('li');
      liItem.classList = "result";
      const gameLink = document.createElement('a');
      // liItem.innerText = day ? `${game.date.substring(11)}: ` : `${game.date}: `;
      liItem.innerText = isToday(day) ? `` : `${game.date}: `;
      gameLink.classList = "bga-link";
      if (game.progress) {
				gameLink.innerHTML = `${game.progress}%`;
			} else {
				const span0 = document.createElement("span");
				const span1 = document.createElement("span");
				span0.innerText = game.score0;
				span1.innerText = game.score1;
				if (game.rank0 == 1) {
					span0.classList = "win";
					wins[0]++;
				} else  {
					span1.classList = "win";
					wins[1]++;
				}
				gameLink.appendChild(span0);
				gameLink.appendChild(document.createTextNode("-"));
				gameLink.appendChild(span1);
			}
      gameLink.href = game.url;
      liItem.appendChild(gameLink);
      if (game.flags) {
      	liItem.appendChild(document.createTextNode(game.flags));
      }
      duelGameList.appendChild(liItem);
    }
    const duelHeader = document.createElement("h3");
    duelHeader.classList = "duelHeader";

    const duelLink = document.createElement("a");
    const duelLink0 = document.createElement("span");
    const duelLink1 = document.createElement("span");
    duelLink.appendChild(duelLink0);
		duelLink.appendChild(document.createTextNode(" - "));
		duelLink.appendChild(duelLink1);
    duelLink.href = games_data.players_url;
    duelLink0.innerText = players[0];
    duelLink1.innerText = players[1];

		const duelScore = document.createElement("span");
		const duelScore0 = document.createElement("span");
		const duelScore1 = document.createElement("span");
		duelScore.appendChild(duelScore0);
		duelScore.appendChild(document.createTextNode("-"));
		duelScore.appendChild(duelScore1);
		duelScore0.innerText = wins[0];
		duelScore1.innerText = wins[1];

		if (wins[0] > wins[1]) {
			duelLink0.classList = "win";
			duelScore0.classList = "win";
		} else if (wins[0] < wins[1]) {
			duelLink1.classList = "win";
			duelScore1.classList = "win";
		}
    duelHeader.appendChild(duelLink);
		duelHeader.appendChild(duelScore);
    gameListDiv.appendChild(duelHeader);
    gameListDiv.appendChild(duelGameList);
  }
  return gameListDiv;
}

})();
