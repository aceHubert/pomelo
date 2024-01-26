$(document).ready(function () {
  $('#password-modify-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $submit = $('button[type="submit"], input[type="submit"]');
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

    if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/.test(data.newPassword)) {
      return showError(locales.passwordInvalid);
    } else if (data.newPassword !== data.confirmPassword) {
      return showError(locales.dismatchPassword);
    }

    data.oldPassword = data.oldPassword.sha256();
    data.newPassword = data.newPassword.sha256();
    delete data.confirmPassword;

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then(function (res) {
        var data = res.data;
        if (!data.success) throw new Error(data.message);
        $form[0].reset();
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

  $('#password-forgot-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $submit = $('button[type="submit"], input[type="submit"]');
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

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then(function (res) {
        var data = res.data;
        if (!data.success) throw new Error(data.message);
        $form[0].reset();
        $submit.remove();
        showError('<span class="success--text">' + data.message + '</span>');

        // 修改路由但不刷新页面，使浏览器刷新返回到上一页
        const returnUrl = getUrlParams('returnUrl');
        window.history.replaceState(null, '', returnUrl ? returnUrl : '/');
      })
      .catch(function (err) {
        var data = err.response ? err.response.data : err;
        showError(data.message);
      })
      .finally(function () {
        $submit.removeAttr('disabled');
      });
  });

  $('#password-reset-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $submit = $('button[type="submit"], input[type="submit"]');
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

    if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/.test(data.newPassword)) {
      return showError(locales.passwordInvalid);
    } else if (data.newPassword !== data.confirmPassword) {
      return showError(locales.dismatchPassword);
    }

    data.password = data.newPassword.sha256();
    delete data.newPassword;
    delete data.confirmPassword;

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then(function (res) {
        var data = res.data;
        if (!data.success) throw new Error(data.message);
        $form[0].reset();
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

  $('#cancle-btn').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var returnUrl = getUrlParams('returnUrl');
    returnUrl ? absoluteGo(returnUrl, true) : history.back();
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
