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
var representLocationMarker;
var toggleMenuButton;
var pinsCluster;

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

const map = L.map('map', {
    maxBounds: L.latLngBounds([90, -180], [-90, 180]),
    maxZoom: 16,
}).fitWorld();
var searchMarkers= [];

// Mapboc API key
const MapboxAPIkey = 'pk.eyJ1IjoicmFrMTQwOSIsImEiOiJjbGZoYmx2ZTUzaGN0M3lwY2g5aGJwNG9wIn0.OfdLIA8gsn7riXEMGI-OMg'

// Esri API
const esriApiKey = 'AAPKe4688fca2b1c4405981a6518c0c88dcd4jIDDrgcGBJWw0ZxlKpyA6OAqsPzALckDhsqhpE-1y9YWu-PsVTzkgYC445HlTZv'
const basemapEnum = "ArcGIS:Navigation";

// example using an Esri Basemap Styles API name
L.esri.Vector.vectorBasemapLayer("ArcGIS:Navigation", {
    // provide either `apikey` or `token`
    apikey: esriApiKey
  }).addTo(map);

// set the minimum zoom level to 5
map.setMinZoom(3);

function addCurrentLocationButton() {
    // pan to current location 
    var locControl = L.control.locate({
        position: "topleft",
        follow: true,
        setView: true,
        flyTo: true,
        drawCircle: true,
        keepCurrentZoomLevel: false,
        markerStyle: {
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8
        },
        circleStyle: {
        weight: 1,
        clickable: false
        },
        icon: "fas fa-location-arrow",
        metric: false,
        strings: {
        title: "Show me where I am",
        popup: "You are within {distance} {unit} from this point",
        outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
        },
        locateOptions: {
        maxZoom: 15,
        watch: true,
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
        }
    }).addTo(map);

    return locControl;
}

// button to fly to current location 
// new L.cascadeButtons([
//     {icon:"fas fa-location-crosshairs" , ignoreActiveState:true , command: () =>{
//         map_init_basic(map, null);
//      }},
// ], {position:'topleft', direction:'horizontal'}).addTo(map);

var pinButton = new L.cascadeButtons([
    {icon:"fas fa-map-pin" , ignoreActiveState:true , command: () =>{
        displayPinsOnMap();
    }},
], {position:'topleft', direction:'horizontal'}).addTo(map);

// add location for location functionality
var locateControl = addCurrentLocationButton();

// ----------------- add toggle menu ----------------------
function addToggleMenuButton() {
    toggleMenuButton = L.control.custom({
        position: 'topright',
        id: 'toggleButtonMenu',
        content :   '<button id="toggleMenu" class="rounded-circle">'+
                    '<i class="fas fa-bars fa-xl"></i>'+
                '</button>',
        events:
        {
            click: function() {
                expandCollapeToggleMenu(false);
            },
            
        }
    }).addTo(map);
    return toggleMenuButton;
}
addToggleMenuButton();

