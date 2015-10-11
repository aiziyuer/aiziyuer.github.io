---
layout: post
title: Superuser编译
categories: [生活]
tags: [技术, android]
published: False

---

### 生成密钥

`keytool -genkey -keystore ~/android.keystore -dname "CN=Moss, OU=Moss, O=Moss, L=Xi'an, ST=Shanxi, C=CN" -validity 36500 -storetype jks -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -keypass android -storepass android -alias android`