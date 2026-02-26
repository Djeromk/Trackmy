<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import Footer from './components/layout/Footer.vue';
import AppWrapper from '@/AppWrapper.vue'
import ErrorBoundary from './components/error/ErrorBoundary.vue';

</script>

<template>
  <div id="trackmy-app" class="min-h-screen">
    <AppHeader />
    <main>
      <ErrorBoundary>
      <Suspense>
        <template #default>
          <AppWrapper />
        </template>
        <template #fallback>
          <div class="flex justify-center items-center h-screen">
            Загрузка...
          </div>
        </template>
      </Suspense>
      </ErrorBoundary>
    </main>
    <Footer />
  </div>
</template>
