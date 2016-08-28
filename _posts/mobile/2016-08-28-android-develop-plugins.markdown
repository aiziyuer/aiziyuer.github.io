---
title: Android开发插件推荐
layout: post
categories: [移动]
tags: [android,生活,效率]
published: True
---

> 时间过得真快, 上一次正儿八经写android代码还是四年前了, 今年入手了6p, 想想要是不写个像样的应用确实不像话.

三年的工作让我明白一个道理, 永远不要执拗于自己造轮子, 尤其是如果自己有一些这个领域的基础知识了, 而当前又有
非常优秀的轮子.

## Android ButterKnife Zelezny

`Android 2.3`那会儿, 最烦的就是满篇的`findViewByID`, 写得累, 正真的核心代码总是一坨一坨的. 这个插件是
`Android Studio`的一个插件, 它允许开发者以注解的方式配置`R.id`.

> talk is cheap, show you the code

这里要注意一下, 必须要在`R.layout.activity_main`这个代码上右击->`Generate...`:

![image](/image/android-develop-plugins/QQ20160828-1.png)

然后插件会扫描你选中的layout对应的xml文件, 找到里面的id, 然后会在对话框中让你选择自动生成哪些代码:

![image](/image/android-develop-plugins/QQ20160828-0.png)