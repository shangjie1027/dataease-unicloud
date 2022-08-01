<template>
  <div id="bide">
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  created() {
    // document.getElementById('app').style.display = 'none';
  },
  data() {
    return {};
  },

  methods: {},
};
</script>

<style>
::-webkit-scrollbar {
  width: 8px;
  height: 12px;
  background-color: #f0f2f5;
}
::-webkit-scrollbar-track {
  border-radius: 8px;
  background-color: #f0f2f5;
}
::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: #bfc3c6;
}
#bide {
  margin-top: 20px;
}
</style>
