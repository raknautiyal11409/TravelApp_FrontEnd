// logout button
var loginButton = document.getElementById("loginButton");

$(document).ready(function() {
  verifyAccessToken();

  // REF - https://ilovedjango.com/django/rest-api-framework/authentication/tips/working-example-of-jwt-authentication-with-ajax-django-rest-framework/
  $("#login-form").submit(function (event) {
    event.preventDefault();
    let formData = new FormData();
    formData.append('email', $('#email').val().trim());
    formData.append('password', $('#password').val().trim());

    $.ajax({
        url: "http://127.0.0.1:8000/account/api/login/",
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
            // store tokens in localStorage
            window.localStorage.setItem('refreshToken', data['refresh']);
            window.localStorage.setItem('accessToken', data['access']);
            window.location.replace("http://127.0.0.1:5501/index.html");
            console.log("success!!");
        },
        error: function (rs, e) {
            console.error(rs.status);
            console.error(rs.responseText);
        }
    }); // end ajax
  });

  function verifyAccessToken() {
    $.ajax({
      url: "http://127.0.0.1:8000/account/api/login/verify/",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ token: window.localStorage.getItem('accessToken')}),
      success: function(data) {
        // Handle success response
        console.log(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 401) {
          // Access token expired, get a new token using the refresh token
          $.ajax({
            url: 'http://127.0.0.1:8000/account/api/login/refresh/',
            type: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + window.localStorage.getItem('accessToken')
            },
            data: JSON.stringify({refresh: window.localStorage.getItem('refreshToken')}),
            success: function(response) {
              window.localStorage.setItem('accessToken', response.access);
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log('Error getting new token:', errorThrown);
            }
          });
        } else {
            console.log('Error verifying access token:', errorThrown);
            if(getCurrentURL() != "http://127.0.0.1:5501/login.html" ){
              window.location.replace("http://127.0.0.1:5501/login.html");
            }
        }
      }
    });
  }

  function getCurrentURL () {
    return window.location.href
  }

  loginButton.addEventListener("click", function() {
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('accessToken');
    window.location.replace("http://127.0.0.1:5501/login.html");
    console.log("Button clicked!");
  });


});
