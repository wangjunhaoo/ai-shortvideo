'use strict'

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const STATE_FILENAME = 'license-state.enc'
const PBKDF2_SALT = 'waoowaoo-state-salt'
const PBKDF2_PASSPHRASE_SUFFIX = 'waoowaoo-license-enc-v1'
const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

/**
 * 根据硬件指纹派生加密密钥
 * @param {string} fingerprint 硬件指纹
 * @returns {Buffer}
 */
function deriveKey(fingerprint) {
  const passphrase = fingerprint + PBKDF2_PASSPHRASE_SUFFIX
  return crypto.pbkdf2Sync(passphrase, PBKDF2_SALT, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST)
}

/**
 * 获取状态文件路径
 * @param {import('electron').App} [app]
 * @returns {string}
 */
function getStatePath(app) {
  // 如果传入了 app 实例，使用 app.getPath；否则从 electron 获取
  if (!app) {
    const { app: electronApp } = require('electron')
    app = electronApp
  }
  return path.join(app.getPath('userData'), STATE_FILENAME)
}

/**
 * 加密并保存授权状态到文件
 * @param {object} state 授权状态对象
 * @param {string} fingerprint 硬件指纹
 * @param {import('electron').App} [app]
 */
function save(state, fingerprint, app) {
  const key = deriveKey(fingerprint)
  const iv = crypto.randomBytes(12) // GCM 推荐 12 字节 IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const plaintext = JSON.stringify(state)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // 存储格式：IV(12) + AuthTag(16) + EncryptedData
  const output = Buffer.concat([iv, authTag, encrypted])
  const filePath = getStatePath(app)

  // 确保目录存在
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, output)
}

/**
 * 从文件读取并解密授权状态
 * @param {string} fingerprint 硬件指纹
 * @param {import('electron').App} [app]
 * @returns {object | null} 解密后的状态对象，文件不存在或解密失败返回 null
 */
function load(fingerprint, app) {
  const filePath = getStatePath(app)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const data = fs.readFileSync(filePath)
    if (data.length < 28) return null // 至少 12(IV) + 16(Tag) 字节

    const iv = data.subarray(0, 12)
    const authTag = data.subarray(12, 28)
    const encrypted = data.subarray(28)

    const key = deriveKey(fingerprint)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return JSON.parse(decrypted.toString('utf8'))
  } catch {
    // 解密失败（指纹变化、文件损坏等）
    return null
  }
}

/**
 * 删除状态文件
 * @param {import('electron').App} [app]
 */
function clear(app) {
  const filePath = getStatePath(app)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

module.exports = { save, load, clear }
