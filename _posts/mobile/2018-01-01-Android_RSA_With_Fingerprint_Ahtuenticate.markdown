---
layout: post
title: "廉价安全的Android密码管理"
date: "2018-01-01 18:44:20 +0800"
---


看了一下现在市面上的所有的密码管理实现和一些大厂的密码校验实现无非试一下几种思路:

1.  服务器端生成`RSA`的公私钥对,然后公钥发给客户端来加密密码后发给服务器,服务器用私钥解密;
2.  密钥存在`so`文件中,然后加解密都靠它,整个`app`进行强签名使得无法更改;
3.  用户名密码都https协议发给服务器端来完成校验 -- 其实就是偷懒的第一种
4.  ....

这里推荐一种比较简单,但是安全系数比较高的实现思路 -- `AndroidKeystore`.

这个是谷歌退出的一种依赖于硬件的强安全密钥存储手段,所有的密钥都会存储在硬件中,
而整个加解密的过程也都是由系统级别的进程完成,完全隔离应用层。

我的需求是想做一个简单的高效率的密码管理的小app，需求如下：
1.  不需要联网，我不相信网络
2.  高效，最好新加个密码什么的非常快
3.  看密码的时候需要做强校验，最好是指纹或者类似锁屏那种校验

所以我准备借鉴最最上面提到的公私钥的思路来实现，大概如下：
1.  通知`Android`系统生成`RSA`公私钥对
2.  明文密码通知`Android`系统使用公钥进行加密
3.  想看的时候进行识别校验，通知`Android`系统使用私钥进行解密

## 样例代码实现

使用公钥加密文明:

``` java
String keyAliasName = "test_rsa"; // 密钥别名
String toEncryptString = "original data"; // 待加密的串

// 生成RSA密钥对
KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(
        KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore");
keyPairGenerator.initialize(
        new KeyGenParameterSpec.Builder(
                keyAliasName,
                KeyProperties.PURPOSE_DECRYPT | KeyProperties.PURPOSE_ENCRYPT)
                .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
                .setUserAuthenticationRequired(true)
                .build());
keyPairGenerator.generateKeyPair();

// 从系统中获取公钥
KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
keyStore.load(null);
PublicKey publicKey = keyStore.getCertificate("licong").getPublicKey();
Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
cipher.init(Cipher.ENCRYPT_MODE, KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_RSA)
        .generatePublic(new X509EncodedKeySpec(publicKey.getEncoded())));

//最值得开心的是获取公钥加密子串过程不需要强校验--"宽进窄出"
byte[] output = cipher.doFinal(toEncryptString.getBytes());
Log.d(TAG, "encrypted: " + new String(output));

```

## 彩蛋

到文章快写完的时候才发现已经有了一个现成写的非常棒的指纹识别库, 里面的实现思路就是我想要的,
支持rxjava, 配上lambda大概就是下面这个样子:

```java
String keyAliasName = "test_rsa"; // 密钥别名
String toEncryptString = "original data"; // 待加密的串
// 开始加密, 这个过程是不需要密码的
RxFingerprint.encrypt(EncryptionMethod.RSA, this, keyAliasName, toEncryptString)
        .subscribe(encryptionResult -> {
            switch (encryptionResult.getResult()) {
                case FAILED:
                case HELP:
                    Log.d(TAG, encryptionResult.getMessage());
                    break;
                case AUTHENTICATED:
                    Log.d(TAG, "encrypted data: " + encryptionResult.getEncrypted());

                    // 开始解密过程, 这个过程中需要输入指纹才可以下一步
                    RxFingerprint.decrypt(EncryptionMethod.RSA, this, keyAliasName, encryptionResult.getEncrypted()).subscribe(decryptionResult -> {
                        switch (decryptionResult.getResult()) {
                            case FAILED:
                                Log.d(TAG, "Fingerprint not recognized, try again!");
                                break;
                            case HELP:
                                Log.d(TAG, encryptionResult.getMessage());
                                break;
                            case AUTHENTICATED:
                                Log.d(TAG, "original data:" + decryptionResult.getDecrypted());
                                break;
                        }

                    });

                    break;
            }
        }, throwable -> {
            Log.e("ERROR", "authenticate", throwable);
        });
```

## 参考文献
---

-   [KeyGenParameterSpec API](https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.html)
-   [KeyProtection API](https://developer.android.com/reference/android/security/keystore/KeyProtection.html)
