var test = window.location.href ;
const notyf = new Notyf();

$(document).ready(function() {
  verifyAccessToken();
  // Create an instance of Notyf

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
            var response = JSON.parse(rs.responseText);
            notyf.error({
              message: response.detail,
              duration: 4000,
              position: {
                x: 'right',
                y: 'top',
              },
            });
        }
    }); // end ajax
  });

  $("#registeration-form").submit(function (event) {
    event.preventDefault();

    if($('#reg_pass1').val().trim() == $('#reg_pass2').val().trim()){

      let formData = new FormData();
      formData.append('name', $('#reg_fname').val().trim() +' '+ $('#reg_sname').val().trim());
      formData.append('email', $('#reg_email').val().trim());
      formData.append('password', $('#reg_pass1').val().trim());
      formData.append('regCode', $('#regCode').val().trim());

      var user_name = $('#reg_fname').val().trim();

      $.ajax({
          url: "http://127.0.0.1:8000/account/api/register/",
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
              var response = JSON.parse(rs.responseText);
              var errorMessgae;
              
              if(response.hasOwnProperty('message')){
                errorMessgae = response.message;
              } else if ('email') {
                errorMessgae = response.email;
              } else {
                errorMessgae = response;
              }

              notyf.error({
                message: errorMessgae,
                duration: 4000,
                position: {
                  x: 'right',
                  y: 'top',
                },
              });
          }
      }); // end ajax
    } else {
      notyf.error({
        message: 'Passwords do not match!!',
        duration: 2000,
        position: {
          x: 'right',
          y: 'top',
        },
      });
    }
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
              if(getCurrentURL() != "http://127.0.0.1:5501/login.html" &&  getCurrentURL() != "http://127.0.0.1:5501/registeration.html" ){
                window.location.replace("http://127.0.0.1:5501/login.html");
              }
            }
          });
        } else {
            console.log('Error verifying access token:', errorThrown);
            if(getCurrentURL() != "http://127.0.0.1:5501/login.html" &&  getCurrentURL() != "http://127.0.0.1:5501/registeration.html" ){
              window.location.replace("http://127.0.0.1:5501/login.html");
            }
        }
      }
    });
  }

  function getCurrentURL () {
    return window.location.href
  }


});
