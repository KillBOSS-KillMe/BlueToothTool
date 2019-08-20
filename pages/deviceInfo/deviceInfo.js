// pages/funtionPage/funtionPage.js
var app = getApp();
var utils = require("../../utils/util.js");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    textLog:"",
    deviceId: "",
    name: "",
    allRes:"",
    serviceId:"",
    readCharacteristicId:"",
    writeCharacteristicId: "",
    notifyCharacteristicId: "",
    connected: true,
    canWrite: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var devid = decodeURIComponent(options.deviceId);
    var devname = decodeURIComponent(options.name);
    var devserviceid = decodeURIComponent(options.serviceId);
    var log = that.data.textLog + "设备名=" + devname +"\n设备UUID="+devid+"\n服务UUID="+devserviceid+ "\n";
    this.setData({
      textLog: log,
      deviceId: devid,
      name: devname,
      serviceId: devserviceid 
    });
    //获取特征值
    that.getBLEDeviceCharacteristics();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (wx.setKeepScreenOn) {
      wx.setKeepScreenOn({
        keepScreenOn: true,
        success: function (res) {
          //console.log('保持屏幕常亮')
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  //清空log日志
  startClear: function () {
    var that = this;
    that.setData({
      textLog: ""
    });
  },
  //返回蓝牙是否正处于链接状态
  onBLEConnectionStateChange:function (onFailCallback) {
    wx.onBLEConnectionStateChange(function (res) {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
      return res.connected;
    });
  },
  //断开与低功耗蓝牙设备的连接
  closeBLEConnection: function () {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId
    })
    that.setData({
      connected: false,

    });
    wx.showToast({
      title: '连接已断开',
      icon: 'success'
    });
    setTimeout(function () {
      wx.navigateBack();
    }, 2000)
  },
  //获取蓝牙设备某个服务中的所有 characteristic（特征值）
  getBLEDeviceCharacteristics: function (order){
    var that = this;
    console.log('特征值读取-----------------------------------')
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      success: function (res) {
        console.log(res)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {//该特征值是否支持 read 操作
            var log = that.data.textLog + "该特征值支持 read 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              readCharacteristicId: item.uuid
            });
          }
          if (item.properties.write) {//该特征值是否支持 write 操作
            var log = that.data.textLog + "该特征值支持 write 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              writeCharacteristicId: item.uuid,
              canWrite:true
            });
            
          }
          if (item.properties.notify || item.properties.indicate) {//该特征值是否支持 notify或indicate 操作
            var log = that.data.textLog + "该特征值支持 notify 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              notifyCharacteristicId: item.uuid,
            });
            that.notifyBLECharacteristicValueChange();
          }

        }

      }
    })
    // that.onBLECharacteristicValueChange();   //监听特征值变化
  },
  //启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
  //注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
  notifyBLECharacteristicValueChange: function (){
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.notifyCharacteristicId,
      success: function (res) {
        var log = that.data.textLog + "notify启动成功" + res.errMsg+"\n";
        that.setData({ 
          textLog: log,
        });
        that.onBLECharacteristicValueChange();   //监听特征值变化
      },
      fail: function (res) {
        wx.showToast({
          title: 'notify启动失败',
          mask: true
        });
        setTimeout(function () {
          wx.hideToast();
        }, 2000)
      }

    })

  },
  //监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
  onBLECharacteristicValueChange:function(){
    var that = this;
    wx.onBLECharacteristicValueChange(function (res) {
      console.log('-------------22222监听特征值变化22222---------------')
      console.log(res)
      var resValue = utils.ab2hext(res.value); //16进制字符串
      console.log(`res.value==>>ab2hext转16进制==>>${resValue}`)
      // var resValueStr = utils.hexToString(resValue);
      // console.log(`res.value==>>ab2hext转16进制==>>hexToString转字符串==>>${resValueStr}`)
  
      // var log0 = that.data.textLog + "成功获取：" + resValueStr + "\n";
      wx.readBLECharacteristicValue({
        // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
        deviceId: that.data.deviceId,
        // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
        serviceId: that.data.serviceId,
        // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
        characteristicId: that.data.notifyCharacteristicId,
        success (res) {
          console.log('-------------11111监听特征值变化11111---------------')
          console.log('readBLECharacteristicValue:', res)
          console.log(utils.ab2hext(res.value))
        }
      })
      // FF00FF00FF00FF0000040500000401020304050001000100100001020304050002
      // 00030800000102030405000300020430000102030405000400000C2000

      // type值对应==>>GET,PUT,ADD  三种类别的请求方式
      // 00 (type)[8] OPT_ID_GET_SEQ==>>GET方式，数据获取
      // 01 (type)[8] OPT_ID_PUT_SEQ==>>PUT方式，数据修改
      // 02 (type)[8] OPT_ID_ADD_DATA==>>ADD方式，数据新增

      // 问题1：00 (isCurExist、isCurA、isCurB、isCurAll)[7] 值的下发，文档中给值不明确
      // 解决方法：把两位数（00）转译成二进制数，理想状态为4位    位数不足的情况下在前面补上0
      // 问题2：01 00 (a组顺序)[8][9]
      //       00 10 (b组顺序)[9][10]
      //       10 00 (全体组顺)[10][11]
      //       三组顺序的生成方式
      // 解决方法：排序通过seq数据存在的顺序，a组顺序，b组顺序，全体组顺表示是否存在于a组，b组。全体组都包含
      //       （可能存在于a组，也可能存在于b组，可能a组b组都存在）
      


      // 问题3：对序列号属性进行写操作
      //   01 (type)[8] OPT_ID_PUT_SEQ
      //   对数据进行拼装包含：前导码，type，pad，len，num，n条seq
      //   新增：num+=1
      //         n条seq增加一条
      //   删除：num-=1
      //         n条seq删除一条
      // 问题4：设置游戏数据接口
      //   02 (type)[8] OPT_ID_ADD_DATA
      //   对数据进行拼装包含：前导码，type，pad，len，num，n条data


      // FF 00 FF 00 FF 00 FF 00 (前导码)[0]-[7]
      // 00 (type)[8]
      // 04 (pad)[9]
      // 05 00 (len)[10][11]
      // 00 04 (num)[12][13]
      // 01 02 03 04 05 00 01 00 01 00 10 00 (SEQ0)[14]--[25]
      // 01 02 03 04 05 00 02 00 03 08 00 00 (SEQ1)[26]--[38]
      // 01 02 03 04 05 00 03 00 02 04 30 00 (SEQ2)[39]--[50]
      // 01 02 03 04 05 00 04 00 00 0C 20 00 (SEQ3)[51]--[62]


      // SEQ0解析：
      // 01 02 03 04 05 00 01 00 01 00 10 00 (SEQ0)[14]--[25]
      // 01 02 03 04 05 00 01  (id)[0]-[6]
      // 00 (isCurExist、isCurA、isCurB、isCurAll)[7]
      // 01 00 (a组顺序)[8][9]
      // 00 10 (b组顺序)[9][10]
      // 10 00 (全体组顺)[10][11]

      // a组顺序：
      // 01 00 (a组顺序)[8][9]
      // [8]==>>01==>>00 00 00 01 (16进制>>2进制)
      // [9]==>>00==>>00 00 00 00 (16进制>>2进制)
      // a组顺序===>>> 00 00 00 00 01


      // b组顺序：
      // 10 10 (b组顺序)[9][10]
      // [9]==>>00==>>00 00 00 00 (16进制>>2进制)
      // [10]==>>10==>>00 01 00 00 (16进制>>2进制)
      // b组顺序===>>> 00 00 00 00 00

      // 全体组顺序：
      // 10 11 (全体组顺序)[10][11]
      // [10]==>>10==>>00 01 00 00  (16进制>>2进制)
      // [11]==>>00==>>00 00 00 00 (16进制>>2进制)
      // 全体组顺序===>>> 00 00 00 00 00 01


      

      // 对序列号属性进行写操作
      // FF 00 FF 00 FF 00 FF 00 (前导码)[0]-[7]
      // 01 (type)[8] OPT_ID_PUT_SEQ
      // 00 (pad)[9]
      // 00 00 (len)[10][11]
      // 00 04 (num)[12][13]
      // 01 02 03 04 05 00 01 00 01 00 10 00 (SEQ0)[14]--[25]
      // 01 02 03 04 05 00 02 00 03 08 00 00 (SEQ1)[26]--[38]
      // 01 02 03 04 05 00 03 00 02 04 30 00 (SEQ2)[39]--[50]
      // 01 02 03 04 05 00 04 00 00 0C 20 00 (SEQ3)[51]--[62]
      // that.setData({
      //   textLog: log0,
      // });

    });
  },
  //orderInput
  orderInput:function(e){
    this.setData({
      orderInputStr: e.detail.value
    })
  },

  //发送指令
  sentOrder:function(){
    var that = this; 
    var orderStr = that.data.orderInputStr;//指令
    console.log(`获取指令==>>${orderStr}`)
    let order = utils.stringToBytes(orderStr);
    console.log(`指令==>>${orderStr}字符串转byte==>>${order}`)
    that.writeBLECharacteristicValue(order);
  },

  //向低功耗蓝牙设备特征值中写入二进制数据。
  //注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
  writeBLECharacteristicValue: function (order){
    var that = this;
    let byteLength = order.byteLength;
    console.log(`执行指令的字节长度==>>${byteLength}`)
    var log = that.data.textLog + "当前执行指令的字节长度:" + byteLength + "\n";
    that.setData({
      textLog: log,
    });
    console.log(`${that.data.deviceId}===${that.data.serviceId}===${that.data.writeCharacteristicId}===${order.slice(0, 20)}`)
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.writeCharacteristicId,
      // 这里的value是ArrayBuffer类型
      value: order.slice(0, 20),
      success: function (res) {
        console.log('============特征值中写入反馈结果============')
        console.log(res)
        if (byteLength > 20) {
          setTimeout(function(){
            // that.writeBLECharacteristicValue(order.slice(20, byteLength));
          },150);
        }
        var log = that.data.textLog + "写入成功：" + res.errMsg + "\n";
        that.setData({
          textLog: log,
        });
      },

      fail: function (res) {
        console.log('========================')
        console.log(res)
        var log = that.data.textLog + "写入失败" + res.errMsg+"\n";
        that.setData({
          textLog: log,
        });
      }
      
    })
  },

})