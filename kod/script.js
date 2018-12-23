/*
var playlistId;
var qtyOfTeams;
*/
let teams = [];
let playlist = [];
let qtyOfTeams = 0;

/* 
Sparar url:en som skickats och antalet lag som angivits i variablerna playlistID och qtyOfTeams.
Kör funktionen showTeamInput och döljer formuläret #startQuiz samtidigt som inputfälten #enter-team-name blir synliga
*/
$("#submit-playlist").click(function(){
    var playlistId = $("#playlist-url").val();
    qtyOfTeams = $("#nr-of-teams").val();
    console.log(playlistId, qtyOfTeams);

    showTeamInput(qtyOfTeams);
    $("#startQuiz").hide();
    $("#enter-team-name").show();

    /*
    $.get("http://deepbet.se:8010/spottit-api/api/v1/playlist?id="+playlistId, function(data, status){
        playlist = data;
      });
    */
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

        $("#"+div.id).html("<label for='team-name'>Lag namn "+i+":</label> <input type='text' id='team-name"+i+"' class='team-name team-name-required' placeholder='Ert roliga lagnamn'>");
    }
}

/*
Visar eller döljer "Starta spelet-knappen" om inte alla fält är korrekt ifyllda
*/

$(document).on('change keyup', '.team-name-required', function(e){
    let disabled = true;
     $(".team-name-required").each(function() {
       let value = this.value
       if ((value)&&(value.trim() !=''))
           {
             disabled = false
           }else{
             disabled = true
             return false
           }
     });
 
    if(disabled){
        $("#start-game-div").hide();
    }else{
        $("#start-game-div").show();
    }
})


/*
När man trycker på start så skapas alla lagobjekten och pushas till teams-arrayen.
Döljer även denna sektionen och visar istället "games-full-div"
*/
$("#start-game").click(function(){
    var numItems = $('.team-name').length;
    for(var i = 1; i <= numItems; i++){
        var teamName = $("#team-name"+i).val();
        team = {
            teamId: i,
            teamName: teamName,
            points:     0,
            stuff: ""
        };
        teams.push(team);
    }
    $("#name-section").hide();
    createTeamDivs();    
    $("#game-full-div").show();
 
})

function createTeamDivs(){
    for(var i = 0; i < qtyOfTeams; i++){
        let colWidth = Math.floor(12/qtyOfTeams);
        let div = document.createElement("div");
        div.id = "team-"+(i+1)+"-score";
        div.className = "team-score col-sm";
        document.getElementById("game-teams-div").appendChild(div);
        let teamId = teams[i].teamId;
        div.addEventListener("click", function(){ 
            updateScore(teamId); 
        });

        $("#"+div.id).html(
            "<ul><li>"+teams[i].teamName+"</li><li><div id='team-"+(i+1)+"-points'>"+teams[i].points+"</div></li></ul>");
        


    }
}



function updateScore(teamId) {
    console.log ("lag", teamId);
    for(let i = 0; i < teams.length; i++){
        if(teams[i].teamId === teamId){
            teams[i].points++;
            var pointsDiv = document.getElementById("team-"+teamId+"-points");
            pointsDiv.innerHTML = teams[i].points;
        }
    }
  }