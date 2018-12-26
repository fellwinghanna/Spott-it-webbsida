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
let synth = window.speechSynthesis;
let colors = ["red","green","blue","yellow", "pink" ];

$(document).ready(function() {
  var hashToken = window.location.hash;
  var start = hashToken.indexOf("=");
  var end = hashToken.indexOf("&token");
  accessToken = hashToken.substring(start + 1, end);
  console.log(accessToken);
});

/* 
Sparar url:en som skickats och antalet lag som angivits i variablerna playlistID och qtyOfTeams.
Kör funktionen showTeamInput och döljer formuläret #startQuiz samtidigt som inputfälten #enter-team-name blir synliga
*/
$("#submit-playlist").click(function() {
  var playlistId = $("#playlist-url").val();
  if (playlistId.includes("playlist")) {
    var index = playlistId.indexOf("playlist:");
    playlistId = playlistId.substring(index + 9);
  }
  qtyOfTeams = $("#nr-of-teams").val();
  console.log(playlistId, qtyOfTeams);

  showTeamInput(qtyOfTeams);
  $("#startQuiz").hide();
  $("#enter-team-name").show();

  $.get(
    "http://deepbet.se:8010/spottit-api/api/v1/playlist?id=" +
      playlistId +
      "&accessToken=" +
      accessToken,
    function(data, status) {
      playlist = data;
    }
  );
});

/*
Skapar diven som håller i inputfälten för lagnamnen, lika många som angivit i qtyOfTeams
*/
function showTeamInput(qtyOfTeams) {

  for (var i = 1; i < parseInt(qtyOfTeams) + 1; i++) {
    var div = document.createElement("div");
    div.id = "team" + i;
    div.className = "teamInputs";
    document.getElementById("enter-team-name").appendChild(div);

    $("#" + div.id).html(

      "<div id='team-shield" +
      i +
      "' class='fas fa-shield-alt'style='font-size:64px;color:"+colors[i-1]+"'></div><label for='team-name'>Lag namn " +
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
    let teamColor = $("#team-shield" + i).get(0);
    console.log(teamColor);
    team = {
      teamId: i,
      teamName: teamName,
      points: 0,
      stuff: "",
      teamColor: colors[i-1] 
    };
    teams.push(team);
  }
  $("#name-section").hide();
  createTeamDivs();
  //startFirstRound();
  $("#game-full-div").show();
  $.when(getSpotifyVolume()).done(function(data) {
    volume = data.device.volume_percent;
  });
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
      updateScore(teamId);
    });

    $("#" + div.id).html(
      "<i class='fas fa-shield-alt'style='font-size:96px;color:"+teams[i].teamColor+"'></i><span id='team-" +
        (i + 1) +
        "-points'>" +
        teams[i].points +
        "</span>"
    );
  }
}

function updateScore(teamId) {
  console.log("lag", teamId);
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].teamId === teamId) {
      teams[i].points++;
      var pointsDiv = document.getElementById("team-" + teamId + "-points");
      pointsDiv.innerHTML = teams[i].points;
    }
  }
}

function startFirstRound() {
  let current = Math.floor(Math.random() * playlist.songs.length);
  let currentSong = playlist.songs[current];
  playlist.songs.splice(current, 1);

  let next = Math.floor(Math.random() * playlist.songs.length);
  let nextSong = playlist.songs[next];
  playlist.songs.splice(next, 1);

  $.when(getApiSong(currentSong)).done(function(data) {
    currentApiSong = data;
  });
  $.when(getApiSong(nextSong)).done(function(data) {
    nextApiSong = data;
  });
}

$("#next-song").click(function() {
  nextSong();
  resetGameDivs();
  hintLevel = 0;
  drawCurrentSong();
  playPreviousSong();
  synth.cancel();
  setSpotifyVolume(volume);
});

$("#next-hint").click(function() {
  console.log(hintLevel);
  switch (hintLevel) {
    case 0:
      showGifs();
      break;
    case 1:
      showTransLyrics();
      break;
    case 2:
      playLyrics();
      break;
    case 3:
      playLyrics();
      break;
    case 4:
      showOriginalLyrics();
      break;
    default:
      showGifs();
  }
  hintLevel++;
  if (hintLevel > 4) {
    hintLevel = 0;
  }
});

function playPreviousSong() {
  console.log(
    "Now playing " + previousApiSong.artist + " - " + previousApiSong.songName
  );
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
  $("#game-lyrics").html("");
}

function showGifs() {
  let gifHtml = "";
  for (let i = 0; i < currentApiSong.gifs.length; i++) {
    gifHtml += "<br><img src='" + currentApiSong.gifs[i] + "'>";
  }
  $("#game-gifs").html(gifHtml);
}

function showTransLyrics() {
  $("#game-lyrics").html(currentApiSong.translatedLyrics);
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

function nextSong() {
  previousApiSong = currentApiSong;
  currentApiSong = nextApiSong;
  let next = Math.floor(Math.random() * playlist.songs.length);
  let nextSong = playlist.songs[next];
  playlist.songs.splice(next, 1);

  $.when(getApiSong(nextSong)).done(function(data) {
    nextApiSong = data;
  });
}

let getApiSong = function(song) {
  let url =
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


/*
Visar eller döljer "Starta spelet-knappen" om inte alla fält är korrekt ifyllda
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
  

  /*
  Hjälpfunctioner
  */

