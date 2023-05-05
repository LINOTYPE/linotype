import { defineNuxtPlugin, useNuxtApp, useRouter, useRuntimeConfig } from 'nuxt/app'
import useDomain from './composables/useDomain'
import useLinotype from './composables/useLinotype'

export default defineNuxtPlugin(async () => {
  
  const config = useRuntimeConfig()
  const nuxtApp = useNuxtApp()
  const router = useRouter()
  const { scheme, domain } = useDomain()
  const { loadLinotype } = useLinotype()

  //define current domain
  if (process.server) {
    scheme.value = ( nuxtApp.ssrContext?.event?.node?.req?.headers['x-forwarded-proto'] || nuxtApp.ssrContext?.event?.node?.req?.connection?.encrypted ? 'https' : 'http' ).split(/\s*,\s*/)[0]
    domain.value = nuxtApp.ssrContext?.event?.node?.req?.headers.host?.split(':')[0] || 'localhost'
  } else {
    scheme.value = location.protocol === 'https:' ? 'https' : 'http'
    domain.value = window?.document?.location?.host?.split(':')[0] || 'localhost'
  }

  //TODO payload: unique payload directus endpoint to load current site info + all route (use cache to speed up first load)

  //register linotype routes
  const linotypePagesRoutesResponse = await fetch(`${config.public.linotype.backend_url}/items/linotype_pages?fields=id,slug,target.*.*`) //add filter : &filter={ "slug": { "_contains": ":" }}`)
  const { data: linotypePagesRoutes } = await linotypePagesRoutesResponse.json()
  for( const item of linotypePagesRoutes ) {
    router.addRoute({
      name: `linotype-custom-${item.id}`,
      path: item.slug,
      component: () => import(`~/pages/index.vue`)
    }) 
  }

  //TODO payload: end

  //load linotype
  nuxtApp.hook('app:created', async () => {
    await loadLinotype()
  })

  
})
