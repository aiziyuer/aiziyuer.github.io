---
layout: post
title: Mac下OpenJDK学习
categories: [开源]
tags: [语言]
published: True
---

> 如果你下定决心学习JDK, 不要因任何困难而停下, 最大的敌人是自己, 是***懒惰***

最近对jit非常感兴趣, 而且正好今年一直都在jvm相关的书籍, 所以想从源码学习OpenJDK的实现,
顺便记录一些过程中的坎坷和技巧, 希望对正在一起学习的人有一些帮助。

## JDK版本选择

这个版本的选择我考虑很久，因为我手上的两本书（`《HotSpot实战》`、`《深入理解Java虚拟机（第2版）》`）里面都是用
OpenJDK7做例子的，但是我在2015年工作的间隙于windows上进行过编译的尝试， 结论就是 -- 怎一个坑字了得， 所以，
我觉得使用最新的OpenJDK9作为研究对象，它的win下编译平台是VS2013（社区版也支持），而且多次尝试，配合Cywin，基本上
幺蛾子很少.

## 计划

- 我现在这份工作不允许我有太多自己的时间, 所以研究的技术大部分是会考虑在windows上运行, 而在平时的一些研究会考虑在
mac下运行. 
- 我当前这份工作对安全的要求很高, 平时在win上研究的一些东西也无法带出来, 所以写出来的文章都是拼印象在虚拟机中又做了
一遍, 所以有可能会出现描述的点和实际的一些操作有出入, 如果实在影响了你的学习, 请直接回复文章或者email我

本文主要记载Mac下的一些使用笔记, 另一篇文章《Win下OpenJDK学习》会记载Win下的一些笔记

## 工具链

- `XCode`-里面会提供LLVM等编译工具, 而且调试jvm的部分jni的C实现非常有用
- `Eclipse`-`java`的IDE

Mac基本跟Linux的环境非常相似, 问题非常少:

## 源码获取

这个必须是非常大的坑, 光是源码获取, 后面我会专门写文章介绍, 步骤非常简单, 但是在国内的上网环境下, 获取jdk的源码简直
太难, 我这里是通过我的亚马逊云将我的代码下载下来后, 打包回传会来的, 源码的下载命令如下:

```
# 官方的推荐方式, github也可以, 但是我在win下不知道尝试了多少次, 问题总是会有, 不推荐
hg clone http://hg.openjdk.java.net/jdk9/jdk9
cd jdk9
# 上面只是下载了一个头, 还需要执行命令才能获取源码
bash ./get_source.sh # 这步我经过了无数次的尝试都没有结果
```


## 编译

### 字体freetype

```bash
brew install freetype
```

### configure

在源码目录下直接运行

```bash
bash ./configure \
--disable-warnings-as-errors \
--with-debug-level=slowdebug \
--with-freetype=/usr/local/opt/freetype \
--with-target-bits=64
```

参数说明

- --disable-warnings-as-errors 忽略警告 # 必须要加, 不加编译中会有问题
- --with-debug-level 设置调试级别，设成 slow debug 可以提供更多的调试信息
- --with-free-type 设置 free type 路径 


## 调试

### Xcode工程创建

File -> New -> Project -> OS X -> Application -> Command Line Tool 新建一个命令行工具

![image](/image/openjdk-study-mac/QQ20160814-0.png)

上面是新建了一个命令行的纯C++的应用, 但是我们想调试的是另外的代码, 所以建议:

### 1. 移除不需要的文件

将源文件`main.c`移除

### 2. 添加项目源码目录

添加`源码目录->jdk->src->java.base`添加项目源码目录中

![image](/image/openjdk-study-mac/QQ20160814-1.png)


### 3. 编辑调试的可执行程序

设置启动对象指向`源码目录/build/macosx-x86_64-normal-server-slowdebug/jdk/bin/java`

![image](/image/openjdk-study-mac/QQ20160814-2.png)

### 4. 设置调试可执行程序的参数

简单起见, 就直接添加`-version`, 目的是运行`java -version`查看版本

![image](/image/openjdk-study-mac/QQ20160814-3.png)

### 5. 设置断点

因为我已经对源码有一些了解, 所以这里直接在`java.base/share/native/launcher/main.c`, 所以直接在源码中设置断点如下:

![image](/image/openjdk-study-mac/QQ20160814-4.png)


## 注意事项

如果出现 sigsegv 信号中断，可以在 lldb 中设置这里没有涉及, 但是进行大量的调试后会碰到这个问题

```bash
(lldb) process handle SIGSEGV --stop=false
```
