export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()

  if (!user.value) {
    return navigateTo('/login')
  }

  if (user.value.role !== 'ADMIN') {
    return navigateTo('/dashboard')
  }
})
