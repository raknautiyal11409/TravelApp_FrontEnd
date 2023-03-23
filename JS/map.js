var searchButton = document.getElementById("searchButton");

var HOST = 'http://127.0.0.1:8000/account';
var locationMarker;
var circle;
var poi_markers;
var current_loc;
var map_ins;
var showMarkerDetial;
var showMarkerDetialOnMap = false;
var marker = [];
var removeSearchMarkerButton;
var crossButtonIsOnMap = false;
var toggleMenuExpanded = false;
var expandedMenu;

const map = L.map('map', {
    maxBounds: L.latLngBounds([90, -180], [-90, 180])
}).fitWorld();
var searchMarkers= [];

// Esri API
const esriApiKey = 'AAPKe4688fca2b1c4405981a6518c0c88dcd4jIDDrgcGBJWw0ZxlKpyA6OAqsPzALckDhsqhpE-1y9YWu-PsVTzkgYC445HlTZv'
const basemapEnum = "ArcGIS:Navigation";

// example using an Esri Basemap Styles API name
L.esri.Vector.vectorBasemapLayer("ArcGIS:Streets", {
    // provide either `apikey` or `token`
    apikey: esriApiKey
  }).addTo(map);

// set the minimum zoom level to 5
map.setMinZoom(3);

// button to fly to current location 
new L.cascadeButtons([
    {icon:"fas fa-location-crosshairs" , ignoreActiveState:true , command: () =>{
        map_init_basic(map, null);
     }},
], {position:'topleft', direction:'horizontal'}).addTo(map);

// ----------------- add toggle menu ----------------------
 L.control.custom({
    position: 'topright',
    id: 'toggleButtonMenu',
    content :   '<button id="toggleMenu" class="rounded-circle">'+
                   '<i class="fas fa-bars fa-xl"></i>'+
               '</button>',
    events:
    {
        click: function() {
            $('#toggleMenu').html('<i class="fas fa-xmark fa-2xl"></i>');
            if(!toggleMenuExpanded){ // check if alredy expanded
                $('#toggleMenu').animate( // toggle animation
                    { deg: 90 },
                    {
                        duration: 400,
                        step: function(now) {
                            $(this).css({ transform: 'rotate(' + now + 'deg)' });
                        }
                    }
                );
                expandToggleMenu();
            } else {
                $('#toggleMenu').animate(
                    { deg: -0 },
                    {
                        duration: 400,
                        step: function(now) {
                            $(this).css({ transform: 'rotate(' + now + 'deg)' });
                        }
                    }
                );
                map.removeControl(expandedMenu);
                $('#toggleMenu').html('<i class="fas fa-bars fa-xl"></i>');
                toggleMenuExpanded = false;
            }
        },
        
    }
}).addTo(map);

// expanded toggle menu
function expandToggleMenu() {
    expandedMenu = L.control.custom({
        position: 'topright',
        id: 'toggleButtonMenuOptions',
        content :   '<button id="userAccountButton" class="rounded-pill">'+
                       '<i class="fas fa-user fa-xl"> <p> Account </p></i>'+
                   '</button>'+
                   '<button id="userFavouritesButton" class="rounded-pill">'+
                       '<i class="fas fa-heart fa-xl"> <p> Favourites </p></i>'+
                   '</button>'+
                   '<button id="userBookmarksButton" class="rounded-pill">'+
                       '<i class="fas fa-book-bookmark fa-xl"> <p> Bookmarks </p></i>'+
                   '</button>'+
                   '<button id="userPinsButton" class="rounded-pill">'+
                       '<i class="fas fa-map-pin fa-xl"> <p> Pins </p></i>'+
                   '</button>',
    }).addTo(map);
    toggleMenuExpanded = true

    $('#userBookmarksButton').on('click', function() {
        displayBookmarkFolders();
    });
}

  
// -----------------  add search --------------------------

// esri geocoder 
var searchControl = L.esri.Geocoding.geosearch({
providers: [
    L.esri.Geocoding.arcgisOnlineProvider({
    // API Key to be passed to the ArcGIS Online Geocoding Service
    apikey: esriApiKey
    })
],
useMapBounds: 8
}).addTo(map);

searchControl.on('search:results', function(data) {
    console.log(data.results);
  });

// create an empty layer group to store the results and add it to the map
var results = L.layerGroup().addTo(map);


// show the pointers on the map
searchControl.on('results', function(data) {
    var searchResults = data.results;
    
    // remove pevious close button 
    if(crossButtonIsOnMap){
        map.removeControl(removeSearchMarkerButton);
        showMarkerDetialOnMap = false;
    }
    
    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }

    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }

    // remove existing markers
    for (var i = 0; i < marker.length; i++) {
        if(marker[i]){
            map.removeLayer(marker[i]);
        }
    }

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
                // remove existing markers
                for (var i = 0; i < marker.length; i++) {
                    if(marker[i]){
                        map.removeLayer(marker[i]);
                    }
                }

                map.removeControl(removeSearchMarkerButton);

                if(showMarkerDetialOnMap){
                    map.removeControl(showMarkerDetial);
                    showMarkerDetialOnMap = false;
                }
            },
            
        }
    }).addTo(map);
    crossButtonIsOnMap = true;

    // add markers to the map 
    for (var i = 0; i < searchResults.length; i++) {
        var markerName, markerLatLong, markerAddress;
        var result = searchResults[i];
        marker[i] = L.marker(result.latlng).addTo(map);
        markerName =  result.properties.PlaceName;
        markerAddress =  result.properties.LongLabel;
        markerLatLong =  " Lat: " + result.latlng.lat.toFixed(5) + ", Lng: " + result.latlng.lng.toFixed(5);
        marker[i].bindPopup("<span class='markerName'>"+ markerName +"</span><span class='markerAddress'>"+ markerAddress + "</span><span class='markerLatLong'>"+ markerLatLong +"</span>");

        // get marker details and display in div
        marker[i].on('click', function(e) {
            var popupContent = e.target.getPopup().getContent();
            var parser = new DOMParser();
            var doc = parser.parseFromString(popupContent, "text/html");
            var mN = doc.querySelector('.markerName');
            var mLL = doc.querySelector('.markerLatLong');
            var mA = doc.querySelector('.markerAddress');
            mN = mN.textContent;
            mA = mA.textContent;
            mLL = mLL.textContent;

            // call function to add details to the div
            showMarkerDetials = showMarkerDetails(mN, mA, mLL);
        });
    }


});


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
    if (results ) { // remove any previously added marker
        results.clearLayers();
    }
    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }
});

