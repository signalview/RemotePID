
const size_plot = 40;
var temperature_data = 26;
var setpoint_data = 25;
const inputSet = document.getElementById("inputSet");




console.log('starting...');

// Create a client instance
var usuario = 'UPS-GYE' + Math.random() * 1000
console.log('Usuario MQTT: ' + usuario);

// var client = new Paho.MQTT.Client('test.mosquitto.org', 8080, usuario)
var client = new Paho.MQTT.Client('broker.hivemq.com', 8000, usuario)

client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({ onSuccess: onConnect, onFailure: onConnectFail });


// called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log('Conectado 🎉')
    client.subscribe("ups/gye/temp0");
    // message = new Paho.MQTT.Message("Hello");
    // message.destinationName = "World";
    // client.send(message);
}
function onConnectFail(error) {

    alert('😢 No pudimos conectarnos al servidor de datos.')
    // client = new Paho.MQTT.Client('test.mosquitto.org', 8081, usuario)
    // client.connect({onSuccess: onConnect, onFailure: () => { console.log('No Conectado!') }
    // });

}


// called when a message arrives
function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.payloadString);
    temperature_data = Number(message.payloadString)

    var thermometer = document.querySelector('svg').querySelectorAll('rect')[2];
    var y = scale(temperature_data)
    thermometer.setAttribute('y', y)
    thermometer.setAttribute('height', tubeFill_bottom - y)
}



















// navigation tabs
function openPage(pageName, elmnt, color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "flex";
    elmnt.style.backgroundColor = color;
}


// Remote
// function remote(type, data) {

//     if (type == 'POST') {

//         console.log("POST data:" + data);
//         var url = "http://3.89.91.254:8001/WebServiceUPM/LABO/post";
//     } else if (type == 'GET') {
//         var url = "http://3.89.91.254:8001/WebServiceUPM/LABO/get";
//     }

//     var xmlhttp = new XMLHttpRequest();
//     xmlhttp.open(type, url, true);

//     if (type == 'POST')
//         xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

//     xmlhttp.onreadystatechange = function () { // Call a function when the state changes.
//         if (this.status === 200 && xmlhttp.responseText) {
//             // Request finished. Do processing here.
//             console.log("respuesta: " + xmlhttp.responseText);

//             var temp = JSON.parse(xmlhttp.responseText).Temperatura;
//             var set = JSON.parse(xmlhttp.responseText).SetPoint;
//             console.log('***************************' + setpoint_data)
//             if (temp != undefined) {
//                 temp = Number(temp);
//                 temp = temp.toFixed(2);
//                 temperature_data = temp

//                 var thermometer = document.querySelector('svg').querySelectorAll('rect')[2];
//                 var y = scale(temp)
//                 thermometer.setAttribute('y', y)
//                 thermometer.setAttribute('height', tubeFill_bottom - y)

//             }
//             if (set != undefined) {
//                 setpoint_data = set
//                 range.noUiSlider.set(setpoint_data);
//                 // updateSetPoint();
//             }
//         } else
//             console.log(xmlhttp.status);

//     }

//     if (type == 'POST')
//         xmlhttp.send("data=" + data);
//     else
//         xmlhttp.send();
//     console.log("enviado...");
// }

// function update() {
//     remote('GET', null);
//     setTimeout(update, 1000);
// }

// update();

// function updateSetPoint() {
//     setpoint = range.noUiSlider.get();
//     console.log("SetPoint: " + setpoint);
//     remote('POST', setpoint);
// }


// chart


var h;
var m;
var s;
const refresh_time = 1000;

function getTime() {
    date = new Date();
    h = date.getHours();
    m = date.getMinutes();
    s = date.getSeconds();
    // var clock = y + '/' + mm + '/' + d + '/' + '--' + h + ':' + m + ':' + s;
    if (String(m).length == 1)
        m = '0' + m;
    setTimeout(getTime, refresh_time);
}
getTime()

