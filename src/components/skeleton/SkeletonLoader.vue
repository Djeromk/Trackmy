<script setup lang="ts">
</script>

<template>
  <div class="skeleton-container">

    <!-- Hero: карточки "В процессе" -->
    <div class="skeleton-hero mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="skeleton-title mb-2"></div>
          <div class="skeleton-subtitle"></div>
        </div>
      </div>

      <div class="skeleton-cards-scroll">
        <div
          v-for="i in 3"
          :key="`hero-${i}`"
          class="skeleton-card-hero"
        >
          <div class="skeleton-cover"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton-text skeleton-text--wide"></div>
            <div class="skeleton-text skeleton-text--medium"></div>
            <div class="skeleton-text skeleton-text--narrow"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Заголовок "Статистика" -->
    <div class="mb-6">
      <div class="skeleton-heading mb-2"></div>
      <div class="skeleton-subtitle"></div>
    </div>

    <!-- Сетка карточек -->
    <div class="skeleton-stats-grid">

      <!-- ActivityCard -->
      <div class="skeleton-card skeleton-card--activity">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="skeleton-icon"></div>
            <div class="space-y-2">
              <div class="skeleton-text skeleton-text--medium"></div>
              <div class="skeleton-text skeleton-text--narrow"></div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <div class="skeleton-percentage mb-3"></div>
          <div class="skeleton-progress-bar"></div>
        </div>

        <div class="flex items-center gap-4">
          <div class="skeleton-chart"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton-legend-item"></div>
            <div class="skeleton-legend-item"></div>
            <div class="skeleton-legend-item"></div>
          </div>
        </div>
      </div>

      <!-- MediaTypeCard x3 -->
      <div
        v-for="i in 3"
        :key="`media-${i}`"
        class="skeleton-card"
      >
        <div class="flex items-start justify-between mb-5">
          <div class="flex items-center gap-3">
            <div class="skeleton-icon"></div>
            <div class="space-y-2">
              <div class="skeleton-text skeleton-text--medium"></div>
              <div class="skeleton-text skeleton-text--narrow"></div>
            </div>
          </div>
          <div class="skeleton-button"></div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="row-span-2 skeleton-stat-main"></div>
          <div class="skeleton-stat-secondary"></div>
          <div class="skeleton-stat-secondary"></div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <div class="skeleton-text skeleton-text--narrow"></div>
            <div class="skeleton-text skeleton-text--narrow"></div>
          </div>
          <div class="skeleton-progress-bar"></div>
        </div>
      </div>
    </div>

    <!-- Accordion секции -->
    <div class="pt-8 space-y-3">
      <div class="mb-6">
        <div class="skeleton-heading mb-2"></div>
        <div class="skeleton-subtitle"></div>
      </div>

      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <div
          v-for="i in 4"
          :key="`filter-${i}`"
          class="skeleton-filter-chip"
        ></div>
      </div>

      <div
        v-for="i in 4"
        :key="`accordion-${i}`"
        class="skeleton-accordion-section"
      >
        <div class="flex items-center justify-between px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="skeleton-dot"></div>
            <div class="skeleton-text skeleton-text--medium"></div>
            <div class="skeleton-badge"></div>
          </div>
          <div class="skeleton-chevron"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>
