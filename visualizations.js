var margin = { 'top': 3, 'right': 19, 'left': 19, 'bottom': 3 },
    originalWidth = document.getElementById('query1AccuracyVis1').clientWidth,
    originalHeight = 150,
    expandedHeight = 200,
    nDots = 25,
    originalDotRadius = (originalHeight-30)/(nDots*2),
    expandedDotRadius = (expandedHeight-30)/(nDots*2),
    nTicks = 10,
    CIHeight = 5,
    dotplotCIMargin = 20,
    xLabel ="proportion",
    default_epsilon = 1,
    xExtent = [0,1],
    totalBudget = 8;

const TOTAL_DOTS_PER_DOTPLOT = 25;
numberOfQueries = 4;

query2Info = new Object();
query2Info.queryNumber = "2";
query2Info.MAX_EPSILON = 2;
query2Info.sensitivity = 1;
query2Info.mu = [20,139,153,140,131,79,34];
query2Info.n = [28,193,224,204,176,123,52];
query2Info.numberOfGroups = 7;
query2Info.current_epsilon = default_epsilon;
query2Info.groupName = ["18-28 years","29-39 years","40-50 years","51-61 years","62-72 years","73-83 years","84+ years"];
query2Info.hopsOn = true;
query2Info.expanded = false,
query2Info.locked = false,
query2Info.name = "Age";

query1Info = new Object();
query1Info.queryNumber = "1";
query1Info.MAX_EPSILON = 2;
query1Info.sensitivity = 1;
query1Info.mu = [236*.673,764*.681];
query1Info.n = [236,764];
query1Info.numberOfGroups = 2;
query1Info.current_epsilon = default_epsilon;
query1Info.groupName = ["Hispanic or Latino","Not Hispanic or Latino"];
query1Info.hopsOn = true;
query1Info.expanded = false,
query1Info.locked = false,
query1Info.name = "Ethnicity";

query3Info = new Object();
query3Info.queryNumber = "3";
query3Info.MAX_EPSILON = 2;
query3Info.sensitivity = 1;
query3Info.mu = [5,26,92,5,3,113,451];
query3Info.n = [7,44,125,9,5,162,648];
query3Info.numberOfGroups = 7;
query3Info.current_epsilon = default_epsilon;
query3Info.groupName = ["American Indian or Alaska Native","Asian","Black or African American","Multiracial","Native Hawaiian or Other Pacific Islander","Some Other Race","White"];
query3Info.hopsOn = true;
query3Info.expanded = false,
query3Info.locked = false,
query3Info.name = "Race";

query4Info = new Object();
query4Info.queryNumber = "4";
query4Info.MAX_EPSILON = 2;
query4Info.sensitivity = 1;
query4Info.mu = [554*.613,351*.652,95*.932];
query4Info.n = [554,351,95];
query4Info.numberOfGroups = 3;
query4Info.current_epsilon = default_epsilon;
query4Info.groupName = ["60201","60202","60203"];
query4Info.hopsOn = true;
query4Info.expanded = false,
query4Info.locked = false,
query4Info.name = "Zip";

var totalN = 1000;

function fillMetadata(queryInfo){
    let div = "#query" + queryInfo.queryNumber + "MetadataText"

    d3.select(div)
    .append()
    .attr("dy","0em")
    .style("font-weight","bold")
    .text("HealthLnk Synthetic Database");

    d3.select(div)
    .append()
    .attr("dy","0em")
    .style("font-weight","bold")
    .text("Sensitive variables: ICD-9");

    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        let text = "";
        text = text + " " + queryInfo.groupName[i] + ": " + (queryInfo.n[i]);
        d3.select(div).append().attr("dy","0em").text(text);
    }
}

d3.select("#remainingEpsilonBudget").text( (totalBudget - default_epsilon * 4).toString());

d3.select("#totalEpsilonBudgetInput").on("input", function() {
    totalBudget = +this.value;
    let remainingBudget = getRemainingBudget();
    d3.select("#remainingEpsilonBudget")
        .text(d3.format('.2')(remainingBudget))
        .style("color",getRemainingBudgetColor(remainingBudget));
  });

function getRemainingBudgetColor(remainingBudget){
    let color;
    if(remainingBudget < 0){
        color = "red";
    } else {
        color = "black";
    }
    return color;
};

// Calculating DP confidence interval (based on Ferrando et al. 2020) start
// https://arxiv.org/abs/2006.07749

// RANDOM NUMBER LAPLACE DISTRIBUTION FUNCTION
//https://www.johndcook.com/blog/2018/03/13/generating-laplace-random-variables/
exp_sample = function (mean) {
    return -mean * Math.log(Math.random());
};

function laplace(scale) {
    e1 = exp_sample(scale);
    e2 = exp_sample(scale);
    return e1 - e2;
}

// RANDOM NUMBER BINOMIAL DISTRIBUTION FUNCTION
function nextBinomial(p, trials) {
    //http://nodegame.github.io/JSUS/docs/lib/random.js.html
    var counter, sum;

    if ('number' !== typeof p) {
        throw new TypeError('nextBinomial: p must be number.');
    }
    if ('number' !== typeof trials) {
        throw new TypeError('nextBinomial: trials must be number.');
    }
    if (p < 0 || p > 1) {
        throw new TypeError('nextBinomial: p must between 0 and 1.');
    }
    if (trials < 1) {
        throw new TypeError('nextBinomial: trials must be greater than 0.');
    }

    counter = 0;
    sum = 0;

    while (counter < trials) {
        if (Math.random() < p) {
            sum += 1;
        }
        counter++;
    }

    return sum;
};

function generate_DP_CIs(hypothetical_DP_release, b, N) {
    var bootstraps = [];
    for (let index = 0; index < 500; index++) {
        var binomial_draw = nextBinomial(p = hypothetical_DP_release, trials = N),
            laplace_draw = laplace(b),
            binomial_plus_laplace = (binomial_draw / N) + laplace_draw;

        if (binomial_plus_laplace > 1) {
            binomial_plus_laplace = 1;
        } else if (binomial_plus_laplace < 0) {
            binomial_plus_laplace = 0;
        } 
        bootstraps.push(binomial_plus_laplace);   
    }

    bootstraps = bootstraps.sort((a, b) => a - b);

    var DP_CIs = [{}];
    DP_CIs[0]['lowerbound_95'] = d3.quantile(bootstraps, .025);
    DP_CIs[0]['upperbound_95'] = d3.quantile(bootstraps, .975);
    DP_CIs[0]['lowerbound_80'] = d3.quantile(bootstraps, .10);
    DP_CIs[0]['upperbound_80'] = d3.quantile(bootstraps, .90);
    DP_CIs[0]['lowerbound_50'] = d3.quantile(bootstraps, .25);
    DP_CIs[0]['upperbound_50'] = d3.quantile(bootstraps, .75);

    return DP_CIs;
}
// Calculating DP confidence interval (based on Ferrando et al. 2020) end


