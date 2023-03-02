$(document).ready(function() {

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
            console.log("success!!");
        },
        error: function (rs, e) {
            console.error(rs.status);
            console.error(rs.responseText);
        }
    }); // end ajax
  });
});
