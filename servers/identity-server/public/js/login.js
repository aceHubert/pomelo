$(document).ready(function () {
  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $submit = $form.find('button[type="submit"]');
    var $errorToast = $('#errorToast');

    function showError(message) {
      $errorToast.find('.toast-body').html(message);

      var errorToast = bootstrap.Toast.getOrCreateInstance($errorToast[0]);
      errorToast.show();
      return () => errorToast.hide();
    }

    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce(function (obj, item) {
      obj[item.name] = item.value;
      return obj;
    }, {});

    // if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/.test(data.password)) {
    //   return showError(locales.passwordInvalid);
    // }

    data.password = data.password.sha256();
    data.remember = data.remember === 'on' ? true : false;
    if ($form.find('#userPolicy').length) {
      if (data.userPolicy !== 'on') {
        return showError(locales.userPolicyInvalid);
      } else {
        data.userPolicy = true;
      }
    }

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then(function (res) {
        var data = res.data;
        if (!data.success) throw new Error(data.message);
        if (data.message) {
          showError(data.message);
          setTimeout(() => {
            absoluteGo(data.next, true);
          }, 3000);
        } else {
          absoluteGo(data.next, true);
        }
      })
      .catch(function (err) {
        var data = err.response ? err.response.data : err;
        showError(data.message);
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
