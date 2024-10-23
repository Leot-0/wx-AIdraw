// apps.js
Page({
  data: {
    apps: [
      {
        id: 1,
        name: "文明6",
        time: 66,
        progress: 85,
        image: "https://s2.loli.net/2024/09/29/MT6gcGWRJdz7Vbu.jpg" // 本地图片或在线图片URL
      },
      {
        id: 2,
        name: "黑神话：悟空",
        time: 46,
        progress: 50,
        image: "https://s2.loli.net/2024/09/29/DTNc1BVWv4GnQO6.jpg"
      },
      {
        id: 3,
        name: "遗迹2",
        time: 18,
        progress: 30,
        image: "https://s2.loli.net/2024/09/29/3Ax7kSvM6zQyPg5.jpg"
      },
      {
        id: 4,
        name: "极限竞速：地平线4",
        time: 9.4,
        progress: 10,
        image: "https://s2.loli.net/2024/09/29/yVrYkKhBP67mUAf.jpg"
      }
    ]
  },

  // 点击整个应用项查看大图
  previewImage(e) {
    const current = e.currentTarget.dataset.src; // 获取当前点击的图片地址
    wx.previewImage({
      current, // 当前显示图片的http链接
      urls: this.data.apps.map(item => item.image) // 需要预览的图片http链接列表
    });
  }
});
