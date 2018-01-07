---
layout: post
title: "实现Samba可以读写但是不可以删除"
date: "2018-01-07 22:00:21 +0800"
---

## 需求来源:
文件服务器(`samba`)以网络的方式挂载的`linux`系统里, 但是测试mm不小心`rm -rf`了一下,
然后世界清静了, 中间经过了数据磁盘数据拷贝成img、磁盘数据恢复等等蛋疼的措施, 最终以
大家都不愿意投入恢复而告终~~

## 痛定思痛
文件服务必须要灵活, 归档文件和文档时可以自动编辑, 但是在读取的时候需要做保护, 最好一次
归档后面不许删除, 但是对于文档这样的东东最好内容可以不限制可以修改;

## 结合组内情况
组里一共不到20个人, 如果采用每日备份确实可以做, 但是今天删除的文件是否要考虑备份?
备份用的仓库是不是要是文件服务器的好几倍? 怎样查找到某个文件在什么时候放入的, 又是
在什么时候弄丢的,这种情况要不要考虑

## 一刀切
上面那些乱七八糟的问题让我想了非常久时间, 后来看到两个帖子,一个说是samba创建文件时可以
继承父文件夹的权组和用户;而另一个则是说linux用个粘滞位`T`,这个位设置后的文件只允许文件
所有者和root才有权限删除。

## 实现原理
1.  创建两个用户属于同一个组, apache, apache_own, 都属于组apache_group;
1.  创建一个带粘滞位的入口目录(samba里面映射地址), own是apache_own;
2.  配置samba创建文件或者文件夹时权限分别是1770,3770, 并且支持从父目录继承属组;

## 实现过程

``` bash
# 创建组
groupadd apache_group

# 创建文件所有用户, apache_own是文件的真实所有者, samba是通过同组的用户进行访问的
useradd -G apache_group apache_own

# 创建文件使用用户, apache和apache_own是一个组的,所以samba登录后是可以访问的
useradd -G apache_group apache_own

# 假设我们需要共享的目录是/opt/apache
mkdir -p /opt/apache

# 设置父类粘滞位和真实文件所有属组
chmod 0770 /opt/apache
chown apache_own:apache_group /opt/apache
chmod g+s /opt/apache
chmod +t /opt/apache # 增加粘滞位

cat <EOF>>/etc/samba/smb.conf
[apache]
    path=/opt/apache
    browseable = yes
    #create mask = 1770 # samba支持继承, 这里是写死文件增加粘滞位
    #directory mode = 3770 # samba支持继承, 这里是写死文件夹增加粘滞位
    #force directory mode = 3770 # samba支持继承, 这里是写死文件夹增加粘滞位
    inherit permissions = yes # 从父文件夹继承权限
    inherit acls = yes # 从父文件夹继承acl
    inherit owner = yes # 从父文件夹继承文件所有者
    force user = apache
    valid users = apache
EOF
```

## 使用过程

用户通过apache用户访问samba提供的文件服务,当创建文件时, 文件父目录是有粘滞位的,
新的文件夹应该也是带粘滞位的(不能被非所有者删除),而samba这里开启了继承文件所有者,
所以新的文件虽然是apache用户加入的,但是文件所有者会是apache_own, 所以apache用户
访问是无法删除的,但是因为apache和apache_own属于同一个组,所以对文件的增改查是可以的



## 参考文献

-   [Read/Write but Don’t Delete](https://community.wd.com/t/solved-read-write-but-dont-delete/56393)
-   [linux实现只能创建不能删除文件](https://wenku.baidu.com/view/aecb7271168884868762d6de.html?re=view)