var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [h + ':' + m],
        datasets: [
            {
                label: 'Temperatura',
                borderColor: '#D64933',
                fill: false,
                data: [temperature_data],
                pointRadius: 0
            }
            // ,
            // {
            //     label: 'Setpoint',
            //     borderColor: '#29339B',
            //     fill: false,
            //     data: [25],
            //     pointRadius: 0
            // }
        ]
    },

    // Configuration options go here
    options: {
        animation: {
            duration: 0 // general animation time
        },
        // hover: {
        //     animationDuration: 0 // duration of animations when hovering an item
        // },
        responsiveAnimationDuration: 0, // animation duration after a resize

        maintainAspectRatio: false,
        responsive: true,
        legend: {
            position: 'top'
        },

        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Hora'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Grados Cº'
                }
            }]
        },
        elements: {
            line: {
                tension: 0
            }
        }
    }
});



function updateChart() {
    var datasets = chart.data.datasets;
    if (size_plot <= datasets[0].data.length) {
        chart.data.labels.shift();
        datasets.forEach(element => {
            element.data.shift();
        });
    }

    chart.data.labels.push(h + ':' + m);
    datasets[0].data.push(temperature_data);
    console.log('-------------------------SETPOINT:' + setpoint_data);

    // datasets[1].data.push(setpoint_data);
    chart.update();
    setTimeout(updateChart, refresh_time);
}
updateChart();














/*//////////////////  Thermometer*/
var width = 80,
    height = 280,
    maxTemp = 100,
    minTemp = 20,
    currentTemp = 28.2;

var bottomY = height - 5,
    topY = 5,
    bulbRadius = 20,
    tubeWidth = 25,
    tubeBorderWidth = 1,
    mercuryColor = "#D64933",
    innerBulbColor = "#D64933"
tubeBorderColor = "#555";

var bulb_cy = bottomY - bulbRadius,
    bulb_cx = width / 2,
    top_cy = topY + tubeWidth / 2;


var svg = d3.select("#thermo")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


var defs = svg.append("defs");

// Define the radial gradient for the bulb fill colour
var bulbGradient = defs.append("radialGradient")
    .attr("id", "bulbGradient")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%")
    .attr("fx", "50%")
    .attr("fy", "50%");

bulbGradient.append("stop")
    .attr("offset", "0%")
    .style("stop-color", innerBulbColor);

bulbGradient.append("stop")
    .attr("offset", "90%")
    .style("stop-color", mercuryColor);




// Circle element for rounded tube top
svg.append("circle")
    .attr("r", tubeWidth / 2)
    .attr("cx", width / 2)
    .attr("cy", top_cy)
    .style("fill", "#FFFFFF")
    .style("stroke", tubeBorderColor)
    .style("stroke-width", tubeBorderWidth + "px");


// Rect element for tube
svg.append("rect")
    .attr("x", width / 2 - tubeWidth / 2)
    .attr("y", top_cy)
    .attr("height", bulb_cy - top_cy)
    .attr("width", tubeWidth)
    .style("shape-rendering", "crispEdges")
    .style("fill", "#FFFFFF")
    .style("stroke", tubeBorderColor)
    .style("stroke-width", tubeBorderWidth + "px");


// White fill for rounded tube top circle element
// to hide the border at the top of the tube rect element
svg.append("circle")
    .attr("r", tubeWidth / 2 - tubeBorderWidth / 2)
    .attr("cx", width / 2)
    .attr("cy", top_cy)
    .style("fill", "#FFFFFF")
    .style("stroke", "none")



// Main bulb of thermometer (empty), white fill
svg.append("circle")
    .attr("r", bulbRadius)
    .attr("cx", bulb_cx)
    .attr("cy", bulb_cy)
    .style("fill", "#FFFFFF")
    .style("stroke", tubeBorderColor)
    .style("stroke-width", tubeBorderWidth + "px");


// Rect element for tube fill colour
svg.append("rect")
    .attr("x", width / 2 - (tubeWidth - tubeBorderWidth) / 2)
    .attr("y", top_cy)
    .attr("height", bulb_cy - top_cy)
    .attr("width", tubeWidth - tubeBorderWidth)
    .style("shape-rendering", "crispEdges")
    .style("fill", "#FFFFFF")
    .style("stroke", "none");


// Scale step size
var step = 5;

// Determine a suitable range of the temperature scale
var domain = [
    step * Math.floor(minTemp / step),
    step * Math.ceil(maxTemp / step)
];

if (minTemp - domain[0] < 0.66 * step)
    domain[0] -= step;