function expandCollapeToggleMenu(menuConflict) {
    if(!toggleMenuExpanded){ // check if alredy expanded
        if(!menuConflict){
            $('#toggleMenu').html('<i class="fas fa-xmark fa-2xl"></i>');
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
        }
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
}


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
                   '</button>'+
                   '<button id="LogoutButton" class="rounded-pill">'+
                       '<i class="fas fa-right-from-bracket fa-xl"> <p> Log Out </p></i>'+
                   '</button>',
    }).addTo(map);
    toggleMenuExpanded = true

    $('#userBookmarksButton').on('click', function() {
        displayBookmarkFolders();
    });

    $('#userFavouritesButton').on('click', function() {
        getlocations_pin_and_fav(false);
    });

    $('#userPinsButton').on('click', function() {
        getlocations_pin_and_fav(true);
    });

    // log out user and send request to blacklist refresh token
    $('#LogoutButton').on("click", function() {
        
        
        console.log("Logged out!");
        $.ajax({
            type: "POST",
            url: HOST + "/api/logout/",
            data: { refreshToken: localStorage.getItem('refreshToken') },
            headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
            success: function(response) {
                // remove the tokens from local storage
                window.localStorage.removeItem('refreshToken');
                window.localStorage.removeItem('accessToken');

                // redirect the user to the login page
                window.location.replace("http://127.0.0.1:5501/login.html");
            },
            error: function(response) {
                console.log(response);
            }
        });
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

// create an empty layer group to store the results and add it to the map
var results = L.layerGroup().addTo(map);


// show the pointers on the map
searchControl.on('results', function(data) {
    var searchResults = data.results;
    
    if (locationMarker ) { // remove any previously added marker
        map.removeLayer(locationMarker); 
    }

    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }
    
    expandCollapeToggleMenu(true);

    // remove existing markers
    for (var i = 0; i < marker.length; i++) {
        if(marker[i]){
            map.removeLayer(marker[i]);
        }
    }

    // add markers to the map 
    for (var i = 0; i < searchResults.length; i++) {
        var markerName, markerLatLong, markerAddress, mLat, mLng;
        var result = searchResults[i];
        marker[i] = L.marker(result.latlng).addTo(map);
        markerName =  result.properties.PlaceName;
        markerAddress =  result.properties.LongLabel;
        markerLatLong =  " Lat: " + result.latlng.lat.toFixed(5) + ", Lng: " + result.latlng.lng.toFixed(5);
        mLat = result.latlng.lat.toFixed(9);
        mLng = result.latlng.lng.toFixed(9);
        marker[i].bindPopup("<span class='markerName'>"+ markerName +"</span><span class='markerAddress'>"+ markerAddress + "</span><span class='markerLatLong'>"+ markerLatLong +"</span><span style='visibility:hidden' class='markerLat'>"+ mLat +"</span><span style='visibility:hidden' class='markerLong'>"+ mLng +"</span>");

        // get marker details and display in div
        marker[i].on('click', function(e) {
            var popupContent = e.target.getPopup().getContent();
            var parser = new DOMParser();
            var doc = parser.parseFromString(popupContent, "text/html");
            var mN = doc.querySelector('.markerName');
            var mLL = doc.querySelector('.markerLatLong');
            var mA = doc.querySelector('.markerAddress');
            var lat =  doc.querySelector('.markerLat');
            var lng =  doc.querySelector('.markerLong');
            mN = mN.textContent;
            mA = mA.textContent;
            mLL = mLL.textContent;
            lat = lat.textContent;
            lng = lng.textContent;

            // call function to add details to the div
            showMarkerDetials = showMarkerDetails(mN, mA, mLL, lat, lng);
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
            console.log(err);
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

// -----------------  click on map  --------------------------

// Add a click event listener to the map
map.on('click', function(e) {

    // remove any previously added marker
    if (locationMarker ) { 
        map.removeLayer(locationMarker); 
    }

    // remove any previously added marker
    if (results ) { 
        results.clearLayers();
    }

    // remove marker detail menu
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

    // remove saved markers
    if(representLocationMarker) {
        map.removeLayer(representLocationMarker);
    }
});


// add a marker on right click and use esri reverse geo coding to get the marker detials
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

    // esri reverse geoCoder
    L.esri.Geocoding.reverseGeocode({
        apikey: esriApiKey
    }).latlng(e.latlng)
    .run(function (error, res) {
        if (error) {
            return;
        }

        locationMarker =  L.marker(res.latlng).addTo(map);
        locationMarker.bindPopup(res.address.Match_addr).openPopup();
        locationMarker.on('click', function(){
            showMarkerDetails(res.address.PlaceName, res.address.LongLabel, res.latlng, res.latlng.lat, res.latlng.lng);
        });
    });
});



// -----------------  show marker details --------------------------
function showMarkerDetails(name, address, marerkerCords, lat, lng) {

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
                '<button id="addFavButton" class="col rounded-circle me-2" type="button">'+
                    '<i class="fas fa-heart fa-xl"></i>'+
                '</button>'+
                '<button id="addPinButton" class="col rounded-circle me-3" type="button">'+
                    '<i class="fas fa-map-pin fa-xl"></i>'+
                '</button>'+
                '<button id="navigateToLocation" class="col rounded-pill ms-5" type="button">'+
                    '<i class="fas fa-map-location fa-xl"></i>'+
                '</button>'+
                '</div>'+
                '</div>',
        style   :
        {
            height : '170px',
            'pointer-events': 'none',
            'margin-left': '10px',  
            'overflow-y': 'auto',
        },
    }).addTo(map);

    $('#addBookmarkButton').on('click', function() {
        displayBooksmarkFolders_OptionMenu( name, address, lat, lng );
    });

    $('#addPinButton').on('click', function() {
        addLocationAs_pin_or_fav_toDB(true, name, address, lat, lng );
    });

    $('#addFavButton').on('click', function() {
        addLocationAs_pin_or_fav_toDB(false, name, address, lat, lng );
    });

    $('#navigateToLocation').on('click', function() {
        showRoute(L.latLng(lat,lng));
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
                getUserBookmarkFolders(function(results_array){
                    dynamicallyReloadFolders(results_array, null);
                });
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
            '<h2 id="bFolder_heading" class="col pt-2"> <i class="fas fa-folder-closed"></i> Bookmark Folders</h2>'+
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

    getUserBookmarkFolders(function(results_array){
        dynamicallyReloadFolders(results_array, bookmarkFolder_diaplay);
    });



    $('#close_BookmarkFolderDiaplay').on('click', function(){
        map.removeControl(bookmarkFolder_diaplay);
    });

    $('#add_BookmarkFolder').on('click', function(){
        bookmarkFolderNameInput();
    });
}

// function reload the folders after a new folder has been added
function dynamicallyReloadFolders(results_array, bookmarkFolder_diaplay){
    if(results_array != null){
        $("#folders").text('');
        for(var i=0; i<results_array.length; i++){
            $("#folders").append('<div class="row border border-2 clickableFolder">'+
                    '<h5 class="col"><i class="fas fa-folder-closed"></i>'+results_array[i][0] +'</h5>'+
                    '<button type="button" class="col deleteFolder" value="'+ results_array[i][1] +' "> <i class="fas fa-trash-can"></i> </button>'+
                    '<span style="visibility: hidden;">'+results_array[i][1] +'</span>'+
                '</div>' 
            );
        }

        $(".clickableFolder").on('click',function() {
            var folderID = $(this).find("span").text();
            var folderName = $(this).find("h5").text();

            if(bookmarkFolder_diaplay !=null){
                map.removeControl(bookmarkFolder_diaplay);
            }
            getLocationsInFolder(folderID, folderName);
        });

        $(".deleteFolder").on('click',function() {
            event.stopPropagation();
            var folderID = $(this).val();
            removeBookmarkFolder(folderID);
            dynamicallyReloadFolders(results_array);
        });
    }
}

function displayBooksmarkFolders_OptionMenu(name, address, lat, lng) {
    var folderOptionMenu = L.control.custom({ 
        position: 'bottomright',
        id: 'selectBookamrkFolder',
        content :
        '<div class="container" id="selectBookamrkFolderInner">'+
          '<div id="sbf_header" class="row">'+
            '<h5 class="col">Select Folder</h5>'+
            '<button id="sbf_addfolder_button" class="col">'+
              '<i class="fas fa-folder-plus fa-xl"></i>'+
            '</button>'+
            '<hr>'+
          '</div>'+
          '<div id="sbf_form" class="row">'+
            '<form id="sbf_form_inner">'+
            '</form>'+
          '</div>'+
          '<div class="row"> '+
            '<button id="sbf_cancel" class="col btn btn-danger rounded-3 "> Cancel </button>'+
            '<button id="sbf_addLocation" class="col btn btn-primary rounded-3"> Add</button>'+
          '</div>'+
        '</div>',
        
    }).addTo(map);

    getUserBookmarkFolders(function(results_array) {
        if(results_array != null) {
            for(var i=0; i< results_array.length; i++) {
                $('#sbf_form_inner').append('<div class="row"><input class="col" type="radio" name="bookmarkFolder" value="'+results_array[i][1]+'">' + 
                '<label class="col" for="html">'+results_array[i][0]+'</label><br></div>');
            }
        }

        $('#sbf_addLocation').on('click', function(){
            var selectedOption = $("input[name='bookmarkFolder']:checked").val();
            $.ajax({
                type: "POST",
                headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
                // contentType: "application/json",
                url: HOST + "/api/add_location_to_folder/",
                data: {
                    location_name: name,
                    address: address, 
                    long: lng,
                    lat: lat,
                    folderID: selectedOption
                },
                success: function(data) {
                    alert('Added Location Succesfully To ' + ' ' + 'folder');
                    map.removeControl(folderOptionMenu);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                    alert('Error: FAILED to add Bookmark. Please try again!!!!');
                },
            });
        });
    });

    $('#sbf_cancel').on('click', function(){
        map.removeControl(folderOptionMenu);
    });

    $('#sbf_addfolder_button').on('click', function(){
        bookmarkFolderNameInput();
    });

}


// general display to display boomarked, pinned and saved locations 
function generalDisplay(caller, data, extra, folderID){

    var heading, icon, headingIcon;
    
    if(showMarkerDetialOnMap){
        map.removeControl(showMarkerDetial);
        showMarkerDetialOnMap = false;
    }

    if(caller == "bookmark") {
        heading = extra;
        icon = '<i class="fas fa-bookmark" style="color: rgb(255, 187, 0);"></i>';
        headingIcon = '<i class="fas fa-folder-open"></i>';
    } else if (caller == 'pins'){
        heading = 'Pins';
        headingIcon = '<i class="fas fa-thumbtack"></i>';
        icon = '<i class="fas fa-map-pin" style="color: rgb(3, 253, 241);"></i>';
    } else if (caller == 'fav') {
        heading = 'Favourites';
        icon = '<i class="fas fa-heart" style="color: rgb(255, 39, 39);"></i>';
        headingIcon = '<i class="far fa-heart"></i>';
    }else {
        console.log('invalid option');
        return 0;
    }

    var generalDisplay = L.control.custom({
        position: 'bottomleft',
        id: 'display_General',
        content : 
            '<div id="bFolder_continer" class="container">'+
                '<div class="row">'+
                '<h2 id="bFolder_heading" class="col pt-2"> ' + headingIcon + heading + '</h2>'+
                '<button type="button" class="col pt-2" id="close_GeneralDisplay" >'+
                    '<i class="fas fa-xmark fa-xl"></i>'+
                '</button>'+
                '</div>'+
                '<hr id="bFolder_divider">'+
                '<div id="locationBlocks" class="row justify-content-center" >'+
                '</div>'+
           ' </div>',
    }).addTo(map);

    if(data != null){
        $('#locationBlocks').text('');
        for(var i = 0; i<data.length; i++){
            $('#locationBlocks').append('<div class="row border border-2 clickableLocation">'+
            '<h5 class="col">'+icon + data[i][0]+'</h5>'+
            '<button type="button" class="col deleteLocation"> <i class="fas fa-trash-can"></i> </button>'+
            '<p class="row ms-1">'+ data[i][1]+'</p>'+
            '<span style="visibility: hidden;" class="lng">'+ data[i][2]+'</span>'+
            '<span style="visibility: hidden;" class="lat">'+ data[i][3]+'</span>'+
            '<span style="visibility: hidden;" class="locName">'+ data[i][0]+'</span>'+
            '</div>');
        }

        $(".clickableLocation").on('click',function() {
            var loc_lat = $(this).find(".lng").text();
            var loc_lng = $(this).find(".lat").text();
            var loc_add = $(this).find("p").text();
            var loc_name = $(this).find(".locName").text();
            map.removeControl(generalDisplay);
            
            // remove pinned location on map
            if(locationMarker){
                map.removeLayer(locationMarker);
            }

            var loc_latlng = L.latLng(parseFloat(loc_lng), parseFloat(loc_lat));

            // remove previous marker
            if(representLocationMarker) {
                map.removeLayer(representLocationMarker);
            }

            representLocationMarker = L.marker(loc_latlng).addTo(map);
            map.flyTo(loc_latlng, 16);
            representLocationMarker.bindPopup("<span class='markerName'>" + loc_name + "</span><span class='markerAddress'>" + loc_add + " </span><span class='markerLatLong'>" + loc_latlng + "</span><span style='visibility:hidden' class='markerLat'>" + loc_lat + "</span><span style='visibility:hidden' class='markerLong'>"+ loc_lng +"</span>");
            representLocationMarker.on('click', function(e){
                e.target.getPopup();
                // call function to add details to the div
                showMarkerDetials = showMarkerDetails(loc_name, loc_add, loc_latlng, loc_lng, loc_lat);
            })
        });

        // call nesscessary functions to delete store loaction
        $(".deleteLocation").on('click',function() {
            event.stopPropagation();
            if(caller == 'pins'){
                var loc_lat = $(this).closest('.clickableLocation').find('.lat').text();
                var loc_long = $(this).closest('.clickableLocation').find('.lng').text();
                removeLocation(true, loc_long, loc_lat, generalDisplay);
            } else if(caller =='fav') {
                var loc_lat = $(this).closest('.clickableLocation').find('.lat').text();
                var loc_long = $(this).closest('.clickableLocation').find('.lng').text();
                removeLocation(false, loc_long, loc_lat, generalDisplay);
            } else if (caller == 'bookmark'){
                var loc_lat = $(this).closest('.clickableLocation').find('.lat').text();
                var loc_long = $(this).closest('.clickableLocation').find('.lng').text();
                removeBookmark(folderID, loc_long, loc_lat, generalDisplay, extra);
            }
        });
    }

    $('#close_GeneralDisplay').on('click', function() {
        map.removeControl(generalDisplay);
    });


}


// Query database

// get folder names from the database
function getUserBookmarkFolders(callback) {
    
    var results_array = [];
    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + "/api/get_Folder_Names/",
        success: function(data) {
            data.forEach(function(objects){
                var tempArr = [];
                Object.keys(objects).forEach(function(key) {
                    tempArr.push(objects[key]);
                });
                results_array.push(tempArr);
            });
            callback(results_array);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert('Failed to load folders ');
        },
    });
}

// get locations in the folder 
function getLocationsInFolder(folderID, folderName){
    var locations_array = [];
    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + "/api/getLocationsInFolder/",
        data: {
            folderID:folderID,
        },
        success: function(data) {
            data.forEach(function(objects){
                var tempArr = [];
                Object.keys(objects).forEach(function(key) {
                    tempArr.push(objects[key]);
                });
                locations_array.push(tempArr);
            });
            generalDisplay('bookmark', locations_array, folderName, folderID);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert('Failed to load folders ');
        },
    });
}

