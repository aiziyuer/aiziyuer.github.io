---
title: Android开发插件/类库推荐
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

![image](/image/android-develop-goods/QQ20160828-1.png)

然后插件会扫描你选中的layout对应的xml文件, 找到里面的id, 然后会在对话框中让你选择自动生成哪些代码:

![image](/image/android-develop-goods/QQ20160828-0.png)


## Retrolambda

这个类库可以让你在Android的开发中使用lamda语法, 我一直是`Ruby`的狂热爱好者, 永远秉承优雅是万物之源;
想要简单地使用它, 只要在你的app的`build.gradle`中加入如下几行(差不多意思的就不用加了):

```javascript
buildscript {
  repositories {
     mavenCentral()
  }

  dependencies {
     classpath 'me.tatarka:gradle-retrolambda:3.2.5'
  }
}

// Required because retrolambda is on maven central
repositories {
  mavenCentral()
}

apply plugin: 'com.android.application' //or apply plugin: 'java'
apply plugin: 'me.tatarka.retrolambda'
```

还需要告诉AndroidStudio解释的语法:

```javascript
android {
  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
}
```

另外, 为了保持最好的兼容性, 在`proguard-rules.pro`中还要加入

```bash
-dontwarn java.lang.invoke.*
```

![image](/image/android-develop-goods/QQ20160904-0.png)


## Material Design Icon Generator

可以直接搜索使用google的官方logo, 妈妈再也不用填担心我找不到图片了.

![image](/image/android-develop-goods/capture.gif)


## android-postfix-plugin

这个的作用文字不好叙述, 直接贴图:

![image](/image/android-develop-goods/8d45e898-64a6-11e5-8c32-8f38b0105177.gif)

![image](/image/android-develop-goods/3c131392-f4ad-11e4-98a0-e56dbfab8c69.gif)

![image](/image/android-develop-goods/c8f2ceb6-f24a-11e4-8711-c5f2a5d205d4.gif)

To Be Continus ... 

## 参考文献
---

- [Butter Knife项目主页](https://jakewharton.github.io/butterknife/)
- [Retrolambda项目主页](https://github.com/evant/gradle-retrolambda)
- [Android Material Design Icon Generator项目主页](https://github.com/konifar/android-material-design-icon-generator-plugin)
- [android-postfix-plugin](https://github.com/takahirom/android-postfix-plugin)






