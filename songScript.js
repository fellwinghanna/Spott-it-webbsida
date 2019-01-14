async function doNextSong() {
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
    return 1;
  });
  console.log("doNextSong done");
  return 2;
}
