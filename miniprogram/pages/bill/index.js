// miniprogram/pages/demo/index.js
const processData = require('../../utlis/ProcessingData')
const getList = require('../../utlis/methods')
const _date = require('../../utlis/date')
const { dbTable, addData, db, deleteData, msgTips } = require('../../services/api')
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  _data:{
    prompt:'',
    yearDataArr: { type:'year',arr:[]},
    monthDataArr: { type: 'month', arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]},
    todayDataArr28: {type:'today', arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28] },
    todayDataArr30: { type: 'today', arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
    todayDataArr31: { type: 'today', arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] },
  },
  data: {
    actions: [
      { name: '修改', color: '#fff', fontsize: '20', width: 100, icon: 'editor', background: '#79afff'},
      { name: '删除', color: '#000', width: 100, color: '#80848f', fontsize: '20', icon: 'delete'}
    ],
    prompt: '本月',
    selectArray:'',
    moneyIncome: 0.00,
    moneyConsumption:0.00,
    sele:{
      year:true,
      month:true,
      day:false,
      income:false,
      consumption:false
    },
    selectIndex: '',
    dataList:[],
    notData: true,
    year:new Date().getFullYear(),
    month: new Date().getMonth()+1,
    today: new Date().getDate()
  },
//过滤日期，每天只显示一个日期
  filterToday(arr) {
    if (Object.prototype.toString.call(arr) !== '[object Array]') return arr
    const dList = arr;
    if (dList.length > 1) {
      for (let i = 0; i < dList.length; i++) {
        if (dList[0].date == dList[(i + 1 == dList.length ? i : i + 1)].date) {
          dList[(i + 1 == dList.length ? i : i + 1)].isSameTime = true;
        }else{
          for(let j=i;j<dList.length;j++){
            if (dList[i].date == dList[(j + 1 == dList.length ? j : j + 1)].date) {
              dList[(j + 1 == dList.length ? j : j + 1)].isSameTime = true;
            }
          }
        }
      }
    }
    return dList;
  },
  //初始数据
  initData(){
    //初始年数据
    const date = new Date().getFullYear();
    for (let i = date-5; i <= date; i++){
      this._data.yearDataArr.arr.push(i);
    }
  },


  /*页面点击事件*/
  //点击年按钮
  bindYearBtn(){
    this.setData({
      selectArray:this._data.yearDataArr,
      'sele.day': false
    })
  },
   //点击月按钮
  bindMonthBtn(){
    this.setData({
      selectArray: this._data.monthDataArr,
      'sele.day': false
    })
  },
  // 点击日按钮
  bindTodayBtn() {
    const arr = [1, 3, 5, 7, 8, 10, 12];    //31天的月份
    const months = this.data.month == 2 ? this.calculatingLeapMonth(this.data.year) : arr.includes(this.data.month) ? this._data.todayDataArr31 : this._data.todayDataArr30
    
    this.setData({
      selectArray: months,
      'sele.day': !this.data.sele.day
    })
    //如果不是真的则是按月选择
    if(!this.data.sele.day){
      this.setData({
        selectArray: this._data.monthDataArr,
        selectIndex: ''
      })
    }
    
  },
  bindConsumptionBtn(){
    let options = {};
    this.setData({
      'sele.consumption': !this.data.sele.consumption
    })

    //如果选择天则按天查询
    if (this.data.sele.day) {
      this._data.prompt = '当天'
      const dayData = this.data.year + '-' + _date.addZero(this.data.month) + '-' + _date.addZero(this.data.today)
      
      this.queryData(dayData,'consumption')

    } else {
      this._data.prompt = '本月'
      const month = this.data.year + '-' + _date.addZero(this.data.month)

      this.queryData(month, 'consumption')
      
    }
  },
  bindIncomeBtn() {
    this.setData({
      'sele.income': !this.data.sele.income
    })
    //如果选择天则按天查询
    if (this.data.sele.day) {
      this._data.prompt = '当天'
      const dayData = this.data.year + '-' + _date.addZero(this.data.month) + '-' + _date.addZero(this.data.today)

      this.queryData(dayData, 'income','day')
      
    } else {
      this._data.prompt = '本月'
      const month = this.data.year + '-' + _date.addZero(this.data.month)

      this.queryData(month, 'income','month')
    }
  },
 
  /** 
   * 搜索数据
   * date 时间
   * billType 消费类型
   * dateType 时间类型
  */
  queryData(date,billType,dateType){
    if (dateType == 'day'){

      if (this.data.sele.consumption) this.getTodayDataLists(date, billType)//按消费查询
      if (this.data.sele.income) this.getTodayDataLists(date, billType)//按收入查询

      //如果支出和收入没有选择或者都选择，则按全部查询
      this.getTodayDataLists(date)
    }else{

      if (this.data.sele.consumption) this.getMonthDataLists(date, billType)//按消费查询
      if (this.data.sele.income) this.getMonthDataLists(date, billType)//按收入查询

      //如果支出和收入没有选择或者都选择，则按全部查询
      this.getMonthDataLists(date)
    }
    
    
    
  },
  // 选择详细日期
  bindDateSelect(e){
    const todayVal = this.screenData(e);
    //如果选择天则按天查询
    if (todayVal){
      this._data.prompt = '当天'
      const dayData = this.data.year + '-' + _date.addZero(this.data.month) + '-' + _date.addZero(this.data.today)
      if (this.data.sele.income) this.getTodayDataLists(dayData,'income')
      this.getTodayDataLists(dayData)
    }else{
      this._data.prompt = '本月'
      const month = this.data.year + '-' + _date.addZero(this.data.month)
      if (this.data.sele.consumption) this.getMonthDataLists(month,'consumption')
      this.getMonthDataLists(month)
    }
  },
  //根据日期筛选数据
  screenData(e){
    let yearVal = '';
    let monthVal = '';
    let todayVal = '';
    switch (e.target.dataset.type) {
      case 'year':
        yearVal = e.target.dataset.date
        break;
      case 'month':
        monthVal = e.target.dataset.date
        break;
      case 'today':
        todayVal = e.target.dataset.date
        break;
    }
    this.setData({
      selectIndex: e.target.dataset.date,
      year: yearVal || this.data.year,
      month: monthVal || this.data.month,
      today: todayVal || this.data.today
    })
    return todayVal
  },

  //根据选择的日期获取月数据
  getMonthDataLists(month,type){
    let options = {}
    options = {
      desc: 'date',
        condition: {
        openid: wx.getStorageSync('uopenid'),
          monthDate: month
      }
    }
    if (type == 'income'){
      options = {
        desc: 'date',
        condition: {
          openid: wx.getStorageSync('uopenid'),
          monthDate: month,
          type:1
        }
      }
    } else if (type == 'consumption'){
      options = {
        desc: 'date',
        condition: {
          openid: wx.getStorageSync('uopenid'),
          monthDate: month,
          type: 0
        }
      }
    }
    getList.getMonthDataList(options, this.process)
  },
  //根据选择的日期获取日数据
  getTodayDataLists(dayData, type){
    
    let options = {}
    options = {
      desc: 'date',
      condition: {
        openid: wx.getStorageSync('uopenid'),
        date: dayData
      }
    }
    if (type == 'income') {
      options = {
        desc: 'date',
        condition: {
          openid: wx.getStorageSync('uopenid'),
          date: dayData,
          type: 1
        }
      }
    } else if (type == 'consumption') {
      options = {
        desc: 'date',
        condition: {
          openid: wx.getStorageSync('uopenid'),
          date: dayData,
          type: 0
        }
      }
    }
    getList.getTodayDataList(options, this.process)
  },
  //获取查询到的数据进行过滤
  process(data){
    const tempList = this.filterToday(data)
    this.setData({
      dataList: tempList,
      prompt: this._data.prompt
    })
    this.detailData(tempList);
  },
  //列表滑动菜单
  clickSwipeoutMenu(e) {
    const options = {
      index: e.detail.index,
      id: e.currentTarget.dataset.id,
      menuid: e.currentTarget.dataset.menuid,
      type: e.currentTarget.dataset.type,
      money: e.currentTarget.dataset.money,
      currIndex:e.currentTarget.dataset.index
    };
    this.operatData(options)
  },
  //列表长按事件
  handlerCloseButton(e) {
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
          money: e.currentTarget.dataset.money,
          currIndex:e.currentTarget.dataset.index
        }
        that.operatData(options)
      },
      fail(res) {
        console.log(res.errMsg)
      }
    })
  },
  //修改/删除数据
  operatData(options) {
    const that = this;
    if (Object.prototype.toString.call(options) !== '[object Object]') throw options + 'Not an object'
    if (!options.index) {
      //修改
      const url = '../addMoney/index?id=' + options.id + '&menuid=' + options.menuid + '&type=edit&current=' + options.type
      wx.navigateTo({ url: url });
    } else {
      //防止删除某天第一条数据后合并到上一天的数据
      if(!that.data.dataList[options.currIndex].isSameTime){
        that.data.dataList[options.currIndex+1].isSameTime = false
      }
      //删除      
      deleteData({ db: dbTable.cb, id: options.id }, function (flag, data) {
        if (flag) {
          msgTips('删除成功')
          const newData = that.data.dataList.filter(item => {
            if (options.id !== item._id) {
              return true
            }
          })
          let switchsShow = true
          if (!newData.length) switchsShow = false
          that.setData({
            dataList: newData,
            'switchs.dataList': switchsShow
          })
          that.removeRecalculate(options.money, options.type)
          
        }
      })
    }
  },
  //删除重新计算
  removeRecalculate(num, type) {
    if (type == '0') {
      this.setData({
        //支出
        moneyConsumption: (this.data.money.moneyConsumption - 0) - (num - 0)
      })
    } else {
      this.setData({
        //收入
        moneyIncome: (this.data.money.moneyIncome - 0) - (num - 0)
      })
    }
  },
  //消费收支数据处理
  detailData(data) {
    //查询条件需要排序
    
    if (!data.length) return this.setData({ moneyConsumption: 0.00, moneyIncome:0.00})
    const moneyConsumption = processData.DataFilter(data, 'type', '0')
    const moneyIncomes = processData.DataFilter(data, 'type', '1')
    if (moneyConsumption.length || moneyConsumption.length) {
      this.setData({
        //支出
        moneyConsumption: moneyConsumption.reduce(processData.consumptionDataCount, 0),
        //收入
        moneyIncome: moneyIncomes.reduce(processData.incomeDataCount, 0),
        //支出        
      })
    }
  },
  //计算是否属于闰月
  calculatingLeapMonth(year){
    
    if (year % 4 == 0) this._data.todayDataArr28.arr.push(29)

    if (this._data.todayDataArr28.arr.length > 28) this._data.todayDataArr28.arr.pop();
    
    return this._data.todayDataArr28;
  },







  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    this.initData()
    const option = {
      desc: 'date',
      condition: {
        openid: wx.getStorageSync('uopenid'),
        monthDate: _date.monthDate
      }
    }
    getList.getMonthDataList(option, this.process)
    this.setData({
      selectArray: this._data.monthDataArr
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // const dList = app.MONTH_DATA_LIST
    // const tempList = this.filterToday(dList);
    // let isData = true
    // if (tempList.length == 0) isData = false
    // this.setData({
    //   selectArray: this._data.monthDataArr,
    //   dataList: tempList,
    //   notData: isData
    // })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '猪猪记，点点滴滴记录生活！',
      path: 'pages/index/index?shareID=' + wx.getStorageSync('uopenid')
    }
  },
})