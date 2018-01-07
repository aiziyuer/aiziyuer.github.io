---
layout: post
title: 在Mac下编译最新的Android M

categories: [网页]
tags: [java,keytool]
published: True

---


## 编译

我的手机是Nexus 6P, 编译的分支选择`6.0.0_r2`进行编译, 分支可以查看[`source-code-tags-and-builds`](https://source.android.com/source/build-numbers.html#source-code-tags-and-builds). 考虑到google在国内的蛋疼问题,
这里使用[中科大的源](https://lug.ustc.edu.cn/wiki/mirrors/help/aosp).

### 环境准备

详细的参考[官方指南](https://source.android.com/source/initializing.html),里面有针对每种操作系统的详细说明.


### 下载Repo工具

目前已有两种下载代码的方式, 可以参考[《Android 镜像使用帮助》](https://lug.ustc.edu.cn/wiki/mirrors/help/aosp).
我使用的是借助`repo`工具的方式, 所以先进行工具的安装.

```bash
mkdir ~/bin
PATH=~/bin:$PATH
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
## 如果上述 URL 不可访问，可以用下面的：
## curl https://storage-googleapis.lug.ustc.edu.cn/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
```

以下懒人的脚本:

```bash
# 创建一个100G的Android专用文件系统
hdiutil create -type SPARSE -fs 'Case-sensitive Journaled HFS+' -size 100g ~/android.dmg
# 挂载
hdiutil detach /Volumes/android ; hdiutil attach ~/android.dmg.sparseimage -mountpoint /Volumes/android;

# 创建需要的版本
cd /Volumes/android
mkdir 6.0.0_r2
cd 6.0.0_r2

repo init -u https://android.googlesource.com/platform/manifest -b android-6.0.0_r2
```