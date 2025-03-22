---
title: 怎样为你的博客增加评论功能
layout: post
categories: [博客]
tags: [技术]
published: true
---


看了那么多网上使用多说失败的帖子, 所以决定直接使用[`disqus`](https://disqus.com/)作为我的博客系统


## 博客微调

这个评论系统做的真的非常棒, 暂时还不了解它的工作原理, 不明白它怎么区分不同的文章的, 不管怎样,先布上去再说.

### 页面修改

我的博客比较简单, 因为我只想给每个`post`页面, 所以在post页面中多一个`include`文件`disqus`, 内容如下:

``` html
<!-- An element a visitor can click if they <3 comments! -->
<div id="disqus_thread" name="{{ site.disqus.shortname }}">
  <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
  <a href="http://disqus.com" class="dsq-brlink" target="_blank">Loading Disqus comments...</a>
</div>
```

这样每个页面在加完后都会多个div来表示需要拉取谁的评论信息, 我这里使用的jekyll博客, 所以这里的配置其实是来自`_config.yml`:

``` yaml
# ...

disqus:
  shortname: aiziyuer

# ...
```

### 脚本修改

我这里使用的ajax的方式执行js, 详细如下:

``` javascript
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
```
