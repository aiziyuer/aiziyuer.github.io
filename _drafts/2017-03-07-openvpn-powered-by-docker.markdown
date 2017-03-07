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
     public:
       ipv4_address: 172.100.0.10
     private:
       ipv4_address: 172.200.0.10
  webserver:
    image: httpd
    networks:
      public:
        ipv4_address: 172.100.0.20
      private:
        ipv4_address: 172.200.0.20

networks:
  public:
    ipam:
      config:
        - subnet: 172.100.0.0/16
  private:
    ipam:
      config:
        - subnet: 172.200.0.0/16
```

### 启动容器

``` bash
# 初始化配置文件和证书
docker-compose run --rm openvpn ovpn_genconfig -u udp://VPN.SERVERNAME.COM
docker-compose run --rm openvpn ovpn_initpki


# 修改配置文件的权限
sudo chown -R $(whoami): ./openvpn-data

# 修改openvpn server
docker-compose up -d openvpn

# 配置客户端
export CLIENTNAME="your_client_name"
# with a passphrase (recommended)
docker-compose run --rm openvpn easyrsa build-client-full $CLIENTNAME
```