// function to add send request to backend to add pin or favroute location to map
function addLocationAs_pin_or_fav_toDB(isPin, name, address, lat, lng ){
    var endpoint = '/api/addFavouriteLocation/'
    if(isPin){
        endpoint = '/api/addPinLocation/'
    }

    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + endpoint,
        data: {
            location_name: name,
            address: address, 
            long: lng,
            lat: lat
        },
        success: function(data) {
            alert('Added Location Succesfully');
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
            alert('Error: FAILED to add. Please try again!!!!');
        },
    });
}

// function get location for favourites and pins from the backend
function getlocations_pin_and_fav(isPin){
    var endpoint = '/api/getFavs/';
    var caller = 'fav';
    if(isPin){
        endpoint = '/api/getPins/';
        caller = 'pins';
    }

    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + endpoint,
        success: function(data) {
            locations_array = []
            data.forEach(function(objects){
                var tempArr = [];
                Object.keys(objects).forEach(function(key) {
                    tempArr.push(objects[key]);
                });
                locations_array.push(tempArr);
            });

            generalDisplay(caller, locations_array, null, null);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
            alert('Error: FAILED to retrieve locations. Please try again!!!!');
        },
    });
}

// remove bookmark 
function removeLocation(isPin, lng, lat, display) {
    var endpoint = '/api/removeFav/';

    if(isPin){
        endpoint= '/api/removePin/';
    }
    
    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + endpoint,
        data: {
            long: lng,
            lat: lat
        },
        success: function(data) {
            alert('Removed marker successfully');
            map.removeControl(display);
            getlocations_pin_and_fav(isPin);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
            alert('Error: FAILED to add. Please try again!!!!');
        },
    });
    
}

