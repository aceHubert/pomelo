$(document).ready(function () {
  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var form = $(this);
    if (!form[0].checkValidity()) {
      form.addClass('was-validated');
      return;
    }
    var username = $('#username').val();
    var password = $('#password').val();
    var remember = $('#rememberMe').prop('checked');
    var $submit = form.find('button[type="submit"]');
    var $error = form.find('#error');
    $submit.attr('disabled', 'disabled');
    $error.hasClass('d-none') ? null : $error.addClass('d-none');
    axios({
      url: form.attr('action'),
      method: form.attr('method') || 'POST',
      data: {
        username,
        password: CryptoJS.SHA256(password).toString(),
        remember,
      },
    })
      .then(function (res) {
        var data = res.data;
        if (data.status === 308) {
          absoluteGo(data.location, true);
        }
      })
      .catch(function (err) {
        var data = err.response ? err.response.data : err;
        $error.removeClass('d-none').html(data.message);
      })
      .finally(function () {
        $submit.removeAttr('disabled');
      });
  });

  $('.toggle-password').click(function () {
    $(this).toggleClass('slash');
    var input = $($(this).attr('toggle'));
    if (input.attr('type') == 'password') {
      input.attr('type', 'text');
    } else {
      input.attr('type', 'password');
    }
  });
});
