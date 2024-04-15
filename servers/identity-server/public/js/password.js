$(document).ready(function () {
  const PasswordRegex = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/;

  $('#password-modify-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $form = $(this);
    const $submit = $('button[type="submit"], input[type="submit"]');

    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    if (!PasswordRegex.test(data.newPassword)) {
      const $newPassword = $form.find('#newPassword');
      const hide = showPopover($newPassword, locales.passwordInvalid);
      $newPassword.on('input', hide);
      return;
    } else if (data.newPassword !== data.confirmPassword) {
      const $confirmPassword = $form.find('#confirmPassword');
      const hide = showPopover($confirmPassword, locales.dismatchPassword);
      $confirmPassword.on('input', hide);
      return;
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
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message);
        $form[0].reset();
        if (data.message) {
          showToast(data.message, 'success');
          setTimeout(() => {
            absoluteGo(data.next, true);
          }, 3000);
        } else {
          absoluteGo(data.next, true);
        }
      })
      .catch((err) => {
        const data = err.response ? err.response.data : err;
        showToast(data.message);
      })
      .finally(() => {
        $submit.removeAttr('disabled');
      });
  });

  $('#password-forgot-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $form = $(this);
    const $submit = $('button[type="submit"], input[type="submit"]');

    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message);

        if (data.next) {
          data.message
            ? showToast('<span class="success--text">' + data.message + '</span>', 'success', {
                onHidden: () => {
                  absoluteGo(data.next, true);
                },
              })
            : absoluteGo(data.next, true);
          return;
        }

        data.message && showToast('<span class="success--text">' + data.message + '</span>', 'success');

        $form[0].reset();
        $submit.remove();

        // 修改路由但不刷新页面，使浏览器刷新返回到上一页
        const returnUrl = getUrlParams('returnUrl');
        window.history.replaceState(null, '', returnUrl ? returnUrl : '/');
      })
      .catch((err) => {
        $submit.removeAttr('disabled');
        const data = err.response ? err.response.data : err;
        showToast(data.message);
      });
  });

  $('#password-code-verify-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $form = $(this);
    const $submit = $('button[type="submit"], input[type="submit"]');

    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message);

        if (data.next) {
          data.message
            ? showToast('<span class="success--text">' + data.message + '</span>', 'success', {
                delay: 3000,
                onHidden: () => {
                  absoluteGo(data.next);
                },
              })
            : absoluteGo(data.next);
          return;
        }

        data.message && showToast('<span class="success--text">' + data.message + '</span>', 'success');
      })
      .catch((err) => {
        const data = err.response ? err.response.data : err;
        showToast(data.message);
      })
      .finally(() => {
        $submit.removeAttr('disabled');
      });
  });

  $('#password-reset-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $form = $(this);
    const $submit = $('button[type="submit"], input[type="submit"]');

    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    if (!PasswordRegex.test(data.newPassword)) {
      const $newPassword = $form.find('#newPassword');
      const hide = showPopover($newPassword, locales.passwordInvalid);
      $newPassword.on('input', hide);
      return;
    } else if (data.newPassword !== data.confirmPassword) {
      const $confirmPassword = $form.find('#confirmPassword');
      const hide = showPopover($confirmPassword, locales.dismatchPassword);
      $confirmPassword.on('input', hide);
      return;
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
        const data = res.data;
        if (!data.success) throw new Error(data.message);
        $form[0].reset();
        if (data.message) {
          showToast(data.message, 'success');
          setTimeout(() => {
            absoluteGo(data.next, true);
          }, 3000);
        } else {
          absoluteGo(data.next, true);
        }
      })
      .catch((err) => {
        const data = err.response ? err.response.data : err;
        showToast(data.message);
      })
      .finally(() => {
        $submit.removeAttr('disabled');
      });
  });

  $('#cancle-btn').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const returnUrl = getUrlParams('returnUrl');
    returnUrl ? absoluteGo(returnUrl, true) : history.back();
  });

  $(document)
    .on('input', ':password', function () {
      if ($(this).val().length) {
        $(this).addClass('has-value');
      } else {
        $(this).removeClass('has-value');
      }
    })
    .find(':password')
    .trigger('input');

  $('.toggle-password').click(function () {
    $(this).toggleClass('slash');
    const input = $($(this).data('target'));
    input.attr('type', input.attr('type') == 'password' ? 'text' : 'password');
  });
});
