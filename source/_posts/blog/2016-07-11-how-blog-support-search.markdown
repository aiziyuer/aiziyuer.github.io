---
layout: post
title: 如何实现博客的搜索
categories: [博客]
tags: [blog, javascript]
published: True
---

这个问题其实是在几个月前已经解决了,但是这个问题确确实实困扰了我很长的时间,所以我相信写出来肯定也会方便不少人.

``` javascript
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
```