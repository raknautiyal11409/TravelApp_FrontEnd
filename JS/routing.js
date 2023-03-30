var formOnPage = false;
var navigationOff;
var plannerRouter = false;
var routingControl;

// get route from current location (Main Roting and Navigation function)
function showRoute(destination) {
    // const geodesicLine = L.Geodesic().addTo(map);
    var start;
    var iconFinish;
    navigationOff= true;
    var customMarker = L.icon({
        iconUrl: '../Images/compass.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });


    getCurerntLocation().then(function(currentLocation){
        start = currentLocation;
    }).catch(function(err) {
        console.log('Failed to get current location:', err);
        alert('Failed to get the current loction. Please turn on location.');
    }).then(function(){
        
        // remove existing markers
        for (var i = 0; i < marker.length; i++) {
            if(marker[i]){
                map.removeLayer(marker[i]);
            }
        }

        if(toggleMenuExpanded){
            map.removeControl(expandedMenu);
            toggleMenuExpanded = false;
        }

        if(locationMarker){
            map.removeLayer(locationMarker);
        }

        // remove saved markers
        if(representLocationMarker) {
            map.removeLayer(representLocationMarker);
        }

        // Remove the Esri search control from the map to prevent freatures collision
        if (searchControl) {
            map.removeControl(searchControl);
        }

        // remove marker details display
        if(showMarkerDetialOnMap){
            map.removeControl(showMarkerDetial);
            showMarkerDetialOnMap = false;
        }

        var startMarker = L.marker(start);

        // >>>>>>>>>>>>>>>>> add roputing machine for planning <<<<<<<<<<<<<<<<<<<<<
        routingControl = L.Routing.control({
            position: 'bottomleft',
            waypoints: [
                start,
                destination
            ],
            createMarker: function(i, waypoint) {
                if (i === 0) {
                    if(navigationOff){
                        startMarker.setLatLng(waypoint.latLng)
                        return startMarker;
                    }else{return null;}
                }
                // Create a marker for all other waypoints
                return L.marker(waypoint.latLng);
            },
            routeWhileDragging: false,
            geocoder: L.Control.Geocoder,
            autoRoute: true,
            showAlternatives: false,
            containerClassName: 'itenary-for-routing_contrainer',
            itineraryClassName: 'itenary-for-routing',
            alternativeClassName: 'itenary-for-routing_alt',
            collapsible:true,
            // altLineOptions: {
            //     styles: [
            //     { color: '#f00', opacity: 0.6, weight: 5 }, // red
            //     { color: '#0f0', opacity: 0.6, weight: 5 }, // green
            //     { color: '#00f', opacity: 0.6, weight: 5 }  // blue
            //     ]
            // }
        }).addTo(map);

        var coordsOnRouteArray;
        var waypoints;
        
        // routingControl.on('routingStart', function(){
            
        // })

        // run function when a rote is found
        routingControl.on('routesfound', function(e) {
            plannerRouter = false;
            waypoints = routingControl.getWaypoints()
            var routeCoords = e.routes[0].coordinates;
            coordsOnRouteArray =[];
            routeCoords.forEach(function(coordinate) { // add the point on the route in an array for route suimulation
                coordsOnRouteArray.push(L.latLng(coordinate.lat, coordinate.lng));
            });
        });

        closeNavigationButton();

        // add a button to start navigation 
        $('.leaflet-routing-geocoders').append('<button id="startNavigation" type="button"> NAVIGATE <i class="fas fa-location-arrow" style="color: rgb(0, 147, 245)"></i></button>');

        // >>>>>>>>>>> start navigation <<<<<<<<<<<<<<<
        $('#startNavigation').on('click', function(){

            if(!plannerRouter){
                map.removeControl(routingControl);
                plannerRouter = true;
            }

            // remove pevious close button 
            if(crossButtonIsOnMap){
                map.removeControl(removeSearchMarkerButton);
            }

            map.setView(coordsOnRouteArray[1],18);

            

            // add second routing machine for navigation 
            var routingControlNavigation = L.Routing.control({
                createMarker: function(i, waypoint) {
                    if (i === 0) {
                        return null;
                    }
                    // Create a marker for all other waypoints
                    return L.marker(waypoint.latLng);
                },
                collapsible:true,
                itineraryClassName: 'itenary-for-navigation',
                alternativeClassName: 'itenary-for-navigation_alt',
                containerClassName: 'itenary-for-navigation_contrainer',
                showAlternatives: false,
            }).addTo(map);

            // show navigation UI
            var navigationSearchUI = navigationPannelSearchInterface(routingControlNavigation);

            // add the waypoints form the routing planner
            routingControlNavigation.setWaypoints(waypoints);
            map.removeLayer(startMarker);
            navigationOff = false;
            testNavigation(coordsOnRouteArray, routingControlNavigation);
        });
        

        if(routingControl){
            map.removeControl(toggleMenuButton);
        }
    });

}

// get current user location 
function getCurerntLocation() {
    var lnglat
    return new Promise(function(resolve, reject) {
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    lnglat = L.latLng(pos.coords.latitude, pos.coords.longitude);
                    resolve(lnglat);
                },
                function (err) {
                    reject(err.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000
                }
            );
        }else {
            reject('Geolocation is not supported by this browser'); 
        }
    });
}