// Calculating non-private confidence interval (binomial CI) start
function generate_nonprivate_CIs(true_proportion, N) {
    var nonprivate_CIs = [{}];
    nonprivate_CIs[0]['lowerbound_95'] = (true_proportion - 1.96 * Math.sqrt((true_proportion * (1 - true_proportion)) / N));
    nonprivate_CIs[0]['upperbound_95'] = (true_proportion + 1.96 * Math.sqrt((true_proportion * (1 - true_proportion)) / N));
    nonprivate_CIs[0]['lowerbound_80'] = (true_proportion - 1.282 * Math.sqrt((true_proportion * (1 - true_proportion)) / N));
    nonprivate_CIs[0]['upperbound_80'] = (true_proportion + 1.282 * Math.sqrt((true_proportion * (1 - true_proportion)) / N));
    nonprivate_CIs[0]['lowerbound_50'] = (true_proportion - 0.674 * Math.sqrt((true_proportion * (1 - true_proportion)) / N));
    nonprivate_CIs[0]['upperbound_50'] = (true_proportion + 0.674 * Math.sqrt((true_proportion * (1 - true_proportion)) / N));
    return nonprivate_CIs;
}
// Calculating non-private confidence interval (binomial CI) end

// Functions necessary for creating quantile dotplots courtesy of Alex Kale and Matt Kay
function createHistogram(data,x,dotRadius) {
    // calculate symmetrical bin midpoints based on data
    binMidpoints = binFromCenter(data.map(d => d.value),x,dotRadius);

    // create array of bin edges from binMidpoints (in data units)
    let edges = [];
    binOffsets = [];

    for (let i = 0; i < binMidpoints.length; i++) {
        if (i == 0) {
            // first bin
            edges.push(binMidpoints[i] - x.invert(x(0) + dotRadius));
        } else {
            // middle bins
            edges.push((binMidpoints[i] + binMidpoints[i - 1]) / 2);
        }
        // document offsets of left bin edges from midpoints
        binOffsets[i] = Math.abs(binMidpoints[i] - edges[i]);
    }
    // add far edge to last bin
    edges.push(binMidpoints[binMidpoints.length - 1] + x.invert(x(0) + dotRadius));

    return d3.histogram()
        .domain([0,1]) // Manually set limits of domain for this DP query case where we can't get values below 0 or over 1
        .thresholds(edges)
        .value(function (d) { return d.value; }); // expects data in json format
}

// a variant of the basic wilkinson binning method (credit: Matt Kay)
// expects sorted dataArray
function wilkinsonBinMidpoints(dataArray, rightToLeft, x,dotRadius) {
    if (dataArray.length == 0) {
        return null;
    }

    // right to left sort
    if (rightToLeft) {
        dataArray = dataArray.reverse();
    }
    // get dot width on data scale
    let binWidth = x.invert(x(0) + 2 * dotRadius);

    // determine midpoints of bins
    let midpoints = [];
    let currBin = 1;            // counter
    let firstPt = dataArray[0]; // first data point in current bin

    for (let i = 1; i < dataArray.length; i++) {

        // difference in pixels from first point in current bin
        let diff = Math.abs(dataArray[i] - firstPt);

        // This is equivalent to diff >= binWidth but it accounts for machine precision (epsilon).
        // If we instead used `>=` directly some things that should be symmetric will not be
        if (diff > binWidth || Math.abs(diff - binWidth) < Number.EPSILON) {
            // bin midpoint is halfway between first and last points in the bin
            midpoints.push((dataArray[i - 1] + firstPt) / 2);
            // start new bin
            currBin++;
            firstPt = dataArray[i]

        }
    }
    if (midpoints.length < currBin) {
        // calculate midpoint for last bin
        midpoints.push((dataArray[dataArray.length - 1] + firstPt) / 2);
    }

    return midpoints.sort((a, b) => a - b);
}

// a modified wilkinson-style binning that expands outward from the center of the data (credit: Matt Kay)
// works best on symmetric data
// expects sorted dataArray
function binFromCenter(dataArray,x,dotRadius) {
    if (dataArray.length == 0) {
        return null;
    }

    // get dot width on data scale
    let binWidth = x.invert(x(0) + 2 * dotRadius);

    if (dataArray.length == 1 || Math.abs(dataArray[dataArray.length - 1] - dataArray[0]) < binWidth) {
        // everything is in one bin
        return [(dataArray[0] + dataArray[dataArray.length - 1]) / 2];
    }

    // used to construct center bin 
    // adjustment is 0 if there are an odd number of points; 0.5 if even and there is still a center bin
    let offsetAdjustment = 0;

    // if we made it this far, there is more than one bin
    if (dataArray.length % 2 == 0) {
        // even number of data points
        if (dataArray[dataArray.length / 2 - 1] != dataArray[dataArray.length / 2]) {
            // two points in middle not equal => 
            // even number of bins and we bin out from center on either side of the middle
            let left = wilkinsonBinMidpoints(dataArray.slice(0, dataArray.length / 2), true, x,dotRadius)
            let right = wilkinsonBinMidpoints(dataArray.slice(dataArray.length / 2), false, x, dotRadius)

            return left.concat(right);
        } else {
            // two points in the middle are equal => 
            // stick them into a single bin together and make that the center bin
            offsetAdjustment = 0.5;
        }
    }

    // if we made it this far, there is either an odd number of items OR 
    // an even number of items where the center two items are equal to each other. 
    // In both of these cases, we construct a center bin first and then bin out from around it.
    let iCenter = dataArray.length / 2 - 0.5;
    let edgeIndexOffsetFromCenter = offsetAdjustment;

    for (let offset = 0; offset < Math.floor(dataArray.length / 2); offset++) {
        let adjustedOffset = offset - offsetAdjustment;
        if (Math.abs(dataArray[iCenter + adjustedOffset] - dataArray[iCenter - adjustedOffset]) < binWidth) {
            // add both points to current bin
            // edgeIndexOffsetFromCenter is number of indices from the center that corresponds to the farthest out datapoint that is still in the middle bin
            edgeIndexOffsetFromCenter = adjustedOffset;
        } else {
            break;
        }
    }

    // calculate midpoint of center bin and place in Array
    let center = [(dataArray[iCenter - edgeIndexOffsetFromCenter] + dataArray[iCenter + edgeIndexOffsetFromCenter]) / 2];

    // construct bins for left / right of center
    left = wilkinsonBinMidpoints(dataArray.slice(0, iCenter - edgeIndexOffsetFromCenter), true, x, dotRadius)
    right = wilkinsonBinMidpoints(dataArray.slice(iCenter + edgeIndexOffsetFromCenter + 1), false, x, dotRadius)

    return left.concat(center, right);
}

function findMaxLength(bins) {
    return bins.length > 0 ? Math.max.apply(Math, $.map(bins, function (el) { return el.length })) : 0;
}

function determineDotRadius(dotRadiusStart,data,height){
    // y_translate determines how much to translate gBins down by 
    var y_translate = height - 30,
        dotRadiusCurrent = dotRadiusStart;

    var histogram = createHistogram(data,x,dotRadiusCurrent);
    var bins = histogram(data);
    var filteredBins = bins.filter(d => d.length > 0);
    var maxDots = findMaxLength(filteredBins);

    if (maxDots * dotRadiusCurrent * 2 <=  y_translate ) {
        return dotRadiusCurrent;
        
    } else {
        while (maxDots * dotRadiusCurrent * 2 > y_translate ) {
            dotRadiusCurrent = dotRadiusCurrent - .0001;
            //histogram binning
            histogram = createHistogram(data,x,dotRadiusCurrent);
            bins = histogram(data);
    
            // binning data and filtering out empty bins
            filteredBins = bins.filter(d => d.length > 0)
    
            //find the maximum number of elements from the bins
            maxDots = findMaxLength(filteredBins);
        };
        return dotRadiusCurrent;
    }
}

