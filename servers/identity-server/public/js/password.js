$(document).ready(function () {
  $('#password-modify-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $error = $form.find('#error');
    var $submit = $('button[type="submit"], input[type="submit"]');
    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce(function (obj, item) {
      obj[item.name] = item.value;
      return obj;
    }, {});

    if (data.newPassword !== data.confirmPassword) {
      return $error.removeClass('d-none').html(locales.dismatchPassword);
    }

    data.oldPassword = data.oldPassword.sha256();
    data.newPassword = data.newPassword.sha256();
    delete data.confirmPassword;

    $submit.attr('disabled', 'disabled');
    $error.hasClass('d-none') ? null : $error.addClass('d-none');
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
          $error.removeClass('d-none').html(data.message);
          setTimeout(() => {
            absoluteGo(data.next, true);
          }, 3000);
        } else {
          absoluteGo(data.next, true);
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

  $('#password-forgot-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $error = $form.find('#error');
    var $submit = $('button[type="submit"], input[type="submit"]');
    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce(function (obj, item) {
      obj[item.name] = item.value;
      return obj;
    }, {});

    $submit.attr('disabled', 'disabled');
    $error.hasClass('d-none') ? null : $error.addClass('d-none');
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
        $error.removeClass('d-none').html('<span class="success--text">' + data.message + '</span>');

        // 修改路由但不刷新页面，使浏览器刷新返回到上一页
        const returnUrl = getUrlParams('returnUrl');
        window.history.replaceState(null, '', returnUrl ? returnUrl : '/');
      })
      .catch(function (err) {
        var data = err.response ? err.response.data : err;
        $error.removeClass('d-none').html(data.message);
      })
      .finally(function () {
        $submit.removeAttr('disabled');
      });
  });

  $('#password-reset-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $(this);
    var $error = $form.find('#error');
    var $submit = $('button[type="submit"], input[type="submit"]');
    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce(function (obj, item) {
      obj[item.name] = item.value;
      return obj;
    }, {});

    if (data.newPassword !== data.confirmPassword) {
      return $error.removeClass('d-none').html(locales.dismatchPassword);
    }

    data.password = data.newPassword.sha256();
    delete data.newPassword;
    delete data.confirmPassword;

    $submit.attr('disabled', 'disabled');
    $error.hasClass('d-none') ? null : $error.addClass('d-none');
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
          $error.removeClass('d-none').html(data.message);
          setTimeout(() => {
            absoluteGo(data.next, true);
          }, 3000);
        } else {
          absoluteGo(data.next, true);
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
