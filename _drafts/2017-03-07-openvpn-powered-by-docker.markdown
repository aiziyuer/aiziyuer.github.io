---
layout: post
title: "如何使用Docker来实现OpenVPN Server"
date: "2017-03-07 22:59:18 +0800"
---

本文旨在使用`docker`来模拟`nat`的网络, 然后借助`openVPN`来实现宿主机访问
NAT网络后侧的受保护的主机, 中间如果有多余的精力,会考虑研究一下
`iptables`的一些知识。

## 容器配置部分

### 配置OpenVPN容器所需的参数

这里我们的容器使用docker-composite来组织, 里面会定义好我们需要的网络信息.
文件如下:

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

### 启动容器

``` bash
# 初始化配置文件和证书
#docker-compose run --rm openvpn ovpn_genconfig -u udp://VPN.SERVERNAME.COM
docker-compose run --rm openvpn ovpn_genconfig -u udp://192.168.1.104
docker-compose run --rm openvpn ovpn_initpki

# 修改配置文件的权限
sudo chown -R $(whoami): ./openvpn

# 配置客户端
export CLIENTNAME="your_client_name"
# with a passphrase (recommended)
docker-compose run --rm openvpn easyrsa build-client-full $CLIENTNAME nopass
docker-compose run --rm openvpn ovpn_getclient $CLIENTNAME > $CLIENTNAME.ovpn

# 修改openvpn server
docker-compose up -d openvpn

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
