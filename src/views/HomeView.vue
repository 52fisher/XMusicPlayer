<template>
  <div class="container">
    <div class="layout_switch">
      <el-switch
      v-model="layout"
      class="mt-2"
      style="margin-left: 24px"
      :active-icon="IconList"
      :inactive-icon="IconGrid"
    />
    </div>
    <template v-if="musicListTitle">
      <div class="music_list" :class="layoutType">
        <div class="music_list_item" @click="handleRouter(item.title)" v-for="item in titleList">{{ item.title }} <span class="total">{{ item.total }}</span></div>
      </div>
    </template>
  </div>
</template>
<script setup>
import Setting from '../components/Setting.js'
import IconList from '../components/icons/IconList.vue'
import IconGrid from '../components/icons/IconGrid.vue'
import { useStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { ref, computed, watchEffect } from 'vue'
import localforage from 'localforage'


const { musicList, musicListTitle } = Setting.getMusicList();
const titleList = ref([]);
watchEffect(() => {
  if (musicListTitle.value) {
    // console.log(musicListTitle.value);
    titleList.value = musicListTitle.value.map(item => {
      return {
        title: item,
        total: musicList.value[item].length
      }
    })
  }
})
const layout = useStorage('layout', true) // 是否为平铺模式
const layoutType = computed(() => {
  return layout.value ? 'flat_layout' : 'flex_layout'
})
// const switch = ref(true);
const router = useRouter()
const handleRouter = (name) => {
  useStorage('list', musicList.value[name])
  // localforage.setItem(name, musicList.value[name])
  router.push({ name: 'list', params: { title: name } })
}
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
      &:hover{
        background-color: rgba(0,0,0,0.05)
      }
    }
  }
  .layout_switch{
    display: flex;
    justify-content: flex-end;
  }
  .flat_layout{
    display: block;
  
    .music_list_item{
      margin: 10px auto;
      height: 40px;
      line-height: 40px;
      border-radius: 8px;
    }
    .total{
      margin: 0 5px;
    }
    .total::before{
      content:"("
    }
    .total::after{
      content:")"
    }
  }
  .flex_layout{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: start;
    align-content: center;
    .music_list_item{
      --size:clamp(6em, 5vw, 8em);
      width: var(--size);
      height: var(--size);
      line-height: var(--size);
      border: 1px solid #CFD6DE;
      border-radius: 8px;
      font-size: clamp(0.5em, 1.5vw, 1em);
      position: relative;
    }
    .total{
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