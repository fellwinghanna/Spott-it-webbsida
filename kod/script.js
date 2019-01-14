/*
var playlistId;
var qtyOfTeams;
*/

let teams = [];
let playlist = [];
let qtyOfTeams = 0;
let accessToken = "";
let previousApiSong;
let currentApiSong;
let nextApiSong;
let hintLevel = 0;
let volume = 0;
let volumeSetByWebsite = 0;
let synth = window.speechSynthesis;
let teamColors = ["red", "green", "blue", "yellow", "pink"];
let playOnSpotify = 1;
let songRound = 0;
let roundTimer = 30;
let interval;

$(document).ready(function() {
  var hashToken = window.location.hash;
  var start = hashToken.indexOf("=");
  var end = hashToken.indexOf("&token");

  accessToken = hashToken.substring(start + 1, end);

  display = document.querySelector("#time");
});

/* 
Sparar url:en som skickats och antalet lag som angivits i variablerna playlistID och qtyOfTeams.
Kör funktionen createEnterTeamNameDivs och döljer formuläret #startQuiz samtidigt som inputfälten #enter-team-name blir synliga
*/
$("#submit-playlist").click(function() {
  var playlistId = $("#playlist-url").val();
  if (playlistId.includes("playlist")) {
    var index = playlistId.indexOf("playlist:");
    playlistId = playlistId.substring(index + 9);
  }
  qtyOfTeams = $("#nr-of-teams").val();
  console.log(playlistId, qtyOfTeams);

  createEnterTeamNameDivs(qtyOfTeams);
  $("#startQuiz").hide();
  $("#enter-team-name").show();

  $.get(
    "http://deepbet.se:8010/spottit-api/api/v1/playlist?id=" +
      //"http://192.168.1.2:8010/spottit-api/api/v1/playlist?id=" +
      playlistId +
      "&accessToken=" +
      accessToken,
    function(data, status) {
      playlist = data;
      console.log(status);
    }
  );
});

/*
Skapar diven som håller i inputfälten för lagnamnen, lika många som angivit i qtyOfTeams
*/
function createEnterTeamNameDivs(qtyOfTeams) {
  for (var i = 1; i < parseInt(qtyOfTeams) + 1; i++) {
    var div = document.createElement("div");
    div.id = "team" + i;
    div.className = "teamInputs";
    document.getElementById("enter-team-name").appendChild(div);

    $("#" + div.id).html(
      "<div id='team-shield" +
        i +
        "' class='fas fa-microphone-alt' style='font-size:64px;color:" +
        teamColors[i - 1] +
        "'></div><label for='team-name'>Lag namn " +
        i +
        ":</label> <input type='text' id='team-name" +
        i +
        "' class='team-name team-name-required' pattern='.{2,10}' placeholder='Ert roliga lagnamn'>"
    );
  }
}

/*
När man trycker på start så skapas alla lagobjekten och pushas till teams-arrayen.
Döljer även denna sektionen och visar istället "games-full-div"
*/
$("#start-game").click(function() {
  var numItems = $(".team-name").length;
  for (var i = 1; i <= numItems; i++) {
    var teamName = $("#team-name" + i).val();
    let roundPoints = [];
    team = {
      teamId: i,
      teamName: teamName,
      points: 0,
      stuff: "",
      teamColor: teamColors[i - 1],
      roundPoints: roundPoints
    };
    teams.push(team);
  }
  $("#name-container").hide();
  createTeamDivs();
  //startFirstRound();
  $(".game").show();
  $("#game-teams-div").show();
  $("#game-controller").show();
  $.when(getSpotifyVolume()).done(function(data) {
    volume = data.device.volume_percent;
  });
  let promise = new Promise(function(resolve, reject) {
    setTimeout(() => doNextSong(), 5000);
  });

  promise.then(doNextSong()).catch(err => console.log("1, Error", err));
});

function createTeamDivs() {
  for (var i = 0; i < qtyOfTeams; i++) {
    let colWidth = Math.floor(12 / qtyOfTeams);
    let div = document.createElement("div");
    div.id = "team-" + (i + 1) + "-score";
    div.className = "team-score col-sm";
    document.getElementById("game-teams-div").appendChild(div);
    let teamId = teams[i].teamId;
    div.addEventListener("click", function() {
      updateScore(teamId, 1);
    });

    $("#" + div.id).html(
      "<i class='fas fa-microphone-alt' style='font-size:76px;color:" +
        teams[i].teamColor +
        "'></i><span id='team-" +
        (i + 1) +
        "-points'>" +
        teams[i].points +
        "</span>"
    );
  }
}

