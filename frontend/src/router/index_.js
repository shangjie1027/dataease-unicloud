/*
 * @Author: your name
 * @Date: 2021-11-01 11:16:36
 * @LastEditTime: 2021-11-01 15:12:23
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \screen_project\src\router\index.js
 */
import Vue from 'vue';
import VueRouter from 'vue-router';
// import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: '/bide/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
];

const router = new VueRouter({
  routes,
});

export default router;
