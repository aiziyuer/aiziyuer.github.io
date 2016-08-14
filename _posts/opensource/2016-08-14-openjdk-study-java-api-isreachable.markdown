---
layout: post
title: InetAddress.isReachable源码学习
categories: [开源]
tags: [语言, 源码, 学习]
published: True
---

> `java`的`java.net.InetAddress.isReachable(int timeout)`判断地址可达, 但真的是这样吗?

## 背景

这个问题是因为我在工作中发现的, 现象就是程序使用普通用户运行, 有个局域网的地址死活不通, 
但是使用root用户运行程序后, 地址就可以访问, 看了内部的java代码,发现就是一下这个接口:

```java
/**
 * Test whether that address is reachable. Best effort is made by the
 * implementation to try to reach the host, but firewalls and server
 * configuration may block requests resulting in a unreachable status
 * while some specific ports may be accessible.
 * A typical implementation will use ICMP ECHO REQUESTs if the
 * privilege can be obtained, otherwise it will try to establish
 * a TCP connection on port 7 (Echo) of the destination host.
 * <p>
 * The timeout value, in milliseconds, indicates the maximum amount of time
 * the try should take. If the operation times out before getting an
 * answer, the host is deemed unreachable. A negative value will result
 * in an IllegalArgumentException being thrown.
 *
 * @param   timeout the time, in milliseconds, before the call aborts
 * @return a <code>boolean</code> indicating if the address is reachable.
 * @throws IOException if a network error occurs
 * @throws  IllegalArgumentException if <code>timeout</code> is negative.
 * @since 1.5
 */
public boolean isReachable(int timeout) throws IOException {

```

接口的注释到时非常清楚, 说这个接口在可以获得高的权限的时候, 会使用`icmp`(这个也是`ping`的内部实现)
协议来做地址可达的测试; 但是平时的时候, 会使用`tcp`协议然后通过端口`7`来进行地址可达的验证;

## 分析
---

看上去好像文档说的很有道理, 但是云里雾里是不是, 所以我想了一个简单的例子, 写一个简单的java小程序来测试:

```java
import java.net.InetAddress;

public class Hello {
			
	public static void main(String[] args) throws Exception {
		InetAddress ia = InetAddress.getByName(args[0]);
		System.out.println(ia.isReachable(Integer.parseInt(args[1])));
	}
}
```

程序接受两个参数: ip地址、超时, 我的程序放在我自己编译的jdk的bin目录，运行起来大概是这个样子：

```bash
./java \
-classpath .:/Users/lc/Documents/OpenJDK/hg/jdk9/build/macosx-x86_64-normal-server-slowdebug/jdk/bin/ \
Hello 192.168.1.109 300
```

## 测试
---

### 模拟远端服务器

考虑到`Mac`下配置防火墙太危险(我还不想弄的我的宿主机瘫痪), 所以我虚拟了一个`ubuntu`系统(一定要桥接网络)来做测试,
先查看现有防火墙设置:

```bash
# 查看网卡获得对外的服务ip
➜  ~ ifconfig eth0
eth0      Link encap:以太网  硬件地址 08:00:27:93:c3:0b  
          inet 地址:192.168.1.105  广播:192.168.1.255  掩码:255.255.255.0
          inet6 地址: fe80::a00:27ff:fe93:c30b/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  跃点数:1
          接收数据包:1054 错误:0 丢弃:0 过载:0 帧数:0
          发送数据包:161 错误:0 丢弃:0 过载:0 载波:0
          碰撞:0 发送队列长度:1000 
          接收字节:193036 (193.0 KB)  发送字节:24001 (24.0 KB)

# 查看当前防火墙, 这里没有任何规则
➜  ~ sudo iptables --list
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

分别用`root/普通`用户运行命令查看`ip`是否可达:

```bash
➜  bin pwd
/Users/lc/Documents/OpenJDK/hg/jdk9/build/macosx-x86_64-normal-server-slowdebug/jdk/bin
# 将Hello.class放在bin目录下
➜  bin ls | grep Hello.class
Hello.class
# Root用户运行, 发现网络是可达的
➜  bin sudo -E ./java Hello 192.168.1.105 300
true
# 普通用户运行, 发现网络依然是可达的
➜  bin ./java Hello 192.168.1.105 300
true
```
这里是因为我的服务器上是什么规则都没有

### 服务器禁用`tcp`的`7`口

这里禁用掉服务器的`7`口, 并且用nmap工具查看端口是否被过滤:

```bash
# 清空其他的规则
➜  ~ sudo iptables -F
➜  ~ sudo iptables -A INPUT -p tcp -m tcp --dport 7 -j DROP
➜  ~ sudo iptables --list
Chain INPUT (policy ACCEPT)
target     prot opt source               destination
DROP       tcp  --  anywhere             anywhere             tcp dpt:echo

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
➜  ~ nmap 192.168.1.105 7

