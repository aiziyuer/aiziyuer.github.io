---
layout: post
title: "单机版kubernetes安装(18.0x)"
categories: [云计算]
tags: [语言, 源码, 学习]
published: True
---

家里网络上了透明代理, 全面接轨最新kubernetes, 教程也直接去除所有对代理的配置, 简化搭建过程。


## 基础软件

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

# 防火墙默认开始Forward
iptables -F
iptables -t nat -F
iptables -P FORWARD ACCEPT
service iptables save

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
export no_proxy=192.168.200.254;

# 安装kubeadm等工具
yum install -y kubelet-1.18.5 kubeadm-1.18.5 kubectl-1.18.5 kubernetes-cni-0.8.6
systemctl enable kubelet
systemctl start kubelet
```

## kubenetes主集群初始化

``` bash
# 初始化安装
kubeadm init --pod-network-cidr=10.244.0.0/16

# 安装好了拷贝下连接信息
mkdir -p $HOME/.kube
cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 设置主节点参与调度
# kubectl taint nodes --all node-role.kubernetes.io/master-

# 出错回滚
# kubeadm reset
# ifconfig cni0 down; ip link delete cni0
# ifconfig flannel.1 down; ip link delete flannel.1
# rm -rf /var/lib/cni/

```

## 安装pod network

``` bash
# 配置flannel
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

### 查询Pod状态
watch kubectl get pod --all-namespaces -o wide
```

## 安装helm

``` bash
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

# 设置stable源
helm repo add stable https://kubernetes-charts.storage.googleapis.com
```

## helm使用

借助helm安装必要的app

``` bash
# ingress
kubectl create namespace ingress || true
helm --namespace=ingress uninstall nginx || true
helm --namespace=ingress install nginx stable/nginx-ingress  \
      --set controller.kind=DaemonSet \
      --set controller.daemonset.useHostPort=true \
      --set controller.nodeSelector."node-role\.kubernetes\.io/master"= \
      --set controller.tolerations\[0\].operator=Exists \
      --set defaultBackend.nodeSelector."node-role\.kubernetes\.io/master"= \
      --set defaultBackend.tolerations\[0\].operator=Exists \
      --set controller.metrics.enabled=true

# nfs动态存储
kubectl create namespace storage || true
helm --namespace=storage uninstall nfs || true
helm --namespace=storage install nfs stable/nfs-client-provisioner \
      --set nfs.server=10.10.10.202 \
      --set nfs.path=/volume1/kubernetes \
      --set storageClass.defaultClass=true \
      --set storageClass.archiveOnDelete=false
kubectl --namespace storage get pod,svc -o wide 

# jenkins
helm --namespace=jenkins uninstall jenkins || true
helm install jenkins stable/jenkins

# 监控
kubectl create namespace monitor || true
helm --namespace=monitor uninstall prometheus || true
helm --namespace=monitor install prometheus stable/prometheus-operator \
      --set prometheus.ingress.enabled=true \
      --set prometheus.ingress.hosts={prometheus.aiziyuer.synology.me} \
      --set grafana.ingress.enabled=true \
      --set grafana.ingress.hosts={grafana.aiziyuer.synology.me} 
      
```