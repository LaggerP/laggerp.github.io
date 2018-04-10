$(document).ready(function () {
    var scroll_start = 0;
    var startchange = $('#startchange');
    var offset = startchange.offset();
    $(document).scroll(function () {
        scroll_start = $(this).scrollTop();
        if (scroll_start > offset.top) {
            $('#navbar-fixed').css('background-color', '#f0f0f0');
        } else {
            $('#navbar-fixed').css('background-color', 'transparent');
        }
    });
});