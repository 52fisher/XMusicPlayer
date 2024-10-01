<template>
  <div class="container">
    <div class="layout_switch">
      <el-switch v-model="layout" class="mt-2" style="margin-left: 24px" :active-icon="IconList"
        :inactive-icon="IconGrid" />
    </div>
    <template v-if="musicList">
      <div class="music_list" :class="layoutType">
        <div class="music_list_item" @click="handleRouter(item.title)" v-for="item in titleList">{{ item.title }} <span
            class="total">{{ item.total }}</span></div>
      </div>
    </template>
  </div>
</template>
<script setup>
import IconList from '../components/icons/IconList.vue'
import IconGrid from '../components/icons/IconGrid.vue'
import { useStorage, useFetch} from '@vueuse/core'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import localforage from 'localforage'
import ApiList from '@/components/ApiList.vue'

// const { musicList, musicListTitle } = Setting.getMusicList();
const { data: musicList } = useFetch(ApiList.musicList).get().json()
const titleList = ref([]);

watch(() => musicList.value, (value) => {
  if (!value) return
  let musicKeys = Object.keys(value);
  // let musicListTitle = [];
  // 删除musicKeys中的 全部 和 所有歌曲 ，添加到第一项
  musicKeys = musicKeys.filter((item) => item !== "全部" && item !== "所有歌曲");
  // musicListTitle = ["全部", "所有歌曲", ...musicKeys];
  titleList.value = ["全部", "所有歌曲", ...musicKeys].map(item => {
    return {
      title: item,
      total: value[item].length
    }
  })

})
const layout = useStorage('layout', true) // 是否为平铺模式
const layoutType = computed(() => {
  return layout.value ? 'flat_layout' : 'flex_layout'
})
// const switch = ref(true);
const router = useRouter()
const handleRouter = (name) => {
  // useStorage('list', musicList.value[name])
  // console.log('%csrc\views\HomeView.vue:51 object', 'color: #007acc;', musicList.value[name]);
  localStorage.setItem('list', JSON.stringify(musicList.value[name]))
  // localforage.setItem(name, musicList.value[name])
  router.push({ name: 'list', params: { title: name } })
}
const { data: setting } = useFetch(ApiList.getSetting).get().json()
watch(() => setting.value, () => {
  let devices = Object.keys(setting.value.devices).map(item => {
    return {
      name: setting.value.devices[item]['name'],
      did: setting.value.devices[item]['did'],
      play_type: setting.value.devices[item]['play_type']||0
    }
  })
  //  console.log('%csrc\views\HomeView.vue:61 devices', 'color: #007acc;', devices);
  devices.push({
    name: '本地',
    did: '',
    play_type: 0
  })
  localforage.setItem('devices', devices)
}, { once: true })
</script>
<style lang="scss" scoped>
.container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;

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

      &:hover {
        background-color: rgba(0, 0, 0, 0.05)
      }
    }
  }

  .layout_switch {
    display: flex;
    justify-content: flex-end;
  }

  .flat_layout {
    display: block;

    .music_list_item {
      margin: 10px auto;
      height: 40px;
      line-height: 40px;
      border-radius: 8px;
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

  .flex_layout {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: start;
    align-content: center;

    .music_list_item {
      --size: clamp(8em, 10vw, 10em);
      width: var(--size);
      height: var(--size);
      line-height: var(--size);
      border: 1px solid #CFD6DE;
      border-radius: 8px;
      font-size: clamp(0.5em, 1.5vw, 1em);
      position: relative;
    }

    .total {
      position: absolute;
      top: 5px;
      display: inline-block;
      left: 2px;
      width: 10px;
      height: 10px;
      line-height: 0;
      color: #b0d9d4;
    }
  }
}
</style>