function make_dotplot(dotRadius,data,accuracy_svg,x,queryNumber,height) {

    if (typeof tooltip !=="undefined"){
        tooltip.style("opacity", 0)
    }

   // y_translate determines how much to translate gBins down by 
   var y_translate = height - 30;

    // histogram binning
    var histogram = createHistogram(data,x,dotRadius);
    var bins = histogram(data);

    // binning data and filtering out empty bins
    var filteredBins = bins.filter(d => d.length > 0)

    // Tooltip for the quantile dotplot to explain what each bin "means"
    tooltip = d3.select("#query" + queryNumber + "Card")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")

    // Three functions that change the tooltip when user hover / move / leave a cell
    // source: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html#template
    let mouseover = function (event, d) {
        tooltip
            .style("opacity", 1)

        let current_circle_class = ".dotplot_circle_" + d.binIdx;
        accuracy_svg.selectAll(current_circle_class)
                .style("opacity", .5)
    }

    let mousemove = function (event, d) {
        tooltip
          .html("The chance that the privacy-preserving release will fall between  <b>" + d3.format('.2')(d.binstart) + " and " + d3.format('.2')(d.binend) + "</b><br>is about <b>" + d.chance + " </b>(" + d.length + " out of " + nDots + " dots)")
          .style("left", (event.clientX - 80) + "px")
          .style("top", (event.clientY - 50) + "px")
      }
      let mouseleave = function (event, d) {
        tooltip
          .style("opacity", 0)
      
        let current_circle_class = ".dotplot_circle_" + d.binIdx;
        accuracy_svg.selectAll(current_circle_class)
          .style("opacity", 1)
      }
      

    //g container for each bin
    let binContainer = accuracy_svg.selectAll(".gBin")
        .data(filteredBins);

    binContainer.exit().remove();
    
    let gbin_class = "gBin"
    let binContainerEnter = binContainer.enter()
        .append("g")
        .attr("class", "gBin" + " " + gbin_class)
        .attr("transform", d => `translate(${x(d.x0) + (margin.right)}, ${y_translate})`)

    //need to populate the bin containers with data
    binContainerEnter.selectAll("circle")
        .data(function (d, i) {
            return d.map((p, j) => {
                return {
                    binIdx: i,
                    stackIdx: j,
                    value: p.value,
                    radius: dotRadius,
                    binstart: d.x0,
                    binend: d.x1,
                    length: d.length, // number of dots in the bin
                    chance: d3.format(",.0%")(d.length / nDots)
                }
            })
        })
        .enter()
        .append("circle")
        .attr("class", "dotplot_circle")
        .attr("class", function (d) { return "dotplot_circle_" + d.binIdx; })
        .attr("cx", function (d) { return x(binOffsets[d.binIdx]) - x(0); }) // center dot at bin midpoint by moving to the right the number of pixels that the bin edge is offest from the bin midpoint
        .attr("cy", function (d) { return - d.stackIdx * 2 * d.radius - d.radius; })
        .attr("r", function (d) {
            return (d.length == 0) ? 0 : d.radius
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

} // end of make_dotplot function

function generateQuantilesFromParams(nDots, true_proportion, b) {
     // generate nDots points to display based on distribution parameters
     // each dot represents an equally portioned quantile
     // evenly space probabilities within 95% containment interval
     // Adapted for DP case to not have values less than 0 or greater than 1
    var quantiles = [],
        lowerP = 0.025,
        upperP = 0.975,
        idx = [...Array(nDots).keys()], // [0, 1, 2, ... nDots - 1]
        probabilities = idx.map(i => (upperP - lowerP) * i / (idx.length - 1) + lowerP);

    probabilities.forEach(p => {
        var temp_value = inverseLaplaceCDF_func(p,true_proportion,b);
        if (temp_value > 1){
            quantiles.push({
                'value': 1
            });
        } else if (temp_value < 0){
            quantiles.push({
                'value': 0
            });
        } else {
            quantiles.push({
                'value': temp_value
            });
        }
    });
    return quantiles;
};

// Laplace inverse CDF function
function inverseLaplaceCDF_func(p, mu, b) {
    // https://www.rdocumentation.org/packages/extraDistr/versions/1.9.1/topics/Laplace
    // https://en.wikipedia.org/wiki/Laplace_distribution
    return mu - b * Math.sign(p - .5) * Math.log(1 - 2 * Math.abs(p - .5));
}

function setX(width) {
    var x = d3.scaleLinear()
        .domain(xExtent)
        .range([0, width - margin.right - margin.left]);
    return x;
}

function generate_hypothetical_DP_release(b,true_proportion){
    var DP_noise = laplace(b);
    if(true_proportion + DP_noise > 1){
        var hypothetical_DP_release = 1;
    } else if (true_proportion + DP_noise < 0){
        var hypothetical_DP_release = 0;
    } else {
        var hypothetical_DP_release = true_proportion + DP_noise;
    }
    return hypothetical_DP_release;
}

function make_nonprivate_CIs(svg, nonprivate_CIs,x,height) {

    svg.selectAll(".nonPrivateCI_95")
        .data(nonprivate_CIs)
        .enter()
        .append("rect")
        .attr("class", "nonPrivateCI_95")
        .attr("x", function (d) { return x(d.lowerbound_95) + margin.right; })
        .attr("y",height - 28 + 7 + CIHeight + 1) // add 1 to leave gap between private and nonprivate CIs
        .attr("width", function (d) { return x(d.upperbound_95) - x(d.lowerbound_95); })
        .attr("height", CIHeight)

    svg.selectAll(".nonPrivateCI_80")
        .data(nonprivate_CIs)
        .enter()
        .append("rect")
        .attr("class", "nonPrivateCI_80")
        .attr("x", function (d) { return x(d.lowerbound_80) + margin.right; })
        .attr("y",height - 28 + 7 + CIHeight + 1)
        .attr("width", function (d) { return x(d.upperbound_80) - x(d.lowerbound_80); })
        .attr("height", CIHeight)

    svg.selectAll(".nonPrivateCI_50")
        .data(nonprivate_CIs)
        .enter()
        .append("rect")
        .attr("class", "nonPrivateCI_50")
        .attr("x", function (d) { return x(d.lowerbound_50) + margin.right; })
        .attr("y",height - 28 + 7 + CIHeight + 1)
        .attr("width", function (d) { return x(d.upperbound_50) - x(d.lowerbound_50); })
        .attr("height", CIHeight)
        
}

// Function to lay down all the parts of the accuracy vis graph (CIs, dotplot, etc) onto accuracy_svg
function setUpInferenceAccuracyVis(svg, true_proportion, hypothetical_DP_release, nonprivate_CIs, DP_CIs, data, primary_vis,expanded,queryNumber,groupName,hops,dotRadius) {

    // x-axis dotplot and setting height
    if (expanded) {
        var height = expandedHeight;
        var x = setX(expandedWidth);
        var x_axis_dotplot = svg.append('g')
                .attr("class", "x-axis-dotplot")
                .attr("transform", "translate(" + margin.right + "," + (height - 30) + ")")
                .call(d3.axisBottom(x).ticks(nTicks));
    } else {
        var height = originalHeight;
        var x = setX(originalWidth);
        var x_axis_dotplot = svg.append('g')
            .attr("class", "x-axis-dotplot")
            .attr("transform", "translate(" + margin.right + "," + (height - 30) + ")")
            .call(d3.axisBottom(x).ticks(nTicks));
    }
    
    make_nonprivate_CIs(svg,nonprivate_CIs,x,height);
    
    if(hops){
        svg.selectAll(".privateCI_95")
            .data(DP_CIs)
            .enter()
            .append("rect")
            .attr("class", "privateCI_95")
            .attr("x", function (d) { return x(d.lowerbound_95) + margin.right; })
            .attr("y", height - 28 + 7) // add 7 so CI doesn't cover axis ticks
            .attr("width", function (d) { return x(d.upperbound_95) - x(d.lowerbound_95); })
            .attr("height", CIHeight)

        svg.selectAll(".privateCI_80")
            .data(DP_CIs)
            .enter()
            .append("rect")
            .attr("class", "privateCI_80")
            .attr("x", function (d) { return x(d.lowerbound_80) + margin.right; })
            .attr("y", height - 28 + 7) // add 7 so CI doesn't cover axis ticks
            .attr("width", function (d) { return x(d.upperbound_80) - x(d.lowerbound_80); })
            .attr("height", CIHeight)

        svg.selectAll(".privateCI_50")
            .data(DP_CIs)
            .enter()
            .append("rect")
            .attr("class", "privateCI_50")
            .attr("x", function (d) { return x(d.lowerbound_50) + margin.right; })
            .attr("y", height - 28 + 7) // add 7 so CI doesn't cover axis ticks
            .attr("width", function (d) { return x(d.upperbound_50) - x(d.lowerbound_50); })
            .attr("height", CIHeight)
    }

    make_dotplot(dotRadius,data,svg,x,queryNumber,height);

    // Un-noised result
    svg.append("line")
        .attr("class", "true_result_line")
        .attr("x1", x(true_proportion) + margin.right)
        .attr("y1", 0)
        .attr("x2", x(true_proportion) + margin.right)
        .attr("y2", height - 10)
        .attr("stroke-width", 1.5)
        .attr("stroke", "black");

    if(hops){
        // Hypothetical DP result
        hypothetical_DP_release_line = svg.append("line")
            .attr("class", "hypothetical_DP_release")
            .attr("x1", x(hypothetical_DP_release) + margin.right)
            .attr("y1", 0)
            .attr("x2", x(hypothetical_DP_release) + margin.right)
            .attr("y2", height - 10)
            .attr("stroke-width", 1)
            .attr("stroke", "red");

            if (hypothetical_DP_release < .2) {
                vertical_line_label_direction = "start"
                vertical_line_adjustment = 5
            } else {
                vertical_line_label_direction = "end"
                vertical_line_adjustment = -5
            }
    }

    if (primary_vis) {
        let queryResultText = ""
        let privacyPreservingRelease = ""
        if(queryNumber == "1"){
            queryResultText = "query result";
            privacyPreservingRelease = "privacy-preserving release";
        }
        if(hops){
            svg.append("text")
                .attr("class", "hypothetical_release_label")
                .attr("transform", "translate(" + (x(hypothetical_DP_release) + margin.right + vertical_line_adjustment) + " ," + 25 + ")")
                .style("text-anchor", vertical_line_label_direction)
                .style("font-family", "Avenir")
                .style("font-size", "12px")
                .style('fill', 'red')
                .text(privacyPreservingRelease);
        }

        svg.append("text")
            .attr("class", "true_result_label")
            .attr("transform", "translate(" + (x(true_proportion) + margin.right - 5) + " ," + 10 + ")")
            .style("text-anchor", "end")
            .style("font-family", "Avenir")
            .style("font-size", "12px")
            .text(queryResultText);
    }

    svg.append("text")
        .attr("class", "true_result_number")
        .attr("transform", "translate(" + (x(true_proportion) + margin.right + 26) + " ," + 10 + ")")
        .style("text-anchor", "end")
        .style("font-family", "Avenir")
        .style("font-size", "12px")
        .text(d3.format('.2')(true_proportion));

    svg.append("text")
        .attr("class","groupName")
        .attr("transform","translate(" + (x(0) + margin.right - 5) + "," + (height - 2.5) + ")")
        .text(groupName)
        .style("font-size","12px");

}

function setUpNoInferenceAccuracyVis(svg,true_proportion, hypothetical_DP_release, data, primary_vis,expanded, queryNumber, groupName, hopsOn,dotRadius) {

    // x-axis dotplot and setting height
    if (expanded) {
        var height = expandedHeight;
        var x = setX(expandedWidth);
        var x_axis_dotplot = svg.append('g')
            .attr("class", "x-axis-dotplot")
            .attr("transform", "translate(" + margin.right + "," + (height - 30) + ")")
            .call(d3.axisBottom(x).ticks(nTicks));

    } else {
        var height = originalHeight;
        var x = setX(originalWidth);
        var x_axis_dotplot = svg.append('g')
            .attr("class", "x-axis-dotplot")
            .attr("transform", "translate(" + margin.right + "," + (height - 30) + ")")
            .call(d3.axisBottom(x).ticks(nTicks));
    }
        
    make_dotplot(dotRadius, data, svg,x,queryNumber,height);

    // Un-noised result
    svg.append("line")
        .attr("class", "true_result_line")
        .attr("x1", x(true_proportion) + margin.right)
        .attr("y1", 0)
        .attr("x2", x(true_proportion) + margin.right)
        .attr("y2", height-30) // subtract 30 so that vertical line does not go below the axis
        .attr("stroke-width", 1.5)
        .attr("stroke", "black");

    if(hopsOn){
        // Hypothetical DP result
        svg.append("line")
            .attr("class", "hypothetical_DP_release")
            .attr("x1", x(hypothetical_DP_release) + margin.right)
            .attr("y1", 0)
            .attr("x2", x(hypothetical_DP_release) + margin.right)
            .attr("y2", height-30)
            .attr("stroke-width", 1)
            .attr("stroke", "red");
    }

    if (primary_vis) {
        if(hopsOn){
            if (hypothetical_DP_release < .2) {
                var vertical_line_label_direction = "start";
                var vertical_line_adjustment = 5;
            } else {
                var vertical_line_label_direction = "end";
                var vertical_line_adjustment = -5;
            }
        }

        let queryResultText = ""
        let privacyPreservingRelease = ""
        if(queryNumber == "1"){
            queryResultText = "query result";
            if(hopsOn){
                privacyPreservingRelease = "privacy-preserving release";
            }
        }
        if(hopsOn){
            svg.append("text")
            .attr("class", "hypothetical_release_label")
            .attr("transform", "translate(" + (x(hypothetical_DP_release) + margin.right + vertical_line_adjustment) + " ," + 25 + ")")
            .style("text-anchor", vertical_line_label_direction)
            .style("font-family", "Avenir")
            .style("font-size", "12px")
            .style('fill', 'red')
            .text(privacyPreservingRelease);
        }

        svg.append("text")
            .attr("class", "true_result_label")
            .attr("transform", "translate(" + (x(true_proportion) + margin.right - 5) + " ," + 10 + ")")
            .style("text-anchor", "end")
            .style("font-family", "Avenir")
            .style("font-size", "12px")
            .text(queryResultText);
    }

    svg.append("text")
        .attr("class", "true_result_number")
        .attr("transform", "translate(" + (x(true_proportion) + margin.right + 26) + " ," + 10 + ")")
        .style("text-anchor", "end")
        .style("font-family", "Avenir")
        .style("font-size", "12px")
        .text(d3.format('.2')(true_proportion));

    svg.append("text")
        .attr("class","groupName")
        .attr("transform","translate(" + (x(0) + margin.right - 5) + "," + (height - 2.5) + ")")
        .text(groupName)
        .style("font-size","12px");
}

function DP_hops_manager(on,queryNumber,count,counter_default,extrapolation,epsilon_value,svg,N,true_proportion,primary_vis,x,height){
    if(on){
        window["query" + queryNumber + "HOP" + count.toString()] = setInterval(function (){
            HOPs(i = counter_default, b = 1 / (N * epsilon_value), extrapolation, svg, true_proportion, N, primary_vis,x, queryNumber,height);
            counter_default++;
        }, 400);
    } else {
        clearInterval(window["query" + queryNumber + "HOP" + count.toString()]);
    }
}


function HOPs(i,b,extrapolation,svg,true_proportion,N,primary_vis, x, queryNumber,height) {
    var simulation = [];
    var hypothetical_DP_release = generate_hypothetical_DP_release(b,true_proportion);
  
    simulation.push([{
      "hypothetical_DP_release": hypothetical_DP_release,
      "n": N
    }]);

    if (extrapolation == true) {
        var DP_CIs = generate_DP_CIs(hypothetical_DP_release, b, N);
    
        svg.selectAll(".privateCI_95")
        .data([])
        .exit()
        .remove()
            
        svg.selectAll(".privateCI_95")
        .data(DP_CIs)
        .enter()
        .append("rect")
        .attr("class", "privateCI_95")
        .attr("x", function (d) { return x(d.lowerbound_95) + margin.right; })
        .attr("y", height - 28 + 7) // add 7 so CI doesn't cover axis ticks
        .attr("width", function (d) { return x(d.upperbound_95) - x(d.lowerbound_95); })
        .attr("height", CIHeight)

        svg.selectAll(".privateCI_80")
        .data([])
        .exit()
        .remove()
    
        svg.selectAll(".privateCI_80")
        .data(DP_CIs)
        .enter()
        .append("rect")
        .attr("class", "privateCI_80")
        .attr("x", function (d) { return x(d.lowerbound_80) + margin.right; })
        .attr("y", height - 28 + 7) // add 7 so CI doesn't cover axis ticks
        .attr("width", function (d) { return x(d.upperbound_80) - x(d.lowerbound_80); })
        .attr("height", CIHeight)
    
        svg.selectAll(".privateCI_50")
        .data([])
        .exit()
        .remove()
    
        svg.selectAll(".privateCI_50")
        .data(DP_CIs)
        .enter()
        .append("rect")
        .attr("class", "privateCI_50")
        .attr("x", function (d) { return x(d.lowerbound_50) + margin.right; })
        .attr("y", height - 28 + 7) // add 7 so CI doesn't cover axis ticks
        .attr("width", function (d) { return x(d.upperbound_50) - x(d.lowerbound_50); })
        .attr("height", CIHeight)
    }
  
    svg.selectAll(".true_result_line")
      .data([])
      .exit()
      .remove()

    let result_release_y_pos = height - 10;
    if(extrapolation==false){
        result_release_y_pos = height-30;
    } 
    
    svg.append("line")
      .attr("class", "true_result_line")
      .attr("x1", x(true_proportion) + margin.right)
      .attr("y1", 0)
      .attr("x2", x(true_proportion) + margin.right)
      .attr("y2", result_release_y_pos)
      .attr("stroke-width", 1.5)
      .attr("stroke", "black");
    
    svg.selectAll(".hypothetical_DP_release")
      .data([])
      .exit()
      .remove()
  
    svg.selectAll(".hypothetical_DP_release")
      .data(simulation[0])
      .enter()
      .append("line")
      .attr("class", "hypothetical_DP_release")
      .attr("x1", function (d) { return x(d.hypothetical_DP_release) + margin.right; })
      .attr("y1", 0)
      .attr("x2", function (d) { return x(d.hypothetical_DP_release) + margin.right; })
      .attr("y2", result_release_y_pos)
      .attr("stroke-width", 1)
      .attr("stroke", "red");
  
    svg.selectAll(".hypothetical_release_label")
      .data([])
      .exit()
      .remove()
    
    if (hypothetical_DP_release < .2) {
        var vertical_line_label_direction = "start";
        var vertical_line_adjustment = 5;
    } else {
        var vertical_line_label_direction = "end";
        var vertical_line_adjustment = -5;
    }
    if (primary_vis) {

        let privacyPreservingRelease = ""
        if(queryNumber == "1"){
            privacyPreservingRelease = "privacy-preserving release";
        }

        svg.append("text")
            .attr("class", "hypothetical_release_label")
            .attr("transform", "translate(" + (x(hypothetical_DP_release) + margin.right + vertical_line_adjustment) + " ," + (25) + ")")
            .style("text-anchor", vertical_line_label_direction)
            .style("font-family", "Avenir")
            .style("font-size", "12px")
            .style('fill', 'red')
            .text(privacyPreservingRelease);
    }

  }

  function update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded,hopsOn) {
    if (expanded) {
        x = setX(expandedWidth);
        var dotRadiusStart = expandedDotRadius;
        var height = expandedHeight;
    } else {
        x = setX(originalWidth);
        var dotRadiusStart = originalDotRadius;
        var height = originalHeight;
    }

    var data = [],
        dotRadii = [];

    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        data[i] = generateQuantilesFromParams(nDots,queryInfo.mu[i]/queryInfo.n[i],queryInfo.sensitivity/(queryInfo.n[i]*queryInfo.current_epsilon));
        dotRadii[i] = determineDotRadius(dotRadiusStart=dotRadiusStart,data[i],height);
    }

    var dotRadiusFinal = Math.min(...dotRadii);

    if (d3.select("#query" + queryInfo.queryNumber + "ExtrapolationCheckbox").property("checked")) {
        let primary_vis;

        for (let i = 0; i < queryInfo.numberOfGroups; i++) {
         
            accuracySVGs[i].selectAll(".gBin,.true_result_line,.hypothetical_DP_release,.hypothetical_release_label,.true_result_label,.x-axis-dotplot,.groupName,.true_result_number")
                .data([])
                .exit()
                .remove()

            if (i==0) {
                primary_vis = true;
            } else {
                primary_vis = false;
            }

            setUpInferenceAccuracyVis(accuracySVGs[i],queryInfo.mu[i]/queryInfo.n[i],hypotheticalDPReleases[i],nonprivate_CIs[i],DP_CIs[i],data[i],primary_vis,expanded,queryInfo.queryNumber,queryInfo.groupName[i], hops=hopsOn,dotRadius=dotRadiusFinal);

            if(hopsOn){
                if (typeof window["query" + queryInfo.queryNumber + "HOP" + i.toString()] === 'undefined'){
                    DP_hops_manager(true,queryNumber=queryInfo.queryNumber,count=i,counter_default[i],extrapolation=true,queryInfo.current_epsilon,accuracySVGs[i],queryInfo.n[i],queryInfo.mu[i]/queryInfo.n[i],primary_vis,x,height);
                } else {
                    DP_hops_manager(on=false,queryNumber=queryInfo.queryNumber,count=i);
                    DP_hops_manager(true,queryNumber=queryInfo.queryNumber,count=i,counter_default[i],extrapolation=true,queryInfo.current_epsilon,accuracySVGs[i],queryInfo.n[i],queryInfo.mu[i]/queryInfo.n[i],primary_vis,x,height);
                }
            }

        }

    } else {
        let primary_vis;

        for (let i = 0; i < queryInfo.numberOfGroups; i++) {
            if (i==0) {
                primary_vis = true;
            } else {
                primary_vis = false;
            }

            if(hopsOn){
                DP_hops_manager(on=false,queryNumber=queryInfo.queryNumber,count=i);
                DP_hops_manager(on=true,queryNumber=queryInfo.queryNumber,count=i,counter_default[i],extrapolation=false,queryInfo.current_epsilon,accuracySVGs[i],queryInfo.n[i],queryInfo.mu[i]/queryInfo.n[i],primary_vis,x,height);    
            }
     
            // Remove elements from the extrapolation version of the vis
            accuracySVGs[i].selectAll(".nonPrivateCI_95, .nonPrivateCI_80, .nonPrivateCI_50, .privateCI_95, .privateCI_80,\
            .privateCI_50, .x-axis-dotplot, .gBin,.true_result_line,.hypothetical_DP_release,\
            .hypothetical_release_label,.true_result_label,.inference_label,.groupName,.true_result_number")
                .data([])
                .exit()
                .remove()
        }

        for (let i = 0; i < queryInfo.numberOfGroups; i++) {
            if (i==0) {
                primary_vis = true;
            } else {
                primary_vis = false;
            }
            hypotheticalDPReleases[i] = generate_hypothetical_DP_release(1/(queryInfo.n[i]*queryInfo.current_epsilon),queryInfo.mu[i]/queryInfo.n[i]);
            setUpNoInferenceAccuracyVis(accuracySVGs[i],queryInfo.mu[i]/queryInfo.n[i],hypotheticalDPReleases[i],data[i],primary_vis,expanded, queryInfo.queryNumber, queryInfo.groupName[i],hopsOn,dotRadiusFinal);
        }
    }
}
function getRemainingBudget(){
    var usedBudget = 0;
    var queryBudget;
    for (let i = 0; i < numberOfQueries; i++) {
        queryBudget = parseFloat(d3.format('.3')(window["query" + (i+1).toString() + "Slider"].value()));
        usedBudget = usedBudget + queryBudget;
    }
    return (totalBudget - usedBudget);
}

