---
title: Xposed框架安装
layout: post
categories: [移动]
tags: [android,生活,效率]
published: True
---

今天早晨醒来, 手机显示有了新的操作系统更新, 所以晚上照旧 下载`Factory`固件 ->
线刷 -> 检查`recovery`包 -> 恢复`root` -> 恢复`xposed`框架

以上的过程对于我现在来说比较熟悉的情况下大概需要花费我1-2小时的时间

## 为什么选择全部手工?

其实我也是一个懒人, 所以我肯定写过一些脚本来自动做, 目前这个脚本已经可以自动去官网上自动下载最新的fatory固件、
去除`flash-all.sh`中的`-w`选项、并且通知我的手机进入`bootloader`刷机模式,但是现在有些比较蛋疼的是, 刷完后系统会自动
重启，然后应用的优化会非常耗时(不算xposed都有77个), 所以后面的`recovery`和`xposed`就比较难弄了, 所以只能先"手动"了

## Plan

作为21世纪有思想的新青年, 自动化是必然的事情, 所以在我没有想到解决上面的问题前, 先把刷机固定的步骤记录下来,
方便后面自动脚本的编写.

- [x] 固化刷机步骤
- [ ] 脚本自动刷机

## 固定刷机步骤

### 前提

- 你需要一台原生android系统的手机(Nexus)
- 解锁OEM锁(开发者模式里面有)
- 解锁bootloader(开机会比较可怕,无所谓)`fastboot flashing unlock`

### 准备

这里考虑的是万能方法, 所以必然是线刷Factory固件了, 你需要有以下几样东西, 每次都需要检查是否是最新版本:

- [Nexus Factory Images](https://developers.google.com/android/nexus/images)不仅可以刷机用还能救转(unlock bootloader, oem unlock)
- [TWRP](https://twrp.me/)第三方的恢复镜像,因为谷歌官方不支持恢复第三方的东西(`supersu`, `xposed`)
- [supersu](http://download.chainfire.eu/supersu)root专用,最后`recover`刷进去
- [Xposed](http://dl-xda.xposed.info/framework/)杀手级应用

### 放入第三方的定制包

`suspersu`和`xposed`两个包基本上都是zip格式的, 因为需要在recovery页面手动刷入, 所以为了避免麻烦, 在刷机前先通过USB拷入手机, 放到一个熟悉的目录,
后面需要手动进入该目录,所以不要太复杂,放根目录进行了.


### 恢复官方工厂镜像

手机开debug模式usb连电脑, 然后解压工厂固件的压缩包, 然后进入解压缩后的目录

```bash
# 替换掉flash-all中危险的清空数据选项-w
gsed -i 's/fastboot -w/fastboot/g' flash-all.sh

# 进入bootloader状态
adb reboot bootloader

# 刷入固件
sh ./flash-all.sh

# 下面手机会重启, 真的很久, 下次研究研究有没有替换的方法

```

### 刷入`recovery`固件

命令行进入twrp镜像所在目录, 然后命令行运行如下:

```bash
# 进入bootloader状态
adb reboot bootloader

# 刷入固件
fastboot flash recovery twrp-3.0.2-0-angler.img

# 刷入后不会要求重启, 马上进入下面的刷入supersu和exposed

# 进入恢复模式（建议还是硬件操作比较好）
adb reboot recovery
```

### 刷入定制的第三方定制包

这一步基本都是手动, 手动就手动吧, 手动安装两个zip的包然后重启.


**DONE**