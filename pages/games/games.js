Page({
  data: {
    prompt: '',  // 用户输入的提示词
    autoPrompts: {
      '风格一': 'ultra-detailed,(best quality),((masterpiece)),(highres),original,extremely detailed 8K wallpaper,(an extremely delicate and beautiful),anime,1girl,orange shoes,solo,sitting,sky,clouds,outdoors,black hair,bird,upward view,blue sky,white socks,daytime,orange jacket,building,long sleeves,leaves,long hair,stairs,red headband,pump Rope,headband,bangs,cloudy sky,from_below,wide_shot',
      '风格二': 'masterpiece,best quality,1girl,fractal art,realistic anime style,abstract art,colorful,highest detailed',
      '风格三': 'Anime style illustration,1girl,short black hair,red eyes,looking at viewer,half body,holding a school bag,wearing a seifuku,under the clear day sky,high resolution illustration,A full art illustration in a flat anime style, her twin braids and jewelry adding to her charm. An upper body portrait of this unique character with one eye red'
    },
    imageUrl: '',  // 生成的图片 URL
    promptId: '',  // 当前任务的ID
    currentStyle: null, // 存储当前选中的风格
    currentWebSocket: null,  // 用于存储当前的 WebSocket 连接
    showModal: false  // 是否显示模态弹窗
  },

  // 获取用户输入的提示词
  onInput(e) {
    this.setData({
      prompt: e.detail.value
    });
  },

  // 用户点击图片确认风格
  confirmStyle(e) {
    const style = e.currentTarget.dataset.style;
    const autoPrompt = this.data.autoPrompts[style];  // 获取对应的提示词

    this.setData({
      currentStyle: style,
      prompt: autoPrompt  // 将对应风格的提示词设为当前提示词
    });

    console.log("用户确认的风格为:", style);
    wx.showToast({
      title: `已选择 ${style}`,
      icon: 'success',
      duration: 2000
    });
  },

  // 生成一个随机的15位数字
  generateRandomSeed() {
    const min = Math.pow(10, 14); // 最小值：100000000000000
    const max = Math.pow(10, 15) - 1; // 最大值：999999999999999
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 创建请求体根据当前风格
  createRequestBody() {
    const styleToCheckpoint = {
      '动漫风格': 'xl\\animexlXuebimix_v40.safetensors',
      '幽灵风格': 'xl\\GhostXL.safetensors',
      '插画风格': 'xl\\LEOSAM AIArt 兔狲插画 SDXL大模型.safetensors'
    };
  
    // 根据当前风格获取相应的ckpt_name
    const ckptName = styleToCheckpoint[this.data.currentStyle] || '1.0\\Anything-v1.0.ckpt'; // 默认值为风格一

    // 调用函数生成随机的15位数字
    const randomSeed = this.generateRandomSeed(); 

    return {
      "3": {
        "inputs": {
          "seed": randomSeed,
          "steps": 20,
          "cfg": 7,
          "sampler_name": "dpmpp_sde_gpu",
          "scheduler": "normal",
          "denoise": 1,
          "model": [
            "4",
            0
          ],
          "positive": [
            "6",
            0
          ],
          "negative": [
            "7",
            0
          ],
          "latent_image": [
            "5",
            0
          ]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "4": {
        "inputs": {
          "ckpt_name": ckptName
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "5": {
        "inputs": {
          "width": 720,
          "height": 1280,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "Empty Latent Image"
        }
      },
      "6": {
        "inputs": {
          "text": this.data.prompt,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "(worst quality,low resolution,bad hands),distorted,twisted,watermark",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "9": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": ["8", 0]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "Save Image"
        }
      }
    };
  },

  // 调用 ComfyUI API 生成图像
  generateImage() {
    const that = this;
    wx.showLoading({ title: '排队中...' });

    //获取请求体
    const requestBody = this.createRequestBody();

    wx.request({
      url: 'http://127.0.0.1:8188/prompt',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        client_id: 'your-client-id',
        prompt: requestBody,
        // style: this.data.currentStyle  // 发送当前风格作为请求的一部分
      },
      success(res) {
        // wx.hideLoading();
        console.log('请求已发送，发送的数据:', requestBody);  // 打印发送的数据
        if (res.statusCode === 200 && res.data && res.data.prompt_id) {
          console.log('发送成功:', res.data);  // 打印响应数据
          that.setData({ promptId: res.data.prompt_id });
          that.connectWebSocket();
        } else {
          wx.showToast({ title: '生成失败', icon: 'none' });
        }
      },
      fail(err) {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误，请稍后再试', icon: 'none' });
      }
    });
  },

  // 通过 WebSocket 连接并监听任务状态
  connectWebSocket() {
    const that = this;

    // 检查并关闭已有的 WebSocket 连接
    if (this.data.currentWebSocket) {
      console.log('WebSocket 先行关闭');
      this.data.currentWebSocket.close();
    }

    // 创建新的 WebSocket 连接
    const socket = wx.connectSocket({
      url: `ws://127.0.0.1:8188/ws?client_id=your-client-id`
    });

    socket.onOpen(() => {
      wx.showLoading({ title: '生成中...' });
      console.log('WebSocket 已连接');
    });

    socket.onMessage((res) => {
      const data = JSON.parse(res.data);
      if (data.type === 'status' && data.data.status.exec_info.queue_remaining === 0) {
        that.fetchGeneratedImage();
      }
    });

    socket.onClose(() => {
      console.log('WebSocket 连接已关闭');
      this.setData({ currentWebSocket: null });
    });

    socket.onError((err) => {
      console.error('WebSocket 发生错误', err);
    });

    // 存储当前的 WebSocket 连接
    this.setData({ currentWebSocket: socket });
  },

  // 获取生成的图像
  fetchGeneratedImage() {
    const that = this;
    const historyUrl = `http://127.0.0.1:8188/history/${this.data.promptId}`;

    wx.request({
      url: historyUrl,
      method: 'GET',
      success(res) {
        wx.hideLoading();  // 不论结果如何，都停止加载提示
        if (res.statusCode === 200 && res.data && res.data[that.data.promptId]) {
          const outputData = res.data[that.data.promptId].outputs;
          for (let nodeId in outputData) {
            const images = outputData[nodeId].images;
            if (images && images.length > 0) {
              const imageUrl = `http://127.0.0.1:8188/view?filename=${images[0].filename}&type=output&ts=${new Date().getTime()}`;  // 添加时间戳
              that.setData({
                imageUrl: imageUrl,  // 更新图片URL，包含时间戳
                showModal: true  // 显示模态弹窗
              });
            }
          }
        } else {
          wx.showToast({ title: '未能获取生成的图像', icon: 'none' });
        }
      },
      fail(err) {
        wx.hideLoading();  // 确保在请求失败时也停止加载提示
        console.error('获取图像失败:', err);
        wx.showToast({ title: '网络错误，请稍后再试', icon: 'none' });
      }
    });
  },

  // 点击图片查看大图
  previewImage() {
    wx.previewImage({
      current: this.data.imageUrl,  // 当前图片的 URL
      urls: [this.data.imageUrl]    // 预览的图片列表（可以预览多张图片）
    });
  },

  // 保存图像到本地
  saveImage() {
    const that = this;
    
    // 下载图片到本地
    wx.downloadFile({
      url: this.data.imageUrl,  // 远程图片的 URL
      success(res) {
        if (res.statusCode === 200) {
          const tempFilePath = res.tempFilePath;  // 下载成功后，图片的本地临时路径
          
          // 检查用户是否已经授权保存到相册
          wx.getSetting({
            success(settingRes) {
              if (!settingRes.authSetting['scope.writePhotosAlbum']) {
                wx.authorize({
                  scope: 'scope.writePhotosAlbum',
                  success() {
                    that.saveImageToAlbum(tempFilePath);  // 已授权，保存图片
                  },
                  fail() {
                    wx.showToast({
                      title: '请授权保存到相册',
                      icon: 'none'
                    });
                  }
                });
              } else {
                that.saveImageToAlbum(tempFilePath);  // 已授权，直接保存图片
              }
            }
          });
        }
      },
      fail(err) {
        wx.showToast({
          title: '图片下载失败',
          icon: 'none'
        });
        console.error('图片下载失败:', err);
      }
    });
  },

  // 保存图片到相册
  saveImageToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,  // 本地图片路径
      success() {
        wx.showToast({
          title: '图片已保存',
          icon: 'success',
          duration: 2000
        });
      },
      fail(err) {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        console.error('保存图片失败:', err);
      }
    });
  },

  // 关闭模态框并关闭 WebSocket
  onCloseModal() {
    if (this.data.currentWebSocket) {
      // 关闭 WebSocket 连接
      this.data.currentWebSocket.close();
      console.log('WebSocket 已关闭');
    }
    
    // 关闭模态弹窗
    this.setData({
      showModal: false,
      currentWebSocket: null  // 清除已关闭的 WebSocket
    });
    console.log("Modal closed");  // 添加日志，检查是否执行到这里
  },

  //启动游戏页面
  onLoad() {
    console.log(this.data.styles); // 查看styles数组是否正确加载
  },
  
});
