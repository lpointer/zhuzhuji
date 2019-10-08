//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }
    this.globalData = {};
    this.todayDataList = [];    //当天数据
    this.MONTH_DATA_LIST = [];  //本月所有记录
    this.type = ['0','1'];
    this.openid = '';
    this.getToday = false;  //是否获取进入的数据
    this.isUser = false;    //是否已经保存用户数据
    this.isTodayAdd = false;//今天是否已经添加数据

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          
        }
      }
    })
    
  }  
})
