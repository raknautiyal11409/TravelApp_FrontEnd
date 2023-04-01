var formOnPage = false;
var navigationOff;
var plannerRouter = false;
var routingControl;
var routingControlNavigation;

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

        // Define routing options
        var options = {
            profile: 'mapbox/walking', // Specify walking as the mode of transportation
            alternatives: true // Request alternative routes
        };

        // Create a custom Mapbox routing engine with the specified options
        var mapboxRouting = L.Routing.mapbox(MapboxAPIkey, options);


        // >>>>>>>>>>>>>>>>> add roputing machine for planning <<<<<<<<<<<<<<<<<<<<<
        routingControl = L.Routing.control({
            position: 'bottomleft',
            waypoints: [
                start,
                destination
            ],
            router: mapboxRouting,
            createMarker: function(i, waypoint) {
                return null;
            },
            routeWhileDragging: false,
            geocoder: L.Control.Geocoder.nominatim(),
            autoRoute: true,
            showAlternatives: true,
            containerClassName: 'itenary-for-routing_contrainer',
            itineraryClassName: 'itenary-for-routing',
            alternativeClassName: 'itenary-for-routing_alt',
            collapsible:true,
            altLineOptions: {
                styles: [
                    { color: '#f00', opacity: 0.6, weight: 5 }, // red
                    { color: '#0f0', opacity: 0.6, weight: 5 }, // green
                    { color: '#00f', opacity: 0.6, weight: 5 }  // blue
                ]
            }
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

            // add display for vicinity search results
            var vicSearchResults = vicSearchDisplay(routingControlNavigation)

            // add second routing machine for navigation 
            routingControlNavigation = L.Routing.control({
                router: mapboxRouting,
                createMarker: function() {
                    return null;
                },
                collapsible:true,
                itineraryClassName: 'itenary-for-navigation',
                alternativeClassName: 'itenary-for-navigation_alt',
                containerClassName: 'itenary-for-navigation_contrainer',
                showAlternatives: false,
            }).addTo(map);

            // show navigation UI
            var vicintiySearchOptions = navigationPannelSearchInterface(routingControlNavigation, vicSearchResults);

            // add the waypoints form the routing planner
            routingControlNavigation.setWaypoints(waypoints);
            map.removeLayer(startMarker);
            navigationOff = false;

            // test naviagtion 
            // testNavigation(coordsOnRouteArray, routingControlNavigation);

            // start navigation function 
            navigation(routingControlNavigation);
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

// navigation function 
function navigation(routingControl){
    var customMarker = L.icon({
        iconUrl: '../Images/new-moon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    var navigation = L.control.locate(); 

    // var navigationMarker = L.marker([0,0], {icon: customMarker}).addTo(map);

    // start tracking user location
    navigation.start();

    // add waypoint markers 
    var waypointMarkers= []; // store waypoint markers
    var route_waypoints = routingControl.getWaypoints(); // get waypoints on the route
    for(var i = 1; i<route_waypoints.length; i++){
        waypointMarkers[i] = L.marker(route_waypoints[i].latLng).addTo(map);
    }

    // set a marker while the user is moving
    var navigationMarker = L.marker([0,0], {icon: customMarker}).addTo(map);
    
    map.on('locationfound', function(e) {
        routingControlNavigation.spliceWaypoints(0, 1, e.latlng);
        // control.route();
        // navigationMarker.setLatLng(e.latlng);
        
        navigationMarker.setLatLng(e.latlng); // make marker move with location

        routingControl.spliceWaypoints(0, 1, e.latlng); // re-route as the user moves

        // check if a waypoint has been reached 
        for(var z=1; z< waypointMarkers.length; z++){
            var distanceToWaypoint = map.distance(e.latlng, route_waypoints[z].latLng);

            if (distanceToWaypoint < 50){
                map.removeLayer(waypointMarkers[z]);
                routingControl.spliceWaypoints(1, 1,e.latlng);
            }
        }

        // keep map centered in the user
        map.setView(e.latlng, map.getZoom(), {'animate' : true, "pan": {
            "duration": 10
        }});

    });
}


function vicinitySearch(currentLocation) {
    var bounds = searchRadiusB_Box(currentLocation);
    L.esri.Geocoding.geocode({apikey: esriApiKey}).text('Cafe').within(bounds).run(function (err, response) {
        if (err) {
        console.log(err);
        return;
        }
        console.log(response);
        show_VicinitySearch_results(response);
    }); 
}

// add a display for vicinity search results
function vicSearchDisplay(){
    // add add buttons for navigation system
    var vicSearchResults = L.control.custom({
        position: 'topleft',
        id: 'vicintiyResults',
        content :   '<button id="open_resultsButton">100</button>'+
        '<div id="vicintiyResultsOpen" style="display: none">'+
          '<div id="vicintiyResultsDynamicCont">'+
          '</div>'+
          '<hr>'+
          '<button type="button" class="btn btn-danger" id="vicSearchCloseButton"> CLOSE </button>'+
        '</div>',
    }).addTo(map);

    // show the results on click
    $('#open_resultsButton').on('click', function(){
        $('#open_resultsButton').css('display', 'none');
        $('#vicintiyResultsOpen').css('display', 'block');
        $('#navigation-control').css('display', 'none');
    });

    // back to button on click
    $('#vicSearchCloseButton').on('click', function(){
        $('#open_resultsButton').css('display', 'block');
        $('#vicintiyResultsOpen').css('display', 'none');
        $('#navigation-control').css('display', 'block');
    });

    return vicSearchResults;
}

// loop though to show seach results
function show_VicinitySearch_results(results) {

    var numberOfResults = results.results.length;

    $('#open_resultsButton').text(numberOfResults);

    if(numberOfResults>0){
        $('#vicintiyResultsDynamicCont').text('');

        for(var i=0; i < numberOfResults; i++ ){
            $('#vicintiyResultsDynamicCont').append('<div class="row vicintyResults rounded-pill mt-2" >'+
            '<h6 class="col ms-4">'+ results.results[i].properties.PlaceName +'</h6>'+
            '<button class="col rounded-pill addStopButton"  value="'+ [results.results[i].latlng.lat, results.results[i].latlng.lng] +'">ADD STOP</button>'+
            '<p class="row ms-2">'+ results.results[i].properties.LongLabel +'</p>'+
            '</div>');
        }

        $('.addStopButton').on('click', function(){
            var latlng = $(this).val();
            var latlngArray = latlng.split(",");
            var newlatlng = L.latLng(latlngArray[0],latlngArray[1]);
            routingControlNavigation.spliceWaypoints(1, 0, newlatlng);

            // get back to normal navigation screen
            $('#open_resultsButton').css('display', 'block');
            $('#vicintiyResultsOpen').css('display', 'none');
            $('#navigation-control').css('display', 'block');
        });
         
    }

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

// add UI while nvigating
function navigationPannelSearchInterface (routingMachine, vicSearchResults) {
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
                    '<label for="customRange1" id="rangeTag" class="form-label"></label>'+
                    '<input type="range" class="form-range" id="vicinityRange" max="20" value="2"></input>'+
                    '<hr class="mt-2">'+
                    '<div class="row vicinityOptionInput_div">'+
                        '<label class="form-label" for="vicinityOptionInput"> Or Enter:</label>'+
                        '<input type="text" id="vicinityOptionInput" class="form-control" />'+
                    '</div>'+
                    '<button type="submit" style="display: none"></button>'+
            '</form>');

            // update range 
            $('#rangeTag').text('Range: ' + $('#vicinityRange').val() +'km'); // set initial value
  
            $('#vicinityRange').on('input', function() {
                $('#rangeTag').text('Range: ' + $('#vicinityRange').val() +'km'); // update value on input change
            });

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

    
    // button to cancel navigation 
    $('#cancelNavigation').on('click', function(){
        
        if(formOnPage){ // get all the options selected for the vicinity search
            var formOptions = []
            formOptions.push( { 'radioInput' :  $("input[name='vicinityOption']:checked").val()}); // get selected option
            formOptions.push( { 'textInput' :   $('#vicinityOptionInput').val()});
            formOptions.push( {'range' : $('#vicinityRange').val()});

            map.on('locationfound', function(e){
                formOptions.push( {'latlng' : e.latlng});
                return formOptions;
            });

        } else {
            map.removeControl(vicSearchResults);
            map.removeControl(navigationControl);
            map.removeControl(routingMachine);
            addToggleMenuButton();
            navigationOff = false;

            // add search back
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

// close button to cancle navigation planner
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