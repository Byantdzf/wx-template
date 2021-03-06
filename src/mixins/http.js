import wepy from 'wepy'
import { service } from '../config.js'

export default class httpMixin extends wepy.mixin {
  /* =================== [$get 发起GET请求] =================== */
  $get(
    {url = '', headers = {}, data = {} },
    {success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    const methods = 'GET'
    this.$ajax(
      {url, headers, methods, data},
      {success, fail, complete }
    )
  }

  /* =================== [$post 发起POST请求] =================== */
  $post(
    {url = '', headers = {}, data = {} },
    {success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    const methods = 'POST'
    this.$ajax(
      {url, headers, methods, data},
      {success, fail, complete }
    )
  }

  /* =================== [$post 发起POST请求] =================== */
  $put(
    {url = '', headers = {}, data = {} },
    {success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    const methods = 'PUT'
    this.$ajax(
      {url, headers, methods, data},
      {success, fail, complete }
    )
  }

  /* =================== [$post 发起POST请求] =================== */
  $delete(
    {url = '', headers = {}, data = {} },
    {success = () => {}, fail = () => {}, complete = () => {} }
  ) {
    const methods = 'DELETE'
    this.$ajax(
      {url, headers, methods, data},
      {success, fail, complete }
    )
  }

  /**
   * [ajax 统一请求方法]
   * @param  {[type]}  item [description]
   * @return {Boolean}      [description]
   */
  $ajax(
    {url = '', headers = {}, methods = 'GET', data = {} },
    {success = () => {}, error = () => {}, fail = () => {}, complete = () => {} }
  ) {
    // 增强体验：加载中
    wx.showNavigationBarLoading()
    // 构造请求体
    const request = {
      // url: url + '?XDEBUG_SESSION_START=1&from_openid='+ wx.getStorageSync('from_openid'),
      url: url + '?XDEBUG_SESSION_START=1&formId=' + wx.getStorageSync('formId') + '&openGId=' + wx.getStorageSync('openGId'),
      method: ['GET', 'POST','PUT', 'DELETE'].indexOf(methods) > -1 ? methods : 'GET',
      header: Object.assign({
        'Authorization': 'Bearer ' + wx.getStorageSync('token'),
        'X-Requested-With': 'XMLHttpRequest'
      }, headers),
      data: Object.assign({
        // set something global
      }, data)
    }

    // 控制台调试日志
    // console.table(request)

    // 发起请求
    wepy.request(Object.assign(request, {
      success: ({ statusCode, data }) => {
        wx.removeStorageSync('message')
        // 控制台调试日志
        console.log('[SUCCESS]', statusCode, typeof data === 'object' ? data : data.toString().substring(0, 100))

        // 状态码正常 & 确认有数据
        if (0 === +data.code && data.data) {
          // 成功回调
          wx.removeStorageSync('formId')
          return setTimeout(() => {
            let successExist = this.isFunction(success)
            successExist && success({statusCode, ...data})
            this.$apply()
          })
        } else if (data.code == 1) {
          wx.showModal({
            title: '提示',
            content: data.message,
            showCancel: false
          })
          wx.setStorageSync('message', data.message)
        }else if (data.code == 2) {
          // 删除过时token
          var pages = getCurrentPages()    //获取加载的页面

          var currentPage = pages[pages.length-1]    //获取当前页面的对象

          var options = currentPage.options
          if (options.id) {
            var url = '/' + currentPage.route  + '?id=' + options.id
          } else {
            var url = '/' + currentPage.route
          }
          wx.setStorageSync('jump', url)
          // debugger
          wx.removeStorageSync('token', null)

          // 重新登录
          wepy.login({
            success: (res) => {
              console.log('wepy.login.success:', res)
              // debugger
              // 根据业务接口处理:业务登陆:异步
              this.$post({ url: service.login, data: {code: res.code} }, {
                success: ({code, data}) => {
                  if(data.token){
                    wx.setStorageSync('token', data.token)
                    wx.setStorageSync('openid', data.openid)
                    let userInfo = {
                      nickName: data.user.name,
                      avatarUrl: data.user.avatar
                    }
                    wx.setStorageSync('userInfo', userInfo)
                    wx.setStorageSync('user_id', data.user.id)
                  }

                  // var route = '/' + getCurrentPages()[0].__route__;
                  var route = '/' +  wx.setStorageSync('jump');

                  if (route == '/pages/users/register'){
                    return
                  }

                  if (!data.token ) {
                    // wx.reLaunch({url: '/pages/users/register'})
                    wx.navigateTo({url: '/pages/users/register?from_openid='+ wx.getStorageSync('from_openid')})
                  } else {
                    wx.reLaunch({url: url})
                  }
                }
              })
            },
            fail: (res) => {
              console.log('wepy.login.fail:', res)
            }
          })

        } else if (data.code == 3 ) {
          var pages = getCurrentPages()    //获取加载的页面

          var currentPage = pages[pages.length-1]    //获取当前页面的对象

          var options = currentPage.options

          var url = '/' + currentPage.route //当前页面url

          wx.setStorageSync('jump', url)

          if (data.message == 'rank') {
            wx.showModal({
              title: '提示',
              content: '需要升级为VIP，才可查看',
              confirmText: '跳转升级',
              success: function(res) {
                if (res.confirm) {
                  wx.navigateTo({url: '/pages/users/upgradingVIP'})
                } else if (res.cancel) {
                  console.log('用户点击取消')
                }
              }
            })
          }
          if (data.message == 'profile') {
            if (wx.getStorageSync('type') == 'marriage') {
              wx.navigateTo({url: '/pages/users/intro'})
            } else {
              wx.navigateTo({url: '/pages/users/unmarri'})
            }
          }
        } else {
          // 失败回调：其他情况
          return setTimeout(() => {
            if (this.isFunction(fail)) {
              fail({statusCode, ...data})
              this.$apply()
            }else{
              wx.showModal({
                title: '提示',
                content: data.message,
                showCancel: false
              })
            }
          })
        }

      },
      fail: ({ statusCode, data }) => {
        // console.log(Object)
        // 控制台调试日志
        console.log('[ERROR]', statusCode, data)
        // 失败回调
        return setTimeout(() => {
          this.isFunction(error) && error({statusCode, ...data})
          this.$apply()
        })
      },
      complete: (res) => {
        //console.log('[COMPLETE]', res)
        // 隐藏加载提示
        wx.hideNavigationBarLoading()
        // 停止下拉状态
        wx.stopPullDownRefresh()
        // 完成回调
        return (() => {
          let completeExist = this.isFunction(complete)
           completeExist && complete(res)
          this.$apply()
        })()
      }
    }))
  }
}

