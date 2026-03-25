<script setup lang="ts">
import AppHeader from "@/components/layout/AppHeader.vue";
import Footer from "@/components/layout/Footer.vue";
import AppWrapper from '@/AppWrapper.vue'
import ErrorBoundary from "@/components/error/ErrorBoundary.vue";
import SkeletonLoader from "@/components/skeleton/SkeletonLoader.vue";
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
            <SkeletonLoader />
          </template>
        </Suspense>
      </ErrorBoundary>
    </main>
    <Footer />
  </div>
</template>
