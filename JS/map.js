var searchButton = document.getElementById("searchButton");
var HOST = location.protocol + "//" + location.host;
var locationMarker;
var circle;
var poi_markers;
var current_loc;
var map_ins;

// Add an event listener to the button
searchButton.addEventListener('click', function() {
    showPoiMarkers();
    console.log('Button clicked!');
  });

var map = L.map('map').fitWorld();

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

//create and icon to display the search results
var LeafIcon = L.Icon.extend({
    options: {
       iconSize:     [38, 95],
       shadowSize:   [50, 64],
       iconAnchor:   [22, 94],
       shadowAnchor: [4, 62],
       popupAnchor:  [-3, -76]
    }
});

// create leaflet icons to pinpoint locations
var greenIcon = new LeafIcon({
    iconUrl: 'http://leafletjs.com/examples/custom-icons/leaf-green.png',
    shadowUrl: 'http://leafletjs.com/examples/custom-icons/leaf-shadow.png'
})

map.locate({setView: true, maxZoom: 16});

function onLocationFound(e) {
    var radius = e.accuracy;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}

map.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}


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
        headers: {"Authorization": localStorage.accessToken},
        url: HOST + "/map_search/",
        data: {
            query: $("#searchValue").val(),
            bbox: map.getBounds().toBBoxString()
        }
    }).done(function (data, status, xhr) {
        
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
    }).fail(function (xhr, status, error) {
        var message = "OSM Overpass query failed.<br/>";
        console.log("Status: " + xhr.status + " " + xhr.responseText);
        showOkAlert(message);
    }).always(function () {
        toggleCentredSpinner("hide");
    });
}
