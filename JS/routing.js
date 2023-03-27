// get route from current location (Main Roting and Navigation function)
function showRoute(destination) {
    var start;
    getCurerntLocation().then(function(currentLocation){
        start = currentLocation;
    }).catch(function(err) {
        console.log('Failed to get current location:', error);
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

        var routingControl = L.Routing.control({
            position: 'bottomleft',
            waypoints: [
                start,
                destination
            ],
            routeWhileDragging: true,
            geocoder: L.Control.Geocoder.nominatim(),
            reverseWaypoints: true,
            showAlternatives: true,
            altLineOptions: {
                styles: [
                { color: '#f00', opacity: 0.6, weight: 5 }, // red
                { color: '#0f0', opacity: 0.6, weight: 5 }, // green
                { color: '#00f', opacity: 0.6, weight: 5 }  // blue
                ]
            }
        }).addTo(map);

        var coordsOnRouteArray =[];
        // add the point on the route in an array for route suimulation
        routingControl.on('routesfound', function(e) {
            var routeCoords = e.routes[0].coordinates;
            
            routeCoords.forEach(function(coordinate) {
                coordsOnRouteArray.push(L.latLng(coordinate.lat, coordinate.lng));
            });
        });

        $('.leaflet-routing-geocoders').append('<button id="startNavigation" type="button"> NAVIGATE <i class="fas fa-location-arrow" style="color: rgb(0, 147, 245)"></i></button>');
        $('#startNavigation').on('click', function(){
            testNavigation(coordsOnRouteArray, routingControl);
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

    for (let i = 0; i < coordsOnRouteArray.length; i++) { // simulate route
        setTimeout(function() {
            console.log(coordsOnRouteArray[i]);
            map.setView(coordsOnRouteArray[i],20);
            routingControl.spliceWaypoints(0, 1, coordsOnRouteArray[i]);
        }, 1000 * i);
    }
}
