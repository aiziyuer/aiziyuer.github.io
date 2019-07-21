---
layout: post
title: "kong学习"
date: "2019-07-20 21:09:31 +0800"
categories: [云计算]
tags: [学习]
published: True
---

## 系统要求

```
# 安装必要的软件
yum install -y jq

```

## 基本API研究

### 简单https反代

``` bash

# 删除绑定了某个service的路由
curl -sX GET \
--url http://localhost:8001/services/$SERVICE_ID/routes \
| jq --raw-output '.data[].id' \
| xargs -n1 -I{} curl -sX DELETE "http://localhost:8001/routes/{}"

# 删除service
curl -sX DELETE \
--url http://localhost:8001/services/ssl_mirrors_huaweicloud_com \
| jq '.'

# 创建service
curl -sX POST \
--url http://localhost:8001/services/ \
--data 'name=ssl_mirrors_huaweicloud_com' \
--data 'url=https://mirrors.huaweicloud.com' \
| jq '.'

export SERVICE_ID=`
 curl -sX GET \
 --url http://localhost:8001/services/ssl_mirrors_huaweicloud_com \
 | jq --raw-output '.id'
`
echo "SERVICE_ID: $SERVICE_ID"

# 创建路由
curl -sX POST \
--url http://localhost:8001/routes/ \
--data 'hosts[]=ziyu0123456789.cn' \
--data 'protocols[]=https' \
--data "service.id=$SERVICE_ID" \
| jq '.'

# 测试路由是否正常
# 原始站点
curl -s -X GET \
https://mirrors.huaweicloud.com/favicon.ico \
| base64 | head -n 1
 # 伪装代理
curl -sk -X GET \
--url https://localhost:8443/favicon.ico \
--header 'Host: ziyu0123456789.cn' \
 | base64 | head -n 1

```

### 处理https证书

``` bash

# 创建证书
export CERT_ID=`
curl -sX POST \
--url http://localhost:8001/certificates/ \
-F 'cert=@/opt/CA/APP-CERTS/server-all.crt' \
-F 'key=@/opt/CA/APP-CERTS/server-key.pem' \
| jq --raw-output '.id'
`
echo "CERT_ID: $CERT_ID"

# 创建前清除已有的SNI
curl -X DELETE \
--url http://localhost:8001/snis/ziyu0123456789.cn
# 创建SNI, name是hostname
curl -sX POST \
--url http://localhost:8001/snis/ \
--data 'name=ziyu0123456789.cn' \
--data "certificate.id=$CERT_ID" \
| jq --raw-output '.'

# 测试路由是否正常
# 原始站点
curl -s -X GET \
https://mirrors.huaweicloud.com/favicon.ico \
| base64 | head -n 1
 # 伪装代理
curl -s -X GET \
--url https://ziyu0123456789.cn/favicon.ico \
 | base64 | head -n 1

# 这里因为我们的域名已经颁发自颁发了域名,
# 参考我前一篇: http://aiziyuer.github.io/2019/07/20/self-ca-server-crt.html
# 所以这curl就可以直接访问, 证书已经完整
```

### 常用的查询指令

```
# 列出所有service
curl -sX GET \
--url http://localhost:8001/services \
| jq '.'

# 列出所有路由
curl -sX GET \
--url http://localhost:8001/routes \
| jq '.'

# 列出所有证书
curl -sX GET \
--url http://localhost:8001/certificates \
| jq '.'

# 列出所有sni
curl -sX GET \
--url http://localhost:8001/snis \
| jq '.'


```


## 插件研究

### request-transformer-advanced

``` bash

# 列出所有插件
curl -sX GET \
--url http://localhost:8001/plugins \
| jq '.'

# 为ssl_mirrors_huaweicloud_com服务打开插件
curl -X POST \
--url http://localhost:8001/services/ssl_mirrors_huaweicloud_com/plugins \
--data "name=request-transformer" \
| jq '.'


# 需要实现 转换: TODO /static_favicon.ico -> /favicon.ico
curl -X PUT \
--url http://localhost:8001/services/ssl_mirrors_huaweicloud_com/plugins \
--data ""

```


## FAQ

-   [配置一个服务](https://www.pocketdigi.com/book/kong/started/configuring-service.html)
