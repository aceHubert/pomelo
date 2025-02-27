/* eslint-disable no-console */
const bannerShown = sessionStorage.getItem('__BANNER_SHOWN__') === '1';
!bannerShown &&
  console.log(
    `%c ________  ________  _____ ______   _______   ___       ________
%c|\\   __  \\|\\   __  \\|\\   _ \\  _   \\|\\  ___ \\ |\\  \\     |\\   __  \\
%c\\ \\  \\|\\  \\ \\  \\|\\  \\ \\  \\\\\\__\\ \\  \\ \\   __/|\\ \\  \\    \\ \\  \\|\\  \\
 %c\\ \\   ____\\ \\  \\\\\\  \\ \\  \\\\|__| \\  \\ \\  \\_|/_\\ \\  \\    \\ \\  \\\\\\  \\
  %c\\ \\  \\___|\\ \\  \\\\\\  \\ \\  \\    \\ \\  \\ \\  \\_|\\ \\ \\  \\____\\ \\  \\\\\\  \\
   %c\\ \\__\\    \\ \\_______\\ \\__\\    \\ \\__\\ \\_______\\ \\_______\\ \\_______\\
    %c\\|__|     \\|_______|\\|__|     \\|__|\\|_______|\\|_______|\\|_______|
  `,
    'color:#ff0000',
    'color:#ff3b00',
    'color:#ff7500',
    'color:#FFAD00',
    'color: #FEDA00',
    'color:#D0FD00',
    'color:#93FF00',
  );
sessionStorage.setItem('__BANNER_SHOWN__', '1');

export {};
