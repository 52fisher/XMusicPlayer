<template>
  <div class="container" v-if="!loading">
    <div class="header">
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
    musicKeys = musicKeys.filter((item) => item !== "全部" && item !== "所有歌曲");
    tList.value = ["全部", "所有歌曲", ...musicKeys].map(item => {
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
  localStorage.setItem('list', JSON.stringify(musicList.value[name]))
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
/* 导入本地字体*/
@font-face {
  font-family: 'AlimamaDongFangDaKai-Regular';
  src: url('@/assets/AlimamaDongFangDaKai-Regular.woff2');
  font-weight: normal;
  font-style: normal
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;

  .header {
    display: flex;
    justify-content: end;
    align-content: center;
    align-items: center;
    gap: 5vw;

    .refresh-loading {
      animation: rotate 1s linear;
    }
  }

  .music_list {
    cursor: default;
    width: 90%;
    margin: 0 auto;

    .music_list_item {
      margin: 10px 0;
      color: #2d2d33;
      text-overflow: ellipsis;
      overflow: hidden;
      text-align: center;
      backdrop-filter: blur(5px);
      background-color: #fff;
      //font-family: "AlimamaDongFangDaKai-Regular";
      font-weight: bold;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05)
      }
    }
  }

  .flat_layout {

    .music_list_item {
      margin: 10px auto;
      height: 40px;
      line-height: 40px;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      border: 1px solid var(--text-color);
    }


    .cover {
      display: none;
    }

    .total {
      margin: 0 5px;
    }

    .total::before {
      content: "("
    }

    .total::after {
      content: ")"
    }
  }

  .grid_layout {
    --size: clamp(8rem, 10vw, 10rem);;
    display: grid;
    justify-content: space-around;
    grid-template-columns: repeat(auto-fill, var(--size));
    grid-column-gap: 2vw;

    .music_list_item {
      width: var(--size);
      height: var(--size);
      border: 1px solid #CFD6DE;
      border-radius: 8px;
      font-size: clamp(0.5em, 1.5vw, 1em);
      position: relative;
      background-size: cover;

      .cover img {
        width: var(--size);
      }

      .title {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        align-content: center;
        height: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        backdrop-filter: blur(5px);
        background-color: rgba(255, 255, 255, 0.5);
        bottom: 0;
      }
    }

    .total {
      position: absolute;
      top: 5px;
      left: 2px;
      width: 10px;
      height: 10px;
      line-height: 0;
      color: #b0d9d4;
    }
  }
}
</style>