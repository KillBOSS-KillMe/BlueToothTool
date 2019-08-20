//app.js
App({
  onLaunch: function() {
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        // console.log("获取用户的当前设置",res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      },
      fail: function(res) {
        console.log("获取信息失败", res)
      }
    })

    this.globalData.sysinfo = wx.getSystemInfoSync();
  },

  getModel: function() { //获取手机型号
    return this.globalData.sysinfo["model"]
  },
  getWxVersion: function() { //获取微信版本号
    return this.globalData.sysinfo["version"]
  },
  getSystem: function() { //获取操作系统版本
    return this.globalData.sysinfo["system"]
  },
  getPlatform: function() { //获取客户端平台
    return this.globalData.sysinfo["platform"]
  },
  getSDKVersion: function() { //获取客户端基础库版本
    return this.globalData.sysinfo["SDKVersion"]
  },

  //toast提示
  toastTips: function(txt) {
    wx.showToast({
      title: txt
    })
  },
  //toast提示，可以设置等待时长
  toastTips1: function(txt, time) {
    wx.showToast({
      title: txt,
      duration: time
    })
  },
  toastTips2: function(txt) {
    wx.showToast({
      title: txt,
      icon: "loading"
    })
  },

  //弹窗提示
  showModal: function(txt) {
    wx.showModal({
      title: '提示',
      content: txt,
      showCancel: false,
    })
  },
  //弹窗提示,有确认按钮
  showModal1: function(txt) {
    wx.showModal({
      title: "提示",
      content: txt,
      showCancel: false,
      confirmText: "确定"
    })
  },
  //loading
  showLoading: function(txt) {
    wx.showLoading({
      title: txt,
      mask: true
    });
  },

  isBlank: function(str) {
    if (Object.prototype.toString.call(str) === '[object Undefined]') { //空
      return true
    } else if (
      Object.prototype.toString.call(str) === '[object String]' ||
      Object.prototype.toString.call(str) === '[object Array]') { //字条串或数组
      return str.length == 0 ? true : false
    } else if (Object.prototype.toString.call(str) === '[object Object]') {
      return JSON.stringify(str) == '{}' ? true : false
    } else {
      return true
    }

  },

  globalData: {
    userInfo: null,
    sysinfo: null
  },
  // 解析从设备获取的值
  diviceDataAnalysis(codeValue) {
    // frontCode ==>> 前导码
    // typeCod ==>> 请求类型(GET_SEQ=>0, PUT_SEQ=>1, ADD_DATA=>2)
    // pad ==>> pad
    // len ==>> len
    // num ==>> seq数量/data数量
    // seqList ==>> seq列表--数组
    // seqAllStr ==>> 所有的seq--字符串
    // seqListNode ==>> seq列表对象--JSON数组
    // seqListNode.id ==>> seq--id
    // seqListNode.isCur ==>> seq--isCur(isExist, isCurA, isCurB, isCurAll)
    // seqListNode.groupA ==>> seq--在A组的顺序
    // seqListNode.groupB ==>> seq--在B组的顺序
    // seqListNode.groupAll ==>> seq--在所有列表中的数据
    let dataNode = new Object()
    let seqList = new Array()
    let frontCode = ''
    let typeCode = parseInt(codeValue[16] + codeValue[17])
    let pad = codeValue[18] + codeValue[19]
    let len = codeValue[20] + codeValue[21] + codeValue[22] + codeValue[23]
    let num = parseInt(codeValue[24] + codeValue[25] + codeValue[26] + codeValue[27])
    let seqAllStr = codeValue.substring(28,codeValue.length);
    // 获取前导码
    for (let i = 0;i < 16; i++) {
      frontCode += codeValue[i]
    }
    // 通过所有的seq字符串获取seq列表数组
    for (let i = 0;i < num; i++) {
      seqList[i] = seqAllStr.substring(i * 24, i * 24 + 24);
    }
    // 数据填充
    dataNode = {
      frontCode: frontCode,
      typeCode: typeCode,
      pad: pad,
      len: len,
      num: num,
      seqList: seqList,
      seqAllStr: seqAllStr,
      seqListNode: []
    }
    // SEQ解析
    for (let i = 0; i < seqList.length; i++) {
      let id = ''
      // 数据提取
      let isCur = seqList[i][14] + seqList[i][15]
      let groupA8 = seqList[i][16] + seqList[i][17]
      let groupA9 = seqList[i][18] + seqList[i][19]
      let groupB9 = seqList[i][18] + seqList[i][19]
      let groupB10 = seqList[i][20] + seqList[i][21]
      let groupAll10 = seqList[i][20] + seqList[i][21]
      let groupAll11 = seqList[i][22] + seqList[i][23]
      // 16进制==>>2进制==>>数据补全
      groupA8 = parseInt(groupA8, 16).toString(2).padStart(8, '0')
      groupA9 = parseInt(groupA9, 16).toString(2).padStart(8, '0')
      groupB9 = parseInt(groupB9, 16).toString(2).padStart(8, '0')
      groupB10 = parseInt(groupB10, 16).toString(2).padStart(8, '0')
      groupAll10 = parseInt(groupAll10, 16).toString(2).padStart(8, '0')
      groupAll11 = parseInt(groupAll11, 16).toString(2).padStart(8, '0')
      // 生成ID数据
      for (let idlength = 0; idlength < 14; idlength++) {
        id += seqList[i][idlength]
      }
      // 获取A组顺序
      let groupA = groupA9.substring(6,groupA9.length) + groupA8;
      // 获取B组顺序
      let groupB = groupB10.substring(4,groupB10.length) + groupA9.substring(0, 6)
      // 获取本条seq在所有seq中的顺序
      let groupAll = groupAll11 + groupAll10.substring(0, 4)
      dataNode.seqListNode[i] = {
        id: id,
        isCur: isCur,
        groupA: groupA,
        groupB: groupB,
        groupAll: groupAll
      }
    }
    return dataNode
  }


})