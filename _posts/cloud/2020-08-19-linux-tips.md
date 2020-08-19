---
layout: post
title: "linux小命令"
categories: [云计算]
tags: [学习]
published: True
---

这里汇总一些`linux`的小命令。


## 磁盘

```
# 创建物理卷
pvcreate /dev/sdb

# 创建虚拟卷
vgcreate ubuntu-vg /dev/sdb

# 扩容虚拟卷
vgextend ubuntu-vg /dev/sdb

# 查看虚拟卷
vgs

# 扩展逻辑卷
lvextend -l 100%FREE /dev/mapper/ubuntu--vg-ubuntu--lv

# 查看逻辑卷
lvs

# 生效空间
resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv

```