---
layout: post
title: CI持续集成-初步尝试

categories: [opensource]
tags: [java,keytool]
published: True

---

最近在做组内的CI持续集成的工作, 云服务都是通过Docker编译成镜像的, 但是Docker这个东西
在多个镜像同时编译的时候会发现在一个节点内docker的daemon的性能会急剧下降, 具体参见:
[docker storage drivers devicemapper and btrfs very slow](https://github.com/moby/moby/issues/10161)

帖子里面罗列了集中底层设备测试下来现有产品级别的docker的速度其实都是比较慢的,我手动测试
了我的服务镜像27个云服务大小在40G左右, 我的预期的15分钟编译时长,我当前能想到的是分多个
多台VM来同时编译实现(最开始我使用了compose+dind+ssh纯容器实现,奈何实际产品各种限制后面
有时间可以介绍下容器中编译容器,速度比VM快3倍多)。


## 过程

初步想法:

`Jenkins Master` + 27 * `Jekins Agent`

这里碰到的主要问题是27个容器实例还好管理, 但是换成vm就太好管了, 而且这27台我是从openstack
创建的, ip都是随机的, 后面还有可能会变动, 所以我的设想转变成了:

Master:
-   Squid做http代理给ssh用 - 浮动IP -> Squid -> ssh到内部机器
-   DNS Server - 这样其他地方只需要域名访问, 所有麻烦的映射都放在dns配置里
-   Jenkins Master - CI Web和控制任务调度

Agent:
-   java - Agent需要JVM环境
-   Jenkins Agent - 真正的执行者
-   Git - 源码控制

## DNS Server配置

安装必要的软件

``` bash
# 更新系统
yum update -y
# 安装必要的named工具
yum install bind bind-utils -y
```

配置入口文件 `/etc/named.conf`

``` bash
cp /etc/named.conf /etc/named.conf.bk # 需改前备份
cat <<'EOF'>/etc/named.conf
options {
	directory 	"/var/named";
	dump-file 	"/var/named/data/cache_dump.db";
	statistics-file "/var/named/data/named_stats.txt";
	memstatistics-file "/var/named/data/named_mem_stats.txt";
	allow-query     {any; }; // 允许谁使用dns, 懒人选any
	forwarders	{8.8.8.8; }; // 碰到解析不了的名字的查询dns服务器
	recursion yes;
	dnssec-enable yes;
	dnssec-validation yes;
	pid-file "/run/named/named.pid";
};

zone "." IN {
	type hint;
	file "named.ca";
};

// 自定义的ci一级域名, 对应的ci.zone文件在/var/named目录下面
zone "ci" IN {
	type master;
	file "ci.zone";
};
EOF
```

自定义域名配置`/var/named/ci.zone`

``` bash
cat <<'EOF'>/var/named/ci.zone
$TTL 86400
@   IN  SOA     ns1.ci. root.ci. (
        2013042201  ;Serial
        3600        ;Refresh
        1800        ;Retry
        604800      ;Expire
        86400       ;Minimum TTL
)
; Specify our two nameservers
		IN	NS		ns1.ci.

; Resolve nameserver hostnames to IP, replace with your two droplet IP addresses.
ns1		IN	A		172.28.0.254

; Define hostname -> IP pairs which you wish to resolve
@		IN	A		172.28.0.254

; TODO 这里可以加很多自定义的二级域名映射,eg. agent.ci -> 172.28.0.200
agent		IN	A		172.28.0.200 ; ubuntu test server
EOF
```
到这里我们已经有了自己的DNS服务器, 后面对所有服务的访问最好都转换成域名访问, 而如果
服务器ip发生变更, 只需要刷新`ci.zone`这个文件就行, 其他的地方'0修改'.

## Squid代理

简单安装和配置, 这个是我用过的最好用的代理软件没有之一.

``` bash
yum -y install squid
cat <<'EOF'>/etc/squid/squid.conf
acl localnet src 10.0.0.0/8     # RFC1918 possible internal network
acl localnet src 172.16.0.0/12  # RFC1918 possible internal network
acl localnet src 192.168.0.0/16 # RFC1918 possible internal network
acl localnet src fc00::/7       # RFC 4193 local private network range
acl localnet src fe80::/10      # RFC 4291 link-local (directly plugged) machines

acl SSL_ports port 443
acl SSL_ports port 22           # ssh
acl Safe_ports port 80          # http
acl Safe_ports port 21          # ftp
acl Safe_ports port 22          # ssh
acl Safe_ports port 443         # https
acl Safe_ports port 70          # gopher
acl Safe_ports port 210         # wais
acl Safe_ports port 1025-65535  # unregistered ports
acl Safe_ports port 280         # http-mgmt
acl Safe_ports port 488         # gss-http
acl Safe_ports port 591         # filemaker
acl Safe_ports port 777         # multiling http
acl CONNECT method CONNECT

http_access allow all

http_port 3128

coredump_dir /var/spool/squid
refresh_pattern ^ftp:           1440    20%     10080
refresh_pattern ^gopher:        1440    0%      1440
refresh_pattern -i (/cgi-bin/|\?) 0     0%      0
refresh_pattern .               0       20%     4320
EOF
systemctl enable squid && systemctl start squid
```

## 内网穿透测试
使用浮动IP来访问内网的设备, 假设Squlid服务器的浮动IP是`192.168.0.254`, 内网ubuntu服务器
的ip是`172.28.0.200`, 对应域名是`agent.ci`, 我们希望的是在windows(相当于外部)直接ssh域名
`agent.ci`来访问ubuntu服务器;

Xshell连接中选择`代理`, 点击`浏览`, 可以新建代理,这里配置一个代理指向`squid`:

![](/image/ci-vm-implement/xshell-setup-squid-proxy.png)

连接中直接使用`agent.ci`来进行ssh的连接:

![](/image/ci-vm-implement/xshell-connect-domain.png)

连接后的效果:
![](/image/ci-vm-implement/xshell-connect-ubuntu.png)

## 参考文章
-   [How To Install the BIND DNS Server on CentOS 6](https://www.digitalocean.com/community/tutorials/how-to-install-the-bind-dns-server-on-centos-6)
-   [使用CentOS7配置Squid代理](https://www.cnblogs.com/riversouther/p/4717720.html)
-   [Use Squid as HTTP / HTTPS / SSH Proxy](https://www.squins.com/knowledge/squid-http-https-ssh-proxy/)
