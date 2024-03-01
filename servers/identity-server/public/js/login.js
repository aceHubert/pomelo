$(document).ready(function () {
  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $form = $(this);
    const $submit = $form.find('button[type="submit"]');

    if (!$form[0].checkValidity()) {
      $form.addClass('was-validated');
      return;
    }
    const data = $form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    // if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/.test(data.password)) {
    //   showPopover($form.find('#password'), locales.passwordInvalid);
    //   return;
    // }

    let $userPolicy;
    if (($userPolicy = $form.find('#userPolicy')).length) {
      if (data.userPolicy !== 'on') {
        const hide = showPopover($userPolicy, locales.userPolicyInvalid);
        $userPolicy.on('change', hide);
        return;
      } else {
        data.userPolicy = true;
      }
    }

    data.password = data.password.sha256();
    data.remember = data.remember === 'on' ? true : false;

    $submit.attr('disabled', 'disabled');
    axios({
      url: $form.attr('action'),
      method: $form.attr('method') || 'POST',
      data,
    })
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message);
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
