import { Api } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const apis: Array<Api> = []
const apiModules = import.meta.glob('@/apis/*.ts', {
  eager: true,
  import: 'default',
}) as Record<string, Api | Array<Api>>
for (const path in apiModules) {
  try {
    const api = apiModules[path]
    if (!api) {
      console.warn('Invalid API module at path:', path)
      continue
    }
    
    if (api instanceof Array) {
      for (const item of api) {
        if (item && typeof item === 'object' && 'name' in item && !item.disabled) {
          apis.push(item)
        }
      }
    } else {
      if (typeof api === 'object' && 'name' in api && !api.disabled) {
        apis.push(api)
      }
    }
  } catch (error) {
    console.error('Error loading API module at path:', path, error)
  }
}

export const useApiStore = create(
  persist<{
    current: string
    setCurrent: (api: string) => void
    getApi: () => Api | null
  }>(
    (set, get) => ({
      setCurrent(api) {
        set({ current: api })
      },
      current: apis.length > 0 ? apis[0].name : '',
      getApi() {
        const currentName = get().current
        if (!currentName) {
          console.warn('No current API selected')
          return apis.length > 0 ? apis[0] : null
        }
        
        const foundApi = apis.find((api) => api.name === currentName)
        if (!foundApi) {
          console.warn('API not found:', currentName)
          return apis.length > 0 ? apis[0] : null
        }
        
        return foundApi
      },
    }),
    {
      name: 'api',
    },
  ),
)

// Initialize with first available API if none selected or current is invalid
if (apis.length > 0) {
  const currentApi = useApiStore.getState().getApi()
  if (!currentApi) {
    useApiStore.getState().setCurrent(apis[0].name)
  }
} else {
  console.error('No APIs available')
}