function testNavigation(coordsOnRouteArray, routingControl) {
    // enable GPS tracking
    // map.locate({watch: true, 
    //     setView: true,
    //     enableHighAccuracy});
    var customMarker = L.icon({
        iconUrl: '../Images/new-moon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    var navigationMarker = L.marker(coordsOnRouteArray[0], {icon: customMarker}).addTo(map);

    
    // for loop to go along the routed path
    for (let i = 0; i < coordsOnRouteArray.length-100; i++) { // simulate route
        if(!navigationOff){
            var timeout = setTimeout(function() {
                if(!navigationOff){
                    console.log(coordsOnRouteArray[i]);
                    // map.setView(coordsOnRouteArray[i],20);
                    // routingControl.spliceWaypoints(0, 1, coordsOnRouteArray[i]);

                    // // setmarker angle
                    // if (i>0) {
                    //     var previousPoint = L.latLng(coordsOnRouteArray[i-1].lat, coordsOnRouteArray[i-1].lng);
                    //     var currentPoint = L.latLng(coordsOnRouteArray[i].lat, coordsOnRouteArray[i].lng);
                    //     var travelAngel = L.GeometryUtil.bearing(previousPoint, currentPoint);
                    // }

                    map.setView(coordsOnRouteArray[i], map.getZoom(), {'animate' : true, "pan": {
                        "duration": 10
                    }});

                    navigationMarker.setLatLng(coordsOnRouteArray[i]);
                    var waypoints = routingControl.getWaypoints();
                    waypoints[0] = coordsOnRouteArray[i];
                    routingControl.setWaypoints(waypoints);

                    if(i==1){
                        // vicinitySearch(coordsOnRouteArray[i]);
                    }
                }else{
                    if(navigationMarker){
                        map.removeLayer(navigationMarker);
                    }
                    
                    // break;
                    clearTimeout(timeout);
                }
            }, 1000 * i);
        } else{
            if(navigationMarker){
                map.removeLayer(navigationMarker);
            }
            
            break;
        }

        // calculate the angle between the current and previous positions
        // if (i>0) {
        //     var angle = coordsOnRouteArray[i].bearingTo(coordsOnRouteArray[i-1]);
        //     map.setBearing(angle); // set the map's bearing to the angle
        // }
    }
}

function vicinitySearch(currentLocation) {

    // console.log('hello');
    // var bounds = searchRadiusB_Box(currentLocation);
    // L.esri.Geocoding.geocode({apikey: esriApiKey}).text('Cafe AND Pub').within(bounds).run(function (err, response) {
    //     if (err) {
    //     console.log(err);
    //     return;
    //     }
    //     console.log(response);
    // }); 
}

// get a bounding box for the search radius
function searchRadiusB_Box(currentUserLocation){

    var turf_point = turf.point([currentUserLocation.lng, currentUserLocation.lat]);
    var options = { steps: 64, units: 'kilometers' };
    var circle = turf.circle(turf_point, 2, options);
    var bbox = turf.bbox(circle);
    var bounds = L.latLngBounds(L.latLng(bbox[1], bbox[0]), L.latLng(bbox[3], bbox[2]));
    return bounds;

}

function navigationPannelSearchInterface (routingMachine) {
    // add add buttons for navigation system
    var navigationControl = L.control.custom({
        position: 'bottomright',
        id: 'navigation-control',
        content :   '<div id="navigationPannel" class="row">'+
                    '<form class="row justify-content-center" id="navigation-control-form"> </div>'+
                    '<div id="navigation-control-Buttons" class="row">' +
                    '<button id="search" class="col rounded-pill" > '+
                       '<i class="fas fa-magnifying-glass fa-xl"> </i>'+
                   '</button>'+
                   '<button id="cancelNavigation" class="col rounded-pill "> '+
                       '<i class="fas fa-circle-xmark fa-xl"> </i>'+
                   '</button>'+
                   '</div>' +
                   '</div>',
        classes: 'container justify-content-center'
    }).addTo(map);


    // dynamically add form when button is clicked
    $('#search').on('click', function(){
        
        if(!formOnPage){

            // empty div before adding contents
            $('#navigation-control-form').text('');

            // add from 
            $('#navigation-control-form').html('<form class="row justify-content-center"> '+
                    '<h6 class="row" id="navigationFormHeading"> Sealect Option</h6>'+
                    '<hr>'+
                    '<div class="row">'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Arts and Entertainment">'+
                        '<label class="col" for="html"> Arts and Entertainment </label>'+
                        '</div>'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Education">'+
                        '<label class="col" for="html"> Education </label>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Land Features">'+
                        '<label class="col" for="html"> Land Features </label>'+
                        '</div>'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Food">'+
                        '<label class="col" for="html"> Food </label>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Nightlife Spot">'+
                        '<label class="col" for="html"> Nightlife Spot </label>'+
                        '</div>'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Parks and Outdoors">'+
                        '<label class="col" for="html"> Parks and Outdoors </label>'+
                    ' </div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Shops and Service">'+
                        '<label class="col" for="html"> Shops and Service </label>'+
                        '</div>'+
                        '<div class="col">'+
                        '<input class="col" type="radio" name="vicinityOption" value="Travel and Transport">'+
                        '<label class="col" for="html"> Travel and Transport </label>'+
                        '</div>'+
                    '</div>'+
                    '<hr class="mt-2">'+
                    '<div class="row vicinityOptionInput_div">'+
                        '<label class="form-label" for="vicinityOptionInput"> Or Enter:</label>'+
                        '<input type="text" id="vicinityOptionInput" class="form-control" />'+
                    '</div>'+
                    '<button type="submit" style="display: none"></button>'+
            '</form>');

            // display form
            $('#navigation-control-form').css('display', 'block');

            formOnPage = true;

            //change cancel button to search button functionality
            $('#cancelNavigation').html('<i class="fas fa-magnifying-glass fa-xl"> </i>');
            $('#cancelNavigation').css('background-color', 'rgba(0, 174, 255)');

            //change search button to back button functionality
            $('#search').html('<i class="fas fa-arrow-left fa-xl"> </i>');
            $('#search').css('background-color', 'rgb(255, 208, 0)');

        } else{
            formOnPage = false;
            // display form
            $('#navigation-control-form').css('display', 'none');

            // empty div before adding contents
            $('#navigation-control-form').text('');

            //change cancel button to search button functionality
            $('#cancelNavigation').html('<i class="fas fa-circle-xmark fa-xl"> </i>');
            $('#cancelNavigation').css('background-color', 'rgb(250, 32, 32)');

            //change search button to back button functionality
            $('#search').html('<i class="fas fa-magnifying-glass fa-xl"> </i>');
            $('#search').css('background-color', 'rgb(0, 174, 255)');
        }
    });

    

    $('#cancelNavigation').on('click', function(){
        
        if(formOnPage){

        } else {
            map.removeControl(navigationControl);
            map.removeControl(routingMachine);
            addToggleMenuButton();
            navigationOff = fasle;

            // add seach back
            searchControl = L.esri.Geocoding.geosearch({
                providers: [
                    L.esri.Geocoding.arcgisOnlineProvider({
                    // API Key to be passed to the ArcGIS Online Geocoding Service
                    apikey: esriApiKey
                    })
                ],
                useMapBounds: 8
            }).addTo(map);
        }

    });

}


function closeNavigationButton(){
    // remove search result markers from the page 
    removeSearchMarkerButton = L.control.custom({
        position: 'topright',
        id:'removeMarkersButton',
        content : 
                '<button class="rounded-circle container-xs w-3 h-3" id="close_button" type="button">'+
                    '<i class="fas fa-xmark fa-2xl"></i>'+
                '</button>',
        classes: 'rounded-circle w-3 h-3',
        events:
        {
            click: function() {

                map.removeControl(removeSearchMarkerButton);

                if(!plannerRouter){
                    map.removeControl(routingControl);
                    plannerRouter = true;
                }

                addToggleMenuButton();
                navigationOff = false;

                // add seach back
                searchControl = L.esri.Geocoding.geosearch({
                    providers: [
                        L.esri.Geocoding.arcgisOnlineProvider({
                        // API Key to be passed to the ArcGIS Online Geocoding Service
                        apikey: esriApiKey
                        })
                    ],
                    useMapBounds: 8
                }).addTo(map);

            },
            
        }
    }).addTo(map);
    crossButtonIsOnMap = true;
}