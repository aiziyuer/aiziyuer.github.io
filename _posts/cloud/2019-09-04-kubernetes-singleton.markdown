---
layout: post
title: 单机版kubernetes搭建
date: 2019-09-04 23:41
categories: [云计算]
tags: [学习]
published: True
---

由于工作中经常需要跟kubernetes打交道, 而生产的kubernetes又不能随意改动, 所以记录一下单机版的安装过程

``` bash

# 安装必要的软件
yum -y install wget net-tools telnet tcpdump lrzsz iptables-services

# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld

# 禁用SELinux
setenforce 0
sed -i '/SELINUX=/d' /etc/selinux/config
echo 'SELINUX=disabled' >> /etc/selinux/config

# 关闭系统Swap
swapoff -a
sed -i 's:^/dev/mapper/centos-swap:#/dev/mapper/centos-swap:g' /etc/fstab

```

## 安装Docker

``` bash

# 安装docker需要的工具
yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

# 添加docker的源
yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 安装docker
yum install -y docker
systemctl start docker && systemctl enable docker

```

## 配置Docker

``` bash

# 防火墙默认开始Forward
iptables -F
iptables -t nat -F
iptables -P FORWARD ACCEPT
service iptables save

# 配置代理, 我这里访问dockerhub是要走代理的, 不然特别慢
mkdir -p /etc/systemd/system/docker.service.d
cat <<EOF >/etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:3128/"
Environment="HTTPS_PROXY=http://127.0.0.1:3128/"
Environment="NO_PROXY=localhost,127.0.0.0/8"
EOF
systemctl daemon-reload
systemctl restart docker

```

## 安装Kubernetes

``` bash

# 安装kubeadm、kubectl、kubelet
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF

# 解决路由异常
cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
vm.swappiness=0
net.ipv4.ip_forward = 1
EOF
sysctl --system

# 配置代理, 我这里访问google时要走代理的,不然网络不通
export http_proxy=http://127.0.0.1:3128;
export https_proxy=http://127.0.0.1:3128;
export no_proxy=192.168.200.10,192.168.200.20,192.168.200.30;

# 安装kubeadm等工具
yum install -y kubelet-1.10.3 kubeadm-1.10.3 kubectl-1.10.3 kubernetes-cni-0.6.0
systemctl enable kubelet
systemctl start kubelet

# 开始安装
kubeadm reset
kubeadm init --kubernetes-version=v1.10.0 --pod-network-cidr=10.244.0.0/16

# 安装好了拷贝下连接信息
mkdir -p $HOME/.kube
cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 设置主节点参与调度
kubectl taint nodes --all node-role.kubernetes.io/master-
```

## 安装pod network

``` bash
# 配置flannel
wget https://raw.githubusercontent.com/coreos/flannel/v0.9.1/Documentation/kube-flannel.yml
# !!修改配置制定网卡, --kube-subnet-mg后面加上: --iface=eth1
# !!修改里面的pod网段, 原生是10.244.0.0/16, 我们的是218.218.0.0/16

kubectl apply -f kube-flannel.yml
kubectl logs -f kube-flannel-ds-amd64-rvmg6 -n kube-system kube-flannel

### 查询Pod状态
watch kubectl get pod --all-namespaces -o wide
```


## 测试

``` bash
# 创建一个三副本的应用
kubectl run nginx --image=nginx --replicas=3

# 公开服务端口
kubectl expose deployment nginx --port=88 --target-port=80 --type=NodePort

# 查看服务信息
kubectl get service
```

## FAQ

- [kubeadm安装单机版kubernetes（简单快速）](https://blog.csdn.net/u013355826/article/details/82801482)