<template>
  <div class="music_player_wrapper" :class="isMiniPlayer ? 'mini' : ' full '">
    <div class="music_player_box">
      <audio ref="audio" :src="currentTrack.url" @loadedmetadata="onLoadedMetadata" @timeupdate="updateCurrentTime"
        @ended="handleTrackEnd" autoplay></audio>
      <!-- 标题、收藏 -->

      <!-- 设备投放选择 -->
      <div class="device_setting" v-if="!isMiniPlayer">
        <div class="current_device_name">{{ currentDevice.name }}</div>
        <div class="shutdown" @click="timerSwitch = true" v-if="currentDevice.did">
          <IconTimer />
          <ModalDialog @close="timerSwitch = false" v-if="timerSwitch">
            <template #title>选择定时关闭的时间</template>
            <template #content>
              <div v-for="item in ['10分钟',  '30分钟', '60分钟']" :key="item" @click="setTimer(item)">
                  {{ item }}
              </div>
            </template>
          </ModalDialog>
        </div>
        <div class="cast_device" @click="devicesSwitch = true">
            <IconDevice />
            <ModalDialog @close="devicesSwitch = false" v-if="devicesSwitch">
              <template #title>选择投放设备</template>
              <template #content>
                <div v-for="item in devices" :key="item.name" @click="changeDevice(item)">
                    {{ item.name }}
                </div>
              </template>
            </ModalDialog>
        </div>

      </div>
      <!-- 歌曲进度条 -->
      <div class="progress_bar" v-if="!isMiniPlayer">
        <input type="range" :max="duration" :value="currentTime" @input="seek" step="0.1" />
      </div>
      <!-- 显示当前歌曲时间 -->
      <div class="time_display" v-if="!isMiniPlayer">
        <div class="current_time">{{ formatTime(currentTime) }}</div>
        <div class="duration">{{ formatTime(duration) }}</div>
      </div>
      <!-- 播放器控制部分 -->
      <div class="controls">
        <!-- 播放模式选择 -->
        <div class="loop" @click="toggleLoopType" v-if="!isMiniPlayer">
          <IconRepeatOne v-if="loopType === 0" />
          <IconRepeatAll v-if="loopType === 1" />
          <IconRandom v-if="loopType === 2" />
        </div>
        <div class="prev">
          <IconMusicPrev @click="prevTrack" />
        </div>
        <div class="audio_state" @click="togglePlay">
          <img src="/cover.png" alt="" ref="audioState" class="cover">
          <div class="audio_state_icon">
            <IconMusicPlay v-if="playState" />
            <IconMusicPause v-else />
          </div>
        </div>
        <div class="next">
          <IconMusicNext @click="nextTrack" />
        </div>
        <!-- 收缩列表 -->
        <div class="shrink" v-if="!isMiniPlayer">
          <IconShrink @click="toggleMiniPlayer" />
        </div>
      </div>

    </div>
    <!-- 显示歌词 -->
    <div class="lyrics-container wordType" ref="lyricsContainer" v-if="!isMiniPlayer">
      <div class="lyrics" :style="{ top: lyricOffset }" v-if="currentLyric.length > 0">
        <div v-for="(line, index) in currentLyric" :key="index" :class="isCurrentLine(index) ? 'current' : ''">
          {{ line.text }}
        </div>
      </div>
      <div v-else class="lyrics_none">暂无歌词，请欣赏音乐吧</div>
    </div>
    <!-- 歌曲信息 -->
    <div class="music_info " v-if="!isMiniPlayer">
      <div class="music_name">
        <div class="music_title wordType">{{ currentTrack.name }}</div>
        <div class="music_star" v-if="currentDevice.did">
          <IconStar />
        </div>
      </div>
      <div class="music_singer">{{ currentTrack.singer }}</div>
    </div>
    <!-- 封面 -->
    <div class="cover_wrapper" v-if="!isMiniPlayer">
      <img src="/defaultcover.jpg" alt="" class="cover" ref="fullCover">
    </div>
    <!-- 音量调整 -->
    <div class="volume" v-if="!isMiniPlayer">
      <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="changeVolume" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFetch, useStorage } from '@vueuse/core'
