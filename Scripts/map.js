$(function () {

    $('[data-toggle="tooltip"]').tooltip();
    //------Map----------------
    var init_map = function () {
        let originSource = new ol.source.Vector({
            features: []
        });
        strLayer = new ol.layer.Vector({
            source: originSource,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: 'green' }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 2
                    })
                })
            })
        });
        let distSource = new ol.source.Vector({
            features: []
        });
        let MaxSource = new ol.source.Vector({
            features: []
        });
        var distLayer = new ol.layer.Vector({
            source: distSource,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: 'red' }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 2
                    })
                })
            })
        });
        var MaxLayer = new ol.layer.Vector({
            source: MaxSource,
            
        });

        let routeSource = new ol.source.Vector({
            features: []
        });
        var routeLayer = new ol.layer.Vector({
            source: routeSource,
            //style: new ol.style.Style({
            //    stroke: new ol.style.Stroke({
            //        width: 5,
            //        color: [0, 0, 256, 1]
            //    })
           // })
        });

        var map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
                strLayer,
                distLayer,
                routeLayer,
                MaxLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([174.75481796893288, -36.87077722591518]),
                zoom: 11
            })
        });

        map.on('click', e => {
            if (map.clickHandler) { map.clickHandler(e) };
        });

        let setButtomAsMapTool = function (id, handler, cursor, titleText) {

            $(`#${id}`).addClass('map-tool');
            $(`#${id}`).click(e => {
                if (titleText) {
                    $("#title span").text(titleText);
                    $("#title").show();
                }
                else
                    $("#title").hide();

                $('#map').css('cursor', cursor);
                $('.map-tool').removeClass('active');
                $(`#${id}`).addClass('active');
                map.clickHandler = handler;
            });
        };

        setButtomAsMapTool(
            'btnStart',
            function (e) {
                MaxSource.clear();
                var pointOrg = new ol.Feature({
                    type: 'distMarker',
                    geometry: new ol.geom.Point([
                        e.coordinate[0],
                        e.coordinate[1]
                    ])
                });
                originSource.clear();
                routeSource.clear();
                originSource.addFeature(pointOrg);
                var strCor = getlatlong(originSource
                    .getFeatures()[0].getGeometry()
                    .getCoordinates());
                $("#orgCoordinate").val(Math.round(strCor[0] * 100000) / 100000 + " , " + Math.round(strCor[1] * 100000) / 100000);

                if (distSource.getFeatures().length == 0) {
                    $("#btnDist").trigger("click");
                }
                else {
                    map.clickHandler = null;
                    $("#title").hide();
                }

            },
            'crosshair',
            "Select your origin!"
        );

        var distinationPoint = function (e) {
            MaxSource.clear();
            var pointDist = new ol.Feature({
                type: 'distMarker',
                geometry: new ol.geom.Point([
                    e.coordinate[0],
                    e.coordinate[1]
                ])

            });
            distSource.clear();
            routeSource.clear();
            distSource.addFeature(pointDist);
            var distCor = getlatlong(distSource
                .getFeatures()[0]
                .getGeometry()
                .getCoordinates());
            $("#distCoordinate").val(Math.round(distCor[0] * 100000) / 100000 + " , " + Math.round(distCor[1] * 100000) / 100000);

            map.clickHandler = null;
            $("#title").hide();
        };
        setButtomAsMapTool(
            'btnDist',
            distinationPoint,
            'crosshair',
            "Select your destination!"
        );

        $('#driving').click(() => {
            $('#map').css('cursor', 'default');
            if (
                originSource.getFeatures().length == 1 &&
                distSource.getFeatures().length == 1
            ) {
                createRoute(google.maps.TravelMode.DRIVING);
            } else {
                window.alert('Please select your origin and your destination!');
            }
        });

        $('#byBus').click(() => {
            $('#map').css('cursor', 'default');
            if (
                originSource.getFeatures().length == 1 &&
                distSource.getFeatures().length == 1
            ) {
                createRoute(google.maps.TravelMode.TRANSIT);
            } else {
                window.alert('Please select your origin and your destination!');
            }
        });


        $('.travel-mode').click(e => {

            $('.travel-mode').removeClass('btn-info');
            $('.travel-mode').addClass('btn-basic');

            $(e.currentTarget).removeClass('btn-basic');
            $(e.currentTarget).addClass('btn-info');

        });



        $('#Go').click(() => {

            var id = $(".travel-mode.btn-info").data("type");
            let travelMode = google.maps.TravelMode.WALKING;

            if (id == "byBicycle") {
                travelMode = google.maps.TravelMode.BICYCLING;
            }

            $('#map').css('cursor', 'default');
            if (
                originSource.getFeatures().length == 1 &&
                distSource.getFeatures().length == 1
            ) {
                createRoute(travelMode);
            } else {
                window.alert('Please select your origin and your destination!');
            }



        });



        var createRoute = (travelMode) => {
            var org = getlatlong(
                originSource
                    .getFeatures()[0]
                    .getGeometry()
                    .getCoordinates()
            );
            var dist = getlatlong(
                distSource
                    .getFeatures()[0]
                    .getGeometry()
                    .getCoordinates()
            );

            var origin = new google.maps.LatLng(org[1], org[0]);
            var destination = new google.maps.LatLng(dist[1], dist[0]);
            var directionService = new google.maps.DirectionsService();

            directionService.route(
                {
                    destination: destination,
                    origin: origin,
                    travelMode: travelMode,
                    provideRouteAlternatives: true
                },
                function (response, status) {
                    routeSource.clear();
                    var TypeRouts = response.request.travelMode;
                    if (status == 'OK') {
                        var routes = response.routes.map((route, j) => {

                            var locations = [];
                            locations = route.overview_path;
                            locations = [origin].concat(locations);
                            locations.push(destination);

                            return {
                                Id: j + 1,
                                Coords: locations,
                                Duration: route.legs[0].distance.text,
                                Distance: route.legs[0].duration.text,
                                DurationValue: route.legs[0].distance.text,
                                DistanceValue: route.legs[0].duration.text
                            }
                        });
                        sendRouts(TypeRouts, routes);
                    } else {
                        window.alert(
                            'Directions request failed due to ' + status
                        );
                    }
                }
            );
        };


        var sendRouts = (TypeRouts, routs) => {
            var data = {
                TypeRouts: TypeRouts, Routs: routs.map(a => {
                    return { Id: a.Id, Distance: a.Distance, Duration: a.Duration, Path: convertUTM(a.Coords) }
                })
            };

            $.ajax({
                url: "/home/GetPath",
                data: JSON.stringify(data),
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                success: function (result) {

                    let minDose = result.sort((a, b) => a.Pollution - b.Pollution)[0].Pollution;
                    var resultArray = result.sort((a, b) => a.MeanPollution - b.MeanPollution);
                    resultArray[0].isMinPollution = true;

                    var routId = routs.sort((a, b) => a.DistanceValue - b.DistanceValue)[0].Id;
                    resultArray.find(a => a.Id == routId).isMinDistance = true;

                    routId = routs.sort((a, b) => a.DurationValue - b.DurationValue)[0].Id;
                    resultArray.find(a => a.Id == routId).isMinDuration = true;

                    var colorRamp = new ColorRamp('#00ff00', '#ff0000', resultArray.length);
                    $("#map-result").html("");
                    MaxSource.clear();


                    for (var i = 0; i < resultArray.length; i++) {

                        //Create Report Table----------------------
                        let div = $("<div></div>");
                        div.addClass("result");
                        let table = $("<table></table>");
                        table.addClass('table');
                        var color1 = `#${colorRamp.getColor(i)}`;
                        let tbody = $("<tbody></tbody>");
                        /*let tr = $(`<tr><td>Duration: ${resultArray[i].Distance}</td><td>Distance: ${resultArray[i].Duration}</td></tr>
                               <tr><td>Dose: ${Math.round(resultArray[i].Pollution * 10000) / 10}</td><td>Exposure: ${Math.round(resultArray[i].MeanPollution * 1000000) / 1000000}</td></tr>
                               <tr><td ><div style="display:none">Max Exposure:${Math.round(resultArray[i].MaxPollution.Value * 1000000) / 1000000}</div></td><td style="color:${color1};text-align: right">${resultArray[i].isMinPollution ? "<i class='fas fa-bell' title='Minimum Exposure' data-placement='bottom' data-toggle='tooltip'></i>" : ""}    ${resultArray[i].isMinDistance ? "<i class='fa fa-arrows-h' title='Minimum Distance' data-placement='bottom' data-toggle='tooltip'></i>" : ""}     ${resultArray[i].isMinDuration ? "<i class='fas fa-clock' title='Minimum Duration' data-placement='bottom' data-toggle='tooltip'></i> " : ""}</td></tr>`);*/
                        let tr = $(`<tr><td>Duration: ${resultArray[i].Distance}</td><td>Distance: ${resultArray[i].Duration}</td></tr>
                               <tr><td>Dose: ${Math.round(((minDose / resultArray[i].Pollution) - 1) * 100) / 100}%</td><td>Exposure: ${Math.round(((resultArray[0].MeanPollution / resultArray[i].MeanPollution)-1) * 100) / 100}%</td></tr>
                               <tr><td ><div style="display:none">Max Exposure:${Math.round(resultArray[i].MaxPollution.Value * 1000000) / 1000000}</div></td><td style="color:${color1};text-align: right">${resultArray[i].isMinPollution ? "<i class='fas fa-bell' title='Minimum Exposure' data-placement='bottom' data-toggle='tooltip'></i>" : ""}    ${resultArray[i].isMinDistance ? "<i class='fa fa-arrows-h' title='Minimum Distance' data-placement='bottom' data-toggle='tooltip'></i>" : ""}     ${resultArray[i].isMinDuration ? "<i class='fas fa-clock' title='Minimum Duration' data-placement='bottom' data-toggle='tooltip'></i> " : ""}</td></tr>`);
                        tbody.append(tr);
                        table.append(tbody);
                        div.append(table);
                        console.log(color1);
                        div.css('border-left-color', color1);
                        $("#map-result").append(div);
                        //Draw Featurs and set color ------------------------------------------------
                        var polyline = new ol.geom.LineString(
                            routs.find(a => a.Id == resultArray[i].Id).Coords.map(a => [a.lng(), a.lat()])
                        );
                        polyline.transform('EPSG:4326', 'EPSG:3857');
                        var routeFeature = new ol.Feature(polyline);
                        routeFeature.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                width: 5,
                                color: color1
                            })
                        }));
                        routeSource.addFeature(routeFeature);

                        //Show Max Pollution Point------------------------------------
                        var latlong = convertLatLong(resultArray[i].MaxPollution);
                        var pointMax = new ol.Feature({
                            type: 'distmarker',
                            geometry: new ol.geom.Point([
                                latlong[0],
                                latlong[1]
                            ]).transform('EPSG:4326', 'EPSG:3857')
                        });
                        pointMax.setStyle(new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 7,
                                fill: new ol.style.Fill({ color: color1 }),
                                stroke: new ol.style.Stroke({
                                    color: color1,
                                    width: 2
                                })
                            })
                        }));
                        
                        MaxSource.addFeature(pointMax);

                    }

                }
            });
        };
         return map;
    };

    let map = init_map();


});

