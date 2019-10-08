//index.js
const app = getApp()
const { dbTable, addData, db, deleteData, msgTips } = require('../../services/api')
const processData = require('../../utlis/ProcessingData')
const methods = require('../../utlis/methods')
const _date = require('../../utlis/date.js')
Page({
  _data:{
    isDeleteAll:false,
    share:''
  },
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    authorization:false,
    actions: [
      { name: '修改', color: '#fff', fontsize: '20', width: 100, icon: 'editor', background: '#79afff'},
      { name: '删除', color: '#000', width: 100, color: '#80848f', fontsize: '20', icon: 'delete'}
    ],
    toggle:false,
    avatarUrl: '',
    username:'匿名',
    money:{
      show:false,
      todayConsumption: 0.00,   //日消费
      moneyConsumption: 0.00,  //月消费
      todayIncome: 0.00,           //日收入
      moneyIncome: 0.00,           //月收入
      budget: true,
      beyond: false
    },
    todayDate: _date.todayDate,
    todayData: [],
    userInfo: {},
    switchs:{
      dataList:false
    },   
    requestResult: ''
  },
  
  
  //消费收支数据处理
  detailData(data){
    //查询条件需要排序
    //月数据保存到全局数据列表
    app.MONTH_DATA_LIST = data
    const todayDataList = processData.DataFilter(app.MONTH_DATA_LIST, 'date', _date.todayDate)
    const moneyIncome = processData.DataFilter(app.MONTH_DATA_LIST, 'type', '1')
        
    const todayIncome = processData.DataFilter(todayDataList, 'type', '1')
    const moneyConsumption = processData.DataFilter(app.MONTH_DATA_LIST, 'type', '0')
   
    const todayConsumption = processData.DataFilter(todayDataList, 'type', '0')
    if (moneyIncome.length || moneyConsumption.length) {
      let switchsShow = false
      if (todayDataList.length) switchsShow = true
      this.setData({
        todayData: todayDataList,
        'switchs.dataList': switchsShow,
        'money.show': true,
        //支出
          'money.moneyConsumption': moneyConsumption.reduce(processData.consumptionDataCount, 0),
        'money.todayConsumption': todayConsumption.reduce(processData.consumptionDataCount, 0),
        //收入
        'money.moneyIncome': moneyIncome.reduce(processData.incomeDataCount, 0),
        'money.todayIncome': todayIncome.reduce(processData.incomeDataCount, 0),
      })
    }
    
  },
  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]

        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath

            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },
  //点击记一笔，需要优化，等待时间久了。。判断是否存需要重点优化下
  onGotUserInfo(e) {
    //getUserInfo:ok  已授权
    //getUserInfo:fail auth deny  不授权
    //e.detail.userInfo 用户信息
    //用户不授权，直接跳转
    const that = this;
    if (e.detail.errMsg.includes('ok')){
      const obj = JSON.parse(e.detail.rawData);
      this.setData({
        avatarUrl: obj.avatarUrl,
        username: obj.nickName,
        userInfo: obj
      })
      //获取用户表是否已经添加数据
      if(app.isUser){
        wx.navigateTo({ url: '../addMoney/index' }) 
      }else{
        addData({ 'db': dbTable.user, 'saveData': { user: e.detail.userInfo, dev: methods.getUserDev(), shareID: that._data.share } }, function (flag) { 
            if(flag) app.isUser = true       
            wx.navigateTo({ url: '../addMoney/index' })
          })
      }
    }else{
      wx.navigateTo({ url: '../addMoney/index' });
    } 
    
  },
  //获取用户是否已经保存到数据库
  getIsUserSave(openid){
    db.collection(dbTable.user).where({
      _openid: openid, // 填入当前用户 openid
    }).get().then(res => {
      if (res.data.length) {
        //用户数据已经保存
        app.isUser = true;
      }
    })
  },
  //获取用户今天是否已经添加数据
  getIsTodayAdd(openid) {
    db.collection(dbTable.record).where({
      _openid: openid, // 填入当前用户 openid
      dete: _date.todayDate
    }).get().then(res => {
      if (res.data.length) {
        //用户数据已经保存
        app.isTodayAdd = true;
      }
    })
  },

  onGetOpenid: function() {
    const that = this;
    const uOpenid = wx.getStorageSync('uopenid');    
	//把openid缓存减少调用云函数
    if(uOpenid){
      app.globalData.openid = uOpenid;
      that.getIsUserSave(uOpenid)
      that.getIsTodayAdd(uOpenid)
      methods.getMonthDataList({ 
        
        desc:'cerateTime',
        condition: {
          openid: uOpenid,
          monthDate: _date.monthDate
        }
      }, that.detailData);
      return
    }
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        wx.setStorageSync('uopenid', res.result.openid)
        app.globalData = res.result;
        that.getIsUserSave(app.globalData.openid)
        methods.getMonthDataList({
          desc: 'cerateTime',
          condition: {
            openid: app.globalData.openid,
            monthDate: _date.monthDate
          }
        }, that.detailData);
        // console.log(app.globalData)
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        
      }
    })
  },

  //列表滑动菜单
  clickSwipeoutMenu(e){
    const options = {
      index: e.detail.index,
      id: e.currentTarget.dataset.id,
      menuid: e.currentTarget.dataset.menuid,
      type: e.currentTarget.dataset.type,
      money: e.currentTarget.dataset.money
    };
    this.operatData(options)
  },
  //列表长按事件
  handlerCloseButton(e){
    const that = this;
    that.setData({
      toggle: e.detail.index
    });
    wx.showActionSheet({
      itemList: ['修改', '删除'],
      success(res) {
        const options = {
          index: res.tapIndex,
          id: e.currentTarget.dataset.id,
          menuid: e.currentTarget.dataset.menuid,
          type: e.currentTarget.dataset.type,
          money: e.currentTarget.dataset.money
        }
        that.operatData(options)
      },
      fail(res) {
        console.log(res.errMsg)
      }
    })
  },
  //修改/删除数据
  operatData(options){
    const that = this;
    if (Object.prototype.toString.call(options) !== '[object Object]') throw options +'Not an object'
    if (!options.index) {
      //修改
      const url = '../addMoney/index?id=' + options.id + '&menuid=' + options.menuid + '&type=edit&current=' + options.type
      wx.navigateTo({ url: url });
    } else {
      //删除
      deleteData({ db: dbTable.cb, id: options.id }, function (flag, data) {
        if (flag) {
          const newData = that.data.todayData.filter(item => {
            if (options.id !== item._id) {
              return true
            }
          })
          let switchsShow = true
          if (!newData.length) switchsShow = false, this._data.isDeleteAll = true
          that.setData({
            todayData: newData,
            'switchs.dataList': switchsShow
          })
          that.removeRecalculate(options.money, options.type)
          msgTips('删除成功')
        }
      })
    }
  },
  //删除重新计算
  removeRecalculate(num, type) {
    if(type == '0'){
      this.setData({
        //支出
        'money.moneyConsumption': (this.data.money.moneyConsumption - 0) - (num - 0),
        'money.todayConsumption': (this.data.money.todayConsumption - 0) - (num - 0)        
      })
    }else{
      this.setData({        
        //收入
        'money.moneyIncome': (this.data.money.moneyIncome - 0) - (num - 0),
        'money.todayIncome': (this.data.money.todayIncome - 0) - (num - 0)
      })
    }
  },
  //关闭提示框
  ok(){
    this.setData({ authorization:false})
    wx.setStorageSync('tipOtionsMsg', 1)
  },
  //生命周期函数

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '我发现一个很有用记账小程序，一点点记录生活，对你很有帮助',
      path: 'pages/index/index?shareID=' + wx.getStorageSync('uopenid')
    }
  },
  onLoad: function (options) {
    if (options.shareID) this._data.share = options.shareID
    this.onGetOpenid()
    // 显示红点
    if (!wx.getStorageSync('RedDot')) wx.showTabBarRedDot({ index: 2 })
    
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                username: res.userInfo.nickName,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })

  },
  onReady: function () {

  },

  onError: function (err) {
    // 上报错误
    console.log(err)
  },

  onShow(options) {
    if (app.getToday && !this._data.isDeleteAll) this.detailData(app.MONTH_DATA_LIST);
    this.onGetOpenid()
    
    setTimeout(()=>{
      // debugger
      if (this.data.todayData.length >= 2 && !wx.getStorageSync('tipOtionsMsg')) {
        this.setData({ authorization: true })
      }
    },2000)
  },
  //下拉刷新
  onPullDownRefresh: function () {
    // wx.showNavigationBarLoading() //在标题栏中显示加载
    methods.getMonthDataList({       
      desc: 'cerateTime',
      condition: {
        openid: app.globalData.openid,
        monthDate: _date.monthDate
      }
      }, this.detailData);
    //模拟加载
    setTimeout(function () {
      // complete
      wx.hideNavigationBarLoading() //完成停止加载
      wx.stopPullDownRefresh() //停止下拉刷新
    }, 1500);
  },
})
