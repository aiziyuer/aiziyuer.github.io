---
layout: post
title: "kong学习"
date: "2019-07-20 21:09:31 +0800"
categories: [云计算]
tags: [学习]
published: False
---

## 系统要求

```
# 安装必要的软件
yum install -y jq

```


## 反代某个https的网站资源

``` bash

# 删除绑定了某个service的路由
curl -sX GET \
--url http://localhost:8001/services/$SERVICE_ID/routes \
| jq --raw-output '.data[].id' \
| xargs -n1 -I{} curl -sX DELETE "http://localhost:8001/routes/{}"

# 删除service
curl -sX DELETE \
--url http://localhost:8001/services/https_mirrors_huaweicloud_com \
| jq '.'

# 创建service
curl -sX POST \
--url http://localhost:8001/services/ \
--data 'name=https_mirrors_huaweicloud_com' \
--data 'url=https://mirrors.huaweicloud.com' \
| jq '.'

export SERVICE_ID=`
 curl -sX GET \
 --url http://localhost:8001/services/https_mirrors_huaweicloud_com \
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

```


## FAQ

-   [配置一个服务](https://www.pocketdigi.com/book/kong/started/configuring-service.html)
