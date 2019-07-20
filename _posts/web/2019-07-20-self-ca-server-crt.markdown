---
layout: post
title: "学会全流程颁发https证书"
date: "2019-07-20 21:09:31 +0800"
categories: [网页]
tags: [openssl,ca]
published: True
---

最近工作用经常跟证书打交道, 公司内部的申请流程又比较繁复, 所以想这次把证书的颁发流程
全部弄明白。

## 证书创建
一般基建CA证书都是根证书，这个证书是需要浏览器进行初始信任的，然而实际上网站使用的
证书肯定确不是由根CA直接签发的，而是由根证书颁发的二级CA证书签发的。

### 初始化环境变量

``` bash

# 根CA
export ROOT_CA_DIR=/opt/CA/ROOT-CA
# 中级CA
export SUB_CA_DIR=/opt/CA/SUB-CA
# 应用证书
export APP_CERTS_DIR=/opt/CA/APP-CERTS
# 创建目录
mkdir -p $ROOT_CA_DIR $SUB_CA_DIR $APP_CERTS_DIR

```

### 根CA

``` bash

# 根CA
export ROOT_CA_DIR=/opt/CA/ROOT-CA

# 1. 生成openssl.conf的配置
mkdir -p $ROOT_CA_DIR $SUB_CA_DIR $APP_CERTS_DIR
cat <<-EOF>$ROOT_CA_DIR/openssl.conf
[ ca ]
default_ca     = CA_default
[ CA_default ]
dir                          = $ROOT_CA_DIR
certs                        = \$dir/certs
crl_dir                      = \$dir/crl
database                     = \$dir/index.txt
new_certs_dir                = \$dir/newcerts
certificate                  = \$dir/cacert.pem
serial                       = \$dir/serial
crlnumber                    = \$dir/crlnumber
crl                          = \$dir/crl.pem
private_key                  = \$dir/private/cakey.pem
RANDFILE                     = \$dir/private/.rand
unique_subject               = no
x509_extensions              = usr_cert
copy_extensions              = copy
name_opt                     = ca_default
cert_opt                     = ca_default
default_days                 = 36500
default_crl_days             = 30
default_md                   = sha256
preserve                     = no
policy                       = policy_ca
[ policy_ca ]
countryName                  = supplied
stateOrProvinceName          = supplied
organizationName             = supplied
organizationalUnitName= supplied
commonName                   = supplied
emailAddress                 = optional
[ req ]
default_bits                 = 2048
default_keyfile              = privkey.pem
distinguished_name           = req_distinguished_name
attributes                   = req_attributes
x509_extensions              = v3_ca
string_mask                  = utf8only
utf8                         = yes
prompt                       = no
[ req_distinguished_name ]
countryName                  = CN
stateOrProvinceName          = Zhejiang
localityName                 = Hangzhou
organizationName             = Global Aiziyuer CA Inc
organizationalUnitName       = Root CA
emailAddress                 = ziyu0123456789@gmail.com
commonName                   = Global Aiziyuer CA Inc
[ usr_cert ]
basicConstraints             = CA:TRUE
[ v3_ca ]
basicConstraints             = CA:TRUE
[ req_attributes ]
EOF

# 2.初始化目录
mkdir -p $ROOT_CA_DIR/{certs,crl,private,newcerts}
true > $ROOT_CA_DIR/index.txt
true > $ROOT_CA_DIR/serial
true > $ROOT_CA_DIR/crlnumber
echo 0100 > $ROOT_CA_DIR/serial
echo 0100 > $ROOT_CA_DIR/crlnumber

# 3. 根CA私钥生成
openssl genrsa -out $ROOT_CA_DIR/private/cakey.pem 2048


# 根CA证书请求文件生成
openssl req -new -config $ROOT_CA_DIR/openssl.conf \
-key $ROOT_CA_DIR/private/cakey.pem -out $ROOT_CA_DIR/private/ca.csr

# 证书签名
openssl ca -config $ROOT_CA_DIR/openssl.conf \
-in  $ROOT_CA_DIR/private/ca.csr -out $ROOT_CA_DIR/cacert.pem

# # 4. 生成证书公钥
# openssl req -x509 -new -config  $ROOT_CA_DIR/openssl.conf \
# -key $ROOT_CA_DIR/private/cakey.pem -out $ROOT_CA_DIR/cacert.pem

# 6. 查看证书
openssl x509 -text -in $ROOT_CA_DIR/cacert.pem

```


### 二级CA

