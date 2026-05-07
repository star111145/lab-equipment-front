<template>
  <router-view />
</template>

<script>
import { websocketClient } from '@/utils/websocket'

export default {
  name: 'App',
  mounted() {
    const userId = localStorage.getItem('userId')
    if (userId) {
      websocketClient.connect(userId)
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

@import url('@/css/responsive.css');
</style>
