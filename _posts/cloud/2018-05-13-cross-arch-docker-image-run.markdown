---
layout: post
title: "跨CPU架构运行容器  "
categories: [云计算]
tags: [语言, 源码, 学习]
layout: post
published: True
date: "2018-05-13 10:17:56 +0800"
---


## 前言

> 随着物理网的兴起,`arm`在生活中扮演者越来越重要的地位,就连公有云也开始支持
> arm, 不过它支持的`arm64`(即`aarch64`), 但是对于应用开发来说大家更加青睐
> 的还是容器化运行,最近发现有趣的现象,普通人对容器理解好像就是当成虚拟机
> 的,其实容器只是像搭积木一样吧linux的一些功能(`cgroup`,`namespace`)组合在一
> 让应用开起来好像是互相不可见(所谓的隔离)的, 其实你在宿主机上面`ps -ef`
> 是可以看到容器里面运行的进程的,这既是它的优点又是它的缺点,有点是容器应用
> 其实就是本机上面的某个进程,启停速度快;坏处就是容器内部所有的(io,内存等
> 内核提供的能力)其实共享的,也就是说宿主机说32位的操作系统,理论上容器应用
> 是无法运行`64`位程序的,甚至`x86`的cpu架构下是无法运行arm应用的。

那么有没有什么变通办法在`x86_64`上面运行`arm`的容器呢,至少生产环境里不能为每一种
cpu架构单独搞一批机器来编译镜像吧~, 这里提供一种基于`qemu`的方式来实现.


## 方法说明

用过桌面版`linux`的相比都折腾过`wineqq`, 这是一种让你能够在`linux`直接双击打开
`windows`下的可执行程序(`exe`后缀), 这里其实两个东东:

1.  一个是有一种方式告诉操作系统`exe`这种程序用什么解析器来解释执行
2.  提供一个解析器来解释运行程序(就像vm那样)

所以交叉运行容器(为了简单后面我直接用docker来做测试,lxc/chroot应该
是差不多的原理)就可以理解成:

1.  向系统注册arm文件解释执行器;
2.  提供一个arm(或者是各个平台的合集)解释器;

## 测试

非常幸运, github上面有个项目就是已经把这两样东西都打包了.

### 各个平台的解释器

[qemu-user-static](https://github.com/multiarch/qemu-user-static/releases/).

### 平台注册文件解释器

这个项目也已经做了一个容器运行就可以完成所有可支持的
平台注册(`x86`, `64`, `aarch64`, `armhf`等等)

``` bash
docker run --rm --privileged multiarch/qemu-user-static:register
# 如果注册成功可以查询到aarch64对应的解释器
cat /proc/sys/fs/binfmt_misc/qemu-aarch64
# enabled
# interpreter /usr/bin/qemu-aarch64-static
# flags:
# offset 0
# magic 7f454c460201010000000000000000000200b700
# mask ffffffffffffff00fffffffffffffffffeffffff
```

如果想回退

``` bash
docker run --rm --privileged multiarch/qemu-user-static:register --reset
```

### 运行测试

测试用的镜像, 这里测试的镜像如下:

-   `arm64v8/centos`
-   `arm64v8/ubuntu`

``` bash
docker run --rm -ti -v /usr/bin/qemu-aarch64-static:/usr/bin/qemu-aarch64-static arm64v8/centos bash
```

![image](/image/cross-arch-docker-image-run/test-result-01.png)

### 遗留问题

测试下来只要是从`dockerhub`上面下载下来的镜像都是可以正常运行的,但是我自己制作的精简版docker镜像运行
会`coredump`, 下一篇详细描述下精简镜像制作的时候好好研究下


# 参考

-   [Docker Official Images](https://github.com/docker-library/official-images#docker-official-images)
-   [qemu-user-static](https://github.com/multiarch/qemu-user-static)
-   [在 x86 下 chroot 到 ARM 平台的 rootfs](https://coldnew.github.io/1ad4bf6d/)