``` bash

# 根CA
export ROOT_CA_DIR=/opt/CA/ROOT-CA
# 中级CA
export SUB_CA_DIR=/opt/CA/SUB-CA

# 1. 生成openssl.conf的配置
# 基本上配置一样, 只有'usr_cert'中的'basicConstraints'发生了变化
mkdir -p $ROOT_CA_DIR $SUB_CA_DIR $APP_CERTS_DIR
cat <<-EOF>$SUB_CA_DIR/openssl.conf
[ ca ]
default_ca     = CA_default
[ CA_default ]
dir                          = $SUB_CA_DIR
certs                        = \$dir/certs
crl_dir                      = \$dir/crl
database                     = \$dir/index.txt
new_certs_dir                = \$dir/newcerts
certificate                  = \$dir/cacert.pem
serial                       = \$dir/serial
crlnumber                    = \$dir/crlnumber
crl                          = \$dir/crl.pem
private_key                  = \$dir/private/cakey.pem
RANDFILE                     = \$dir/private/.rand
unique_subject               = no
x509_extensions              = usr_cert
copy_extensions              = copy
name_opt                     = ca_default
cert_opt                     = ca_default
default_days                 = 36500
default_crl_days             = 30
default_md                   = sha256
preserve                     = no
policy                       = policy_ca
[ policy_ca ]
countryName                  = supplied
stateOrProvinceName          = supplied
organizationName             = supplied
organizationalUnitName= supplied
commonName                   = supplied
emailAddress                 = optional
[ req ]
default_bits                 = 2048
default_keyfile              = privkey.pem
distinguished_name           = req_distinguished_name
attributes                   = req_attributes
x509_extensions              = v3_ca
string_mask                  = utf8only
utf8                         = yes
prompt                       = no
[ req_distinguished_name ]
countryName                  = CN
stateOrProvinceName          = Zhejiang
localityName                 = Hangzhou
organizationName             = Global Aiziyuer CA Inc
organizationalUnitName       = Aiziyuer CA
emailAddress                 = ziyu0123456789@gmail.com
commonName                   = Global Aiziyuer CA Inc
[ usr_cert ]
basicConstraints             = CA:FALSE
[ v3_ca ]
basicConstraints             = CA:TRUE
[ req_attributes ]
EOF


# 2.初始化目录
mkdir -p $SUB_CA_DIR/{certs,crl,private,newcerts}
true > $SUB_CA_DIR/index.txt
true > $SUB_CA_DIR/serial
true > $SUB_CA_DIR/crlnumber
echo 0100 > $SUB_CA_DIR/serial
echo 0100 > $SUB_CA_DIR/crlnumber

# 3. 根CA私钥生成
openssl genrsa -out $SUB_CA_DIR/private/cakey.pem 2048

# 4. 根CA证书请求文件生成
openssl req -new -config $SUB_CA_DIR/openssl.conf \
-key $SUB_CA_DIR/private/cakey.pem -out $SUB_CA_DIR/private/ca.csr

# 5. 证书签名
openssl ca -config $ROOT_CA_DIR/openssl.conf -extensions v3_ca \
-in  $SUB_CA_DIR/private/ca.csr -out $SUB_CA_DIR/cacert.pem

# 6. 查看证书
openssl x509 -text -in $SUB_CA_DIR/cacert.pem

```

### 应用证书

``` bash

# 根CA
export ROOT_CA_DIR=/opt/CA/ROOT-CA
# 中级CA
export SUB_CA_DIR=/opt/CA/SUB-CA
# 应用证书
export APP_CERTS_DIR=/opt/CA/APP-CERTS

# 生成应用证书
rm -rf $APP_CERTS_DIR
mkdir -p $ROOT_CA_DIR $SUB_CA_DIR $APP_CERTS_DIR
openssl genrsa -out $APP_CERTS_DIR/server-key.pem 2048

# 生成证书请求文件（csr文件）
openssl req -new -days 365 \
-key $APP_CERTS_DIR/server-key.pem -out $APP_CERTS_DIR/server-csr.pem \
-config <(
cat <<-EOF
[ req ]
prompt                       = no
distinguished_name           = server_distinguished_name
req_extensions               = req_ext
x509_extensions	             = v3_req
attributes		               = req_attributes
[ server_distinguished_name ]
countryName                  = CN
stateOrProvinceName          = Zhejiang
localityName                 = Hangzhou
organizationName             = Global Aiziyuer CA Inc
organizationalUnitName       = Aiziyuer CA
emailAddress                 = ziyu0123456789@gmail.com
commonName                   = ziyu0123456789.cn
[ v3_req ]
basicConstraints             = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
[ req_attributes ]
[ req_ext ]
subjectAltName               = @alternate_names
[ alternate_names ]
DNS.1                        = ziyu0123456789.cn
EOF
)

# 使用二级CA进行签发
openssl ca -config $SUB_CA_DIR/openssl.conf \
-in $APP_CERTS_DIR/server-csr.pem -out  $APP_CERTS_DIR/server-crt.pem

# 证书聚合分发, 由于是二级CA颁发的证书，所以，服务器需要把根CA、二级CA等证书都要发送给浏览器
cat  $APP_CERTS_DIR/server-crt.pem $SUB_CA_DIR/cacert.pem $ROOT_CA_DIR/cacert.pem \
| tee $APP_CERTS_DIR/server-all.crt

# 拷贝根CA的CRT证书
cp $ROOT_CA_DIR/cacert.pem $APP_CERTS_DIR/root-ca.crt

# 查看应用目录
tree $APP_CERTS_DIR
```

### 证书说明

以上步骤做完了应用目录应该是如下样子:

```bash

# tree $APP_CERTS_DIR
/opt/CA/APP-CERTS
├── root-ca.crt     -- 需要让浏览器加入信任的根颁发机构
├── server-all.crt  -- 应用服务器用于发送给浏览器的crt证书
├── server-crt.pem
├── server-csr.pem
└── server-key.pem  -- 应用服务器私钥

```


## 应用测试

```
cat <<'EOF'>/etc/nginx/conf.d/ziyu0123456789.cn.conf
server {
	listen       443 ssl;
	server_name  ziyu0123456789.cn;

	ssl_certificate      /etc/nginx/certs/ziyu0123456789.cn/server-all.crt;
	ssl_certificate_key  /etc/nginx/certs/ziyu0123456789.cn/server-key.pem;

	ssl_session_cache    shared:SSL:1m;
	ssl_session_timeout  5m;

	ssl_ciphers  HIGH:!aNULL:!MD5;
	ssl_prefer_server_ciphers  on;

	location / {
		root   html;
		index  index.html index.htm;
	}
}
EOF

```


## FAQ

-   [Create your own CA or root CA, subordinate CA](https://itsecworks.com/2010/11/22/create-your-own-ca-or-root-ca-subordinate-ca/)
-   [OpenSSL自建CA和签发二级CA及颁发SSL证书](https://blog.csdn.net/mn960mn/article/details/85645805)