import IconMusicPlay from './icons/IconMusicPlay.vue'
import IconMusicPause from './icons/IconMusicPause.vue'
import IconMusicNext from './icons/IconMusicNext.vue'
import IconMusicPrev from './icons/IconMusicPrev.vue'
import IconRepeatAll from './icons/IconRepeatAll.vue'
import IconRepeatOne from './icons/IconRepeatOne.vue'
import IconRandom from './icons/IconRandom.vue'
import IconShrink from './icons/IconShrink.vue'
import IconDevice from './icons/IconDevice.vue'
import IconStar from './icons/IconStar.vue'
import IconTimer from './icons/IconTimer.vue'
import localforage from 'localforage'
import ModalDialog from './ModalDialog.vue'
import ApiList from './ApiList.vue'
const emit = defineEmits(['prev-track', 'next-track', 'random-track','handle-play','change-device'])
const playState = ref(false);
const volume = ref(0.5);
// const loopType = ref('sequence');
const currentTime = ref(0);
const duration = ref(0); // 歌曲总时长
const audio = ref()
const audioState = ref() // 封面播放组件
const fullCover = ref() // 组件最大化后的 全屏封面
//循环播放
const loopType = ref(useStorage('loopType', 0));
const loopList = ['单曲循环', '列表循环', '随机播放'];
// 滚动偏移量
const lyricOffset = ref(0);

// 滚动歌词容器的引用
const lyricsContainer = ref(null);

const currentTrack = computed(() => props.currentTrack);
const devices = ref([]);
const devicesSwitch = ref(false)
const timerSwitch = ref(false)
const currentDevice = ref({name:"本机",did:""});
localforage.getItem('devices').then((value) => {
  if (value) {
    devices.value = value
  }
})
localforage.getItem('currentDevice').then((value) => {
  if (value) {
    currentDevice.value = value
  }
})
const props = defineProps({
  currentTrack: {
    type: Object,
    default: () => ({
      name: '',
      url: '',
      album: '',
      lyric: "",
      cover: '',
    }),
  }, isMiniPlayer: {
    type: Boolean,
    default: true
  }
})
// console.log('%csrc\components\Player.vue:86 props', 'color: #007acc;', props.currentTrack.value);
//切换循环模式
const toggleLoopType = () => {
  loopType.value = (loopType.value + 1) % loopList.length;
}
const toggleMiniPlayer = () => {
  emit('toggle-mini-player')
}

const changeDevice = (item) => {
  //更更换设备应该立即暂停音乐
  console.log('%csrc\components\Player.vue:169 playState.value', 'color: #007acc;', playState.value);
  if (playState.value!==true) {
    audio.value.pause()
  }
  devicesSwitch.value = false
  currentDevice.value = item
  // console.log('%csrc\components\Player.vue:169 item', 'color: #007acc;', item);
  //若更改的设备不是本地(did为空)，则要立即通过ApiList拉取音量
  if (item.did) {
    const { data: deviceVolume } = useFetch(ApiList.getVolume + item.did).get().json()
    watch(() => volume.value, (value) => {
      volume.value = parseInt(deviceVolume.value) / 100;
    },{once:true})
  }
  
  localforage.setItem('currentDevice', toRaw(item))
  emit('change-device', item)
}
// 监听音量变化，如果currentDevice的did不为空，则要同步发送请求
watch(() => volume.value, (value) => {
  if (currentDevice.value.did) {
    console.log('%csrc\components\Player.vue:186 value', 'color: #007acc;', value);
    const { data: deviceVolume } = useFetch(ApiList.setVolume).post({
      did: currentDevice.value.did,
      volume: value*100
    }).json()
  }
})
//投放到小爱设备的音乐需要立即更新进度条
setInterval(() => {
  if (currentDevice.value.did) {
    const { data: res } = useFetch(ApiList.playingMusic + currentDevice.value.did).get().json()
    watch(() => res.value, (value) => {
      if (res.value.ret == "OK" && res.value.is_playing) {
        duration.value = res.value.duration
        currentTime.value = res.value.offset * duration.value / 100
        updateLyricOffset();
      }
    },{once:true})
  }
}, 1000)

