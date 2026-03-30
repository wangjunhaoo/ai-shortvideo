'use client'
import { useTranslations } from 'next-intl'
import { RendererSessionPendingScreen } from '@renderer/auth/RendererSessionPendingScreen'
import Navbar from '@/components/Navbar'
import { rendererSignOut, useRequiredRendererSession } from '@renderer/auth/client'
import ApiConfigTab from '@renderer/modules/profile/components/ApiConfigTab'
import { AppIcon } from '@/components/ui/icons'

export default function ProfilePage() {
  const { data: session, canRenderProtected, isLoading } = useRequiredRendererSession()
  const t = useTranslations('profile')
  const tc = useTranslations('common')

  if (isLoading || !canRenderProtected || !session) {
    return <RendererSessionPendingScreen label={tc('loading')} />
  }

  return (
    <div className="glass-page min-h-screen">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-6 h-[calc(100vh-140px)]">

          {/* 左侧侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <div className="glass-surface-elevated h-full flex flex-col p-5">

              {/* 用户信息 */}
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="font-semibold text-[var(--glass-text-primary)]">{session.user?.name || t('user')}</h2>
                  <p className="text-xs text-[var(--glass-text-tertiary)]">{t('personalAccount')}</p>
                </div>

              </div>

              {/* 导航菜单 */}
              <nav className="flex-1 space-y-2">
                <button
                  className="glass-btn-base glass-btn-tone-info w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer"
                >
                  <AppIcon name="settingsHexAlt" className="w-5 h-5" />
                  <span className="font-medium">{t('apiConfig')}</span>
                </button>
              </nav>
              {/* 退出登录 */}
              <button
                onClick={() => rendererSignOut({ callbackUrl: '/' })}
                className="glass-btn-base glass-btn-tone-danger mt-auto flex items-center gap-2 px-4 py-3 text-sm rounded-xl transition-all cursor-pointer"
              >
                <AppIcon name="logout" className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0">
            <div className="glass-surface-elevated h-full flex flex-col">

              <ApiConfigTab />
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}

