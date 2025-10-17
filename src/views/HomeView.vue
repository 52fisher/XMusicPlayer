<template>
  <div class="home-container" v-if="!loading">
    <div class="home-header">
      <div class="layout_switch">
        <el-switch v-model="layout" :active-icon="IconList" inline-prompt :inactive-icon="IconGrid" />
      </div>
      <div class="refresh">
        <el-button round size="small" @click="handleRefresh">
          <el-icon :class="{ 'refresh-loading': isRefresh }">
            <Refresh />
          </el-icon>
        </el-button>
      </div>
    </div>
    <template v-if="musicList">
      <div class="music_list" :class="layoutType">
        <div class="music_list_item" @click="handleRouter(item.title)" v-for="(item, index) in titleList" :key="index">
          <div class="cover" v-if="!layout"><img :src="defaultcover" ref="listRefs"></div>
          <div class="title">
            {{ item.title }}
          </div>
          <div class="total">{{ item.total }}</div>
        </div>
      </div>
    </template>
  </div>
  <div class="loading_mask" v-loading.fullscreen.lock="loading" element-loading-text="首次运行需要获取和缓存音乐列表，请稍后"></div>
</template>
<script setup>
import IconList from '../components/icons/IconList.vue'
import IconGrid from '../components/icons/IconGrid.vue'
import { useStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import ApiList from '@/components/ApiList.vue'
import { useIntersectionObserver } from '@vueuse/core'
import fetchData from '@/components/FetchData.js'
import defaultcover from '/defaultcover.jpg'
import { Refresh } from '@element-plus/icons-vue'
const loading = ref(true);

const listRefs = ref([]);
//musicList如果在localStorage有缓存，则调用本地缓存，否则调用接口获取
const useList = (remote = false) => {
  const mList = useStorage('musicList', {})
  const tList = useStorage('titleList', [])
  if (remote === false) {
    if (Object.keys(mList.value).length !== 0 && tList.value.length !== 0) {
      loading.value = false
      return {
        musicList: mList,
        titleList: tList
      };
    }
  }

  fetchData(ApiList.musicList, "", (data) => {
    mList.value = data
    let musicKeys = Object.keys(data);
    // 删除musicKeys中的 全部 和 所有歌曲 ，添加到第一项
    musicKeys = musicKeys.filter((item) => item !== "全部" && item !== "所有歌曲" && item !== "收藏");
    tList.value = ["全部", "所有歌曲", '收藏', ...musicKeys].map(item => {
      return {
        title: item,
        total: data[item].length
      }
    })
    loading.value = false
    localStorage.setItem('musicList', JSON.stringify(data))
    localStorage.setItem('titleList', JSON.stringify(tList.value))
  })
  return {
    musicList: mList,
    titleList: tList
  };
}
//不能放在useList前面，存在暂时性死区
const { musicList, titleList } = useList();


const isRefresh = ref(false)
const handleRefresh = () => {
  isRefresh.value = !isRefresh.value
  loading.value = true;
  const { musicList: mlist, titleList: tlist } = useList(true);
  musicList.value = mlist.value;
  titleList.value = tlist.value;
}


// 是否为平铺模式，默认为平铺模式
const layout = useStorage('layout', true)
const layoutType = computed(() => {
  return layout.value ? 'flat_layout' : 'grid_layout'
})
//通过list/title获取对应的musicList
const router = useRouter()
const handleRouter = (name) => {
  // localStorage.setItem('list', JSON.stringify(musicList.value[name]))
  router.push({ name: 'list', params: { title: name } })
}
//缓存设置中的devices
fetchData(ApiList.getSetting, "", (data) => {
  // localStorage.setItem('setting', JSON.stringify(data))
  let devices = Object.keys(data.devices).map(item => {
    return {
      name: data.devices[item]['name'],
      did: data.devices[item]['did'],
      play_type: data.devices[item]['play_type'] || 0
    }
  })
  devices.push({
    name: '本地',
    did: '',
    play_type: 0
  })
  localStorage.setItem('devices', JSON.stringify(devices))
})

/**
 * @description: Lazy load images and fetch music info
 * @param {HTMLElement} target The element that contains the image
 * @param {number} index The index of the element in the list
 */
const handleLazyImage = (target, index) => {
  //取出index所对应的标题名称的音乐列表
  const mlist = musicList.value[titleList.value[index].title];
  //列表一定存在，但是不一定有数据
  if (mlist.length === 0) {
    return;
  }
  //取出列表第一个歌名
  const name = mlist[0];
  /**
   * Fetch music info from the API
   */
  fetchData(ApiList.musicInfoWithTag + encodeURIComponent(name), '', (res) => {
    /**
     * If the API returns a picture, update the image src
     */
    res.tags.picture && (target.src = res.tags.picture)
  })
}
//listRefs有变动，则说明图片需要懒加载，立即对每个元素进行观察
watch(listRefs.value, (value) => {
  listRefs.value.forEach((item, index) => {
    const { stop } = useIntersectionObserver(item, ([{ isIntersecting }]) => {
      if (!isIntersecting) {
        return;
      }
      stop()
      handleLazyImage(item, index)
    })
  })
})
</script>
<style lang="scss" scoped>
// 导入本地字体
@font-face {
  font-family: 'AlimamaDongFangDaKai-Regular';
  src: url('@/assets/AlimamaDongFangDaKai-Regular.woff2');
  font-weight: normal;
  font-style: normal
}

// CSS变量系统 - 全局主题控制
:root {
  // 颜色变量
  --primary-color: #D81159;
  --text-color: #2d2d33;
  --text-secondary: #6b7280;
  --background-color: #ffffff;
  --surface-color: #ffffff;
  --border-color: #CFD6DE;
  --hover-color: #f9fafb;
  
  // 尺寸变量
  --header-height: 60px;
  --item-spacing: 10px;
  --border-radius: 8px;
  
  // 字体变量
  --font-main: 'AlimamaDongFangDaKai-Regular', system-ui, sans-serif;
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #EC4899;
    --text-color: #f3f4f6;
    --text-secondary: #9ca3af;
    --background-color: #111827;
    --surface-color: #1f2937;
    --border-color: #374151;
    --hover-color: #374151;
  }
}