if (domain[1] - maxTemp < 0.66 * step)
    domain[1] += step;


// D3 scale object
var scale = d3.scale.linear()
    .range([bulb_cy - bulbRadius / 2 - 8.5, top_cy])
    .domain(domain);


// Max and min temperature lines
[minTemp, maxTemp].forEach(function (t) {

    var isMax = (t == maxTemp),
        label = (isMax ? "max" : "min"),
        textCol = (isMax ? "rgb(230, 0, 0)" : "rgb(0, 0, 230)"),
        textOffset = (isMax ? -4 : 4);

    svg.append("line")
        .attr("id", label + "Line")
        .attr("x1", width / 2 - tubeWidth / 2)
        .attr("x2", width / 2 + tubeWidth / 2 + 22)
        .attr("y1", scale(t))
        .attr("y2", scale(t))
        .style("stroke", tubeBorderColor)
        .style("stroke-width", "1px")
        .style("shape-rendering", "crispEdges");

    svg.append("text")
        .attr("x", width / 2 + tubeWidth / 2 + 2)
        .attr("y", scale(t) + textOffset)
        .attr("dy", isMax ? null : "0.75em")
        .text(label)
        .style("fill", textCol)
        .style("font-size", "11px")

});


var tubeFill_bottom = bulb_cy,
    tubeFill_top = scale(currentTemp);

// Rect element for the red mercury column
svg.append("rect")
    .attr("x", width / 2 - (tubeWidth - 10) / 2)
    .attr("y", tubeFill_top)
    .attr("width", tubeWidth - 10)
    .attr("height", tubeFill_bottom - tubeFill_top)
    .style("shape-rendering", "crispEdges")
    .style("fill", mercuryColor)


// Main thermometer bulb fill
svg.append("circle")
    .attr("r", bulbRadius - 6)
    .attr("cx", bulb_cx)
    .attr("cy", bulb_cy)
    .style("fill", "url(#bulbGradient)")
    .style("stroke", mercuryColor)
    .style("stroke-width", "2px");


// Values to use along the scale ticks up the thermometer
var tickValues = d3.range((domain[1] - domain[0]) / step + 1).map(function (v) { return domain[0] + v * step; });


// D3 axis object for the temperature scale
var axis = d3.svg.axis()
    .scale(scale)
    .innerTickSize(7)
    .outerTickSize(0)
    .tickValues(tickValues)
    .orient("left");

// Add the axis to the image
var svgAxis = svg.append("g")
    .attr("id", "tempScale")
    .attr("transform", "translate(" + (width / 2 - tubeWidth / 2) + ",0)")
    .call(axis);

// Format text labels
svgAxis.selectAll(".tick text")
    .style("fill", "#777777")
    .style("font-size", "10px");

// Set main axis line to no stroke or fill
svgAxis.select("path")
    .style("stroke", "none")
    .style("fill", "none")

// Set the style of the ticks 
svgAxis.selectAll(".tick line")
    .style("stroke", tubeBorderColor)
    .style("shape-rendering", "crispEdges")
    .style("stroke-width", "1px");



/////////////slide
// var range = document.getElementById('range');

// noUiSlider.create(range, {

//     range: {
//         'min': 0,
//         'max': 100
//     },

//     step: 1,

//     // Handles start at ...
//     start: [20],

//     // Put '0' at the bottom of the slider
//     direction: 'rtl',
//     orientation: 'vertical',

//     // Move handle on tap, bars are draggable
//     behaviour: 'tap-drag',
//     tooltips: true,
//     format: wNumb({
//         decimals: 0
//     }),

//     // Show a scale with the slider
//     pips: {
//         mode: 'range',
//         density: 3
//     }
// });
// range.style.height = '200px';


// range.noUiSlider.on('update', (values, handle, unencoded, tap, positions) => {

//     if(document.activeElement!==inputSet)
//         inputSet.value = values[0]
//     updateSetPoint()

// });

// /////////////////INPUT EVENT
// inputSet.addEventListener("keyup", function (event) {
//     // Number 13 is the "Enter" key on the keyboard
//     if (event.keyCode === 13) {
//         console.log(' SOOOOOOOOOOOOO');

//       range.noUiSlider.set(inputSet.value)
//       updateSetPoint()

//     }
//   });