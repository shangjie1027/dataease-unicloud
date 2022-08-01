module.exports = {
  TokenKey: 'De-Authorization',
  RefreshTokenKey: 'refreshauthorization',
  LinkTokenKey: 'LINK-PWD-TOKEN',
  title: '',
  /* for sso */
  IdTokenKey: 'IdToken',
  AccessTokenKey: 'AccessToken',

  /**
   * @type {boolean} true | false
   * @description Whether fix the header
   */
  //   fixedHeader: false,

  /**
   * @type {boolean} true | false
   * @description Whether show the logo in sidebar
   */
  sidebarLogo: false,
  showSettings: true,
  interruptTokenContineUrls: [
    '/api/sys_msg/list/',
    '/dataset/taskLog/list/'
  ]
}
