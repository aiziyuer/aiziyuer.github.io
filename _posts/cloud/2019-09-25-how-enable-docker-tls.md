---
layout: post
title: 如何优雅开启docker的remoteAPI功能
date: 2019-09-25 09:45
categories: [云计算]
tags: [学习]
published: True
---

默认的`docker`都是通过`unix port`来与`server`进行通信, 但是如果是想通过`windows`远程管理`linux上`面的`docker`就不太方便了。
当然你可以说直接开启非安全的连接就好了,但是那不安全啊~~, 下面介绍一个傻瓜式的开启安全远程api的tls认证的方法。

### 根CA

``` bash
# 根CA
export ROOT_CA_DIR=/opt/CA/ROOT-CA

# 1. 生成openssl.conf的配置
mkdir -p $ROOT_CA_DIR $APP_CERTS_DIR
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

# ps. 上面的usr_cert中CA:TRUE代表它还可以用作其他CA的签发而不仅仅是作为一个普通的根证书颁发机构

# 2.初始化目录
mkdir -p $ROOT_CA_DIR/{certs,crl,private,newcerts}
true > $ROOT_CA_DIR/index.txt
true > $ROOT_CA_DIR/serial
true > $ROOT_CA_DIR/crlnumber
echo 0100 > $ROOT_CA_DIR/serial
echo 0100 > $ROOT_CA_DIR/crlnumber

# 3. 根CA私钥生成
openssl genrsa -out $ROOT_CA_DIR/private/cakey.pem 2048

# 4. 根CA证书请求文件生成
openssl req -new -config $ROOT_CA_DIR/openssl.conf \
-key $ROOT_CA_DIR/private/cakey.pem -out $ROOT_CA_DIR/private/ca.csr

# 5. 证书签名
openssl ca -selfsign -batch -config $ROOT_CA_DIR/openssl.conf \
-extensions v3_ca \
-in  $ROOT_CA_DIR/private/ca.csr -out $ROOT_CA_DIR/cacert.pem

# 6. 查看证书
openssl x509 -text -in $ROOT_CA_DIR/cacert.pem
```

### 应用证书

``` bash
# 根CA
export ROOT_CA_DIR=/opt/CA/ROOT-CA

# 应用证书
export APP_CERTS_DIR=/opt/CA/APP-CERTS

# 1. 生成应用证书
rm -rf $APP_CERTS_DIR
mkdir -p $ROOT_CA_DIR $APP_CERTS_DIR
openssl genrsa -out $APP_CERTS_DIR/key.pem 2048

# 2. 生成证书请求文件（csr文件）
openssl req -new -days 365 \
-key $APP_CERTS_DIR/key.pem -out $APP_CERTS_DIR/csr.pem \
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
commonName                   = aiziyuer.github.io
[ v3_req ]
basicConstraints             = CA:FALSE
keyUsage                     = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage             = serverAuth,clientAuth
[ req_attributes ]
[ req_ext ]
subjectAltName               = @alternate_names
[ alternate_names ]
DNS.1                        = aiziyuer.github.io
DNS.2                        = ziyu0123456789.cn
IP.1                         = 192.168.200.254
IP.2                         = 127.0.0.2
EOF
)

# 3. 使用CA进行签发
openssl ca -batch -config $ROOT_CA_DIR/openssl.conf \
-in $APP_CERTS_DIR/csr.pem -out  $APP_CERTS_DIR/cert.pem

# # 4. 证书聚合分发, 服务器需要把根CA发送给浏览器
# cat  $APP_CERTS_DIR/cert.pem $ROOT_CA_DIR/cacert.pem \
# | tee $APP_CERTS_DIR/cert.pem

# 5. 拷贝根CA的CRT证书
cp $ROOT_CA_DIR/cacert.pem $APP_CERTS_DIR/ca.pem

# 6. 查看应用目录
tree $APP_CERTS_DIR

# 你可以压缩一下证书目录归档了以后再用
# tar czvf CA.tar.gz /opt/CA/
```

### 证书说明

以上步骤做完了应用目录应该是如下样子:

```bash
# tree $APP_CERTS_DIR
/opt/CA/APP-CERTS
├── ca.pem     -- 需要让浏览器加入信任的根颁发机构
├── cert.pem   -- 应用服务器/客户端用于发送给浏览器的crt证书
├── csr.pem
└── key.pem    -- 应用服务器/客户端私钥
```


## docker服务器端配置

``` bash
cat <<'EOF'>/etc/docker/daemon.json
{
  "tlsverify": true,
  "tlscert": "/opt/CA/APP-CERTS/cert.pem",
  "tlskey": "/opt/CA/APP-CERTS/key.pem",
  "tlscacert": "/opt/CA/APP-CERTS/ca.pem",
  "hosts": [
    "tcp://0.0.0.0:2376",
    "unix:///var/run/docker.sock"
  ]
}
EOF
systemctl restart docker

# 测试可用性
docker \
    --tlsverify \
    --tlscacert=/opt/CA/APP-CERTS/ca.pem \
    --tlscert=/opt/CA/APP-CERTS/cert.pem \
    --tlskey=/opt/CA/APP-CERTS/key.pem \
    -H 192.168.200.254:2376 info
```

## docker客户端配置

``` bash
# 将最上面生成的/opt/CA/APP-CERTS下的证书全部拷贝到~/.docker目录下即可
# 应用证书
export APP_CERTS_DIR=/opt/CA/APP-CERTS
mkdir -p ~/.docker
cp $APP_CERTS_DIR/* ~/.docker

# tree ~/.docker
~/.docker
├── ca.pem     -- 需要让浏览器加入信任的根颁发机构
├── cert.pem   -- 应用服务器/客户端用于发送给浏览器的crt证书
├── csr.pem
└── key.pem    -- 应用服务器/客户端私钥

# 测试联通性
export DOCKER_HOST=tcp://192.168.200.254:2376
export DOCKER_TLS_VERIFY=1
docker info
```