// remove bookmark from folder
function removeBookmark(folderID, lng, lat, display, folderName) {
    var endpoint = '/api/removeBookmark/';
    
    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + endpoint,
        data: {
            folderID: folderID,
            long: lng,
            lat: lat
        },
        success: function(data) {
            alert('Removed marker successfully');
            map.removeControl(display);
            getLocationsInFolder(folderID, folderName);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
            alert('Error: FAILED to remove bookmarked location. Please try again!!!!');
        },
    });
    
}

// remove bookmark folder
function removeBookmarkFolder(folderID) {
    var endpoint = '/api/removeBookmarkFolder/';
    
    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + endpoint,
        data: {
            folderID: folderID
        },
        success: function(data) {
            getUserBookmarkFolders(function(results_array){
                dynamicallyReloadFolders(results_array, null);
            });
            alert('Removed folder successfully');
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
            alert('Error: FAILED to remove folder. Please try again!!!!');
        },
    });
    
}

// function to display pin on the map
function displayPinsOnMap() {
    $.ajax({
        type: "POST",
        headers: {"Authorization": 'Bearer ' + localStorage.getItem('accessToken')},
        // contentType: "application/json",
        url: HOST + '/api/getPins/',
        success: function(data) {
            if(!pinsCluster){
                pinsCluster = L.markerClusterGroup();

                data.forEach(function(pin){
                    var pinMarker = L.marker([pin.lat, pin.lng]); 
                    pinMarker.bindPopup(pin.name +' \n '+ pin.address);
                    pinsCluster.addLayer(pinMarker);
                    
                });
                
                map.addLayer(pinsCluster);
            } else{
                map.removeLayer(pinsCluster);
                pinsCluster = false;
            }

            
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
            alert('Error: FAILED to retrieve locations. Please try again!!!!');
        },
    });
}