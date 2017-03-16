---
layout: post
title: "IPTables学习笔记(docker)"
categories: [开源]
tags: [语言, 源码, 学习]
published: True
---

本文旨在使用`docker`来模拟`nat`的网络, 然后借助`openVPN`来实现宿主机访问
NAT网络后侧的受保护的主机, 中间如果有多余的精力,会考虑研究一下
`iptables`的一些知识。


本文考虑iptables的三种用途:

1. 根据ip/端口进行访问的控制;
2. 外部范文请求的SNAT, 主要用作外部访问的中专, 典型的就是VPN;
3. 对外部的请求做DNAT, 主要用来伪装内部的服务器(外部无法感知真正提供服务的服务器);


所以这里我设计了如下的网络:

![image](/image/openvpn-powered-by-docker/iptables1.png)

里面的`mac os`是我的宿主机, 其余两台机器都是由`docker`虚拟出来的两台linux机器, 一台对外
提供web服务, 另一台上面会安装`openVPN`服务, 宿主机直接访问内部的`web`服务器是走不通的, 但是可以
借助`openVPN`的服务器做中转来访问内部的`web`服务器;

## VPN Server配置

因为`VPN Server`的配置说简单不简单, 所复杂也说不上, 所以为了更好的演示, 这边使用别人已经做好
的`VPN Server`的`docker`镜像来辅助创建vpn server;

### 配置docker编排文件

这里我们的容器使用docker-composite来组织。

``` ruby
version: '2'
services:
  openvpn:
    cap_add:
     - NET_ADMIN
    image: kylemanna/openvpn
    ports:
     - "1194:1194/udp"
    volumes:
     - ./openvpn/conf:/etc/openvpn
    networks:
     private:
       ipv4_address: 172.200.0.10 # vpnserver有一个内网ip
  webserver:
    image: httpd
    networks:
      private:
        ipv4_address: 172.200.0.20 # 内网的服务器的内网ip

networks:
  private: # 为了本次测试新建一个私有专用网络
    ipam:
      config:
        - subnet: 172.200.0.0/16
```

标签`networks`中定义了一个名字为`private`的网桥, 因为`docker-compose`有项目的概念,
我这里的项目名称是`test`, 所以直接运行`docker-compose up`(直接运行应该会报错,
等到报错就`ctrl+c`),这样会自动帮我们创建一个名字为`test-private`的网桥:

![image](/image/openvpn-powered-by-docker/QQ20170316-223356.png)

### 配置服务端/客户端的配置

####  生成服务器的配置文件

``` bash
# 初始化配置文件和证书
# 因为docker配置了1194的映射, 所以用我的mac宿主系统的ip:192.168.1.104作为udp的服务器地址
docker-compose run --rm openvpn ovpn_genconfig -u udp://192.168.1.104
docker-compose run --rm openvpn ovpn_initpki

# 修改配置文件的权限
sudo chown -R $(whoami): ./openvpn

```

![image](/image/openvpn-powered-by-docker/QQ20170316-225020.png)

中间是一段漫长的等待...

![image](/image/openvpn-powered-by-docker/QQ20170316-225355.png)

因为这里的docker景象是通用的, 我们本次测试有一些需要定制的地方, 修改如下:

![image](/image/openvpn-powered-by-docker/QQ20170316-233853.png)

#### 生成VPN客户端文件

``` bash

# 配置客户端
export CLIENTNAME="your_client_name"
# with a passphrase (recommended)
docker-compose run --rm openvpn easyrsa build-client-full $CLIENTNAME nopass
docker-compose run --rm openvpn ovpn_getclient $CLIENTNAME > $CLIENTNAME.ovpn

```

![image](/image/openvpn-powered-by-docker/QQ20170316-231946.png)

> 这里需要注意, 因为我们的vpn并不是想要让所有的网段都走vpn, 而只是让某个网段走vpn
> 所以这里的配置文件还不能直接用, 需要打开`.ovpn`文件后注释掉`redirect-gateway def1`
> 否则你连上vpn后会发现宿主上不了网

#### 启动VPN服务器和web服务器

``` bash
# 启动所有的服务
docker-compose up -d
# 查看启动的日志, 没有报错就是ok的
docker-compose logs

```

![image](/image/openvpn-powered-by-docker/QQ20170316-234129.png)

#### 客户端连接vpn服务器

mac下没有自带openvpn, 使用`brew install openvpn`:

![image](/image/openvpn-powered-by-docker/QQ20170316-234250.png)

从启动日志可以看出, 客户端已经加入了一条`172.200.0.0/16->10.10.10.5`的路由;
这个时候如果`ping`一下`openVPN`的服务器内网地址应该是可以走通的:

![image](/image/openvpn-powered-by-docker/QQ20170316-234527.png)

到这里, vpn的通道已经打通了, 也就是说我们客户端对`172.200.0.0/16`网段的访问都一定会
通过`OpenVPN Server`来转, 后面我们详细测试iptables的两个重要特性 -- SNAT和DNAT。


