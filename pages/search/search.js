// search.js
Page({
  data: {
    city: '', // 用户输入的城市名
    selectedCity: '选择城市', // 下拉框选中的城市名
    cities: [  // 包含英文名称和中文注释的城市列表
      { name: "Beijing", label: "Beijing（北京）" },
      { name: "Shanghai", label: "Shanghai（上海）" },
      { name: "Guangzhou", label: "Guangzhou（广州）" },
      { name: "Shenzhen", label: "Shenzhen（深圳）" },
      { name: "Hangzhou", label: "Hangzhou（杭州）" },
      { name: "Nanjing", label: "Nanjing（南京）" },
      { name: "Chengdu", label: "Chengdu（成都）" },
      { name: "Chongqing", label: "Chongqing（重庆）" },
      { name: "Tianjin", label: "Tianjin（天津）" },
      { name: "Xi'an", label: "Xi'an（西安）" },
      { name: "Wuhan", label: "Wuhan（武汉）" },
      { name: "Fuzhou", label: "Fuzhou（福州）" },
      { name: "Changsha", label: "Changsha（长沙）" }
      // 更多城市...
    ],
    weather: null // 查询到的天气信息
  },

  // 页面加载时自动提取城市label
  onLoad() {
    const citiesLabels = this.data.cities.map(city => city.label);
    this.setData({ citiesLabels });
  },

  // 获取用户输入的城市名
  onInput(e) {
    this.setData({
      city: e.detail.value
    });
  },

  // 处理城市选择下拉框的选择事件
  onCitySelect(e) {
    const selectedCity = this.data.cities[e.detail.value]; // 获取选中的城市对象
    this.setData({
      selectedCity: selectedCity.label, // 显示中文注释的名称
      city: selectedCity.name // 使用英文名称进行查询
    });
    // 自动触发天气查询
    this.getWeather();
  },

  // 查询天气信息
  getWeather() {
    const that = this;
    
    // 校验是否输入了城市名
    if (!this.data.city) {
      wx.showToast({
        title: '请输入城市名',
        icon: 'none'
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '查询中...'
    });

    // 调用 OpenWeather API
    wx.request({
      url: 'https://api.openweathermap.org/data/2.5/weather',
      data: {
        q: this.data.city,  // 使用英文城市名查询
        appid: '0ecadc716bfe5b9c2a17f3bb98bc2885',  // 使用你提供的 API Key
        units: 'metric',  // 使用摄氏温度
        lang: 'zh_cn' // 使用中文
      },
      success(res) {
        wx.hideLoading(); // 隐藏加载提示
        console.log('天气信息:', res);

        if (res.data && res.data.weather) {
          // 更新天气数据
          that.setData({
            weather: res.data
          });
        } else {
          wx.showToast({
            title: '未找到城市',
            icon: 'none'
          });
        }
      },
      fail() {
        wx.hideLoading(); // 隐藏加载提示
        wx.showToast({
          title: '获取天气失败',
          icon: 'none'
        });
      }
    });
  }
});