function setUpEpsilonSlider(accuracySVGs,queryInfo, expanded, reset, hopsOn) {
    if (!expanded && !reset && hopsOn){
        window["query" + queryInfo.queryNumber + "Slider"] = d3.sliderBottom()
            .min(.001)
            .max(queryInfo.MAX_EPSILON)
            .width(originalWidth - 86)
            .tickFormat(d3.format('.3'))
            .ticks(10)
            .step(0.001)
            .default(default_epsilon)
            .on('onchange', val => {
                val = d3.format('.3')(val);
                update_slider(val,accuracySVGs,queryInfo,expanded);
                let remainingBudget = getRemainingBudget();
                d3.select("#remainingEpsilonBudget")
                  .text( (remainingBudget).toFixed(2))
                  .style("color",getRemainingBudgetColor(remainingBudget))
            });
    
        let sliderDivName = "div#query" + queryInfo.queryNumber + "EpsilonSlider";
        var gStep = d3.select(sliderDivName)
            .append('svg')
            .attr('width', originalWidth-45)
            .attr('height', 55)
            .append('g')
            .attr('transform', 'translate(30,15)');

        gStep.call(window["query" + queryInfo.queryNumber + "Slider"]);
    } else if (expanded) {
        window["query" + queryInfo.queryNumber + "Slider"].on('onchange', val =>{
            val = d3.format('.3')(val);
            update_slider(val,accuracySVGs,queryInfo,expanded);
            let remainingBudget = getRemainingBudget();
            d3.select("#remainingEpsilonBudget")
                .text((remainingBudget).toFixed(2))
                .style("color",getRemainingBudgetColor(remainingBudget));
        });
    } else if (reset && !expanded || (!expanded && !reset && !hopsOn)) {
        window["query" + queryInfo.queryNumber + "Slider"].on('onchange', val =>{
            val = d3.format('.3')(val);
            update_slider(val,accuracySVGs,queryInfo,expanded);
            let remainingBudget = getRemainingBudget();
            d3.select("#remainingEpsilonBudget")
                .text((remainingBudget).toFixed(2))
                .style("color",getRemainingBudgetColor(remainingBudget));
        });
    } 
}

