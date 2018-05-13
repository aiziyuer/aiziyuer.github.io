---
title: Mac下的工具使用备忘
layout: post
categories: [生活]
tags: [mac, 效率]
published: True
---


## 杀手级应用

这里记录的主要是可以左右一个系统易用性的工具, 没有了他们, 你可能会觉得Mac系统平庸无奇.

### Homebrew

这是Mac下的包管理工具, 类似Ubuntu下的apt, 个人感觉没有apt好用;

- 缓存目录: `~/Library/Caches/Homebrew`
- 安装目录: `/usr/local/Cellar`

1. 如果碰到下载速度太慢怎么办?

```bash
# 先正常走一遍软件安装, 不用等待完成可以直接ctrl+c停止, 为的只是知道url
brew install -vd android-ndk

# 进入Homebrew的缓存目录
cd ~/Library/Caches/Homebrew

```

2.代理配置

```bash
# ~/.curlrc中加入如下一段代码
socks5 = "127.0.0.1:1080"
# 测试一下本机的ip
curl ip.cn
```


## 用到手烂的小命令

下面一些大部分都是常用的命令组合, 来达到一些通用的功能.

### 根据名字杀进程

```bash
ps -ef | grep jekyll | grep -v grep | awk '{print $2}' | xargs kill -9
```


### Dash

这个是把所有比较热门的程序API集结在一起方便查询, 免费有查询频度的限制

1. 离线安装比较大的doc

[Docset下载链接](https://kapeli.com/docset_links), 这里可以查询到所有可以下载的doc源文件, 然后把文件放到
`/Users/lc/Library/Application Support/Dash/DocSets/`下然后`rescan`即可.

![image](/image/mac-tools-tips/QQ20160828-0.png)

2. IDE支持

基本你可以想到的IDE都支持Dash, AndroidStudio插件仓库中直接搜索即可
