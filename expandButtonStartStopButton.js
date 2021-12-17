for (let i = 0; i < numberOfQueries; i++) {
    let lockName = "#query" + (i+1).toString() + "EpsilonLock";
    $(lockName).attr("disabled", true);
}

$("#responsiveCheckbox").click(function(e){
    if($("#responsiveCheckbox").is(":checked") == true){
        for (let i = 0; i < numberOfQueries; i++) {
            let lockName = "#query" + (i+1).toString() + "EpsilonLock";
            $(lockName).attr("disabled", false);
        }
    } else {
        for (let i = 0; i < numberOfQueries; i++) {
            let lockName = "#query" + (i+1).toString() + "EpsilonLock";
            $(lockName).attr("disabled", true);
        }
    }
});

function lock1() {
    if($("#query1EpsilonLock").attr('checked')){
        query1Info.locked = true;
    } else {
        query1Info.locked = false;
    }
  }

function lock2() {
    if($("#query2EpsilonLock").attr('checked')){
        query2Info.locked = true;
    } else {
        query2Info.locked = false;
    }
}

function lock3() {
    if($("#query3EpsilonLock").attr('checked')){
        query3Info.locked = true;
    } else {
        query3Info.locked = false;
    }
}

function lock4() {
    if($("#query4EpsilonLock").attr('checked')){
        query4Info.locked = true;
    } else {
        query4Info.locked = false;
    }
}


$('#query1ExpandQueryButton').click(function(e){

    $("#query1ButtonIcon").toggleClass("fa-window-minimize");

    $('#query1Card').toggleClass('fullscreen'); 

    if (document.querySelector("#query1Card").classList.contains("fullscreen")) {
        var selection = d3.select("#query1");
        selection.selectAll("svg").remove();

        query1Info.expanded = true;
        generateExpandedQueryVis(query1Info);

    } else {
        query1Info.expanded = false;

        for (let i = 0; i < numberOfQueries; i++) {
            let queryDiv = "#query" + (i+1).toString();
            d3.select(queryDiv).selectAll("svg").remove();
            resetQueryVis(window["query" + (i+1).toString() + "Info"]);
        }
    }
});

$('#query2ExpandQueryButton').click(function(e){

    $("#query2ButtonIcon").toggleClass("fa-window-minimize");

    $('#query2Card').toggleClass('fullscreen'); 

    if (document.querySelector("#query2Card").classList.contains("fullscreen")) {
        var selection = d3.select("#query2");
        selection.selectAll("svg").remove();
        query2Info.expanded = true;
        generateExpandedQueryVis(query2Info);

    } else {
        query2Info.expanded = false;

        for (let i = 0; i < numberOfQueries; i++) {
            let queryDiv = "#query" + (i+1).toString();
            d3.select(queryDiv).selectAll("svg").remove();
            resetQueryVis(window["query" + (i+1).toString() + "Info"]);
        }
    }
});

$('#query3ExpandQueryButton').click(function(e){

    $("#query3ButtonIcon").toggleClass("fa-window-minimize");

    $('#query3Card').toggleClass('fullscreen'); 

    if (document.querySelector("#query3Card").classList.contains("fullscreen")) {
        var selection = d3.select("#query3");
        selection.selectAll("svg").remove();
        query3Info.expanded = true;

        generateExpandedQueryVis(query3Info);

    } else {
        query3Info.expanded = false;

        for (let i = 0; i < numberOfQueries; i++) {
            let queryDiv = "#query" + (i+1).toString();
            d3.select(queryDiv).selectAll("svg").remove();
            resetQueryVis(window["query" + (i+1).toString() + "Info"]);
        }
    }
});

$('#query4ExpandQueryButton').click(function(e){

    $("#query4ButtonIcon").toggleClass("fa-window-minimize");

    $('#query4Card').toggleClass('fullscreen'); 

    if (document.querySelector("#query4Card").classList.contains("fullscreen")) {
        var selection = d3.select("#query4");
        selection.selectAll("svg").remove();
        query4Info.expanded = true;

        generateExpandedQueryVis(query4Info);

    } else {
        query4Info.expanded = false;

        for (let i = 0; i < numberOfQueries; i++) {
            let queryDiv = "#query" + (i+1).toString();
            d3.select(queryDiv).selectAll("svg").remove();
            resetQueryVis(window["query" + (i+1).toString() + "Info"]);
        }
    }
});


