
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import localforage from 'localforage';
  
localforage.config({
  driver: localforage.INDEXEDDB, // 选择存储引擎，如IndexedDB
  name: 'xplayer', // 数据库名称
  version: 1, // 数据库版本号
  storeName: 'player', // 数据仓库的名称
});
const app = createApp(App)

app.use(router)

app.mount('#app')