function update_slider(new_epsilon,accuracySVGs,queryInfo,expanded) {


    if (expanded) {
        var x = setX(expandedWidth);
        var dotRadiusStart = expandedDotRadius;
        var height = expandedHeight;
    } else {
        var x = setX(originalWidth);
        var dotRadiusStart = originalDotRadius;
        var height = originalHeight;
    }

    var data = [],
        dotRadii = [];
    
    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        data[i] = generateQuantilesFromParams(nDots,queryInfo.mu[i]/queryInfo.n[i],queryInfo.sensitivity/(queryInfo.n[i]*new_epsilon));
        dotRadii[i] = determineDotRadius(dotRadiusStart,data[i],height);

        accuracySVGs[i].selectAll(".gBin")
            .data([])
            .exit([])
            .remove();
    }

    var dotRadiusFinal = Math.min(...dotRadii);

    let counter_default = Array.apply(null, Array(queryInfo.numberOfGroups)).map(Number.prototype.valueOf,0);

    if (d3.select("#query" + queryInfo.queryNumber + "ExtrapolationCheckbox").property("checked")) {

        let primary_vis;
        for (let i = 0; i < queryInfo.numberOfGroups; i++) {
            if (i==0) {
                primary_vis = true;
            } else {
                primary_vis = false;
            }

            if(queryInfo.hopsOn){
                DP_hops_manager(on=false,queryNumber=queryInfo.queryNumber,count=i);
                DP_hops_manager(on=true,queryInfo.queryNumber,i,counter_default[i],extrapolation=true,new_epsilon,accuracySVGs[i],queryInfo.n[i],queryInfo.mu[i]/queryInfo.n[i],primary_vis,x,height);
            }
        
            make_dotplot(dotRadiusFinal,data[i],accuracySVGs[i],x,queryInfo.queryNumber,height);

            if(!queryInfo.hopsOn){
                // When HOPs are on, the query result line gets redrawn on top of the dotplot. When HOPs is not on
                // we need to redraw it or else it will show up underneath the dotplot
                accuracySVGs[i].selectAll(".true_result_line")
                    .data([])
                    .exit()
                    .remove()

              accuracySVGs[i].append("line")
                .attr("class", "true_result_line")
                .attr("x1", x(queryInfo.mu[i]/queryInfo.n[i]) + margin.right)
                .attr("y1", 0)
                .attr("x2", x(queryInfo.mu[i]/queryInfo.n[i]) + margin.right)
                .attr("y2", height-10)
                .attr("stroke-width", 1.5)
                .attr("stroke", "black");
            }
        }

    } else {

        for (let i = 0; i < queryInfo.numberOfGroups; i++){
            let primary_vis;
            if(i == 0){
                primary_vis = true;
            } else {
                primary_vis = false;
            }
            if(hopsOn){
                DP_hops_manager(false,queryInfo.queryNumber,count=i);
                DP_hops_manager(on=true,queryInfo.queryNumber,i,counter_default[i],extrapolation=false,new_epsilon,accuracySVGs[i],queryInfo.n[i],queryInfo.mu[i]/queryInfo.n[i],primary_vis,x,height);    
            }

            make_dotplot(dotRadiusFinal,data[i],accuracySVGs[i],x,queryInfo.queryNumber,height);

            if(!hopsOn){
                // When HOPs are on, the query result line gets redrawn on top of the dotplot. When HOPs is not on
                // we need to redraw it or else it will show up underneath the dotplot
                accuracySVGs[i].selectAll(".true_result_line")
                    .data([])
                    .exit()
                    .remove()
              
              accuracySVGs[i].append("line")
                .attr("class", "true_result_line")
                .attr("x1", x(queryInfo.mu[i]/queryInfo.n[i]) + margin.right)
                .attr("y1", 0)
                .attr("x2", x(queryInfo.mu[i]/queryInfo.n[i]) + margin.right)
                .attr("y2", height-30)
                .attr("stroke-width", 1.5)
                .attr("stroke", "black");
            }
        }

    }
    
   window["query" + queryInfo.queryNumber + "Info"].current_epsilon = new_epsilon; //update global current_epsilon value for the query
   update_risk_vis(queryInfo.queryNumber);
   if (d3.select("#responsiveCheckbox").property("checked")) {
       var remainingBudget = getRemainingBudget();
       var numberOfQueriesUnlocked = 0;

        if(remainingBudget < 0){
            for(let i=0; i<numberOfQueries; i++){
                let queryTemp = (i+1).toString();

                if(queryTemp!=queryInfo.queryNumber){
                    let queryInfoTemp = window["query" + (i+1).toString() + "Info"];
                    numberOfQueriesUnlocked = numberOfQueriesUnlocked + (+!queryInfoTemp.locked);
                }
            }

            var splitBudget = Math.abs(remainingBudget)/numberOfQueriesUnlocked;
            for(let i=0; i<numberOfQueries; i++){
                let queryTemp = (i+1).toString();

                if(window["query" + queryTemp + "Info"].locked == true){
                    continue;
                }
                if(queryTemp == queryInfo.queryNumber){
                    continue;
                }
                
                let queryTempValue = parseFloat(d3.format('.3')(window["query" + queryTemp + "Slider"].value()));
                let newValue = queryTempValue - splitBudget;
                if(newValue < 0){
                    newValue = 0.001;
                }
                window["query" + (i+1).toString() + "Slider"].value(newValue);
                
            }
        }
   }
}

