const { dbTable, db } = require('../services/api')
let _data = {
  list:'',
  num:20,
  numDay:20
}

module.exports = {
  _data,
  /**
   * 获取当月全部数据
   * options obj查询条件
   * fn     过滤数据方法
   */
  getMonthDataList(options,fn) {
    const that = this;
    wx.showLoading({title: '正在加载'})
    //正在加载load...
    db.collection(dbTable.cb)
    .where(options.condition)
    .orderBy(options.desc, 'desc')
    .get()
    .then(res => {      
      //不知道为什么第二次onshow查询不到数据
      if (res.data.length == 20) {
        that.skipQueryMonth(options,fn)
        that._data.list = res.data;
      } else {
        that._data.list = res.data;
        if (typeof fn === 'function') fn(that._data.list)        
      }
      wx.hideLoading()
    })
    .catch(err => {
      console.log(err)
    })
  },
  /**
   * 获取当月全部数据，由于getMonthDataList只能获取20条数据，所以使用本方法不断递归获取本月全部数据保存到
   * options obj查询条件
   *  fn     过滤数据方法
  */
  skipQueryMonth( options, fn) {
    
    const that = this;
    //正在加载load...
    db.collection(dbTable.cb)
    .where(options.condition)
    .orderBy(options.desc, 'desc')
    .skip(that._data.num)
    .get()
    .then(res => {
        that._data.list = that._data.list.concat(res.data)
        if (res.data.length == 20) {
          that._data.num = (that._data.num - 0) + 20
          that.skipQueryMonth(that._data.num, options, fn)
        } else {
          if (typeof fn === 'function') fn(that._data.list)
        }
    })
    .catch(err => {
       console.log(err)
    })
  },
  /**
   * 获取当日全部数据
   * options obj查询条件
   * fn     过滤数据方法
   */
  getTodayDataList(options, fn) {
    const that = this;
    wx.showLoading({ title: '正在加载' })
    //正在加载load...
    db.collection(dbTable.cb)
    .where(options.condition)
    .orderBy(options.desc, 'desc')
    .get()
    .then(res => {

      //不知道为什么第二次onshow查询不到数据
      if (res.data.length == 20) {
        that.skipQueryToday(options, fn)
        that._data.list = res.data;
      } else {
        that._data.list = res.data;
        if (typeof fn === 'function') fn(that._data.list)
      }
      wx.hideLoading()
    })
    .catch(err => {
      console.log(err)
    })
  },
  /**
   * 获取当日全部数据，由于getMonthDataList只能获取20条数据，所以使用本方法不断递归获取本日全部数据保存到
   * options obj查询条件
   *  fn     过滤数据方法
  */
  skipQueryToday(options, fn) {

    const that = this;
    //正在加载load...
    db.collection(dbTable.cb)
    .where(options.condition)
    .orderBy(options.desc, 'desc')
    .skip(that._data.numDay)
    .get()
    .then(res => {
        that._data.list = that._data.list.concat(res.data)
        if (res.data.length == 20) {
          that._data.numDay = (that._data.numDay - 0) + 20
          that.skipQueryToday(that._data.numDay, options, fn)
        } else {
          if (typeof fn === 'function') fn(that._data.list)
        }
    })
    .catch(err => {
        console.log(err)
    })
  },
  getUserDev() {
    let dev = ''
    wx.getSystemInfo({
      success: function (res) {
        dev = res
      }
    })
    return dev
  }
}