map.on('contextmenu', function(e) {
    
    if (locationMarker ) { // remove any previously added marker
        map.removeLayer(locationMarker); 
    }

    if (results ) { // remove any previously added marker
        results.clearLayers();
    }

    // remove existing markers
    for (var i = 0; i < marker.length; i++) {
        if(marker[i]){
            map.removeLayer(marker[i]);
        }
    }

    // if(){ // refresh div
    //     map.removeControl(showMarkerDetials);
    // }

    // Create a new marker at the clicked location
    locationMarker = L.marker(e.latlng).addTo(map);
  });



// -----------------  show marker details --------------------------
function showMarkerDetails(name, address, marerkerCords) {

    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }

    showMarkerDetial = L.control.custom({
        position: 'bottomleft',
        content : '<div id="show_marker_det" class="container-sm">'+
                '<h4 id="show_marker_det_heding" class="row mt-1 ms-2"> ' + name  + ' </h4>' +
                '<div class="row container-fluid">' +
                '<p class="row m-0" > ' + address + ' </p>' +
                '<p class="row m-0"> ' + marerkerCords + ' </p>' +
                '</div>' +
                '<div  id="show_marker_det_buttons" class="row container-fluid mt-2">'+
                '<button id="addBookmarkButton" class="col rounded-circle ms-2 me-2" type="button">'+
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
        style   :
        {
            height : '170px',
            'pointer-events': 'none',
            'margin-left': '10px',  
        },
    }).addTo(map);

    $('#addBookmarkButton').on('click', function() {
        bookmarkFolderNameInput();
    });
    
    showMarkerDetialOnMap = true;
}




// show form to input folder name
function bookmarkFolderNameInput() {
    var nameInputBox = L.control.custom({ 
        position: 'bottomleft',
        id: 'addBookmarkFolder-Name',
        content : '<form class="container">'+
        '<label for="addFolder" class="row form-label">Input Folder Name</label>'+
        '<input type="text" class="row form-control" id="addFolderNameInputField"/>'+
        '<div id="addBookmarkFolder-buttons" class="row mt-2 ms-5">'+
          '<button id="cancel-bookmark-action"  class="col btn btn-outline-danger btn-sml" type="button"> Cancel </button>'+
          '<button id="add-bookmark-folder"  class="col ms-2 btn btn-primary" type="button"> Add </button>'+
       ' </div>'+
       ' </form>',
        
    }).addTo(map);

    $('#cancel-bookmark-action').on('click', function(){
        map.removeControl(nameInputBox);
    });

    $('#add-bookmark-folder').on('click', function(){
        addBoomarkFolder($('#addFolderNameInputField').val(), nameInputBox)
    });
}


// Add folder to the database
function addBoomarkFolder(folderName, nameInputBox) {

    if(folderName != "") {
        $.ajax({
            type: "POST",
            headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
            // contentType: "application/json",
            url: HOST + "/api/addBookmarFolder/",
            data: {
                name: folderName
            },
            success: function(data) {
                alert('Added Bookmark Folder Succesfully');
                map.removeControl(nameInputBox);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('FAILED to add Bookmark Folder ');
            },
        });
    } else{
        alert("Please fill in the name")
    }
}

// Function to dynamically show bookmark folders in a contianer
function displayBookmarkFolders() {

    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }

    var bookmarkFolder_diaplay = L.control.custom({
        position: 'bottomleft',
        id: 'display_BookmarkFolders',
        content : 
        '<div id="bFolder_continer" class="container">'+
          '<div class="row">'+
            '<h2 id="bFolder_heading" class="col pt-2"> Bookmark Folders</h2>'+
            '<button type="button" class="col pt-2" id="add_BookmarkFolder" >'+
                '<i class="fas fa-folder-plus fa-xl"></i>'+
            '</button>'+
            '<button type="button" class="col pt-2" id="close_BookmarkFolderDiaplay" >'+
              '<i class="fas fa-xmark fa-xl"></i>'+
            '</button>'+
          '</div>'+
          '<hr id="bFolder_divider">'+
          '<div id="folders" class="row justify-content-center" >'+
          '</div>'+
        '</div>',
    }).addTo(map);

    $('#close_BookmarkFolderDiaplay').on('click', function(){
        map.removeControl(bookmarkFolder_diaplay);
    });

    $('#add_BookmarkFolder').on('click', function(){
        bookmarkFolderNameInput();
    });
}

function displayBooksmarks() {

}

function displayFavourites(){

}

function dispalyPins(){
      
}

// Query databse
function getUserBookmarkFolders() {

}