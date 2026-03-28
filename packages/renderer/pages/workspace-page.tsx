'use client'
import { useTranslations } from 'next-intl'
import { RendererSessionPendingScreen } from '@renderer/auth/RendererSessionPendingScreen'
import Navbar from '@/components/Navbar'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useWorkspacePageState } from '@renderer/modules/workspace/useWorkspacePageState'
import { ProjectFormModal } from '@renderer/modules/workspace/ProjectFormModal'
import { WorkspacePagination } from '@renderer/modules/workspace/WorkspacePagination'
import { WorkspaceProjectsSection } from '@renderer/modules/workspace/WorkspaceProjectsSection'
import { WorkspaceSearchBar } from '@renderer/modules/workspace/WorkspaceSearchBar'

export default function WorkspacePage() {
  const t = useTranslations('workspace')
  const tc = useTranslations('common')
  const workspace = useWorkspacePageState(t)

  if (workspace.isLoading || !workspace.canRenderProtected || !workspace.session) {
    return <RendererSessionPendingScreen label={tc('loading')} />
  }

  return (
    <div className="glass-page min-h-screen">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-2">{t('title')}</h1>
            <p className="text-[var(--glass-text-secondary)]">{t('subtitle')}</p>
          </div>
          <WorkspaceSearchBar
            searchInput={workspace.searchInput}
            hasActiveSearch={!!workspace.searchQuery}
            onSearchInputChange={workspace.setSearchInput}
            onSearch={workspace.handleSearch}
            onClear={workspace.clearSearch}
            t={t}
          />
        </div>

        <WorkspaceProjectsSection
          loading={workspace.loading}
          projects={workspace.projects}
          deletingProjectId={workspace.deletingProjectId}
          searchQuery={workspace.searchQuery}
          onCreateProject={workspace.openCreateModal}
          onEditProject={workspace.openEditModal}
          onDeleteProject={workspace.openDeleteConfirm}
          t={t}
        />

        <WorkspacePagination
          loading={workspace.loading}
          pagination={workspace.pagination}
          onPageChange={workspace.handlePageChange}
          t={t}
        />
      </main>

      <ProjectFormModal
        mode="create"
        visible={workspace.showCreateModal}
        loading={workspace.createLoading}
        name={workspace.formData.name}
        description={workspace.formData.description}
        modelNotConfigured={workspace.modelNotConfigured}
        onClose={workspace.closeCreateModal}
        onNameChange={(name) => workspace.setFormData({ ...workspace.formData, name })}
        onDescriptionChange={(description) => workspace.setFormData({ ...workspace.formData, description })}
        onSubmit={workspace.handleCreateProject}
        t={t}
        tc={tc}
      />

      <ProjectFormModal
        mode="edit"
        visible={workspace.showEditModal && !!workspace.editingProject}
        loading={workspace.createLoading}
        name={workspace.editFormData.name}
        description={workspace.editFormData.description}
        onClose={workspace.closeEditModal}
        onNameChange={(name) => workspace.setEditFormData({ ...workspace.editFormData, name })}
        onDescriptionChange={(description) => workspace.setEditFormData({ ...workspace.editFormData, description })}
        onSubmit={workspace.handleEditProject}
        t={t}
        tc={tc}
      />

      <ConfirmDialog
        show={workspace.showDeleteConfirm}
        title={t('deleteProject')}
        message={t('deleteConfirm', { name: workspace.projectToDelete?.name || '' })}
        confirmText={tc('delete')}
        cancelText={tc('cancel')}
        type="danger"
        onConfirm={workspace.handleDeleteProject}
        onCancel={workspace.cancelDelete}
      />
    </div>
  )
}
