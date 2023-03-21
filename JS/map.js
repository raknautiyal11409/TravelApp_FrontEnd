var searchButton = document.getElementById("searchButton");
var getCurrentLocation = document.getElementById("getCurrentLocation");
var HOST = 'http://127.0.0.1:8000/account';
var locationMarker;
var circle;
var poi_markers;
var current_loc;
var map_ins;
var showMarkerDetials
const map = L.map('map', {
    maxBounds: L.latLngBounds([90, -180], [-90, 180])
}).fitWorld();

// Add Geoapify Address Search control
var myAPIKey = "826cc571070340f49a8ae82427859b4d"; 
// mapBox API KEY
const mapBoxAPIkey = 'pk.eyJ1IjoicmFrMTQwOSIsImEiOiJjbGZoYmx2ZTUzaGN0M3lwY2g5aGJwNG9wIn0.OfdLIA8gsn7riXEMGI-OMg'

// -----------------  show marker details --------------------------
showMarkerDetials = L.control.custom({
    position: 'bottomleft',
    content : '<div id="show_marker_det" class="container-sm">'+
            '<h4 id="show_marker_det_heding" class="row mt-1 ms-2">Heading</h4>' +
            '<div class="row container-fluid">' +
            '<p class="row m-0" >Content</p>' +
            '<p class="row m-0">Content</p>' +
            '</div>' +
            '<div  id="show_marker_det_buttons" class="row container-fluid mt-2">'+
            '<button class="col rounded-circle ms-2 me-2" type="button">'+
                '<i class="fas fa-book-bookmark fa-xl"></i>'+
            '</button>'+
            '<button class="col rounded-circle me-2" type="button">'+
                '<i class="fas fa-heart fa-xl"></i>'+
            '</button>'+
            '<button class="col rounded-circle me-3" type="button">'+
                '<i class="fas fa-map-pin fa-xl"></i>'+
            '</button>'+
            '<button class="col rounded-pill ms-5" type="button">'+
                '<i class="fas fa-map-location fa-xl"></i>'+
            '</button>'+
            '</div>'+
            '</div>',
    classes : 'container',
    style   :
    {
        height : '170px',
        'pointer-events': 'none',
    },
    events:
    {
        click: function(data)
        {
            console.log('wrapper div element clicked');
        },
    }
});

// -----------------  add map layer --------------------------
// Get current location 
// getCurrentLocation.addEventListener('click', function() {
//     map_init_basic(map, null);
//     console.log('Button clicked!');
//   });

// var map = L.map('map').fitWorld();

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: '© OpenStreetMap'
// }).addTo(map);

L.tileLayer('https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=826cc571070340f49a8ae82427859b4d', {
  attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors',
  maxZoom: 20, id: 'osm-bright'
}).addTo(map);

// set the minimum zoom level to 5
map.setMinZoom(3);
  
// -----------------  add search --------------------------
const addressSearchControl = L.control.addressSearch(myAPIKey, {
    position: 'topright',
    resultCallback: (address) => {
      var location = [address['lat'] ,address['lon']];
      if (locationMarker) {
        map.removeLayer(locationMarker); // remove any previously added marker
      }
      map.flyTo(location, 16);
      locationMarker = L.marker(location).addTo(map);
    },
    suggestionsCallback: (suggestions) => {
      console.log(suggestions);
    }
});
map.addControl(addressSearchControl);

// -----------------  dislplay current location --------------------------

// set map to user current location and save data to the database 
function map_init_basic(map, options) {
    var pos;
    map.setView([53.5, -8.5], 11);
    updateLocation(map);
}

// call necessary functions to update user location and display the user location on the map
function updateLocation(map) {
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            setMapToCurrentLocation(map, pos);
            // update_db(pos);
            current_loc = pos;
            map_ins = map;
        },
        function (err) {
        },
        {
            enableHighAccuracy: true,
            timeout: 30000
        }
    );
}

// button to fly to current location 
new L.cascadeButtons([
    {icon:"fas fa-location-crosshairs" , ignoreActiveState:true , command: () =>{
        map_init_basic(map, null);
     }},
], {position:'topleft', direction:'horizontal'}).addTo(map);

// set map to current location 
function setMapToCurrentLocation(map, pos) {
    console.log("In setMapToCurrentLocation.");
    var myLatLon = L.latLng(pos.coords.latitude, pos.coords.longitude);
    map.flyTo(myLatLon, 16); // added animation
    // locationMarker = L.marker(myLatLon).addTo(map); // add the new marker to the application
    if (circle) {
        map.removeLayer(circle); //remove circle if already present
    }

    // add the circle around the current location
    circle = L.circle(myLatLon, {
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.3,
        radius: 40
    }).addTo(map);
    $(".toast-body").html("Found location<br>Lat: " + myLatLon.lat + " Lon: " + myLatLon.lng);
    $(".toast").toast('show');
}

// show results of the overpass query on the map
function showPoiMarkers() { 
    console.log("In showPoiMarkers");
    
    // If we have markers on the map from a previous query, we remove them.
    if (poi_markers) {
        map.removeLayer(poi_markers);
    }
    
    // Show a spinner to indicate Ajax call in progress.
    // toggleCentredSpinner("show");
    
    $.ajax({
        type: "POST",
        headers: {"Authorization": window.localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + "/map_search/",
        data: {
            query: $("#searchValue").val(),
            bbox: map.getBounds().toBBoxString()
        },
        success: function(data) {

            //Create a cluster group for our markers to avoid clutter. 'Marker Cluster' is a Leaflet plugin.
            poi_markers = L.markerClusterGroup();
            
            // Handle GeoJSON response from the server.
            var geoJsonLayer = L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    // Associate each point with the icon we made earlier
                    return L.marker(latlng, {icon: greenIcon});
                },
                onEachFeature: function (feature, layer) {
                    // For each feature associate a popup with the 'name' property
                    layer.bindPopup(feature.properties.name);
                }
            });
            
            // Add the GeoJSON layer to the cluster.
            poi_markers.addLayer(geoJsonLayer);
            
            // Add the cluster to the map.
            map.addLayer(poi_markers);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            var message = "OSM Overpass query failed.<br/>";
            console.log("Status: " + jqXHR.status + " " + jqXHR.responseText);
            showOkAlert(message);
        },
        always: function () {
            toggleCentredSpinner("hide");
        }
    });
}

// -----------------  click on map  --------------------------

// Add a click event listener to the map
map.on('click', function(e) {


    if (locationMarker ) { // remove any previously added marker
        map.removeLayer(locationMarker); 
    }
    map.removeControl(showMarkerDetials);
});

map.on('contextmenu', function(e) {
    
    if (locationMarker ) { // remove any previously added marker
        map.removeLayer(locationMarker); 
    }

    // if(){ // refresh div
    //     map.removeControl(showMarkerDetials);
    // }
    
    // Add show marker div to page
    showMarkerDetials.addTo(map);

    // Create a new marker at the clicked location
    locationMarker = L.marker(e.latlng).addTo(map);
  });



