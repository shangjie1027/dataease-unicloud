import router from '@/router'
import store from './store'
// import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import {
  getToken
} from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import {
  buildMenus
} from '@/api/system/menu'
import {
  filterAsyncRouter
} from '@/store/modules/permission'
import {
  isMobile
} from '@/utils/index'
import Layout from '@/layout/index'
// import bus from './utils/bus'

import { getSocket } from '@/websocket'

NProgress.configure({
  showSpinner: false
}) // NProgress Configuration

const whiteList = ['/bide/login', '/401', '/404', '/delink', '/nolic','/home'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()
  const mobileIgnores = ['/delink']
  const mobilePreview = '/preview/'

  if (isMobile() && !to.path.includes(mobilePreview) && mobileIgnores.indexOf(to.path) === -1) {
    window.location.href = window.origin + '/app.html'
    NProgress.done()
  }

  // set page title
  // document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()
  if (hasToken) {

    console.log('hasToken------42      ' + to.path)
    if (to.path === '/bide/login') {
      // if is logged in, redirect to the home page
      // next({
      //   path: '/bide/panel/index'
      // })
      window.location.href = '/#/bide/panel/index';
      window.location.reload();
      NProgress.done()
    } 
    else {
      // if (to.path.indexOf('/bide')> -1) {
      //   to.path = to.path.replace('/bide', '');
      // }
      // debugger
      const hasGetUserInfo = store.getters.name
      if (hasGetUserInfo || to.path.indexOf('/previewScreenShot/') > -1 || to.path.indexOf('/preview/') > -1 || to.path.indexOf('/delink') > -1 || to.path.indexOf('/nolic') > -1) {
        next()
        store.dispatch('permission/setCurrentPath', to.path)
      } else {
        if (store.getters.roles.length === 0) { // ????????????????????????????????????user_info??????
          // get user info
          store.dispatch('user/getInfo').then(() => {
            const deWebsocket = getSocket()
            deWebsocket && deWebsocket.reconnect && deWebsocket.reconnect()
            console.log('??????????????????63')
            store.dispatch('lic/getLicInfo').then(() => {
              loadMenus(next, to)
            }).catch(() => {
              loadMenus(next, to)
            })
          }).catch((err) => {
            // $alert('???????????????userInfo?????????????????????????????????' + err);
            // console.log('??????????????????----'+ err)
            store.dispatch('user/logout').then(() => {
              location.reload() // ?????????????????????vue-router?????? ??????bug
            })
          })
        } else if (store.getters.loadMenus) {
          // ?????????false??????????????????
          store.dispatch('user/updateLoadMenus')
          store.dispatch('lic/getLicInfo').then(() => {
            loadMenus(next, to)
          }).catch(() => {
            loadMenus(next, to)
          })
        } else {
          next()
        }
      }
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      
    console.log('bide89---------' + to.path + '-------------' + to.fullPath)
      // in the free login whitelist, go directly
      next()
    } else {
      
    console.log('bide94---------' + to.path + '-------------' + to.fullPath)
      // other pages that do not have permission to access are redirected to the login page.
      next(`/bide/login`)
  NProgress.done()
    }
  }
})
export const loadMenus = (next, to) => {
  buildMenus().then(res => {
    const datas = res.data
    const filterDatas = filterRouter(datas)
    const asyncRouter = filterAsyncRouter(filterDatas)
    // ?????????????????? ?????????????????? ?????? ????????????????????????????????????
    // if (JSON.stringify(datas).indexOf('wizard') > -1) {
    //   asyncRouter.push({
    //     path: '/',
    //     component: Layout,
    //     redirect: '/wizard/index',
    //     hidden: true
    //   })
    // } else {
      asyncRouter.push({
        path: '/',
        component: Layout,
        redirect: '/bide/panel/index',
        hidden: true
      })
    // }

    asyncRouter.push({
      path: '*',
      redirect: '/404',
      hidden: true
    })
    store.dispatch('permission/GenerateRoutes', asyncRouter).then(() => { // ????????????
      router.addRoutes(asyncRouter)
      if (pathValid(to.path, asyncRouter)) {
        next({
          ...to,
          replace: true
        })
      } else {
        next('/')
      }
    })
  })
}

/**
 * ??????path????????????
 * @param {*} path
 * @param {*} routers
 * @returns
 */
const pathValid = (path, routers) => {
  const temp = path;// .startsWith('/bide/') ? path.substr(6) : path
  const locations = temp.split('/')
  if (locations.length === 0) {
    return false
  }

  return hasCurrentRouter(locations, routers, 0)
}
/**
 * ????????????every level
 * @param {*} locations
 * @param {*} routers
 * @param {*} index
 * @returns
 */
const hasCurrentRouter = (locations, routers, index) => {
  // const location = locations[index]
  // let kids = []
  // const isvalid = routers.some(router => {
  //   kids = router.children
  //   return (router.path === location || ('/' + location) === router.path)
  // })
  // if (isvalid && index < locations.length - 1) {
  //   return hasCurrentRouter(locations, kids, index + 1)
  // }
  return true;//isvalid
}
// ????????????????????????
const filterRouter = routers => {
  const user_permissions = store.getters.permissions
  // if (!user_permissions || user_permissions.length === 0) {
  //   return routers
  // }
  const tempResults = routers.filter(router => hasPermission(router, user_permissions))
  // ?????????????????????(??????) ??????????????? ????????????
  return tempResults.filter(item => {
    if (item.type === 0 && (!item.children || item.children.length === 0)) {
      return false
    }
    return true
  })
}
const hasPermission = (router, user_permissions) => {
  // ?????????????????? ????????????????????????????????????????????????
  if (router.permission && !user_permissions.includes(router.permission)) {
    return false
  }
  if (!filterLic(router)) {
    return false
  }
  // ?????????????????? ??? ?????????????????? ????????????????????????????????????
  if (router.children && router.children.length) {
    const permissionChilds = router.children.filter(item => hasPermission(item, user_permissions))
    router.children = permissionChilds
    return router.children.length > 0
  }
  return true
}
const filterLic = (router) => {
  return !router.isPlugin || store.getters.validate
}
router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
