---
layout: post
title: CentOS7上搭建wireguard服务
date: 2020-03-06 13:45
category: [云计算]
author: 李聪
tags: [学习]
published: True
summary: 
---

``` bash
############# 服务器内核篇 ##########################
# 安装源
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
yum install -y \
    https://www.elrepo.org/elrepo-release-7.0-4.el7.elrepo.noarch.rpm

# 安装ml内核(如果不需要bbr想稳定点就: lts的4.x内核)
yum --enablerepo="elrepo-kernel" install -y \
        kernel-ml kernel-ml-devel

# 查看可用引导版本
egrep ^menuentry /etc/grub2.cfg | cut -f 2 -d \'

# 如果是UEFI系统用一下命令查看可用引导版本
awk -F\' '$1=="menuentry " {print i++ " : " $2}' /boot/efi/EFI/centos/grub.cfg

# 切换内核
grub2-set-default 0

# 重启生效内核
reboot

# 查看内核是否生效
uname -r

# 设置内核参数
cat << EOF >/etc/sysctl.conf
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.ip_forward = 1
net.ipv4.tcp_syncookies = 1
EOF
sysctl --system

# 做作的防火墙策略放开
firewall-cmd --zone=public --add-port=57000/udp --permanent
firewall-cmd --zone=public --add-masquerade --permanent
firewall-cmd --reload
firewall-cmd --list-all

############### 服务器应用篇 ######################

# 安装wireguard
yum install -y \
    https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
curl -o /etc/yum.repos.d/jdoss-wireguard-epel-7.repo \
    https://copr.fedorainfracloud.org/coprs/jdoss/wireguard/repo/epel-7/jdoss-wireguard-epel-7.repo
yum install -y wireguard-dkms wireguard-tools


# 生成私钥
mkdir -p /etc/wireguard
wg genkey >/etc/wireguard/10.10.8.0
wg genkey >/etc/wireguard/10.10.8.1
wg genkey >/etc/wireguard/10.10.8.2
wg genkey >/etc/wireguard/10.10.8.3
# ...

systemctl stop wg-quick@wg0.service

# 生成配置
cat << EOF >/etc/wireguard/wg0.conf
[Interface]
PrivateKey = $(cat /etc/wireguard/10.10.8.0)
Address = 10.10.8.0/24
ListenPort = 57000
SaveConfig = true
PostUp = iptables -t nat -A POSTROUTING -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -j MASQUERADE

[Peer]
PublicKey = $(wg pubkey </etc/wireguard/10.10.8.1)
AllowedIPs = 10.10.8.1/32
PersistentKeepalive = 25

[Peer]
PublicKey = $(wg pubkey </etc/wireguard/10.10.8.2)
AllowedIPs = 10.10.8.2/32
PersistentKeepalive = 25

[Peer]
PublicKey = $(wg pubkey </etc/wireguard/10.10.8.3)
AllowedIPs = 10.10.8.3/32
PersistentKeepalive = 25

# ...
EOF

# 启动
systemctl enable wg-quick@wg0.service
systemctl start wg-quick@wg0.service

################### 客户端应用篇 ######################
# 生成客户端配置
cat << EOF
[Interface]
PrivateKey = $(cat /etc/wireguard/10.10.8.1)
Address = 10.10.8.1/32
DNS = 8.8.8.8

[Peer]
PublicKey = $(wg pubkey </etc/wireguard/10.10.8.0)
Endpoint = $(curl icanhazip.com):57000
AllowedIPs = 10.10.8.0/32, 0.0.0.0/5, 8.0.0.0/7, 11.0.0.0/8, 12.0.0.0/6, 16.0.0.0/4, 32.0.0.0/3, 64.0.0.0/2, 128.0.0.0/3, 160.0.0.0/5, 168.0.0.0/6, 172.0.0.0/12, 172.32.0.0/11, 172.64.0.0/10, 172.128.0.0/9, 173.0.0.0/8, 174.0.0.0/7, 176.0.0.0/4, 192.0.0.0/9, 192.128.0.0/11, 192.160.0.0/13, 192.169.0.0/16, 192.170.0.0/15, 192.172.0.0/14, 192.176.0.0/12, 192.192.0.0/10, 193.0.0.0/8, 194.0.0.0/7, 196.0.0.0/6, 200.0.0.0/5, 208.0.0.0/4, 8.8.8.8/32
PersistentKeepalive = 25
EOF

# ...

```