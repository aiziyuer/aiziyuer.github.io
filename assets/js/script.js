
/*!--------------------------------*\
   3-Jekyll Theme
   @author Peiwen Lu (P233)
   https://github.com/P233/3-Jekyll
\*---------------------------------*/

// Detect window size, if less than 1280px add class 'mobile' to sidebar therefore it will be auto hide when trigger the pjax request in small screen devices.
if ($(window).width() <= 1280) {
  $('#sidebar').addClass('mobile');
}

// Variables
var sidebar    = $('#sidebar'),
    container  = $('#post'),
    content    = $('#pjax'),
    button     = $('#icon-arrow');

// Tags switcher
var clickHandler = function(id) {
  return function() {
    $(this).addClass('active').siblings().removeClass('active');
    $('.pl__all').hide();
    $('.' + id).delay(50).fadeIn(350);
  };
};

$('#tags__ul li').each(function(index){
  $('#' + $(this).attr('id')).on('click', clickHandler($(this).attr('id')));
});

// If sidebar has class 'mobile', hide it after clicking.
$('.pl__all').on('click', function() {
  $(this).addClass('active').siblings().removeClass('active');
  if (sidebar.hasClass('mobile')) {
    $('#sidebar, #pjax, #icon-arrow').addClass('fullscreen');
  }
});


$('#search-input').keyup(function() {

    $(this).addClass('active').siblings().removeClass('active');

    // 先将隐藏所有的文章
    $('.pl__all').hide();

    // 获取输入框的内容(转小写是为了不区分大小写)
    var search_val = $('#search-input').val().toLowerCase();

    // 这里是获取当前用户选择了分类
    $('#pl__container > .' + $('#tags__ul > .active').attr('id') + ' > .pl__title ').each(function(i) {

        var e = $(this);
        // 忽略大小写后进行比较
        if (e.text().toLowerCase().contains(search_val)) {
            // 设置延迟10ms并且渐变显示出来
            e.parent().delay(10).fadeIn(15);
        }

    });

});


// Enable fullscreen.
$('#js-fullscreen').on('click', function() {
  if (button.hasClass('fullscreen')) {
    sidebar.removeClass('fullscreen');
    button.removeClass('fullscreen');
    content.delay(300).queue(function(){
      $(this).removeClass('fullscreen').dequeue();
    });
  } else {
    sidebar.addClass('fullscreen');
    button.addClass('fullscreen');
    content.delay(200).queue(function(){
      $(this).addClass('fullscreen').dequeue();
    });
  }
});

$('#mobile-avatar').on('click', function(){
  $('#sidebar, #pjax, #icon-arrow').addClass('fullscreen');
});

// Pjax
$(document).pjax('#avatar, #mobile-avatar, .pl__all', '#pjax', { fragment: '#pjax', timeout: 10000 });

$(document).on({
  'pjax:click': function() {
    content.removeClass('fadeIn').addClass('fadeOut');
    NProgress.start();
  },
  'pjax:start': function() {
    content.css({'opacity':0});
  },
  'pjax:end': function() {
    NProgress.done();
    container.scrollTop(0);
    content.css({'opacity':1}).removeClass('fadeOut').addClass('fadeIn');
    afterPjax();
  },
  'pjax:complete':function(){
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,this]);
  }
});

// Re-run scripts for post content after pjax
function afterPjax() {
  // Open links in new tab
  $('#post__content a').attr('target','_blank');

  // Generate post TOC for h1 h2 and h3
  var toc = $('#post__toc-ul');

  // Empty TOC and generate an entry for h1
  toc.empty().append('<li class="post__toc-li post__toc-h1"><a href="#post__title" class="js-anchor-link">' + $('#post__title').text() + '</a></li>');

  // Generate entries for h2 and h3
  $('#post__content').children('h2,h3').each(function() {
    // Generate random ID for each heading
    $(this).attr('id', function() {
      var ID = "",
          alphabet = "abcdefghijklmnopqrstuvwxyz";

      for(var i=0; i < 5; i++) {
        ID += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }
      return ID;
    });

    if ($(this).prop("tagName") == 'H2') {
      toc.append('<li class="post__toc-li post__toc-h2"><a href="#' + $(this).attr('id') + '" class="js-anchor-link">' + $(this).text() + '</a></li>');
    } else {
      toc.append('<li class="post__toc-li post__toc-h3"><a href="#' + $(this).attr('id') + '" class="js-anchor-link">' + $(this).text() + '</a></li>');
    }
  });

  // Smooth scrolling
  $('.js-anchor-link').on('click', function() {
    var target = $(this.hash);
    container.animate({scrollTop: target.offset().top + container.scrollTop() - 70}, 500, function() {
      target.addClass('flash').delay(700).queue(function() {
        $(this).removeClass('flash').dequeue();
      });
    });
  });

  // Lazy Loading Disqus
  var ds_loaded = false;
  var top = $('#disqus_thread').offset().top;
  window.disqus_shortname = $('#disqus_thread').attr('name');

  function check() {
    if ( !ds_loaded && container.scrollTop() + container.height() > top ) {
      $.ajax({
        type: 'GET',
        url: '//' + disqus_shortname + '.disqus.com/embed.js',
        dataType: 'script',
        cache: true
      });
      ds_loaded = true;
    }
  }check();
  container.scroll(check);

}afterPjax();

