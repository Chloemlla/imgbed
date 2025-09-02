import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { upload } from '@/utils/upload'
import { useApiStore } from './api'
import { createAsyncPool } from '@/utils/async-pool'

export type TFileStatus = 'prepare' | 'uploading' | 'uploaded' | 'error'
export type TFile = {
  file: File
  focus: boolean
  url: string
  status: TFileStatus
  progress: number
  id: string
  err?: string
}
const pool = createAsyncPool(5)
export const useFileStore = create<{
  files: TFile[]
  add: (file: File) => void
  retry: (id: string) => void
  del: (id: string) => void
  clear: () => void
  edit: (f: TFile) => void
  focus: (id: string) => void
}>((set, get) => ({
  files: [],
  add(file) {
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return
    }
    
    if (file.size > maxSize) {
      console.error('File too large:', file.size)
      return
    }
    
    // Sanitize file name
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 255)
    const sanitizedFile = new File([file], sanitizedName, { type: file.type })
    
    const id = nanoid()
    set((state) => ({
      files: [
        ...state.files,
        {
          file: sanitizedFile,
          focus: false,
          url: '',
          status: 'prepare',
          progress: 0,
          id: id,
        },
      ],
    }))
    pool(async () => {
      try {
        const currentFile = get().files.find((f) => f.id === id)
        if (!currentFile) {
          console.error('File not found during upload:', id)
          return
        }
        
        get().edit({
          ...currentFile,
          status: 'uploading',
        })
        
        const api = useApiStore.getState().getApi()
        if (!api) {
          throw new Error('No API available for upload')
        }
        
        const res = await upload(api, file, (p) => {
          const fileToUpdate = get().files.find((f) => f.id === id)
          if (fileToUpdate) {
            get().edit({
              ...fileToUpdate,
              progress: p,
            })
          }
        })
        
        const finalFile = get().files.find((f) => f.id === id)
        if (finalFile) {
          get().edit({
            ...finalFile,
            url: res.url,
            status: res.err ? 'error' : 'uploaded',
            err: res.err,
          })
        }
      } catch (error) {
        const errorFile = get().files.find((f) => f.id === id)
        if (errorFile) {
          get().edit({
            ...errorFile,
            status: 'error',
            err: error instanceof Error ? error.message : 'Upload failed',
          })
        }
        console.error('Upload error:', error)
      }
    })
  },
  retry(id) {
    const file = get().files.find((f) => f.id === id)
    if (!file) {
      return
    }
    get().edit({
      ...file,
      status: 'prepare',
    })
    pool(async () => {
      try {
        const currentFile = get().files.find((f) => f.id === id)
        if (!currentFile) {
          console.error('File not found during retry:', id)
          return
        }
        
        get().edit({
          ...currentFile,
          status: 'uploading',
        })
        
        const api = useApiStore.getState().getApi()
        if (!api) {
          throw new Error('No API available for retry')
        }
        
        const res = await upload(
          api,
          file.file,
          (p) => {
            const fileToUpdate = get().files.find((f) => f.id === id)
            if (fileToUpdate) {
              get().edit({
                ...fileToUpdate,
                progress: p,
              })
            }
          },
        )
        
        const finalFile = get().files.find((f) => f.id === id)
        if (finalFile) {
          get().edit({
            ...finalFile,
            url: res.url,
            status: res.err ? 'error' : 'uploaded',
            err: res.err,
          })
        }
      } catch (error) {
        const errorFile = get().files.find((f) => f.id === id)
        if (errorFile) {
          get().edit({
            ...errorFile,
            status: 'error',
            err: error instanceof Error ? error.message : 'Retry failed',
          })
        }
        console.error('Retry error:', error)
      }
    })
  },
  del(id) {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }))
  },
  clear() {
    set({ files: [] })
  },
  edit(f) {
    set((state) => ({
      files: state.files.map((item) => {
        if (item.id === f.id) {
          return f
        }
        return item
      }),
    }))
  },
  focus(id) {
    set((state) => ({
      files: state.files.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            focus: true,
          }
        }
        return {
          ...item,
          focus: false,
        }
      }),
    }))
  },
}))