$('#query1SimulationButton').click(function(e){
    let simulationButton = $("#query1SimulationButtonIcon")
    if(simulationButton.hasClass('fa-stop-circle')){
        simulationButtonClick(simulationButton,query1Info,play=false)
    } else {
        simulationButtonClick(simulationButton,query1Info,play=true);
    }
    allSimulationButtonSwitch();
});

$('#query2SimulationButton').click(function(e){
    let simulationButton = $("#query2SimulationButtonIcon")
    if(simulationButton.hasClass('fa-stop-circle')){
        simulationButtonClick(simulationButton,query2Info,play=false)
    } else {
        simulationButtonClick(simulationButton,query2Info,play=true);
    }
    allSimulationButtonSwitch();
});

$('#query3SimulationButton').click(function(e){
    let simulationButton = $("#query3SimulationButtonIcon")
    if(simulationButton.hasClass('fa-stop-circle')){
        simulationButtonClick(simulationButton,query3Info,play=false)
    } else {
        simulationButtonClick(simulationButton,query3Info,play=true);
    }
    allSimulationButtonSwitch();
});

$('#query4SimulationButton').click(function(e){
    let simulationButton = $("#query4SimulationButtonIcon")
    if(simulationButton.hasClass('fa-stop-circle')){
        simulationButtonClick(simulationButton,query4Info,play=false)
    } else {
        simulationButtonClick(simulationButton,query4Info,play=true);
    }
    allSimulationButtonSwitch();
});

function allSimulationButtonSwitch(){
    let simButtonIcon,
        stopCount = 0,
        playCount = 0
        allSimulationButton = $("#allSimulationButtonIcon");

    for (let i = 0; i < numberOfQueries; i++) {
        simButtonIcon = $("#query" + (i+1).toString() + "SimulationButtonIcon");

        if(simButtonIcon.hasClass('fa-stop-circle')){
            stopCount++;
        } else if(simButtonIcon.hasClass('fa-play-circle')){
            playCount++;
        }
    } 

    if(stopCount == numberOfQueries){
        if(allSimulationButton.hasClass('fa-play-circle')){
            allSimulationButton.removeClass('fa-play-circle').addClass('fa-stop-circle');
        }
    } else if (playCount == numberOfQueries){
        if(allSimulationButton.hasClass('fa-stop-circle')){
            allSimulationButton.removeClass('fa-stop-circle').addClass('fa-play-circle');
        }
    }
}


function simulationButtonClick(simulationButton,queryInfo,play){
    if(!play){
        simulationButton.removeClass( 'fa-stop-circle' ).addClass( 'fa-play-circle');
        queryInfo.hopsOn = false;
        
        if(queryInfo.expanded == true){
            generateExpandedQueryVis(queryInfo);
        } else {
            generateQueryVisNoHOPs(queryInfo);
        }
    } else {
        simulationButton.removeClass( 'fa-play-circle' ).addClass( 'fa-stop-circle');
        queryInfo.hopsOn = true;
        d3.select("#query" + queryInfo.queryNumber).selectAll("svg").remove();
 
        if(queryInfo.expanded == true){
            generateExpandedQueryVis(queryInfo);
        } else{
            height = originalHeight;
            width = originalWidth;
            dotRadius = originalDotRadius;
            resetQueryVis(queryInfo);
        }  
    }

};

$('#allSimulationButton').click(function(e){
    let allSimulationButton = $("#allSimulationButtonIcon");
    if(allSimulationButton.hasClass('fa-stop-circle')){
        let simButtonIcon,
            queryInfo;

        for (let i = 0; i < numberOfQueries; i++) {
            simButtonIcon = "#query" + (i+1).toString() + "SimulationButtonIcon";
            queryInfo = window["query" + (i+1).toString() + "Info"];
            simulationButtonClick($(simButtonIcon),queryInfo,play=false);
        }

        allSimulationButton.removeClass('fa-stop-circle').addClass('fa-play-circle');
    } else {
        let simButtonIcon,
            queryInfo;

        for (let i = 0; i < numberOfQueries; i++) {
            simButtonIcon = "#query" + (i+1).toString() + "SimulationButtonIcon";
            queryInfo = window["query" + (i+1).toString() + "Info"];
            simulationButtonClick($(simButtonIcon),queryInfo,play=true);
        } 

        allSimulationButton.removeClass('fa-play-circle').addClass('fa-stop-circle');
    }

});

