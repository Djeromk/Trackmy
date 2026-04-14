import './styles/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.config.errorHandler = (err: unknown, instance, info: string): void => {
  const error = err instanceof Error ? err : new Error(String(err))

  console.error(
    '[App Error]',
    '\nСообщение:', error.message,
    '\nКонтекст:', info,
    '\nКомпонент:', instance?.$options?.name ?? 'неизвестен',
    '\nСтек:', error.stack
  )
}

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): void => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Неизвестная ошибка Promise'))

  console.error(
    '[Unhandled Promise Rejection]',
    '\nСообщение:', error.message,
    '\nСтек:', error.stack
  )
})

const authStore = useAuthStore()
authStore.initialize().then(() => {
  app.mount('#app')
})
