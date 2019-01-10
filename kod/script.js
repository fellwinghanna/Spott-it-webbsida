
var playlistId;
var qtyOfTeams;

let teams = [];

/* 
Sparar url:en som skickats och antalet lag som angivits i variablerna playlistID och qtyOfTeams.
Kör funktionen showTeamInput och döljer formuläret #startQuiz samtidigt som inputfälten #enter-team-name blir synliga
*/
$("#submit-playlist").click(function(){
    var playlistId = $("#playlist-url").val();
    var qtyOfTeams = $("#nr-of-teams").val();
    console.log(playlistId, qtyOfTeams);

    showTeamInput(qtyOfTeams);
    $("#startQuiz").hide();
    $("#enter-team-name").show();
    $("#start-game").show();

});

/*
Skapar diven som håller i inputfälten för lagnamnen, lika många som angivit i qtyOfTeams
*/
function showTeamInput(qtyOfTeams){
    for(var i=1;i<parseInt(qtyOfTeams)+1;i++){
        var div = document.createElement("div");
        div.id = "team"+i;
        div.className = "teamInputs";
        document.getElementById("enter-team-name").appendChild(div);

        $("#"+div.id).html("<label for='team-name'>Lag namn "+i+":</label> <input type='text' id='team-name"+i+"' class='team-name' placeholder='Ert roliga lagnamn'>");
    }

}

/*
I "Enter-team-name" sidan
Visar eller döljer "Starta spelet"-button. Dold sålänge alla fält inte är ifyllda
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
  

// skrier ut i konsollen: .team-nameindex: angivet lagnamn 
// skapar ett lag med lagnamn och initialt 0 poäng
$("#start-game").click(function(){
    value = $(this).val()
    $(".team-name").each(function(index, element){
        value = $(element).val();

        team = [
            teamName = value,
            points = 0,
            id = index
        ]
        teams.push(team)
        console.log("team-name" + index + ':' + value);        
    });

    $("#enter-team-name").hide();
    $("#start-game").hide();

});


function displayScoreboard(teams){
    for(var i=1;i<parseInt(qtyOfTeams)+1;i++){
        var div = document.createElement("div");
        div.id = "teamScore"+i;
        div.className = "teams-scores";
        document.getElementById("scoreboard").appendChild(div);

        $("#"+div.id).html("");
    }
}

