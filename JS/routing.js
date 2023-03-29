// get route from current location (Main Roting and Navigation function)
function showRoute(destination) {
    // const geodesicLine = L.Geodesic().addTo(map);
    var start;
    var navigationOff= true;
    var iconFinish;
    var plannerRouter = false;
    var customMarker = L.icon({
        iconUrl: '../Images/compass.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    getCurerntLocation().then(function(currentLocation){
        start = currentLocation;
    }).catch(function(err) {
        console.log('Failed to get current location:', err);
        alert('Failed to get the current loction. Please turn on location.')
    }).then(function(){
        
        // remove existing markers
        for (var i = 0; i < marker.length; i++) {
            if(marker[i]){
                map.removeLayer(marker[i]);
            }
        }

        // Remove the Esri search control from the map to prevent freatures collision
        if (searchControl) {
            map.removeControl(searchControl);
        }

        // remove display
        if(showMarkerDetialOnMap){
            map.removeControl(showMarkerDetial);
            showMarkerDetialOnMap = false;
        }

        var startMarker = L.marker(start);

        // >>>>>>>>>>>>>>>>> add roputing machine for planning <<<<<<<<<<<<<<<<<<<<<
        var routingControl = L.Routing.control({
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

        // add a button to start navigation 
        $('.leaflet-routing-geocoders').append('<button id="startNavigation" type="button"> NAVIGATE <i class="fas fa-location-arrow" style="color: rgb(0, 147, 245)"></i></button>');

        var isControlOnMap = map.hasLayer(routingControl.getContainer());
        // start navigation
        $('#startNavigation').on('click', function(){
            if(!plannerRouter){
                map.removeControl(routingControl);
                plannerRouter = true;
            }

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
        iconUrl: '../Images/compass.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    var navigationMarker = L.marker(coordsOnRouteArray[0], {icon: customMarker}).addTo(map);

    for (let i = 0; i < coordsOnRouteArray.length-100; i++) { // simulate route
        setTimeout(function() {
            console.log(coordsOnRouteArray[i]);
            // map.setView(coordsOnRouteArray[i],20);
            // routingControl.spliceWaypoints(0, 1, coordsOnRouteArray[i]);

            navigationMarker.setLatLng(coordsOnRouteArray[i]);
            var waypoints = routingControl.getWaypoints();
            waypoints[0] = coordsOnRouteArray[i];
            routingControl.setWaypoints(waypoints);
            if(i==1){
                // vicinitySearch(coordsOnRouteArray[i]);
            }
        }, 1000 * i);

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