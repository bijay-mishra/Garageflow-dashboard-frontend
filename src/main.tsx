import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import { queryClient } from '@/lib/queryClient'
import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ToastProvider } from '@/context/ToastContext'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { AuthProvider } from '@/context/AuthContext'
import { ModuleProvider } from '@/context/ModuleContext'
import { MenuProvider } from '@/context/MenuContext'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import { apiBase, loadRuntimeConfig } from '@/lib/runtimeConfig'
import { clearSessionIfApiChanged } from '@/lib/authStorage'
import './index.css'

// public/config.json is fetched before the first render, so the API base URL is
// resolved by the time any query fires. Kept inside a function rather than a
// top-level await, which esbuild cannot emit for the browser build target.
loadRuntimeConfig().finally(() => {
  // After the config resolves and before React mounts, so AuthContext's very
  // first read already reflects it. A token issued by a different API is
  // dropped here rather than left to fail on whichever request happens first.
  clearSessionIfApiChanged(apiBase())

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AuthProvider>
                  <ModuleProvider>
                    <MenuProvider>
                    <WorkspaceProvider>
                      <BrowserRouter>
                        <App />
                      </BrowserRouter>
                    </WorkspaceProvider>
                    </MenuProvider>
                  </ModuleProvider>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