// 动画定义
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.home-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  background-color: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);

  .home-header {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    height: var(--header-height);
    animation: fadeIn 0.5s ease-out;

    .refresh-loading {
      animation: rotate 1s linear infinite;
    }
  }

  .music_list {
    cursor: default;
    width: 100%;
    animation: fadeIn 0.5s ease-out 0.2s both;

    .music_list_item {
      margin: var(--item-spacing) 0;
      color: var(--text-color);
      text-overflow: ellipsis;
      overflow: hidden;
      backdrop-filter: blur(5px);
      background-color: var(--surface-color);
      font-family: var(--font-main);
      font-weight: bold;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        background-color: var(--hover-color);
      }
    }
  }

  // 平铺布局优化
  .flat_layout {
    .music_list_item {
      margin: var(--item-spacing) auto;
      height: 48px;
      line-height: 48px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
    }

    .cover {
      display: none;
    }

    .total {
      color: var(--text-secondary);
      font-weight: normal;
      font-size: 0.9em;
    }

    .total::before {
      content: "(";
    }

    .total::after {
      content: ")";
    }
  }

  // 网格布局优化 - 响应式设计
  .grid_layout {
    --grid-item-size: clamp(120px, 18vw, 160px);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--grid-item-size), 1fr));
    gap: clamp(16px, 3vw, 24px);
    justify-content: center;

    .music_list_item {
      width: var(--grid-item-size);
      height: var(--grid-item-size);
      position: relative;
      background-size: cover;
      background-position: center;
      overflow: hidden;
      margin: 0;

      .cover {
        width: 100%;
        height: 100%;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
      }

      .title {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        width: 100%;
        backdrop-filter: blur(8px);
        background-color: rgba(255, 255, 255, 0.7);
        bottom: 0;
        font-size: clamp(0.8em, 2vw, 1em);
        padding: 0 8px;
        text-align: center;
        transition: background-color 0.3s ease;

        // 深色模式下的标题背景
        @media (prefers-color-scheme: dark) {
          background-color: rgba(0, 0, 0, 0.7);
        }
      }

      &:hover img {
        transform: scale(1.05);
      }
    }

    .total {
      display: none;
    }
  }
}

// 加载动画优化
.loading_mask {
  background-color: var(--background-color);
  color: var(--text-color);
}

// 响应式断点优化
@media (max-width: 768px) {
  .home-container {
    padding: 12px;
  }
  
  .grid_layout {
    --grid-item-size: clamp(100px, 25vw, 140px);
  }
}

@media (max-width: 480px) {
  .home-container {
    .home-header {
      gap: 16px;
    }
    
    .grid_layout {
      --grid-item-size: clamp(80px, 30vw, 120px);
    }
  }
}

// 高分辨率屏幕优化
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .music_list_item {
    border: 0.5px solid var(--border-color);
  }
}
</style>