const setTimer = (item) => {
  if (currentDevice.value.did) {
    const { data: res } = useFetch(ApiList.sendCmd).post({
      did: currentDevice.value.did,
      cmd: item+"后关机"
    }).json()
  }
}
watch(()=>currentTrack.value.cover,(value)=>{
  audioState.value.src = value
})
// 监听音频元数据加载完成
const onLoadedMetadata = (event) => {
  // const audio = event.target;
  // console.log('%csrc\components\Player.vue:80 event', 'color: #007acc;', event);
  duration.value = event.target.duration;
  audio.value?.play().catch((err) => {
    // console.log('%csrc\components\Player.vue:116 err,playState', 'color: #007acc;', err, playState);
    playState.value = true;
  });
  // console.log('%csrc\components\Player.vue:119 currentTrack.value.cover', 'color: #007acc;', currentTrack.value.cover);
  audioState.value.src = currentTrack.value.cover;

};
// 播放、暂停
const togglePlay = () => {
  playState.value = !playState.value;
  //如果currentDevice的did不为空，则应该在小爱设备上进行播放
  if (currentDevice.value.did) {
    if( playState.value===true){
      useFetch(ApiList.sendCmd).post({
        did: currentDevice.value.did,
        cmd: '关机'
      })
      return;
    }
    // playState.value = !playState.value;
    emit('handle-play', currentTrack.value.name)
    return;
  }
  playState.value ? audio.value.play() : audio.value.pause();
  // playState.value = !playState.value;
};
// 上一首
const prevTrack = async () => {
  audio.value.pause(); // 切换前先暂停
  if (loopType.value === 2) {
    emit('random-track');
    return;
  }
  emit('prev-track');
  // currentTrackIndex.value = (currentTrackIndex.value - 1 + playerList.value.length) % playerList.value.length;
  // await playCurrentTrack(); // 切换后自动播放
};
// 下一首
const nextTrack = async () => {

  audio.value.pause(); // 切换前先暂停
  //loopType如果为2，则表示随机播放,抛出随机random-track
  if (loopType.value === 2) {
    emit('random-track');
    return;
  }
  emit('next-track');
  // currentTrackIndex.value = (currentTrackIndex.value + 1) % playerList.value.length;
  // await playCurrentTrack(); // 切换后自动播放
};

// 播放当前音乐
const playCurrentTrack = async () => {
  playState.value = true;
  await audio.value.load(); // 确保加载完毕
  // 尝试播放
  await audio.value.play()

};
// 监听当前歌曲的播放进度
const updateCurrentTime = (event) => {
  currentTime.value = event.target.currentTime;
  updateLyricOffset(); // 根据播放进度更新歌词滚动
};
// 调节音量
const changeVolume = () => {
  audio.value.volume = volume.value;
};
// 监听歌曲播放结束
const handleTrackEnd = () => {
  //单曲循环直接再次调用playCurrentTrack,并把歌词的offset归零
  lyricOffset.value = 0;
  if (loopType.value === 0) {
    playCurrentTrack();
    return;
  }
  // 列表循环
  nextTrack();

};
// 调节播放进度
const seek = (event) => {
  const target = event.target;
  audio.value.currentTime = parseFloat(target.value); // 跳转到新的播放位置
};
// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`; // 格式化为分:秒
};

// 解析歌词
const currentLyric = computed(() => {
  // const obj = currentTrack.value;
  return currentTrack.value.lyric ? parseLyrics(currentTrack.value.lyric) : [];
});

