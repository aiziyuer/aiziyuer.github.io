---
layout: post
title: "Hyper-V虚拟机通过宿主机上网(NAT)"
date: 2019-09-04 20:57
summary: 公司内
categories: [云计算]
tags: [学习]
published: True
---

最近单位里面发福利, 一人一台台式机, 终于可以用上win10了, 终于可以上hyper-v了, 终于可以用docker了。但是hyper-v中安装VM根VMware是完全不同的,个人理解Hyper-V定位云基础设施, 盘子比Vmware要高一个档次, 下面是入门级在Hyper-V中创建VM并通过宿主机上网的教程。

``` powershell

# 创建一个内部的交换机(附带会创建一个虚拟网卡)
New-VMSwitch -SwitchName "NAT-Switch" -SwitchType Internal -Verbose

# 查看虚拟网卡的ifindex
# Get-NetAdapter -Name "*NAT-Switch*" | Format-List -Property "*"
Get-NetAdapter -Name "*NAT-Switch*" | Format-List -Property "InterfaceIndex"

# 给虚拟网卡设置ip
# Remove-NetIPAddress -IPAddress 192.168.200.1
New-NetIPAddress -IPAddress 192.168.200.1 -PrefixLength 24 -InterfaceIndex (Get-NetAdapter -Name "*NAT-Switch*").InterfaceIndex -Verbose

# 创建一个NAT网络(关键在这里!)
New-NetNat -Name NATNetwork -InternalIPInterfaceAddressPrefix 192.168.200.0/24 -Verbose

# 给名称是"CentOS7"的VM设置使用这个交换机, 也可以通过hyper-v管理器操作
Get-VM -Name CentOS7 | Get-VMNetworkAdapter | Connect-VMNetworkAdapter -SwitchName "NAT-Switch"

```

## FAQ

- [Windows 10: How to setup NAT network for Hyper-V guests](https://anandthearchitect.com/2018/01/06/windows-10-how-to-setup-nat-network-for-hyper-v-guests/)
