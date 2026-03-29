'use strict'

const crypto = require('crypto')
const { net } = require('electron')

/**
 * 客户端签名密钥（混淆嵌入）
 * 实际值通过拆分拼接方式降低静态提取难度
 */
const _k = ['wang', 'junha', 'o-cli', 'ent-', 'hmac', '-sec', 'ret-', 'v1-', 'x9k2', 'mZ']
const CLIENT_SECRET = _k.join('')

/**
 * License API 客户端
 */
class LicenseClient {
  /**
   * @param {string} [serverBaseUrl] 服务器基础 URL
   */
  constructor(serverBaseUrl) {
    this.baseUrl = serverBaseUrl || process.env.LICENSE_SERVER_URL || 'http://license.soloclew.cn'
    this._heartbeatTimer = null
  }

  /**
   * 对请求进行 HMAC 签名
   * @param {object} payload 请求体
   * @returns {{ body: string, headers: Record<string, string> }}
   */
  _signRequest(payload) {
    const timestamp = Date.now().toString()
    const nonce = crypto.randomUUID()
    const body = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', CLIENT_SECRET)
      .update(timestamp + nonce + body)
      .digest('hex')

    return {
      body,
      headers: {
        'Content-Type': 'application/json',
        'X-License-Timestamp': timestamp,
        'X-License-Nonce': nonce,
        'X-License-Signature': signature,
      },
    }
  }

  /**
   * 发送已签名的 POST 请求
   * @param {string} endpoint API 路径
   * @param {object} payload 请求体
   * @returns {Promise<object>}
   */
  _post(endpoint, payload) {
    const { body, headers } = this._signRequest(payload)
    const url = `${this.baseUrl}${endpoint}`

    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url,
      })

      for (const [key, value] of Object.entries(headers)) {
        request.setHeader(key, value)
      }

      let responseBody = ''

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseBody += chunk.toString()
        })

        response.on('end', () => {
          try {
            const result = JSON.parse(responseBody)
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(result)
            } else {
              const err = new Error(result.message || `HTTP ${response.statusCode}`)
              err.status = response.statusCode
              err.data = result
              reject(err)
            }
          } catch {
            reject(new Error(`响应解析失败: ${responseBody.substring(0, 200)}`))
          }
        })

        response.on('error', (err) => reject(err))
      })

      request.on('error', (err) => reject(err))
      request.write(body)
      request.end()
    })
  }

  /**
   * 激活 License
   * @param {string} licenseKey 授权密钥
   * @param {string} fingerprint 硬件指纹
   * @param {object} fingerprintComponents 指纹各维度哈希
   * @param {object} deviceInfo 设备信息
   * @returns {Promise<object>}
   */
  async activate(licenseKey, fingerprint, fingerprintComponents, deviceInfo) {
    return this._post('/api/license/activate', {
      licenseKey,
      fingerprint,
      fingerprintComponents,
      deviceInfo,
    })
  }

  /**
   * 心跳验证
   * @param {string} licenseKey 授权密钥
   * @param {string} fingerprint 硬件指纹
   * @param {string} appVersion 应用版本
   * @returns {Promise<object>}
   */
  async heartbeat(licenseKey, fingerprint, appVersion) {
    return this._post('/api/license/heartbeat', {
      licenseKey,
      fingerprint,
      appVersion,
    })
  }

  /**
   * 注销激活
   * @param {string} licenseKey 授权密钥
   * @param {string} fingerprint 硬件指纹
   * @returns {Promise<object>}
   */
  async deactivate(licenseKey, fingerprint) {
    return this._post('/api/license/deactivate', {
      licenseKey,
      fingerprint,
    })
  }

  /**
   * 启动心跳循环
   * @param {string} licenseKey 授权密钥
   * @param {string} fingerprint 硬件指纹
   * @param {string} appVersion 应用版本
   * @param {number} [intervalMs=1800000] 心跳间隔（默认 30 分钟）
   * @returns {() => void} 停止函数
   */
  startHeartbeatLoop(licenseKey, fingerprint, appVersion, intervalMs = 30 * 60 * 1000) {
    // 先停止已有的心跳
    this.stopHeartbeatLoop()

    const doHeartbeat = async () => {
      try {
        await this.heartbeat(licenseKey, fingerprint, appVersion)
        console.log('[license] 心跳验证成功')
      } catch (err) {
        console.warn('[license] 心跳验证失败:', err.message)
      }
    }

    // 启动后立即执行一次
    void doHeartbeat()

    this._heartbeatTimer = setInterval(doHeartbeat, intervalMs)

    return () => this.stopHeartbeatLoop()
  }

  /**
   * 停止心跳循环
   */
  stopHeartbeatLoop() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
      this._heartbeatTimer = null
    }
  }
}

module.exports = { LicenseClient }
