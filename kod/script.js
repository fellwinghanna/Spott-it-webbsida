/*
var playlistId;
var qtyOfTeams;
*/


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
FUNGERAR EJ. Varje lagnamn som angivits i respektive fält i diven .team-name ska sparas i variabler...
*/
/*
$("#start-game").click(function(){
    $(".team-name").each(function(value){
        console.log(".team-name" + ':' + $(this).attr('id'));
        // alternativt text() istället?
        
    });
})
*/


// testade olika men får inget utskrivet värde i konsollen
// endast " .team-name0: " osv
$("#start-game").click(function(){
    $(".team-name").each(function(index, value){
        console.log(".team-name" + index + ':' + $(value).text());
        /* alternativt text istället? */
        
    });
})



