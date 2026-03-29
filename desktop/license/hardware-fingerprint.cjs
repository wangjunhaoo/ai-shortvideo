'use strict'

const os = require('os')
const crypto = require('crypto')
const { execFile } = require('child_process')

const HMAC_SALT = 'waoowaoo-fingerprint-salt-v1'

/** 虚拟网卡关键词，用于过滤非物理网卡 */
const VIRTUAL_NIC_KEYWORDS = [
  'virtualbox',
  'vmware',
  'hyper-v',
  'vethernet',
  'docker',
  'wsl',
  'virtual',
  'veth',
  'br-',
  'virbr',
  'lo',
]

/**
 * 对单个维度值做 SHA-256 哈希
 * @param {string} value
 * @returns {string}
 */
function hashComponent(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * 执行 wmic 命令并返回清洗后的输出行
 * @param {string[]} args wmic 参数列表
 * @returns {Promise<string[]>}
 */
function runWmic(args) {
  return new Promise((resolve) => {
    execFile('wmic', args, { windowsHide: true }, (err, stdout) => {
      if (err) {
        resolve([])
        return
      }
      const lines = stdout
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      // 第一行是表头，跳过
      resolve(lines.slice(1))
    })
  })
}

/**
 * 获取 CPU 型号
 * @returns {string}
 */
function getCpuModel() {
  const cpus = os.cpus()
  return cpus.length > 0 ? cpus[0].model : 'unknown-cpu'
}

/**
 * 获取主板序列号（仅 Windows）
 * @returns {Promise<string>}
 */
async function getBoardSerial() {
  const lines = await runWmic(['baseboard', 'get', 'serialnumber'])
  const serial = lines.find((l) => l.length > 0 && l.toLowerCase() !== 'serialnumber')
  return serial || 'unknown-board'
}

/**
 * 获取第一个磁盘序列号（仅 Windows）
 * @returns {Promise<string>}
 */
async function getDiskSerial() {
  const lines = await runWmic(['diskdrive', 'get', 'serialnumber'])
  const serial = lines.find((l) => l.length > 0 && l.toLowerCase() !== 'serialnumber')
  return serial || 'unknown-disk'
}

/**
 * 获取第一个物理网卡的 MAC 地址
 * @returns {string}
 */
function getPhysicalMac() {
  const interfaces = os.networkInterfaces()
  for (const [name, addrs] of Object.entries(interfaces)) {
    // 过滤虚拟网卡
    const nameLower = name.toLowerCase()
    if (VIRTUAL_NIC_KEYWORDS.some((kw) => nameLower.includes(kw))) continue

    for (const addr of addrs) {
      // 跳过内部地址和全零 MAC
      if (addr.internal) continue
      if (addr.mac === '00:00:00:00:00:00') continue
      return addr.mac
    }
  }
  return 'unknown-mac'
}

/**
 * 采集硬件指纹
 * @returns {Promise<{ fingerprint: string, components: { cpu: string, board: string, disk: string, mac: string } }>}
 */
async function getHardwareFingerprint() {
  const [cpuRaw, boardRaw, diskRaw] = await Promise.all([
    Promise.resolve(getCpuModel()),
    getBoardSerial(),
    getDiskSerial(),
  ])
  const macRaw = getPhysicalMac()

  const cpu = hashComponent(cpuRaw)
  const board = hashComponent(boardRaw)
  const disk = hashComponent(diskRaw)
  const mac = hashComponent(macRaw)

  // 合成指纹
  const fingerprint = crypto
    .createHmac('sha256', HMAC_SALT)
    .update(cpu + board + disk + mac)
    .digest('hex')

  return {
    fingerprint,
    components: { cpu, board, disk, mac },
  }
}

module.exports = { getHardwareFingerprint }
