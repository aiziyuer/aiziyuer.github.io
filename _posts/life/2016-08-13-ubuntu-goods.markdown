---
layout: post
title: Ubuntu使用小记
categories: [生活]
tags: [系统]
published: True
---


Ubuntu在10-13年陪我度过了大学的三年时光, 一直作为我的主力系统, 但是13年参加工作后, 切换到mac系统后就冷落了它, 
这里记录一下虚拟机中使用ubuntu的经验, 算是对它的一种补偿吧~

## 装机后必须要做的几件事

0. 虚拟机的增强

装了它, 基本上剪贴板啊, 共享目录之类的就都有了, 不过物理机安装不需要考虑, 所以把它当成0任务吧

1. 修改软件源

我用的是中科大的软件源:

```bash
sudo sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
```

2. 取消乱七八糟的super键

这里要求本机已经安装了`compizconfig-settings-manager`, 命令行下运行`ccsm`,
`Ubuntu Unity Plugin`占用了大部分的快捷键, 我一般都全部去掉


3. 修改hosts

我是重度google使用者


## 哪些不知道有罪的app

这些app基本上是你不知道, 就对不起你正在使用的系统, 罗列的基本上是我在使用

### 通用的软件

- vim 改良版的vi, 高亮啊, 定制啊, 都有
- git 版本控制, 程序员必备
- zsh 比bash的功能多很多
- oh-my-zsh 让我喜欢上使用命令行的东西, 可以让zsh如虎添翼


### 效率工具

- synapse ubuntu下的"水银", 快速启动
- guake 终端复用工具, 有了它, 基本就很少用terminal了
- nautilus-open-terminal 可以在文件夹从这里打开终端