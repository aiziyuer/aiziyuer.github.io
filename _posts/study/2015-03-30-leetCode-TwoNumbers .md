---
layout: post
title: Add Two Numbers
category: [学习]
keywords: [2015,leetCode,学习]
---

> You are given two linked lists representing two non-negative numbers. The digits are stored in reverse > order and each of their nodes contain a single digit. Add the two numbers and return it as a linked > > list.
> 
> Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)
> Output: 7 -> 0 -> 8


## My Attempt Solution1:
拿到题目, 开始写了才发现对题目理解不到位, 暂时如下:

```javascript
function ListNode(val) {
    this.val = val;
    this.next = null;
}

/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function (l1, l2) {

    // 原地逆序
    var swap = function (l) {
        while (l != null && l.next != null) {

            // 交换顺序
            var tmpVar = l.val;
            l.val = l.next.val;
            l.next.val = tmpVar;

            l = l.next;
        }
    }

    swap(l1);
    swap(l2);


    return l2;
}


var input1 = '2 -> 4 -> 3';
var input2 = '5 ->6 -> 4';

var inputStr1 = input1.split(/[^\d]+/);
var inputStr2 = input2.split(/[^\d]+/);

var tmpL, l1, l2;
tmpL = l1 = new ListNode(parseInt(inputStr1[0]));
if (inputStr1.length > 1) {
    for (var i = 1; i < inputStr1.length; i++) {
        tmpL.next = new ListNode(parseInt(inputStr1[i]));
        tmpL = tmpL.next;
    }
}

tmpL = l2 = new ListNode(parseInt(inputStr2[0]))
if (inputStr2.length > 1) {
    for (var i = 1; i < inputStr2.length; i++) {
        tmpL.next = new ListNode(parseInt(inputStr2[i]));
        tmpL = tmpL.next;
    }
}

var l3 = addTwoNumbers(l1, l2);

var ret = ''
if (l3 != null) {
    ret += l3.val;

    tmpL = l3.next;
    while (tmpL != null) {
        ret += ' -> ' + tmpL.val;
        tmpL = tmpL.next;
    }

}

console.log(ret);

console.log('finished');
```

## AC Solution:
这个题目题意有点混乱, `stored in reverse order`说是给定的input是逆序的,最坏的是前几个测试用例还很难猜出题意.本题的意思是给定两个非负数的链表,并且每个节点的数字都是一位数字,完成两个'链表'的相加(需要考虑进位的问题).我的做法是将链表形式的数据转换成实际意义的数字,然后再转换回去,还没有尝试其他的方式;

``` javascript
function ListNode(val) {
    this.val = val;
    this.next = null;
}

/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function (l1, l2) {

    var node2value = function (node) {

        if (node === null) {
            return 0;
        }

        return arguments.callee(node.next) * 10 + node.val;
    }

    var value2node = function (value) {

        var l = new ListNode(value % 10);
        value = Math.floor(value / 10);
        var tmp = l;

        while (value !== 0) {
            tmp.next = new ListNode(value % 10);
            value = Math.floor(value / 10);
            tmp = tmp.next;
        }

        return l;
    }


    var num1 = node2value(l1);
    var num2 = node2value(l2);
    var num3 = num1 + num2;

    var ret = value2node(num3);


    return ret;
}


function createNodes(array) {

    var ret = null;

    if (array != null && array.length > 0) {

        var tmpL = ret = new ListNode(parseInt(array[0]));
        if (array.length > 1) {

            for (var i = 1; i < array.length; i++) {
                tmpL.next = new ListNode(parseInt(array[i]));
                tmpL = tmpL.next;
            }

        }
    }

    return ret;
}

var input1 = '2 -> 4 -> 3';
var input2 = '5 -> 6 -> 4';

var inputStr1 = input1.split(/[^\d]+/);
var inputStr2 = input2.split(/[^\d]+/);

var l1 = createNodes(inputStr1);
var l2 = createNodes(inputStr2);

var l3 = addTwoNumbers(l1, l2);

var ret = '', tmpL;
if (l3 != null) {
    ret += l3.val;

    tmpL = l3.next;
    while (tmpL != null) {
        ret += ' -> ' + tmpL.val;
        tmpL = tmpL.next;
    }

}

console.log(ret);

console.log('finished');
```
