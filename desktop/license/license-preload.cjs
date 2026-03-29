'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('licenseAPI', {
  /** 激活 License */
  activate: (licenseKey) => ipcRenderer.invoke('license:activate', licenseKey),
  /** 获取当前授权状态 */
  getStatus: () => ipcRenderer.invoke('license:getStatus'),
  /** 注销激活 */
  deactivate: () => ipcRenderer.invoke('license:deactivate'),
})
