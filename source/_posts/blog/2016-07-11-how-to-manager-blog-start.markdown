---
layout: post
title: 如何高效地管理博客
categories: [博客]
tags: [blog, bash]
published: True
---

我的博客主要是采用`jekyll`作为后台进行`markdown`文法的文章渲染,但是我在使用过程中发现主要有两种使用场景:

- 对博客主题进行修改 -- 往往需要调节`css`和`js`等跟博客文章无关的东西, 需要一个可以即时预览的功能
- 纯粹写文章, 不想被其他因素打扰, 不涉及美化工作, 文法基本已经记住,不需要实时预览,但是需要刷新页面就能看效果

## 实时预览功能

这个实时预览功能, 最直接的就是修改文章样式后, 浏览器(可能还有我的手机平板)上的网页内容需要跟着刷新.而且同时
我的博客中样式的编写都是`scss`的,所以需要有个实时的编译器,观察到我的样式改变后,立刻生成对应的`css`文件,并且通知
`jekyll`服务刷新头文件,最后通知浏览器刷新页面.


### 前端自动化

考虑到博客也算是一个弱化的前端工程,尝试过[`compass`](http://compass-style.org/)、
[`kola`](http://koala-app.com/),觉得限制实在太多,
所以干脆从头开始使用纯前端自动化工具[`gulp`](http://www.gulpjs.com.cn/)管理博客.

### 一些经验

`gulp`这个东西给我的感觉有点像`unix`的味道, 不过不管她多么好用,依然离不开[`nodejs`](https://nodejs.org/zh-cn/),
[`npm`](https://www.npmjs.com/),我这里就不赘述. 以下是我的一些`gulp`任务书写经验

- `gulpfile.js`其实可以是一个文件夹, `gulp`的运行非常聪明, 她可以以文件夹下的index.js作为入口文件
- 整个工程中,只有`gulp`的脚本是属于`nodejs`, 所以`.jshintrc`文件建议在`gulpfile.js`单独弄一个
- 使用[`require-dir`](https://github.com/aseemk/requireDir)插件可以遍历一个文件夹下所有的`javascript`文件,懒人必备
- `config.json`作为配置文件的方式太low了, 一律使用`config.js`+ `module.exports`的方式替代,美真的不是一点点

### Sass的编译

> talk's cheap, show u the code.

``` javascript 

// gulpfile.js/tasks/css.js 定义编译的任务
gulp.task('css', () => {
    gulp.src(config.src.scss + '/**/*.?(s)css')
        .pipe($.sass())
        .on('error', (err) => {
        	// 这里捕获异常, 只是打印错误日志, 不会终止css任务
            $.util.log(err);
        })
        .pipe($.concat('style.css'))
        .pipe(gulp.dest(config.src.css));
});

// gulpfile.js/tasks/watch.js 定义watch任务, 当有css文件更新就触发编译任务
gulp.task('watch:css', () => {
    gulp.watch(config.src.scss + '**/*.?(s)css', ['css']);
});

```

### Jekyll编译服务

因为`jekyll`是使用`ruby`语言开发的一个小的服务器,所以需要使用`nodejs`提供的`chind.spawn`的方式来多进程运行:

``` javascript 

// gulpfile.js/tasks/jekyll.js 使用child.spawn来完成jekyll进程的启动
gulp.task('jekyll', () => {

    var jekyll_exe = process.platform === "win32" ? "jekyll.bat" : "jekyll";
    var jekyll = child.spawn(jekyll_exe, ['build',
        '--incremental', // 当文章非常多的时候开启, 文章少的时候貌似不开效果更好
        '--watch'
    ]);

    var jekyllLogger = (buffer) => {
        buffer.toString()
            .split(/\n/)
            .forEach((message) => $.util.log('Jekyll: ' + message));
    };

    jekyll.stdout.on('data', jekyllLogger);
    jekyll.stderr.on('data', jekyllLogger);
});

```

### 同步刷新浏览器

这里要介绍下一个很好玩的插件[`browserSync`](https://www.browsersync.io/), 我的理解是她代理了一部分的http服务,
所以访问网站的同时,其实是她在页面的投入加入了一些东西, 所以她可以远程触发浏览器重新请求网页, 配置如下:

```javascript
var browserSync = require('browser-sync').create();

gulp.task('server', ['css'], () => {

	$.util.log(config.site);

    browserSync.init({
        files: [config.site.root + '/**'],
        port: 3131,
        server: {
            baseDir: config.site.root
        }
    });
   
});
```

### 汇总gulp任务

到这里, 基本上稍微串一串几个任务就可以实现第一个需求了: `gulp.task('start', ['jekyll','server', 'watch']);`


### 纯粹写代码

由于我之前博客是使用`gulp`来进行管理, 这种方式肯定是希望控制台回显更多的错误日志才好,但是如果是平时的使用,我更希望专注于内容的协作, 所以我使用`bash`改写了启动脚本:

```bash
#!/usr/bin/env bash

usage()
{
	printf "
Usage

  start [options]

Options

[-k|--kill] 杀死jekyll进程

[-j|--jekyll] 启动jekyll进程

[-h|--help] 显示帮助

[-g|--gulp] gulp的方式运行
	
"
}

kill_jekyll_service(){
  ps -ef | grep jekyll | grep -v grep | awk '{print $2}' | xargs kill -9
}

start_jekyll_service(){
  jekyll server >output.log 2>&1 &
}

gulp_start(){
  gulp start
}

while true; do
  case "$1" in

    (-k|--kill)
	    kill_jekyll_service
      exit 0
	    ;;

    (-j|--jekyll)
      kill_jekyll_service
      start_jekyll_service
      exit 0
      ;;

    (-h|--help)
      usage
      exit 0
      ;;

    (-g|--gulp)
      gulp_start
      exit 0
      ;;

    (*)
      usage
      exit 1
      ;;

  esac
done
```