function updateScore(teamId, nbrOfPoints) {
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].teamId === teamId) {
      teams[i].points += nbrOfPoints;
      var pointsDiv = document.getElementById("team-" + teamId + "-points");
      pointsDiv.innerHTML = teams[i].points;
      var scoreboard = document.getElementById(
        "scoreboard-team" + teamId + "points"
      );
      scoreboard.innerHTML = teams[i].points;
    }
  }
}

$("#next-song").click(function() {
  doNextSong();
});

let doNextSong = function() {
  let resolvedTest = true;
  songRound++;
  let asdf = new Promise((resolve, reject) => {
    nextSong()
      .then(data => console.log(data))
      .then(slideAndReset())

      .catch(() => {
        resolvedTest = false;
      });

    if (resolvedTest) {
      resolve(".... do Next Song worked");
    } else {
      reject(Error("do Next Song broke"));
    }
  });
};

let slideAndReset = function() {
  return new Promise((resolve, reject) => {
    $("#game-question-full").hide(
      "slide",
      { direction: "left" },
      "fast",
      function() {
        resetGameDivs();
        hintLevel = 0;
        //startTimer(roundTimer);
        playPreviousSong();
        synth.cancel();
        setSpotifyVolume(volume);
        nextHint();
        $("#game-question-full").show("slide", { direction: "left" }, "slow");
      }
    );
    resolve("testar worked!");
  });
};

let nextSong = function() {
  return new Promise((resolve, reject) => {
    getSongs()
      .then(data => console.log(data))
      .catch(err => console.log(err));
    resolve("nextSong worked!");
  });
};

const getSongs = function() {
  return new Promise((resolve, reject) => {
    if (playlist.songs.length > 0) {
      if (currentApiSong != null) {
        previousApiSong = currentApiSong;
      }
      if (nextApiSong != null) {
        currentApiSong = nextApiSong;
      }
      let next = Math.floor(Math.random() * playlist.songs.length);
      let nextSongToGet = playlist.songs[next];
      playlist.songs.splice(next, 1);

      getApiSong(nextSongToGet)
        .then(data => {
          nextApiSong = data;
          resolve("1, getApiSong worked!");
        })
        .catch(err => {
          reject(Error("1, Error AJAX", err));
          nextSong();
        });
    } else {
      if (nextApiSong != null) {
        currentApiSong = nextApiSong;
        nextApiSong = null;
      } else {
        showResultModal();
        previousApiSong = currentApiSong;
        reject(Error("NO MORE SONGS!"));
      }
    }
  });
};

let getApiSong = function(song) {
  let url =
    //"http://192.168.1.2:8010/spottit-api/api/v1/song?artist=" +
    "http://www.deepbet.se:8010/spottit-api/api/v1/song?artist=" +
    song.artist +
    "&title=" +
    song.songName +
    "&trackUri=" +
    song.trackId +
    "&coverUri=" +
    song.albumCover;
  return $.ajax({
    url: url,
    type: "GET",
    contenttype: "application/json",
    data: {}
  });
};

$("#next-hint").click(function() {
  nextHint();
});

function nextHint() {
  clearInterval(interval);
  switch (hintLevel) {
    case 0:
      $("#game-gifs").show();
      showGifs();

      break;
    case 1:
      resetGameDivs();
      $("#game-header").show();
      newTitle();

      break;
    case 2:
      resetGameDivs();
      $("#game-lyrics-translated").show();
      showTransLyrics();

      break;
    case 3:
      playLyrics();

      break;
    case 4:
      resetGameDivs();
      synth.cancel();
      $("#game-album-cover").show();

      showCover();
      break;
    case 5:
      showScoreBoard();
      break;
    default:
      showGifs();
  }
  startTimer(roundTimer);
  hintLevel++;
}

function newTitle() {
  $("#game-header").html(currentApiSong.newTitle);
}

function playPreviousSong() {
  if (playOnSpotify === 1 && previousApiSong != null) {
    var data = {
      uris: [previousApiSong.trackId],
      offset: {
        position: 0
      },
      position_ms: 0
    };
    $.ajax({
      url: "https://api.spotify.com/v1/me/player/play",
      type: "PUT",
      contenttype: "application/json",
      data: JSON.stringify(data),
      headers: {
        Authorization: "Bearer " + accessToken
      },
      success: function(data) {}
    });
  }
}

