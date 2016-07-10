"use strict";

var path = require('path');
var root_path = path.resolve(path.dirname('../'));


module.exports = () => {

	// 前端源码目录
	var assetSrcRoot = path.join(root_path, 'assets');
	var assetSrc = {
		root: assetSrcRoot,
		scss: path.join(assetSrcRoot, '_sass'),
		css: path.join(assetSrcRoot, 'css')
	};


	// 站点发布目录
	var siteRoot = path.join(root_path, '_site');
	var site = {
		root:siteRoot,
		css: path.join(siteRoot, 'assets/css') // 目标的目录
	};


    var config = {
        root: root_path, //项目根目录
        site: site, // 站点目录
        src: assetSrc, // asset源码目录
    };
    return config;
};
