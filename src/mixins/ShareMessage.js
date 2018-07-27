import wepy from 'wepy';
import { service } from '../config.js'

export default class ShareMessage extends wepy.mixin {
  data = {
    from_openid: '',
    formId: [],
    openGid: ''
  };
  onLoad(e) {
    let that = this
    if(e.from_openid) {
      wx.setStorageSync('from_openid', e.from_openid)
      that.from_openid = wx.getStorageSync('openid')
      that.$apply()
    }
    wx.showShareMenu({
      withShareTicket: true
    })
  }
  onShow(e) {
  }
  methods = {
    formSubmit(e) {
      this.formId.push(e.detail.formId)
      console.log(this.formId)
      wx.setStorageSync('formId', this.formId)
    },
    onShareAppMessage(res) {
      console.log(res)
      let that = this
      // wx.setStorageSync('from_openid', that.from_openid)
      that.$apply()
      let pages = getCurrentPages()    //获取加载的页面
      let currentPage = pages[pages.length-1]    //获取当前页面的对象
      let link = currentPage.route    //当前页面url
      let options = currentPage.options.id
      let id = options ? '?id=' + options : ''
      let url = ''
      if (options) {
        url = link + id + '&from_openid=' + that.from_openid
      } else {
        url = link + '?from_openid=' + that.from_openid
      }
      console.log(url)
      return {
        title: this.config.navigationBarTitleText,
        path: url,
        imageUrl: '',
        success: function(res) {
          let shareTickets = res.shareTickets;
          console.log(res)
          if (!shareTickets) {
            return false
          }
          wx.getShareInfo({
            shareTicket: shareTickets[0],
            success: function(res){
              let encryptedData = res.encryptedData
              let iv = res.iv
              let code = ''
              wepy.login({
                success: (res) => {
                  code = res.code
                  let data = {
                    code: code,
                    iv: iv,
                    encryptedData: encryptedData
                  }
                  // that.$post({url: service.infor, data}, {
                  //   success: ({code, data}) => {
                  //     that.openGid = data.openGId
                  //     that.$apply()
                  //   },
                  //   fail: ({code, data}) => {},
                  //   complete: () => { }
                  // })
                },
                fail: (res) => {
                  console.log('wepy.login.fail:', res)
                }
              })
            }
          })
          console.log('转发成功')
        },
        fail: function(res) {
          console.log('转发成功')
        }
      }
    }
  }
}