let getSpotifyVolume = function() {
  return $.ajax({
    url: "https://api.spotify.com/v1/me/player",
    type: "GET",
    contenttype: "application/json",
    headers: {
      Authorization: "Bearer " + accessToken
    },
    data: {}
  });
};

let setSpotifyVolume = function(volume) {
  return $.ajax({
    url:
      "https://api.spotify.com/v1/me/player/volume?volume_percent=" +
      parseInt(volume),
    type: "PUT",
    contenttype: "application/json",
    headers: {
      Authorization: "Bearer " + accessToken
    },
    data: {}
  });
};

function resetGameDivs() {
  $("#game-gifs").html("");
  $("#game-lyrics-translated").html("");
  $("#game-lyrics-original").html("");
  $("#game-header").html("");
  $("#game-album-cover").html("");
  $("#game-gifs").hide();
  $("#game-lyrics-translated").hide();
  $("#game-lyrics-original").hide();
  $("#game-header").hide();
  $("#game-album-cover").hide();
}

function showGifs() {
  let gifHtml1 = "";

  if (currentApiSong != null) {
    if (currentApiSong.gifs.length > 0) {
      console.log(currentApiSong.gifs);
      let nbrOfGifs = currentApiSong.gifs.length;
      let dynamicWidth = 100 / nbrOfGifs;
      let fixedWidth = 100 / 3;
      let width = Math.max(dynamicWidth, fixedWidth);
      if (nbrOfGifs > 5) {
        nbrOfGifs = 5;
      }
      for (let i = 0; i < nbrOfGifs; i++) {
        if (i % 3 == 0) {
          gifHtml1 += "<br>";
        }
        gifHtml1 +=
          "<img  style='max-width: " +
          width +
          "%; max-height: 35vh;'class='img-fluid img-responsive inline-block' src='" +
          currentApiSong.gifs[i] +
          "'>";
      }
    }
  }

  $("#game-gifs").html(gifHtml1);
}

function showTransLyrics() {
  $("#game-lyrics-translated").html(currentApiSong.translatedLyrics);
}
function showOriginalLyrics() {
  $("#game-lyrics-original").html(currentApiSong.originalLyrics);
}

function playLyrics() {
  $.when(getSpotifyVolume()).done(function(data) {
    volume = data.device.volume_percent;
    setSpotifyVolume(volume / 2);
  });
  let msg = new SpeechSynthesisUtterance(currentApiSong.originalLyrics);
  synth.speak(msg);
  msg.onend = function(event) {
    setSpotifyVolume(volume);
  };
}

function drawCurrentSong() {}

/*
  Hjälpfunctioner
  */
function showCover() {
  let cover = "";

  if (currentApiSong != null) {
    cover += "<img src='" + currentApiSong.albumCoverUrl + "'>";
  }

  $("#game-album-cover").html(cover);
}
/*
Eventlisteners
  */
$(document).ready(function() {
  $(".switch :checkbox").change(function() {
    if (this.checked) {
      playOnSpotify = 1;
    } else {
      playOnSpotify = 0;
    }
  });

  let slide = document.getElementById("volume");
  let sliderDiv = document.getElementById("volumeAmount");

  $("#volumeSlider").change(function() {
    $("#volumeAmount").html(this.value);
    volume = this.value;
    setSpotifyVolume(this.value);
  });
});

/*
In "Enter-team-name" page
Shows or hides the "Starta spelet"-button if not all fields are correctly filled
*/
$(document).on("change keyup", ".team-name-required", function(e) {
  let disabled = true;
  $(".team-name-required").each(function() {
    let value = this.value;
    if (value && value.trim() != "") {
      disabled = false;
    } else {
      disabled = true;
      return false;
    }
  });

  if (disabled) {
    $("#start-game-div").hide();
  } else {
    $("#start-game-div").show();
  }
});

