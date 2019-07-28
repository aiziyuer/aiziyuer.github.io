---
layout: post
title: "kong学习之-插件"
date: "2019-07-28 14:04:31 +0800"
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

### 简单路由

我们实现一个简单的uri的转换:
`https://ziyu0123456789.cn/favico_ico` => `https://mirrors.huaweicloud.com/favicon.ico`

``` bash

export service_url="https://mirrors.huaweicloud.com"

export SERVICE_NAME=`
echo -n $service_url | perl -pe 's/[^\w]+/_/g'
`
echo "SERVICE_NAME: $SERVICE_NAME"

# 删除绑定了某个service的路由
curl -sX GET \
--url http://localhost:8001/services/$SERVICE_NAME/routes \
| jq --raw-output '.data[].id' \
| xargs -n1 -I{} curl -sX DELETE "http://localhost:8001/routes/{}"

# 删除service
curl -sX DELETE \
--url http://localhost:8001/services/$SERVICE_NAME \
| jq '.'

# 创建service
curl -sX POST \
--url http://localhost:8001/services/ \
--data name=$SERVICE_NAME \
--data url=$service_url \
| jq '.'

# 删除绑定了某个service的路由
curl -sX GET \
--url http://localhost:8001/services/$SERVICE_NAME/routes \
| jq --raw-output '.data[].id' \
| xargs -n1 -I{} curl -sX DELETE "http://localhost:8001/routes/{}"

export SERVICE_ID=`
 curl -X GET \
 --url http://localhost:8001/services/$SERVICE_NAME \
 | jq --raw-output '.id'
`
echo "SERVICE_ID: $SERVICE_ID"

# 创建路由
export ROUTE_ID=`
curl -X POST http://localhost:8001/routes/ \
-H 'Content-Type: application/json' \
-d @- << EOF | jq --raw-output '.id'
{
    "hosts": ["ziyu0123456789.cn"],
    "protocols": ["https"],
    "paths": ["/(?<l1>[^/]+)_(?<l2>[^/]+)"],
    "service": {
        "id": "$SERVICE_ID"
    }
}
EOF
`
echo "ROUTE_ID: $ROUTE_ID"

# 创建插件
curl -X POST \
--url "http://localhost:8001/routes/$ROUTE_ID/plugins" \
--data 'name=uri-transformer' \
--data "route.id=$ROUTE_ID" \
--data "config.uri_template=/{l1}.{l2}"

# 测试路由是否正常
# 原始站点
curl -X GET \
"$SERVICE_NAME/favicon.ico" \
| base64 | head -n 1

 # 测试代理1
curl -vvv -k -X GET \
--url https://ziyu0123456789.cn:8443/favicon.ico \
 | base64 | head -n 1

 # 测试代理1
curl -k -X GET \
--url https://ziyu0123456789.cn:8443/favicon_ico \
 | base64 | head -n 1

```

### 常用的查询指令

``` bash
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


## FAQ

-   [配置一个服务](https://www.pocketdigi.com/book/kong/started/configuring-service.html)
-   [写一个Kong前端URI通配符传递插件](https://www.xiaomastack.com/2019/01/19/kong-plugin-upstream-url-penetrate/)