## 使用SNAT进行访问者的伪装

> 很多时候虽然服务器在局域网里非常安全, 但是隔绝了外部, 使得服务器的管理也非常麻烦, 那么比较
> 好的办法就是vpn, 而vpn只能实现从外部一台机器到达vpn服务器的连通, 这时候就需要`SNAT`功能来让vpn
> 充当数据包的转发功能;

当前我们可以访问`openVPN`的Server, 但是并不能访问同在一个私网里的那个web服务器:`172.200.0.20`.

![image](/image/openvpn-powered-by-docker/QQ20170316-235145.png)

我们进入openVPN的docker容器`docker exec -it test_openvpn_1 bash`:

![image](/image/openvpn-powered-by-docker/QQ20170316-235512.png)

这里可以看到里面NAT的POSTROUTING链规则中没有特殊的配置规则, 而我们的数据从宿主机经过vpn转换
到达VPN Server后数据包原地址应该是1`0.10.10.0/24`网段的, 所以这里有两种做法,原理差不多,都是让
进来的`10.10.10.0/24`网段的数据再次经过自己本机的路由出去:

``` bash
# 添加一条NAT规则, 将来源是10.10.10.0/24网段的包再进行一次route再送出去
iptables -t nat -A POSTROUTING -j MASQUERADE -s 10.10.10.0/24

# 添加一条SNAT规则, 伪装数据来源,将来源是10.10.10.0/24网段的数据包进行一次源地址转换
iptables -t nat -A POSTROUTING -j SNAT -s 10.10.10.0/24 --to-source 172.200.0.10
```

为了简单起见, 我就使用第二条命令做演示, 加入iptables规则后再宿主机上面进行ping测试:

![image](/image/openvpn-powered-by-docker/QQ20170317-000126.png)

这条命令实际上查看是`10.10.10.0/24`网段的数据再数据包出系统前做了一把源地址的修改, 修改成了
`OpenVPN`服务器的ip, 这样在`OpenVPN`的服务器上就可以进行正常的路由找到同在局域网中的web服务器:
`172.200.0.20`.

## 使用DNAT实现内部服务器的伪装

> 有时候处在局域网中的应用服务器也需要对外提供访问功能, 那不可避免的就是安全问题: 应用服务器对外
> 的ip, 以及应用服务器对外提供的服务端口等等; 这时候iptables的DNAT功能就可以实现在路由前对
> 目的地址的修改进而实现有一些有意思的伪装功能;

试想我们当前有的两台局域网的设备:`172.200.0.10`、`172.200.0.20`, 其中20就是应用服务器, 那有没有可能对外隐藏掉20的服务器ip呢, 答案是肯定的;

``` bash
# 添加一条DNAT规则, 伪装应用服务器,对外隐藏了实际提供服务的服务器ip地址和端口
iptables -t nat -A PREROUTING -d 172.200.0.30 -p tcp --dport 80 -j DNAT --to-destination 172.200.0.20:80
iptables -t nat -A PREROUTING -d 172.200.0.30 -p icmp -j DNAT --to-destination 172.200.0.20
```
![image](/image/openvpn-powered-by-docker/QQ20170317-001710.png)

这里的原理就是对于iptables来说, 数据包进入前, 会先经过nat的PREROUTING链, 而这个链实在本地
路由前完成的, 所以如果在这个阶段修改了数据包的目的地址, 那在经过路由时就会路由到别的服务器上,
而这些对于外部的访问者来说都是隐藏的, 外部访问者不会感知到数据包在链路层被修改过了;


## 文献参考

- [通过iptables实现端口转发和内网共享上网](http://wwdhks.blog.51cto.com/839773/1154032)
- [iptables维基百科](https://zh.wikipedia.org/wiki/Iptables)


## 一些用得到的的命令

``` bash

# mac下面查看本地路由
netstat –nr
# linux下查看本地路由
route -n
# windows下查看本地路由
route print

# 带行号显示iptables的规则(有行号方便后面的删除)
iptables -t nat -L --line-number

# 根据行号删除规则
iptables -t nat -D POSTROUTING 2

# 添加一条NAT规则, 将来源是10.10.10.0/24网段的包再进行一次route再送出去
iptables -t nat -A POSTROUTING -j MASQUERADE -s 10.10.10.0/24

# 添加一条SNAT规则, 伪装数据来源,将来源是10.10.10.0/24网段的数据包进行一次源地址转换
iptables -t nat -A POSTROUTING -j SNAT -s 10.10.10.0/24 --to-source 172.200.0.10

# 添加一条DNAT规则, 伪装应用服务器,对外隐藏了实际提供服务的服务器ip地址和端口
iptables -t nat -A PREROUTING -d 172.200.0.30 -p tcp --dport 80 -j DNAT --to-destination 172.200.0.20:80
iptables -t nat -A PREROUTING -d 172.200.0.30 -p icmp -j DNAT --to-destination 172.200.0.20

```