function showScoreBoard() {
  // When the user clicks the button, open the modal
  let points;
  let addPoints = [];
  modalScore.style.display = "block";
  let scoreTable =
    "<div class='table-responsive'>" +
    "<table class='table' id='score-table'>" +
    "<tr>" +
    "<th> </th>" +
    "<th>Lagnamn</th>" +
    "<th>Poäng</th>" +
    "<th>Giphy</th>" +
    "<th>Synonymer</th>" +
    "<th>Översättning</th>" +
    "<th>Uppläsning</th>" +
    "<th>Skivomslag</th>" +
    "<th></th>" +
    "<th>Minus</th>" +
    "</tr>";
  for (let i = 0; i < teams.length; i++) {
    for (let pointsToAdd = -1; pointsToAdd <= 5; pointsToAdd++) {
      let pointsButton = document.createElement("button");
      var color = 1 - pointsToAdd / 7;
      pointsButton.style.backgroundColor = getColor(color);
      pointsButton.id =
        "button-team-" + teams[i].teamId + "-points-" + pointsToAdd;
      pointsButton.innerText = pointsToAdd;
      pointsButton.style.width = "100%";
      pointsButton.className = "btn";
      let pointsObject = {
        teamId: teams[i].teamId,
        button: pointsButton,
        nbrOfPoints: pointsToAdd
      };
      addPoints.push(pointsObject);
    }

    scoreTable +=
      "<tr>" +
      "<td> </td>" +
      "<td>" +
      teams[i].teamName +
      "</td>" +
      "<td id='scoreboard-team" +
      teams[i].teamId +
      "points'>" +
      teams[i].points +
      "</td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points-5'></td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points-4'></td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points-3'></td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points-2'></td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points-1'></td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points-0'></td>" +
      "<td id='td-team-" +
      teams[i].teamId +
      "-points--1'></td>" +
      "</tr>" +
      "</div>";
  }
  scoreTable += "</table>";
  console.log(scoreTable);

  $("#score-board-modal").html(scoreTable);
  for (let i = 0; i < addPoints.length; i++) {
    document
      .getElementById(
        "td-team-" + addPoints[i].teamId + "-points-" + addPoints[i].nbrOfPoints
      )
      .appendChild(addPoints[i].button);

    addPoints[i].button.addEventListener("click", function() {
      updateScore(addPoints[i].teamId, addPoints[i].nbrOfPoints);
    });
  }

  $("#modal-answer").text(
    currentApiSong.artist + " - " + currentApiSong.songName
  );
}
var modalScore = document.getElementById("modalScore");
var modalResult = document.getElementById("modalResult");
// Get the <span> element that closes the modal

var confirmPoints = document.getElementById("cofirm-button");
var restart = document.getElementById("restart-button");
// When the user clicks on <span> (x), close the modal

confirmPoints.onclick = function() {
  modalScore.style.display = "none";
  console.log("Points Confirmed");
  for (let i = 0; i < teams.length; i++) {
    teams[i].roundPoints.push(teams[i].points);
  }
  doNextSong();
};

restart.onclick = function() {
  window.location.href = "http://deepbet.se/Spotify-redirect/";
};

function getColor(value) {
  //value from 0 to 1
  var hue = ((1 - value) * 120).toString(10);
  return ["hsl(", hue, ",100%,50%)"].join("");
}

function startTimer(duration) {
  if (songRound > 0 && hintLevel < 6) {
    var timer = duration;
    let display = document.querySelector("#time");

    interval = setInterval(function() {
      display.innerHTML = --timer;

      if (timer == 0) {
        clearInterval(interval);
        nextHint();
      }
    }, 1000);
  }
}

function showResultModal() {
  let winnerPoints = 0;
  let winners = [];
  let loserPoints = 9999;
  let losers = [];
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].points > winnerPoints) {
      winnerPoints = teams[i].points;
      winners = [];
      winners.push(teams[i].teamName);
    } else if (teams[i].points == winnerPoints) {
      winners.push(teams[i].teamName);
    } else if (teams[i].points < loserPoints) {
      loserPoints = teams[i].points;
      losers = [];
      losers.push(teams[i].teamName);
    } else if (teams[i].points == loserPoints) {
      losers.push(teams[i].teamName);
    }
  }
  modalResult.style.display = "block";
  let winnersHtml = "Bäst: ";
  for (let i = 0; i < winners.length; i++) {
    winnersHtml += "" + winners[i] + " ";
  }
  let loserHtml = "Sämst: ";
  for (let i = 0; i < losers.length; i++) {
    loserHtml += "" + losers[i] + " ";
  }
  loserHtml += " HAHA LOOOSERS!";

  $("#result-winner").text(winnersHtml);
  $("#result-loser").text(loserHtml);
  console.log(winners);
  console.log(losers);
}
