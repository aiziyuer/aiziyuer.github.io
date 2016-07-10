"use strict";

var path = require('path');
var root_path = path.resolve(path.dirname('../'));


module.exports = () => {

    // 前端源码目录
    var assetSrc = ((root) => {

        var scssRoot = path.join(root, '_sass');
        var cssRoot = path.join(root, 'css');

        return {
            root: root,
            scss: scssRoot,
            css: cssRoot
        };

    })(path.join(root_path, 'assets')); // 默认是根目录下asset目录为assert源码根目录

    // 站点发布目录
    var site = ((root) => {

        return {
            root: root,
            css: path.join(root, 'assets/css') // 目标的目录
        };

    })(path.join(root_path, '_site')); // 默认是根目录_site目录为发布的根目录


    return {
        root: root_path, //项目根目录
        site: site, // 站点目录
        src: assetSrc, // asset源码目录
    };
};
