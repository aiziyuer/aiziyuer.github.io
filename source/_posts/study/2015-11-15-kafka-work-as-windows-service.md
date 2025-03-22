---
layout: post
title: win下让Kafka以Service方式运行
categories: [学习]
tags: [bat,windows]
published: True

---

Kafka是依赖于Zookeeper的，也就是说如果要启动kafka, 必须要先启动zookeeper，但是如果每次调试都要进入命令行启动两个黑框框就太蛋疼了，所以可以学习Tomcat来把Java的程序以windows的Service方式来运行，一下是修改Kafka的启动脚本`server.cmd`：

``` java
@echo off
SetLocal

set KAFKA_LOG4J_OPTS=-Dlog4j.ZKKFCONFIGuration=file:%~dp0..\..\ZKKFCONFIG\log4j.properties
set KAFKA_HEAP_OPTS=-Xmx512M -Xms512M

set ZKSERVER_NAME=moss-zkServer
set ZKSERVER_EXE=%~dp0%ZKSERVER_NAME%.exe
set ZKKFMAIN_CLASS=org.apache.zookeeper.server.quorum.QuorumPeerMain
set ZKKFCONFIG="%~dp0..\..\config\zookeeper.properties"

set KFSERVER_NAME=moss-Kafka
set KFSERVER_EXE=%~dp0%KFSERVER_NAME%.exe
set KFMAIN_CLASS=kafka.Kafka
set KFCONFIG="%~dp0..\..\config\server.properties"

call "%~dp0kafka-run-class-cracked.bat"

REM 
if "%1" == "" goto showUsage
if %1 == install goto doInstall
if %1 == uninstall goto doUninstall
echo Unknown parameter "%1"
goto :showUsage

:doInstall
"%ZKSERVER_EXE%" //IS//%ZKSERVER_NAME% --DisplayName="%ZKSERVER_NAME%" ^
  	--StdOutput=auto --StdError=auto --LogLevel=Debug --LogPath="%~dp0logs" ^
    --Startup=auto --StartMode=jvm --Jvm="%JAVA_HOME%\jre\bin\server\jvm.dll" ^
    --PidFile="%~dp0%ZKSERVER_NAME%.pid" ^
    --Classpath="%CLASSPATH%" ^
  	--StartClass="%ZKKFMAIN_CLASS%" ^
    --StartParams="%ZKKFCONFIG%" ^
    --StartPath="%~dp0" ^
    --JvmOptions="%KAFKA_HEAP_OPTS% %KAFKA_JVM_PERFORMANCE_OPTS% %KAFKA_JMX_OPTS% %KAFKA_LOG4J_OPTS%"
"%KFSERVER_EXE%" //IS//%KFSERVER_NAME% --DisplayName="%KFSERVER_NAME%" ^
    --StdOutput=auto --StdError=auto --LogLevel=Debug --LogPath="%~dp0logs" ^
    --Startup=auto --StartMode=jvm --Jvm="%JAVA_HOME%\jre\bin\server\jvm.dll" ^
    --PidFile="%~dp0%KFSERVER_NAME%.pid" ^
    --Classpath="%CLASSPATH%" ^
    --StartClass="%KFMAIN_CLASS%" ^
    --StartParams="%KFCONFIG%" ^
    --StartPath="%~dp0" ^
    --JvmOptions="%KAFKA_HEAP_OPTS% %KAFKA_JVM_PERFORMANCE_OPTS% %KAFKA_JMX_OPTS% %KAFKA_LOG4J_OPTS%"
goto :eof

:doUninstall
"%ZKSERVER_EXE%" //DS//%ZKSERVER_NAME%
"%KFSERVER_EXE%" //DS//%KFSERVER_NAME%
goto :eof

:showUsage
echo Usage: service.bat install/uninstall
goto :eof
EndLocal
```

> 注意上面的`kafka-run-class-cracked.bat`是将`kafka-run-class.bat`注释了`%COMMAND%`这一行，只保留该脚本的环境变量操作。

> 注意windows下的脚本需要考虑编码（linux下编辑的直接运行会诡异的错误）
