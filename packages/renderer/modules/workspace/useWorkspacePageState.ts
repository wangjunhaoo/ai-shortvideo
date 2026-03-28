import { useCallback, useEffect, useState } from 'react'
import { useRequiredRendererSession } from '@renderer/auth/client'
import {
  createProject,
  deleteProject,
  getUserPreference,
  listProjects,
  updateProject,
} from '@renderer/clients/project-client'
import { useRouter } from '@/i18n/navigation'
import { logError as _ulogError } from '@/lib/logging/core'
import { shouldGuideToModelSetup } from '@/lib/workspace/model-setup'
import { PAGE_SIZE, type Pagination, type Project, type TranslationFn } from './types'

type ProjectFormState = {
  name: string
  description: string
}

const EMPTY_FORM: ProjectFormState = {
  name: '',
  description: '',
}

export function useWorkspacePageState(t: TranslationFn) {
  const { data: session, status, canRenderProtected, isLoading } = useRequiredRendererSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormState>(EMPTY_FORM)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<ProjectFormState>(EMPTY_FORM)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modelNotConfigured, setModelNotConfigured] = useState(false)

  const fetchProjects = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      })
      if (search.trim()) {
        params.set('search', search.trim())
      }

      const response = await listProjects(params)
      if (!response.ok) return

      const data = await response.json()
      setProjects(data.projects)
      setPagination(data.pagination)
    } catch (error) {
      _ulogError('获取项目失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canRenderProtected || !session) return
    void fetchProjects(pagination.page, searchQuery)
  }, [canRenderProtected, fetchProjects, pagination.page, searchQuery, session])

  const resetCreateForm = useCallback(() => {
    setFormData(EMPTY_FORM)
  }, [])

  const resetEditForm = useCallback(() => {
    setEditFormData(EMPTY_FORM)
    setEditingProject(null)
  }, [])

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [searchInput])

  const clearSearch = useCallback(() => {
    setSearchInput('')
    setSearchQuery('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true)
    void (async () => {
      try {
        const response = await getUserPreference()
        if (!response.ok) return
        const payload: unknown = await response.json()
        setModelNotConfigured(shouldGuideToModelSetup(payload))
      } catch {
      }
    })()
  }, [])

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false)
    resetCreateForm()
  }, [resetCreateForm])

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }, [])

  const handleCreateProject = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) return

    setCreateLoading(true)
    try {
      const response = await createProject({
        ...formData,
        mode: 'novel-promotion',
      })

      if (!response.ok) {
        alert(t('createFailed'))
        return
      }

      let shouldOpenModelSetup = true
      const preferenceResponse = await getUserPreference()
      if (preferenceResponse.ok) {
        const preferencePayload: unknown = await preferenceResponse.json()
        shouldOpenModelSetup = shouldGuideToModelSetup(preferencePayload)
      } else {
        _ulogError('获取用户偏好失败:', { status: preferenceResponse.status })
      }

      clearSearch()
      setPagination((prev) => ({ ...prev, page: 1 }))
      void fetchProjects(1, '')
      setShowCreateModal(false)
      resetCreateForm()

      if (shouldOpenModelSetup) {
        alert(t('analysisModelRequiredAfterCreate'))
        router.push({ pathname: '/profile' })
      }
    } catch (error) {
      _ulogError('创建项目失败:', error)
      alert(t('createFailed'))
    } finally {
      setCreateLoading(false)
    }
  }, [clearSearch, fetchProjects, formData, resetCreateForm, router, t])

  const openEditModal = useCallback((project: Project, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setEditingProject(project)
    setEditFormData({
      name: project.name,
      description: project.description || '',
    })
    setShowEditModal(true)
  }, [])

  const closeEditModal = useCallback(() => {
    setShowEditModal(false)
    resetEditForm()
  }, [resetEditForm])

  const handleEditProject = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingProject || !editFormData.name.trim()) return

    setCreateLoading(true)
    try {
      const response = await updateProject(editingProject.id, editFormData)

      if (!response.ok) {
        alert(t('updateFailed'))
        return
      }

      const data = await response.json()
      setProjects((prev) => prev.map((project) => (
        project.id === editingProject.id ? data.project : project
      )))
      closeEditModal()
    } catch {
      alert(t('updateFailed'))
    } finally {
      setCreateLoading(false)
    }
  }, [closeEditModal, editFormData, editingProject, t])

  const openDeleteConfirm = useCallback((project: Project, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setProjectToDelete(project)
    setShowDeleteConfirm(true)
  }, [])

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
    setProjectToDelete(null)
  }, [])

  const handleDeleteProject = useCallback(async () => {
    if (!projectToDelete) return

    setDeletingProjectId(projectToDelete.id)
    setShowDeleteConfirm(false)

    try {
      const response = await deleteProject(projectToDelete.id)

      if (!response.ok) {
        alert(t('deleteFailed'))
        return
      }

      void fetchProjects(pagination.page, searchQuery)
    } catch {
      alert(t('deleteFailed'))
    } finally {
      setDeletingProjectId(null)
      setProjectToDelete(null)
    }
  }, [fetchProjects, pagination.page, projectToDelete, searchQuery, t])

  return {
    session,
    status,
    canRenderProtected,
    isLoading,
    projects,
    loading,
    showCreateModal,
    createLoading,
    formData,
    editingProject,
    showEditModal,
    editFormData,
    deletingProjectId,
    showDeleteConfirm,
    projectToDelete,
    pagination,
    searchQuery,
    searchInput,
    modelNotConfigured,
    setSearchInput,
    setFormData,
    setEditFormData,
    handleSearch,
    clearSearch,
    openCreateModal,
    closeCreateModal,
    handlePageChange,
    handleCreateProject,
    openEditModal,
    closeEditModal,
    handleEditProject,
    openDeleteConfirm,
    cancelDelete,
    handleDeleteProject,
  }
}
