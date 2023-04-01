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

    // add a marker for each waypoint
    var waypointMarkers= [];
    var route_waypoints = routingControl.getWaypoints();
    for(var i = 1; i<route_waypoints.length; i++){
        waypointMarkers[i] = L.marker(route_waypoints[i].latLng).addTo(map);
    }

    // add a marker for navigation 
    var navigationMarker = L.marker(coordsOnRouteArray[0], {icon: customMarker}).addTo(map);

    
    // for loop to go along the routed path
    for (let i = 0; i < coordsOnRouteArray.length; i++) { // simulate route
        if(!navigationOff){
            var timeout = setTimeout(function() {
                if(!navigationOff){
                    // Another way to make gps work
                    // map.setView(coordsOnRouteArray[i],20);

                    // keep map at the user while routing
                    map.setView(coordsOnRouteArray[i], map.getZoom(), {'animate' : true, "pan": {
                        "duration": 10
                    }});

                    navigationMarker.setLatLng(coordsOnRouteArray[i]); // make marker move with location

                    
                    routingControl.spliceWaypoints(0, 1, coordsOnRouteArray[i]); // re-route as the user moves


                    // check if a waypoint has been reached 
                    for(var z=1; z< waypointMarkers.length; z++){
                        var  route_waypoint = route_waypoints[z];
                        var distanceToWaypoint = map.distance(coordsOnRouteArray[i], route_waypoint.latLng);

                        if (distanceToWaypoint < 50){
                            map.removeLayer(waypointMarkers[z]);
                            routingControl.spliceWaypoints(1, 1,coordsOnRouteArray[i]);
                        }
                    }
                    // update the route
                    
                    // waypoints[0] = coordsOnRouteArray[i];
                    // routingControlNavigation.setWaypoints(waypoints);

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