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

$(document).ready(function() {
  var hashToken = window.location.hash;
  var start = hashToken.indexOf("=");
  var end = hashToken.indexOf("&token");
  accessToken = hashToken.substring(start + 1, end);
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
        "' class='fas fa-shield-alt'style='font-size:64px;color:" +
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
    team = {
      teamId: i,
      teamName: teamName,
      points: 0,
      stuff: "",
      teamColor: teamColors[i - 1]
    };
    teams.push(team);
  }
  $("#name-section").hide();
  createTeamDivs();
  //startFirstRound();
  $("#game-full-div").show();
  $("#game-teams-div").show();
  $("#game-controller").show();
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
      "<i class='fas fa-shield-alt'style='font-size:96px;color:" +
        teams[i].teamColor +
        "'></i><span id='team-" +
        (i + 1) +
        "-points'>" +
        teams[i].points +
        "</span>"
    );
  }
}

function updateScore(teamId) {
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
  $.when(nextSong()).done(function(data) {
    $("#game-question-full").hide(
      "slide",
      { direction: "left" },
      "fast",
      function() {
        resetGameDivs();
        hintLevel = 0;
        drawCurrentSong();
        playPreviousSong();
        synth.cancel();
        setSpotifyVolume(volume);
        nextHint();
        $("#game-question-full").show("slide", { direction: "left" }, "slow");
      }
    );
  });
});

$("#next-hint").click(function() {
  nextHint();
});

function nextHint() {
  switch (hintLevel) {
    case 0:
      showGifs();
      break;
    case 1:
      showTransLyrics();
      break;
    case 2:
      newTitle();
      break;
    case 3:
      showOriginalLyrics();
      break;
    case 4:
      playLyrics();
      break;
    default:
      showGifs();
  }
  hintLevel++;
  if (hintLevel > 4) {
    hintLevel = 0;
  }
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
}

function showGifs() {
  let gifHtml1 = "";
  let gifHtml2 = "";

  if (currentApiSong != null) {
    if (currentApiSong.gifs.length > 0) {
      let nbrOfGifs = currentApiSong.gifs.length;
      for (let i = 0; i < parseInt(nbrOfGifs / 2); i++) {
        gifHtml1 += "<img src='" + currentApiSong.gifs[i] + "'>";
      }

      for (
        let i = parseInt(nbrOfGifs / 2);
        i < currentApiSong.gifs.length;
        i++
      ) {
        gifHtml2 += "<img src='" + currentApiSong.gifs[i] + "'>";
      }
    }
  }
  $("#game-gifs1").html(gifHtml1);
  $("#game-gifs2").html(gifHtml2);
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

let nextSong = function() {
  if (playlist.songs.length > 0) {
    if (currentApiSong != null) {
      previousApiSong = currentApiSong;
    }
    if (nextApiSong != null) {
      currentApiSong = nextApiSong;
    }
    let next = Math.floor(Math.random() * playlist.songs.length);
    let nextSong = playlist.songs[next];
    playlist.songs.splice(next, 1);

    $.when(getApiSong(nextSong)).done(function(data) {
      nextApiSong = data;
    });
  } else {
    if (nextApiSong != null) {
      currentApiSong = nextApiSong;
      nextApiSong = null;
    } else {
      console.log("NO MORE SONGS!");
    }
  }
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

/*
  Hjälpfunctioner
  */

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
