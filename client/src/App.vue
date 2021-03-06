<template>
  <v-app :dark="dark" v-bind:class="[{ 'app--dark': dark }, { 'app--light': !dark }]">
    <Navbar></Navbar>
    <NavigationDrawer></NavigationDrawer>
    <Dialog></Dialog>
    <v-content>
      <router-view></router-view>
    </v-content>
    <FooterNav />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Navbar from '@/components/navbar/Navbar.vue';
import NavigationDrawer from '@/components/navigation_drawer/NavigationDrawer.vue';
import FooterNav from './components/footer_nav/FooterNav.vue';
import Dialog from './components/dialog/Dialog.vue';
import { mapActions, mapMutations } from 'vuex';

export default Vue.extend({
  name: 'App',
  components: {
    Navbar,
    NavigationDrawer,
    FooterNav,
    Dialog
  },

  computed: {
    dark() {
      return this.$store.state.ui.dark;
    },
    loading() {
      return this.$store.state.ui.ajaxInProgress;
    },
    tabSelected() {
      const route = this.$route.path.toLowerCase();
      if (route.includes('trade')) return 'trade';
      if (route.includes('portfolios')) return 'portfolios';
      if (route.includes('leaderboard')) return 'leaderboard';
      return 'info';
    }
  },
  methods: {
    ...mapActions([
      'checkUserAuth',
      'setStocksData',
      'setCryptosData',
      'setRankingsData'
    ]),
    ...mapMutations(['toggleDarkMode'])
  },
  created: function() {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // if they like it dark, they get it dark, we <3 our users
      this.toggleDarkMode();
    }

    // check for a valid token whenever they visit
    this.checkUserAuth();
    this.setStocksData();
    this.setCryptosData();
    this.setRankingsData();
  }
});
</script>
