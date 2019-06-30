---
layout: post
title: "多master高可用kubernets集群搭建"
date: "2018-08-04 08:56:45 +0800"
categories: [云计算]
tags: [学习]
published: True
---

# 背景

承接上一篇<<搭建高可用ETCD集群>>, 这里给出高可用的多Master节点的K8集群搭建
手册


# 安装指南

## 软件版本说明

| name | version |
| --- | --- |
| etcd  | 3.2.18  |
| centos7   | 7.5.1804  |


## 网络规划:

为了模拟生产的环境, 你可以用VMware创建三台虚拟机, 然后为这三台虚拟机创建一个虚拟网络,
我这里创建的网络的网段是`192.168.200.1-192.168.200.255`.

| host | ip |
| --- | ---|
| master1 | 192.168.200.10 |
| master2 | 192.168.200.20 |
| master3 | 192.168.200.30 |
| node1   | 192.168.200.40 |


## 环境处理

做一下时间同步

``` bash
yum install ntp -y
ntpdate pool.ntp.org
```

``` bash
# 安装必要的软件
yum update -y
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
sed -i 's:^/dev/mapper/cl-swap:#/dev/mapper/cl-swap:g' /etc/fstab

# 配置SSH支持forward
sed -i '/AllowTcpForwarding/d' /etc/ssh/sshd_config
echo 'AllowTcpForwarding yes' >> /etc/ssh/sshd_config
systemctl restart sshd

# 安装Docker
yum install docker -y
systemctl enable docker
systemctl start docker

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
yum -y install kubeadm-1.9.2 kubectl-1.9.2 kubelet-1.9.2 kubernetes-cni-0.6.0
systemctl enable kubelet
systemctl start kubelet

```

## 初始化首节点(master1)

``` bash
mkdir -p ~/k8s
cd ~/k8s
# 生成集群的配置
cat >config.yaml <<EOF
apiVersion: kubeadm.k8s.io/v1alpha1
kind: MasterConfiguration
kubernetesVersion: v1.9.2
api:
  advertiseAddress: 0.0.0.0
etcd:
  endpoints:
  - https://master1:2379
  - https://master2:2379
  - https://master3:2379
  caFile: /etc/etcd/certs/ca.pem
  certFile: /etc/etcd/certs/client.pem
  keyFile: /etc/etcd/certs/client-key.pem
networking:
  podSubnet: 218.218.0.0/16
apiServerCertSANs:
- 192.168.200.10
- 192.168.200.20
- 192.168.200.30
apiServerExtraArgs:
  apiserver-count: "3"
EOF

# 这一步会下载k8的镜像会稍微慢一点
kubeadm init --ignore-preflight-errors=all --config=config.yaml

# 首节点初始化后靠背一份配置到本地方便用kubectl来访问集群
mkdir -p $HOME/.kube
cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

## 初始化剩余节点(master2,master3)

``` bash
# 从首节点上拷贝证书
scp root@master1:/etc/kubernetes/pki/\* /etc/kubernetes/pki

# 初始化节点
mkdir -p ~/k8s
cd ~/k8s
cat >config.yaml <<EOF
apiVersion: kubeadm.k8s.io/v1alpha1
kind: MasterConfiguration
kubernetesVersion: v1.9.2
api:
  advertiseAddress: 0.0.0.0
etcd:
  endpoints:
  - https://master1:2379
  - https://master2:2379
  - https://master3:2379
  caFile: /etc/etcd/certs/ca.pem
  certFile: /etc/etcd/certs/client.pem
  keyFile: /etc/etcd/certs/client-key.pem
networking:
  podSubnet: 218.218.0.0/16
apiServerCertSANs:
- 192.168.200.10
- 192.168.200.20
- 192.168.200.30
apiServerExtraArgs:
  apiserver-count: "3"
EOF

# 这一步会下载k8的镜像会稍微慢一点
kubeadm init --ignore-preflight-errors=cri --config=config.yaml

# 首节点初始化后靠背一份配置到本地方便用kubectl来访问集群
mkdir -p $HOME/.kube
cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

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

## 工作节点添加

``` bash
# 在master节点上临时生成一个token来加入node
kubeadm token create

# token获取
kubeadm token list | grep authentication,signing | awk '{print $1}'

# sha256获取
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'

# 添加工作节点
kubeadm --ignore-preflight-errors=cri join --token a6030a.be2b152063795011 192.168.200.30:6443 --discovery-token-ca-cert-hash sha256:f9bb5d10afb47b24c4fb2304c1bf9b11845590c51e3d9116af4e07e2f37c3223

# 如果想删除node
kubectl get node
kubectl delete node

```

## 出错回滚

k8的集群搭建涉及的东西比较多, 难免会出现理解偏差导致节点初始化出错, 以下是节点
初始化的回滚方法

``` bash
kubeadm reset
ifconfig cni0 down
ip link delete cni0
ifconfig flannel.1 down
ip link delete flannel.1
rm -rf /var/lib/cni/
systemctl restart docker
```

> 特别: k8的信息是写入etcd的, 所以如果出现节点救不活了, 建议清除etcd的所有配置


# 参考文献

-   [How to Install Multi Master Kubernetes 1.9 on RHEL 7](https://kazuhisya.netlify.com/2018/02/08/how-to-install-k8s-on-el7/)
-   [kubernetes 1.9 high-availability](https://github.com/kubernetes/website/blob/release-1.9/docs/setup/independent/high-availability.md)
-   [kubernetes 1.10 high-availability](https://github.com/kubernetes/website/blob/release-1.10/content/en/docs/setup/independent/high-availability.md)
