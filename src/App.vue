<script setup lang="ts">
import AppHeader from "@/components/layout/AppHeader.vue";
import BottomNavigation from "@/components/layout/BottomNavigation.vue";
import Footer from "@/components/layout/Footer.vue";
import AppWrapper from '@/AppWrapper.vue'
import ErrorBoundary from "@/components/error/ErrorBoundary.vue";
import SkeletonLoader from "@/components/skeleton/SkeletonLoader.vue";
</script>

<template>
  <div id="trackmy-app" class="min-h-screen pb-20 md:pb-0">
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
    <BottomNavigation />
    <Footer />
  </div>
</template>
