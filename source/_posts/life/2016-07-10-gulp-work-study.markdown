---
layout: post
title: gulp学习笔记
categories: [生活]
tags: [nodejs,自动化]
published: True
---

## 背景说明

我的博客自14年以来更新非常缓慢,想了一下原因,主要前端这块的接触实在太少,所以每次想美化一下博客,
或者给博客增加一些小功能的时候非常痛苦,所以准备用工程化的理念来对博客进行管理.


## Gulp介绍

gulp我的理解是, 使用npm作为类库管理, 但是使用js这种灵活的脚本来完成任务的编写,而且最吸引我的是,
她是基于流的, 所以给我的最大感受就是, 刚开始学习有些困难, 但是弄明白一个之后就一通百通了.

### 使用插件介绍

``` yaml
gulp-load-plugins: 以驼峰访问的方式访问以gulp开头的插件
gulp-util: 日志啊什么的
gulp-sass: 用来编译sass为css
gulp-filter: 过滤器
gulp-print: 用于输入管道的中间文件
gulp-concat: 用于拼接文件

```


### gulp脚本重构

- [x] 第一次重构, 将`config.json`改写成`config.js`, 是的配置的编写更加自由
- [x] 第二次重构, 将gulp的task根据功能分成不同的文件, 便于管理和区分