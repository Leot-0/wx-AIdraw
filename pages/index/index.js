// index.js
Page({
  navigateToGames() {
    wx.switchTab({
      url: '/pages/games/games',
    });    
  },

  navigateToApps() {
    wx.switchTab({
      url: '/pages/apps/apps',
    });    
  },

  navigateToSearch() {
    wx.switchTab({
      url: '/pages/search/search',
    });    
  },

  //分享给朋友
  onShareAppMessage: function () {
    return {
      title: '这里是Odouyi的小酒馆',
      desc:'屋里可比外面亮堂多了，快进来吧',
      path: '/pages/index/index' // 用户点击后的跳转页面
    };
  },

  //分享朋友圈
  onShareTimeline: function () {
    return {
        title: '这里是Odouyi的小酒馆',
        query: 'key=value',  // 页面跳转所带来的查询参数
        imageUrl: '/images/majicmix realistic 麦橘写实.png'  // 用于显示的分享图片，不设置则截取当前页面
    };
}

});
