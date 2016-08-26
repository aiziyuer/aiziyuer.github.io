---
title: 支持xposed框架的模拟器
layout: post
categories: [移动]
tags: [android,生活,效率]
published: True
---


考虑到我正在使用的nexus手机已经安装了xposed框架, 所以想要利用业余时间写一点有意思的xposed的应用,
哎, 我可是大二开始就接触了android了, 现在天天开发web的后台页面,生活真是枯燥至极.

## 环境选择

我平时使用的iMac, 所以使用`Gemotion`或者官方自带的模拟器, 考虑到我有可能有时候心血来潮,
想要在win下做开发, 所以这里暂时先选择Gemotion作为开发主力,后面要是有变动, 再另行说明.

### 系统镜像安装

这里必须要吐槽一下Gemotion的服务, 虽然个人版是免费试用, 但是镜像在国内的下载速度真的也是醉了,
不过天无绝人之路. 这里有个小窍门, 一般Gemotion的操作都会在`~/.Genymobile/genymotion.log`中记录,
所以随便翻翻, 基本就能找到下载的路径了:

![image](/image/genmotion-tips/QQ20160826-1.png)

这里可以拿到原始文件的url, 下载后, 替换`~/.Genymobile/Genymotion/ova`下的那个慢的要死的文件就行;


## 开发环境

为了方便开发, 有些基础的东西还是需要准备好.

### Xposed框架安装

需要的文件:

- [ARM Translation 1.1](https://docs.google.com/uc?authuser=0&id=0B2wvlvvQ2cX3OUVKcnpjRmxyOGs&export=download)
- [Google Apps](https://docs.google.com/uc?authuser=0&id=0B2wvlvvQ2cX3a1dhcXV5SDd4TXc&export=download)
- [SuperSU v2.46](https://docs.google.com/uc?authuser=0&id=0B2wvlvvQ2cX3WUtoTW1lNW5heW8&export=download)
- [xposed-v86-sdk23-x86](http://dl-xda.xposed.info/framework/sdk23/x86/xposed-v86-sdk23-x86.zip)
- [Xposed Installer 3.0 alpha4](https://docs.google.com/uc?authuser=0&id=0B2wvlvvQ2cX3ak9WWXY0cGdCSVk&export=download)

这个方法其实是4.0就有的方法, 但是现在看起来在6.0上依然生效. 依次拖入模拟器就可以安装,
全部安装后重启模拟器.

![image](/image/genmotion-tips/QQ20160826-0.png)


### 必备软件包

