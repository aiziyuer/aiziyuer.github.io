---
title: Android开发笔记(基础)
layout: post
categories: [移动]
tags: [android,生活,效率]
published: True
---

## SDK安装

这里我使用的homebrew来进行软件包的管理.

```bash
brew install android-sdk
brew install android-ndk
```

- SDK位置: `/usr/local/Cellar/android-sdk`
- NDK位置: `/usr/local/Cellar/android-ndk`


## 远程调试

这里我使用`WIFI ADB`(当然需要手机已经Root), 在Android Studio中添加工具可以不用每次都`adb connect`:

![image](/image/android-develop-base-action/QQ20160828-0.png)


这样如果每次手机网络修改后, 可以直接在`Tools` -> `Android Dev Tools` -> `Android Over Wifi`来启动连接.


## Log高亮

`Android Studio`中有个不太好的地方, 就是Logcat里面都是清一色的红色和白色, 对于我这样的夜晚才有自己时间的人来说
是无法接受的, 所以果断想办法, 配色部分AS已经很贴心地想到了, 位置是: `Perferences` -> `Editor` 
-> `Colors &Fonts` -> `Android Logcat`, 配置参数如下(默认是继承了`Console Colors`, 如果想要编辑颜色, 一定要去勾选前面的继承复选):

Log级别		| 	色值
-|-
Assert		|	`9876AA`
Debug		|	`6897BB`
Error		|	`FF6B68`
Info		|	`6A8759`
Verbose		|	`BBBBBB`
Warning		|	`BBB529`

最后的配置效果如下:

![image](/image/android-develop-base-action/QQ20160829-0.png)