for (let i = 0; i < numberOfQueries; i++) {
    let queryInfo = window["query" + (i+1).toString() + "Info"];
    generateQueryVis(queryInfo);
    fillMetadata(queryInfo);
}

function generateQueryVis(queryInfo) {

    let accuracySVGs = []
    for (let i = 0; i < queryInfo.numberOfGroups; i++) {
        accuracySVGs[i] = d3.select("#query" + queryInfo.queryNumber + "AccuracyVis" + (i+1).toString())
        .append("svg")
        .attr('width', originalWidth)
        .attr('height',originalHeight)
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

    setUpEpsilonSlider(accuracySVGs,queryInfo,expanded=false,reset=false, hopsOn=true);
    update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded=false,hopsOn=true);
    d3.select("#query" + queryInfo.queryNumber + "ExtrapolationCheckbox").on("change", function() {update_checkbox(accuracySVGs,queryInfo,hypotheticalDPReleases,nonprivate_CIs,DP_CIs,counter_default,nDots,expanded=false,hopsOn=true);});
}

var max_output_dist = 1;
var sensitivity = 1;
make_risk_vis();
// Risk visualization start
function make_risk_vis(){
    // RISK VISUALIZATION
    const RISK_PANEL_WIDTH = document.getElementById('risk_vis').clientWidth;
    const RISK_HEIGHT = 270;

    // generate data
    var risk_data = [];
    var i = 0;
    while (i < (query1Info.MAX_EPSILON*numberOfQueries)+ .01) {
        var temp_epsilon = i;
        var risk_upper_bound = 1 / (1 + (totalN - 1) * Math.exp(-temp_epsilon * max_output_dist / sensitivity))

        risk_data.push({
            "epsilon": i,
            "risk_upper_bound": risk_upper_bound
        });
       
        i = i + .01; //https://stackoverflow.com/questions/10473994/javascript-adding-decimal-numbers-issue
    }

    // https://www.tutorialsteacher.com/d3js/axes-in-d3
    window.risk_svg = d3.select("#risk_vis")
        .append("svg")
        .attr("width", RISK_PANEL_WIDTH)
        .attr("height", RISK_HEIGHT);

    //Create scale
    window.x_scale_risk = d3.scaleLinear()
        .domain([0, query1Info.MAX_EPSILON*numberOfQueries])
        .range([0, RISK_PANEL_WIDTH - 50]);

    // Add scales to axis
    window.x_axis_risk = d3.axisBottom()
        .scale(x_scale_risk);

    //Append group and insert axis
    risk_svg.append("g")
        .attr("class", "x-axis")
        .call(x_axis_risk)
        .attr("transform", "translate(45," + (RISK_HEIGHT - 40) + ")")

    risk_svg.append("text")
        .attr("transform", "translate(" + (x_scale_risk(4)+30) + "," + (RISK_HEIGHT - 10) + ")")
        .style("text-anchor", "middle")
        .style("font-family", "Avenir")
        .style("font-size", "12px")
        .html("privacy budget (&#949;)");
    
    risk_svg.append("text")
        .attr("transform", "translate(" + 8 + "," + (RISK_HEIGHT - .5*RISK_HEIGHT) + ")rotate(270)")
        .style("text-anchor", "middle")
        .style("font-family", "Avenir")
        .style("font-size", "12px")
        .html("disclosure risk");

    window.y_scale_risk = d3.scaleLinear()
        .range([RISK_HEIGHT - 40, 0])
        .domain([0, risk_data[risk_data.length-1].risk_upper_bound]);

    window.y_axis_risk = d3.axisLeft()
        .ticks(10)
        .scale(y_scale_risk)
        .tickFormat(d3.format(".0%"));

    risk_svg.append("g")
        .attr("class", "y-axis")
        .call(y_axis_risk)
        .attr("transform", "translate(45," + (0) + ")");

    var risk_epsilon_line_func = d3.line()
        .x(function (d) { return x_scale_risk(d.epsilon); })
        .y(function (d) { return y_scale_risk(d.risk_upper_bound); })
        .curve(d3.curveLinear);

    risk_svg.append('path')
        .attr('d', risk_epsilon_line_func(risk_data))
        .attr("transform", "translate(45,0)")
        .attr("class","risk_path_1")
        .attr('stroke-width', 1)
        .attr("fill","none")
        .attr("stroke","black");

    for (let i = 0; i < numberOfQueries; i++) {
        let queryTemp =  window["query" + (i+1).toString() + "Info"]
        queryTemp.current_risk = 1 / (1 + (totalN - 1) * Math.exp(-queryTemp.current_epsilon * max_output_dist / sensitivity));

        risk_tooltip = d3.select("#risk_vis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position","fixed")

        // Three functions that change the tooltip when user hover / move / leave a cell
        // source: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html#template
        let mouseover_1 = function (event, d) {
            risk_tooltip
                .style("opacity", 1)
    
            risk_svg.selectAll(".risk_path_1")
                    .style("opacity", .5)
        }

        let mousemove_1 = function (event, d) {
            risk_tooltip
              .html(queryTemp.name + ": " + d3.format('.2%')(queryTemp.current_risk))
              .style("left", (event.clientX + 10) + "px")
              .style("top", (event.clientY + 10) + "px")
              .style("font-size","13px")
          }
          let mouseleave_1 = function (event, d) {
            risk_tooltip
              .style("opacity", 0);
          }

        risk_svg.append('line')
            .attr("class","riskLine" + (i+1).toString())
            .attr("x1", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("y1", y_scale_risk(queryTemp.current_risk))
            .attr("x2", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("y2", y_scale_risk(0))
            .attr("stroke-width", 1)
            .style("stroke-dasharray", "2,2")
            .attr("stroke", "gray")

        risk_svg.append('line')
            .attr("class","riskLine" + (i+1).toString())
            .attr("x1", x_scale_risk(0) + 45)
            .attr("y1", y_scale_risk(queryTemp.current_risk))
            .attr("x2", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("y2", y_scale_risk(queryTemp.current_risk))
            .attr("stroke-width", 1)
            .style("stroke-dasharray", "2,2")
            .attr("stroke", "gray")

        risk_svg.append("circle")
            .attr("class","query" + (i+1).toString() + "risk_circle")
            .attr("cx", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("cy", y_scale_risk(queryTemp.current_risk))
            .attr("r", 4)
            .on("mouseover", mouseover_1)
            .on("mousemove", mousemove_1)
            .on("mouseleave", mouseleave_1);

    }

    let usedBudget = totalBudget-getRemainingBudget();
    let totalRisk = 1 / (1 + (totalN - 1) * Math.exp(-usedBudget * max_output_dist / sensitivity));

    risk_tooltip_overall = d3.select("#risk_vis")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position","fixed")

    // Three functions that change the tooltip when user hover / move / leave a cell
    // source: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html#template
    let mouseover_overall = function (event, d) {
        risk_tooltip_overall
            .style("opacity", 1)
    }

    let mousemove_overall = function (event, d) {
        risk_tooltip_overall
        .html("Overall: " + d3.format('.2%')(totalRisk))
        .style("left", (event.clientX + 10) + "px")
        .style("top", (event.clientY + 10) + "px")
        .style("font-size","13px")
    }
    let mouseleave_overall = function (event, d) {
        risk_tooltip_overall
        .style("opacity", 0);
    }

    risk_svg.append('line')
        .attr('class', 'total_risk')
        .attr("x1", x_scale_risk(usedBudget) + 45)
        .attr("y1", y_scale_risk(totalRisk))
        .attr("x2", x_scale_risk(usedBudget) + 45)
        .attr("y2", y_scale_risk(0))
        .attr("stroke-width", 1)
        .style("stroke-dasharray", "2,2")
        .attr("stroke", "gray")

    risk_svg.append('line')
        .attr('class', 'total_risk')
        .attr("x1", x_scale_risk(0) + 45)
        .attr("y1", y_scale_risk(totalRisk))
        .attr("x2", x_scale_risk(usedBudget) + 45)
        .attr("y2", y_scale_risk(totalRisk))
        .attr("stroke-width", 1)
        .style("stroke-dasharray", "2,2")
        .attr("stroke", "gray")

    risk_svg.append("circle")
        .attr("class","total_risk")
        .attr("cx", x_scale_risk(usedBudget) + 45)
        .attr("cy", y_scale_risk(totalRisk))
        .attr("r", 4)
        .on("mouseover", mouseover_overall)
        .on("mousemove", mousemove_overall)
        .on("mouseleave", mouseleave_overall);


} // end of make_risk_vis function

function update_risk_vis(queryNumber){

    if (typeof risk_tooltip !=="undefined"){
        risk_tooltip.style("opacity", 0);
    }

    if (typeof risk_tooltip_overall !=="undefined"){
        risk_tooltip_overall.style("opacity", 0);
    }

    risk_svg.selectAll(".riskLine" + queryNumber)
        .data([])
        .exit()
        .remove();

    risk_svg.selectAll(".query" + queryNumber + "risk_circle")
        .data([])
        .exit()
        .remove();

    risk_svg.selectAll(".total_risk")
        .data([])
        .exit()
        .remove();

    let queryTemp =  window["query" + queryNumber + "Info"]

    queryTemp.current_risk = 1 / (1 + (totalN - 1) * Math.exp(-queryTemp.current_epsilon * max_output_dist / sensitivity));
    
    risk_tooltip = d3.select("#risk_vis")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position","fixed")

    // Three functions that change the tooltip when user hover / move / leave a cell
    // source: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html#template
    let mouseover_1 = function (event, d) {
        risk_tooltip
            .style("opacity", 1);
    }

    let mousemove_1 = function (event, d) {
        risk_tooltip
        .html(queryTemp.name + ": " + d3.format('.2%')(queryTemp.current_risk))
        .style("left", (event.clientX + 10) + "px")
        .style("top", (event.clientY + 10) + "px")
        .style("font-size","13px")
    }
    let mouseleave_1 = function (event, d) {
        risk_tooltip
        .style("opacity", 0);
    }
    
    risk_svg.append('line')
            .attr("class","riskLine" + queryNumber)
            .attr("x1", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("y1", y_scale_risk(queryTemp.current_risk))
            .attr("x2", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("y2", y_scale_risk(0))
            .attr("stroke-width", 1)
            .style("stroke-dasharray", "2,2")
            .attr("stroke", "gray")
    
    risk_svg.append('line')
            .attr("class","riskLine" + queryNumber)
            .attr("x1", x_scale_risk(0) + 45)
            .attr("y1", y_scale_risk(queryTemp.current_risk))
            .attr("x2", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("y2", y_scale_risk(queryTemp.current_risk))
            .attr("stroke-width", 1)
            .style("stroke-dasharray", "2,2")
            .attr("stroke", "gray")
    
    risk_svg.append("circle")
            .attr("class","query" + queryNumber + "risk_circle")
            .attr("cx", x_scale_risk(queryTemp.current_epsilon) + 45)
            .attr("cy", y_scale_risk(queryTemp.current_risk))
            .attr("r", 4)
            .on("mouseover", mouseover_1)
            .on("mousemove", mousemove_1)
            .on("mouseleave", mouseleave_1);
    
    let usedBudget = totalBudget-getRemainingBudget();
    let totalRisk = 1 / (1 + (totalN - 1) * Math.exp(-usedBudget * max_output_dist / sensitivity));

    risk_tooltip_overall = d3.select("#risk_vis")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position","fixed")

    // Three functions that change the tooltip when user hover / move / leave a cell
    // source: https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html#template
    let mouseover_overall = function (event, d) {
        risk_tooltip_overall
            .style("opacity", 1)
    }

    let mousemove_overall = function (event, d) {
        risk_tooltip_overall
        .html("Overall: " + d3.format('.2%')(totalRisk))
        .style("left", (event.clientX + 10) + "px")
        .style("top", (event.clientY + 10) + "px")
        .style("font-size","13px")
    }
    let mouseleave_overall = function (event, d) {
        risk_tooltip_overall
        .style("opacity", 0);
    }

    risk_svg.append('line')
        .attr('class', 'total_risk')
        .attr("x1", x_scale_risk(usedBudget) + 45)
        .attr("y1", y_scale_risk(totalRisk))
        .attr("x2", x_scale_risk(usedBudget) + 45)
        .attr("y2", y_scale_risk(0))
        .attr("stroke-width", 1)
        .style("stroke-dasharray", "2,2")
        .attr("stroke", "gray")

    risk_svg.append('line')
        .attr('class', 'total_risk')
        .attr("x1", x_scale_risk(0) + 45)
        .attr("y1", y_scale_risk(totalRisk))
        .attr("x2", x_scale_risk(usedBudget) + 45)
        .attr("y2", y_scale_risk(totalRisk))
        .attr("stroke-width", 1)
        .style("stroke-dasharray", "2,2")
        .attr("stroke", "gray")

    risk_svg.append("circle")
        .attr('class', 'total_risk')
        .attr("cx", x_scale_risk(usedBudget) + 45)
        .attr("cy", y_scale_risk(totalRisk))
        .attr("r", 4)
        .on("mouseover", mouseover_overall)
        .on("mousemove", mousemove_overall)
        .on("mouseleave", mouseleave_overall);
}
