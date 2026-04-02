import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import { SettingsModal } from '@/components/ui/config-modals/ConfigEditModal'
import { ART_STYLES } from '@/lib/constants'

const messages = {
  configModal: {
    title: '项目配置',
    subtitle: '默认沿用设置中心的全局配置，也可为当前项目单独自定义，修改仅对本项目生效。',
    saved: '已保存',
    autoSave: '自动保存',
    visualStyle: '视觉风格',
    modelParams: '模型参数',
    aspectRatio: '画面比例',
    ttsSettings: '旁白配置',
    loadingModels: '加载模型列表...',
    analysisModel: '分析模型',
    characterModel: '人物生成模型',
    locationModel: '场景生成模型',
    storyboardModel: '分镜图像模型',
    editModel: '修图/编辑模型',
    videoModel: '视频模型',
    audioModel: '语音合成模型',
    pleaseSelect: '请选择...',
    paramConfig: '参数配置',
    noParams: '该模型无可配置参数',
    boolOn: '开',
    boolOff: '关',
  },
} as const

const renderWithIntl = (node: ReactElement) => {
  const providerProps: ComponentProps<typeof NextIntlClientProvider> = {
    locale: 'zh',
    messages: messages as unknown as AbstractIntlMessages,
    timeZone: 'Asia/Shanghai',
    children: node,
  }

  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, providerProps),
  )
}

describe('SettingsModal', () => {
  it('保留 5 种视觉风格常量', () => {
    expect(ART_STYLES).toHaveLength(5)
    expect(ART_STYLES.map((style) => style.label)).toEqual([
      '漫画风',
      '精致国漫',
      '日系动漫风',
      '真人风格',
      '古风彩绘',
    ])
  })

  it('将视觉风格卡片提升到后续模型卡片之上', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(SettingsModal, {
        isOpen: true,
        onClose: () => undefined,
        availableModels: {
          llm: [],
          image: [],
          video: [],
          audio: [],
        },
      }),
    )

    expect(html).toContain('glass-surface-soft relative z-10 p-5 sm:p-6 space-y-4')
    expect(html).toContain('视觉风格')
  })
})