function generateExpandedQueryVis(queryInfo){
    expandedWidth = document.getElementById('query' + queryInfo.queryNumber + 'AccuracyVis1').clientWidth;

    var div = d3.select("#query" + queryInfo.queryNumber);
    div.selectAll("svg").remove();

    let accuracySVGs = []
    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        accuracySVGs[i] = d3.select("#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
        .append("svg")
        .attr('width', expandedWidth)
        .attr('height',expandedHeight)
        .attr("id","#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
    }

    let hypotheticalDPReleases = [],
        DP_CIs = [],
        nonprivate_CIs = [],
        data = [],
        primary_vis,
        counter_default = Array.apply(null, Array(queryInfo.numberOfGroups)).map(Number.prototype.valueOf,0);

    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        hypotheticalDPReleases[i] = generate_hypothetical_DP_release(queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon),queryInfo.mu[i]/queryInfo.n[i]);
        DP_CIs[i] = generate_DP_CIs(hypotheticalDPReleases[i],queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon),queryInfo.n[i]);
        nonprivate_CIs[i] = generate_nonprivate_CIs(queryInfo.mu[i]/queryInfo.n[i],queryInfo.n[i]);
        data[i] = generateQuantilesFromParams(nDots,queryInfo.mu[i]/queryInfo.n[i],queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon));
        if (i==0) {
            primary_vis = true;
        } else {
            primary_vis = false;
        }
    }

    setUpEpsilonSlider(accuracySVGs,queryInfo,expanded=true,hopsOn=queryInfo.hopsOn);
    update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded=true,hopsOn=queryInfo.hopsOn);
    d3.select("#query" + queryInfo.queryNumber + "ExtrapolationCheckbox").on("change", function() {update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded=true,hopsOn=queryInfo.hopsOn);});
}


function resetQueryVis(queryInfo){

    var height = originalHeight,
        width = originalWidth;

    let accuracySVGs = []

    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        accuracySVGs[i] = d3.select("#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
        .append("svg")
        .attr('width', width)
        .attr('height',height)
        .attr("id","#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
    }

    let hypotheticalDPReleases = [],
        DP_CIs = [],
        nonprivate_CIs = [],
        data = [],
        primary_vis,
        counter_default = Array.apply(null, Array(queryInfo.numberOfGroups)).map(Number.prototype.valueOf,0);

    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        hypotheticalDPReleases[i] = generate_hypothetical_DP_release(queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon),queryInfo.mu[i]/queryInfo.n[i]);
        DP_CIs[i] = generate_DP_CIs(hypotheticalDPReleases[i],queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon),queryInfo.n[i]);
        nonprivate_CIs[i] = generate_nonprivate_CIs(queryInfo.mu[i]/queryInfo.n[i],queryInfo.n[i]);
        data[i] = generateQuantilesFromParams(nDots,queryInfo.mu[i]/queryInfo.n[i],queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon));
        if (i==0) {
            primary_vis = true;
        } else {
            primary_vis = false;
        }
    }

    setUpEpsilonSlider(accuracySVGs,queryInfo,expanded=false,reset=true, hopsOn=queryInfo.hopsOn);
    update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded=false,hopsOn=queryInfo.hopsOn);
    d3.select("#query" + queryInfo.queryNumber + "ExtrapolationCheckbox").on("change", function() {update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded=false,hopsOn=queryInfo.hopsOn);});
}

function generateQueryVisNoHOPs(queryInfo){

    var div = d3.select("#query" + queryInfo.queryNumber);
    div.selectAll("svg").remove();

    let accuracySVGs = []
    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        accuracySVGs[i] = d3.select("#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
        .append("svg")
        .attr('width', originalWidth)
        .attr('height',originalHeight)
        .attr("id","#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
    }

    let nonprivate_CIs = [],
        data = [],
        primary_vis;

    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        nonprivate_CIs[i] = generate_nonprivate_CIs(queryInfo.mu[i]/queryInfo.n[i],queryInfo.n[i]);
        data[i] = generateQuantilesFromParams(nDots,queryInfo.mu[i]/queryInfo.n[i],queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon));
        if (i==0) {
            primary_vis = true;
        } else {
            primary_vis = false;
        }
    }

    setUpEpsilonSlider(accuracySVGs,queryInfo,expanded=false,reset=false,hopsOn=false);
    update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases=500,nonprivate_CIs,DP_CIs=500,counter_default=500,nDots,expanded=false,hopsOn=false);
    d3.select("#query" + queryInfo.queryNumber + "ExtrapolationCheckbox").on("change", function() {update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases=500,nonprivate_CIs,DP_CIs=500,counter_default=500,nDots,expanded=false,hopsOn=false);});
}