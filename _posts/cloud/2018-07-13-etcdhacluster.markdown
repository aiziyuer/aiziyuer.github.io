---
layout: post
title: "搭建高可用ETCD集群"
categories: [云计算]
tags: [学习]
date: "2018-07-13 22:40:17 +0800"
published: True
---

# 背景

在正式的生产环境中, `Kubernets`的集群往往是多个`master`的, 而k8的元信息都是存储
在etcd中的, 这就要求我们的`etcd`是要多个节点做到高可用, 这里就简单记录一下`etcd`
集群的搭建过程,希望对他人也有帮助。

# 安装指南

## 软件版本说明

| name | version |
| --- | --- |
| etcd  | 3.2.18  |
| centos7   | 7.5.1804  |

## 网络规划

为了模拟生产的环境, 你可以用VMware创建三台虚拟机, 然后为这三台虚拟机创建一个虚拟网络,
我这里创建的网络的网段是`192.168.200.1-192.168.200.255`.

| host | ip |
| --- | ---|
| master1 | 192.168.200.10 |
| master2 | 192.168.200.20 |
| master3 | 192.168.200.30 |

## 环境处理

做一下时间同步

``` bash
yum install ntp -y
ntpdate pool.ntp.org
```

安装证书生成工具

``` bash
curl -o /usr/local/bin/cfssl \
https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
curl -o /usr/local/bin/cfssljson \
https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
chmod +x /usr/local/bin/cfssl*
```

配置hosts以方便解析域名

``` bash
sed -i '/master/d' /etc/hosts
cat <<'EOF'>>/etc/hosts
192.168.200.10 master1
192.168.200.20 master2
192.168.200.30 master3
EOF
```

安装etcd

``` bash
yum install etcd -y
```

配置相同的`ssh`秘钥

``` bash
ssh-keygen -t rsa -b 4096 # master1
ssh-copy-id root@master2
ssh-copy-id root@master3
```

## 证书生成

etcd最蛋疼最麻烦的地方来了,证书的配置没有太多的学问,一定要特别细心才行.

> 不建议放k8配置目录(/etc/kubernetes/pki/etcd), kubeadm reset的时候会被删掉

### 生成CA证书(master1)

``` bash
# 进入证书目录
mkdir -p /etc/etcd/certs && cd /etc/etcd/certs

cat >ca-config.json <<EOF
{
    "signing": {
        "default": {
            "expiry": "43800h"
        },
        "profiles": {
            "server": {
                "expiry": "43800h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            },
            "client": {
                "expiry": "43800h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "client auth"
                ]
            },
            "peer": {
                "expiry": "43800h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            }
        }
    }
}
EOF

cat >ca-csr.json <<EOF
{
    "CN": "etcd",
    "key": {
        "algo": "rsa",
        "size": 2048
    }
}
EOF

# 生成 ca的公钥:ca.pem, 私钥:ca-key.pem
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
```

### 生成客户端证书(master1)

k8或者一些通过证书来访问的gui工具

``` bash
# 进入证书目录
mkdir -p /etc/etcd/certs && cd /etc/etcd/certs
cat >client.json <<EOF
{
    "CN": "client",
    "key": {
        "algo": "ecdsa",
        "size": 256
    }
}
EOF

# 生成client的公钥: client.pem,私钥:client-key.pem
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json \
-profile=client client.json | cfssljson -bare client
```

### 证书分发到其他节点(master2,master3)

``` bash
mkdir -p /etc/etcd/certs && cd /etc/etcd/certs
scp root@master1:/etc/etcd/certs/\* .
```

### 生成server和peer证书(master1,master2,master3)

> 这一步在三个节点分别执行

生成服务端和etcd节点互信(`2380`)的证书

``` bash
export PEER_NAME=$(hostname)
export PRIVATE_IP=$(ip addr show ens37 | grep -Po 'inet \K[\d.]+')

cfssl print-defaults csr > config.json
sed -i '0,/CN/{s/example\.net/'"$PEER_NAME"'/}' config.json
sed -i 's/www\.example\.net/'"$PRIVATE_IP"'/' config.json
sed -i 's/example\.net/'"$PEER_NAME"'/' config.json

cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json \
-profile=server config.json | cfssljson -bare server
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json \
-profile=peer config.json | cfssljson -bare peer
```

因为etcd是以etcd用户来启动的,所以设置证书为etcd属组

``` bash
chown etcd:etcd /etc/etcd/certs/*
```

### 配置etcd(master1,master2,master3)

``` bash
export PEER_NAME=$(hostname)
export PRIVATE_IP=$(ip addr show ens37 | grep -Po 'inet \K[\d.]+')

sed -i '/K8Cluster start/,/K8Cluster end/d' /etc/etcd/etcd.conf
cat <<EOF>>/etc/etcd/etcd.conf
### K8Cluster start
#[Member]
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://0.0.0.0:2380"
ETCD_LISTEN_CLIENT_URLS="https://0.0.0.0:2379,http://0.0.0.0:4001" # 这里的4001主要是给etcdctl用的
ETCD_NAME="$PEER_NAME"
#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://$PEER_NAME:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://$PEER_NAME:2379,http://$PEER_NAME:4001"
ETCD_INITIAL_CLUSTER="master1=https://master1:2380,master2=https://master2:2380,master3=https://master3:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="new"
ETCD_STRICT_RECONFIG_CHECK="true"
ETCD_ENABLE_V2="true"
#[Security]
ETCD_CERT_FILE="/etc/etcd/certs/server.pem"
ETCD_KEY_FILE="/etc/etcd/certs/server-key.pem"
ETCD_CLIENT_CERT_AUTH="true"
ETCD_TRUSTED_CA_FILE="/etc/etcd/certs/ca.pem"
ETCD_PEER_CERT_FILE="/etc/etcd/certs/peer.pem"
ETCD_PEER_KEY_FILE="/etc/etcd/certs/peer-key.pem"
ETCD_PEER_CLIENT_CERT_AUTH="true"
ETCD_PEER_TRUSTED_CA_FILE="/etc/etcd/certs/ca.pem"
### K8Cluster end
EOF

systemctl daemon-reload && systemctl restart etcd

```

> 这里要注意, etcd集群启动时首节点启动会卡住, 一定要第二个(或者第三个)节点启动后
> 首节点服务才会正常


### 检查集群状态

``` bash
etcdctl cluster-health

### 得到输出如下说明集群正常:
# member 5f23d73292959784 is healthy: got healthy result from http://master3:4001
# member 9d8e4977362dd913 is healthy: got healthy result from http://master2:4001
# member 9db5890b6392f376 is healthy: got healthy result from http://master1:4001
# cluster is healthy
```

## FAQ

1.  etcd的service无法启动日志在哪? 答: `/var/log/messages`.
2.  etcd首节点启动会卡主怎么办? 答: 启动第一个卡主后启动剩下的节点第一个就会往下走.
3.  cfssl这个工具下载卡主怎么办? 答: 科学上网.

## 参考文献

-   [How to Install Multi Master Kubernetes 1.9 on RHEL 7](https://kazuhisya.netlify.com/2018/02/08/how-to-install-k8s-on-el7/)
-   [kubernetes 1.9 high-availability](https://github.com/kubernetes/website/blob/release-1.9/docs/setup/independent/high-availability.md)
-   [kubernetes 1.10 high-availability](https://github.com/kubernetes/website/blob/release-1.10/content/en/docs/setup/independent/high-availability.md)