// 解析歌词并生成带有时间戳和内容的列表
const parseLyrics = (lyric) => {
  const lines = lyric.split('\n');
  const parsed = lines.map((line) => {
    const match = line.match(/\[(\d+):(\d+\.\d+)\] ?(.*)/); // 只需匹配文本部分
    if (match) {
      const [, mins, secs, text] = match;
      return {
        time: parseFloat(mins) * 60 + parseFloat(secs),
        text: text.trim(), // 确保去掉多余的空格
      };
    }
    return null; // 没有匹配成功的行返回 null
  }).filter((item) => item && item.text.length > 0); // 过滤掉空行或没有文本的行
  return parsed;
};



// 更新歌词偏移，确保当前歌词在视野中
const updateLyricOffset = () => {
  const currentLyricIndex = currentLyric.value.findIndex((line) => line.time > currentTime.value);
  // 防止歌曲结束后偏移量重置
  if (currentTime.value <= duration.value) {
    if (currentLyricIndex > 0) {
      //每一行高度不固定，要根据元素的实际高度来计算
      lyricOffset.value = `calc( ( ${currentLyricIndex - 1} * -1 ) * var(--lh))`;
      // lyricOffset.value = (currentLyricIndex - 1) * 18 + 10; // 30px 代表每行歌词的高度
      // console.log('%csrc\components\Player.vue:236 (currentLyricIndex - 1)  * 18 + 10 ', 'color: #007acc;', (currentLyricIndex - 1) * 18 + 10);
    }
  } else {
    // 如果歌曲结束，保持在最后一行
    lyricOffset.value = `calc( ${currentLyric.value.length - 1} * -1 * var(--lh) - var(--pd) * 2 * var(--lh))`;
  }
};

/**
 * 判断当前行是否为当前时间对应的歌词行
 * @param {number} index - 歌词行的索引
 * @returns {boolean} - 是否是当前时间对应的歌词行
 */
const isCurrentLine = (index) => {
  // 找到当前时间对应的歌词行
  const nextIndex = currentLyric.value.findIndex((line) => line.time > currentTime.value);

  // 如果当前时间小于歌曲总时长
  if (currentTime.value <= duration.value) {
    // 如果找到当前时间对应的歌词行
    if (nextIndex > 0) {
      // 则当前行是当前时间对应的歌词行
      return index === nextIndex - 1;
    } else {
      // 如果当前时间大于 0
      if (currentTime.value > 0) {
        // 则当前行是最后一行
        return index === currentLyric.value.length - 1;
      }
    }
  }
};
//使用autoplay时playState变得不可靠，自动更新状态存在问题，必须在挂载完成后,监听audio的播放状态,修正状态
onMounted(() => {
  audio.value.addEventListener('playing', () => {
    playState.value = false;
    audioState?.value?.classList.add('rotate')
  })
  audio.value.addEventListener('pause', () => {
    playState.value = true;
    audioState?.value?.classList.remove('rotate')
  })
})
watchEffect(() => {
  if (props.isMiniPlayer === true) {
    return;
  }
  if (fullCover.value) {
    currentTrack.value.cover && (fullCover.value.src = currentTrack.value.cover);
  }
})

</script>