Starting Nmap 6.40 ( http://nmap.org ) at 2016-08-14 22:11 CST
Strange error from connect (22):Invalid argument
Nmap scan report for 192.168.1.105
Host is up (0.0035s latency).
Not shown: 999 closed ports
PORT  STATE    SERVICE
7/tcp filtered echo

```

分别用`root/普通`用户运行命令查看`ip`是否可达:

```bash
➜  bin sudo -E ./java Hello 192.168.1.105 300
true
# 普通用户访问, 因为对方7口被禁, 所以访问不了
➜  bin ./java Hello 192.168.1.105 300
false
```

### 结论

到了这里, 可以清晰看到, 如果服务器禁止了端口扫描而禁用了`7`口, 那这时候使用这个`api`就会无比蛋疼

## 源码调试
---

其实我第一次接触这个问题是因为看文档才想到权限问题, 但是并不是一下子看javadoc就理解了意思的, 而是
直接调试了底层的`c`源码,了解的,所以这里一并做下记录.

### 分析JAVA代码

通过java端的调试, 基本上可以看到是java中进行了jni的调用:

```java
private native boolean isReachable0(byte[] addr, int timeout, byte[] ifaddr, int ttl) throws IOException;
```

### 分析`JNI`代码

接下来就是搜索jdk的C源码, 这里我使用的是`textmate`(`win`下我一般都用`powergrep`, 但是貌似这个速度更快)

![image](/image/openjdk-study-java-api-isreachable/QQ20160814-0.png)

找到路径是`/Users/lc/Documents/OpenJDK/hg/jdk9/jdk/src/java.base/unix/native/libnet/Inet4AddressImpl.c`


### 调试`JNI`代码

1. 添加`java.base`源码到目录准备调试
2. `Xcode`中的参数修改为`-classpath .:/Users/lc/Documents/OpenJDK/hg/jdk9/build/macosx-x86_64-normal-server-slowdebug/jdk/bin/ Hello 192.168.1.105 300`
3. 在`Inet4AddressImpl.c`中设置断点
4. 调试过程中, `lldb`设置`process handle SIGSEGV --stop=false`

![image](/image/openjdk-study-java-api-isreachable/QQ20160814-1.png)

里面有一小段c代码:

```c
/*
 * Let's try to create a RAW socket to send ICMP packets
 * This usually requires "root" privileges, so it's likely to fail.
 */
fd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
if (fd != -1) {
  /*
   * It didn't fail, so we can use ICMP_ECHO requests.
   */
  return ping4(env, fd, &him, timeout, netif, ttl);
}
```

代码的注释就靠谱多了, 说是需要`root`权限进行`RAW Socket`(这个不属于`tcp`了), 只有得到后才会进行`ping`的方式来检测服务可达, 
所以`ping`这个操作是也需要"`root`"权限才能做的. 

## 后记
---

### 为什么我们平时ping可以非`root`直接执行呢?

```bash
# 首先看一下ping的权限
➜  ~ ls -l /bin/ping
-rwsr-xr-x 1 root root 44168  5月  8  2014 /bin/ping
➜  ~ ping www.google.com.hk
PING www.google.com.hk (220.255.2.153) 56(84) bytes of data.
64 bytes from chatenabled.mail.google.com (220.255.2.153): icmp_seq=2 ttl=46 time=486 ms
```
`ping`程序的执行权限中的`set-user-ID`
（`suid`，左数第四个）位默认是被置位的，即该程序默认是以所有者权限运行的,
对于`ping`，所有者为`root`。所以普通用户 不需要`sudo`也可以运行该程序。

```bash
➜  ~ sudo chmod -s /bin/ping
➜  ~ ls -l /bin/ping        
-rwxr-xr-x 1 root root 44168  5月  8  2014 /bin/ping
➜  ~ ping www.google.com.hk 
ping: icmp open socket: Operation not permitted
```

说明没有`suid`后就需要`root`权限才能执行了.

> 不过也挺奇怪, 我的`mac`下`ping`的去权模是`-r-xr-xr-x`, 但是照样可以使用, 以后再研究吧.

### 那有没有不开启`suid`的方式来是`ping`工作的方法吗?

有, 在 root 用户下，用 setcap 命令给 /bin/ping 这个可执行文件加上 “cap_net_admin,cap_net_raw+ep” 权限，普通用户即可使用`ping`;

```bash
➜  ~  sudo setcap 'cap_net_admin,cap_net_raw+ep' /bin/ping
➜  ~ getcap /bin/ping
/bin/ping = cap_net_admin,cap_net_raw+ep
➜  ~ ls -l /bin/ping 
-rwxr-xr-x 1 root root 44168  5月  8  2014 /bin/ping
➜  ~ ping www.google.com.hk
PING www.google.com.hk (220.255.2.153) 56(84) bytes of data.
64 bytes from chatenabled.mail.google.com (220.255.2.153): icmp_seq=1 ttl=46 time=557 m
```

Done

## 参考文献
---

- [对 Capabilities (libcap, getcap, setcap) 的基本了解](http://feichashao.com/capabilities_basic/)