var createTable = () => {
    let div = $("<div></div>");
    div.addClass("result");
    let table = $("<table></table>");
    table.addClass('table table-hover');
    div.append(table);
    $("#map-result").html(div);
    //let thead = $("<thead></thead>");
    //let trow = $("<tr></tr>");
    //thead.append(trow);
    //table.append(thead);
    //trow.append($("<th>Distance</th>"));
    //trow.append($("<th>Time</th>"));
    return table;
}
var getlatlong = feature => {
    var point = ol.proj.transform(feature, 'EPSG:3857', 'EPSG:4326');
    return point;
};
var convertUTM = (locations) => {
    var firstProjection = '+proj=longlat +ellps=WGS84 + datum=WGS84 + no_defs';//proj4.defs["SR-ORG:14"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    var secondProjection = '+proj=utm +zone=60 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs ';//proj4.defs['EPSG:32759'] = "+proj=utm +zone=59 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

    var points = locations.map(a => {
        var g = proj4(firstProjection, secondProjection).forward([a.lng(), a.lat()]);
        return { X: g[0], Y: g[1] }
    })


    return points;
};
var convertLatLong = (location) => {
    var secondProjection = '+proj=longlat +ellps=WGS84 + datum=WGS84 + no_defs';//proj4.defs["SR-ORG:14"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    var firstProjection = '+proj=utm +zone=60 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs ';//proj4.defs['EPSG:32759'] = "+proj=utm +zone=59 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

    return proj4(firstProjection, secondProjection).forward([location.X, location.Y]);
};




// var tmp = generateColor('#00ff00', '#ff0000', 5);