<style scoped lang="scss">
.wordType {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.music_player_wrapper {
  display: flex;
  flex-direction: column-reverse;
  background: #fff;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  justify-content: space-between;
  bottom: 0;
  z-index: 99;
  position: -webkit-sticky;
  position: fixed;
  color: #262338;
  width: 100vw;
  --lh: 8.467vw;
  --fz: 5.333vw;

  .music_player_box {
    background-color: white;
    width: 100vw;
    --size: clamp(50px, 20vw, 100px);
  }

  .music_info {
    font-size: var(--fz);
    width: 90vw;
    height: 20vw;

    .music_name {
      display: flex;
      font-weight: bold;
      justify-content: space-between;

      svg {
        width: 6vw;
        height: 6vw;

      }
    }

    .music_singer {
      font-size: calc(var(--fz) * 0.7);
      font-weight: normal;
      color: #a2a9af;
    }
  }

  .device_setting {
    display: flex;
    width: 90vw;
    justify-content: end;
    margin-bottom: 2vh;
    gap: 4vw;
    .current_device_name {
      font-size: calc(var(--fz) * 0.8);
      font-weight: normal;
    }
    .shutdown {
      margin-left: auto;
    }
  }

  .poper {
    position: fixed;
    z-index: 99;
    width: 90vw;
    background-color: #f9f8fd;
    text-align: center;
    padding: 5vw;
    font-weight: normal;
    font-size: calc(var(--fz) * 0.6);
    border-radius: 5vw;
    backdrop-filter: blur(50px);
    cursor: default;
    bottom: 0;
    height: 30vw;

    .device {
      border-bottom: 1px solid #DFE2DB;
    }
  }

  .controls {
    display: flex;
    gap: 20vw;

    .prev,
    .next,
    .audio_state,
    .loop,
    .shrink {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .progress_bar {
    display: flex;
    justify-content: center;
    align-content: center;

    input {
      width: 80vw;
    }
  }

  .audio_state {
    position: relative;

    .cover {
      width: var(--size);
      height: var(--size);
      background-size: var(--size) var(--size);
      border-radius: var(--size);
      position: absolute;
    }

    .audio_state_icon {
      display: flex;
      align-items: center;
      padding: .5rem;
      opacity: .8;
      background: #f0f0f0;
      border-radius: var(--size);
      width: calc(var(--size) * 0.4);
      height: calc(var(--size) * 0.4);
      justify-content: center;
    }

    svg {
      position: absolute;
      z-index: 99;
      color: #2c2c2c;
    }
  }

  .lyrics-container {
    flex: 1;
    height: 500px;
    overflow-y: auto;
    position: relative;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    font-size: 4.333vw;
    line-height: var(--lh);
    font-weight: normal;
    height: 20vh;
    overflow: hidden;
  }

  .lyrics-container:active {
    cursor: grab;
  }

  .lyrics {
    position: absolute;
    transition: top 0.3s linear;
  }

  .lyrics>div {
    text-align: center;
    width: 96vw;
    padding: 0 2vw;
  }

  .lyrics_none {
    display: flex;
    justify-content: center;
  }

  .current {
    color: red;
  }

  .time_display {
    display: flex;
    justify-content: space-between;
    width: 80vw;
    margin: 0 auto;
  }

  .volume {
    position: fixed;
    right: 0;
    top: 50%;
    z-index: 99;
    transform: translateX(40%) translateY(-50%) rotate(-90deg);
  }

  .cover_wrapper {
    height: 50vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4vw;

    .cover {
      width: 80vw;
      height: 80vw;
      border-radius: 4vw;
    }
  }
}

.mini {
  flex-direction: row;

  .controls {
    gap: 20vw;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28vw;
    box-shadow: 8px 0px 5px 0px rgba(0, 0, 0, 0.1);
  }

}

.full {
  top: 0;
  overflow: hidden;

  .music_player_box {
    height: 28vh;
  }

  .lyrics-container {
    position: relative;
    height: 20vh;
    overflow: hidden;
  }

  .controls {
    display: flex;
    gap: 10vw;
    justify-content: center;
    align-content: center;

    .loop svg,
    .shrink svg {
      fill: #a2a9af;
    }
  }


}

.rotate {
  animation: coverRotate 5s linear infinite;
}

@keyframes coverRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

input[type="range"] {
  height: 10px;
  border: 0;
  background-color: #f0f0f0;
  border-radius: 5px;
  position: relative;
  -webkit-appearance: none !important;
  appearance: none !important;
  outline: none;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4400;
}

input[type=range]::-webkit-slider-runnable-track {
  height: 15px;
  border-radius: 10px;
  /*将轨道设为圆角的*/
  box-shadow: 0 1px 1px #def3f8, inset 0 .125em .125em #0d1112;
  /*轨道内置阴影效果*/
  background-color: #0dc9f7;
}

input[type=range]:focus {
  outline: none;
  /*原始的控件获取到焦点时，会显示包裹整个控件的边框，所以还需要把边框取消。*/
}
</style>