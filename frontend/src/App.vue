<template>
  <div>
    <!-- Search Bar -->
    <section class="section">
      <div class="container">
        <div class="field">
          <p class="control has-icons-left">
            <input class="input" type="text" placeholder="Search..." />
            <span class="icon is-left">
              <i class="fas fa-search"></i>
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Two Columns -->
    <section class="section">
      <div class="container">
        <div class="columns">
          <!-- Left Column: Map Component -->
          <div class="column is-two-thirds">
            <div class="box">
              <MapComponent />
            </div>
          </div>

          <!-- Right Column: Play/Pause Component -->
          <div class="column">
            <div class="box has-text-centered">
              <PlayPauseComponent />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { defineComponent } from "vue";

// MapComponent - Placeholder for the map
const MapComponent = defineComponent({
  template: `<h3>Map Component</h3>`,
});

// PlayPauseComponent - Play and pause buttons
const PlayPauseComponent = defineComponent({
  template: `
      <div>
        <button class="button is-primary">Play</button>
        <button class="button is-danger">Pause</button>
      </div>
    `,
});
</script>

<style>
/* Optional custom styles */
</style>
