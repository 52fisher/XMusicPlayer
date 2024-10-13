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
              <div v-for="item in ['10分钟', '30分钟', '60分钟']" :key="item" @click="setTimer(item)">
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
        <!-- <input type="range" :max="duration" :value="currentTime" @input="seek" step="0.1" /> -->
        <el-slider v-model="currentTime" @change="seek" :max="duration" :step="0.1"
          :disabled="currentDevice.did ? true : false" :show-tooltip="false" />
      </div>
      <!-- 显示当前歌曲时间 -->
      <div class="time_display" v-if="!isMiniPlayer">
        <div class="current_time">{{ formatTime(currentTime) }}</div>
        <div class="duration">{{ formatTime(duration) }}</div>
      </div>
      <!-- 播放器控制部分 -->
      <div class="controls" ref="controls">
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
          <img :src="currentTrack.cover" alt="" ref="audioState" class="cover">
          <div class="audio_state_icon">
            <IconMusicPause v-if="playState" />
            <IconMusicPlay v-else />
          </div>
        </div>
        <div class="next">
          <IconMusicNext @click="nextTrack" />
        </div>
        <!-- 收缩列表 -->
        <div class="shrink" v-if="!isMiniPlayer">
          <IconShrink @click="isMiniPlayer = true" />
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
        <div class="music_star" v-show="currentDevice.did" @click="FavoriteSong">
          <IconStar :class="{ stared: stared }" />
        </div>
      </div>
      <div class="music_singer">{{ currentTrack.singer }}</div>
    </div>
    <!-- 封面 -->
    <div class="cover_wrapper" v-if="!isMiniPlayer">
      <img :src="currentTrack.cover" alt="" class="cover">
    </div>
    <!-- 音量调整 -->
    <div class="volume" v-if="!isMiniPlayer">
      <!-- <input type="range" min="0" max="1" step="0.01" v-model="volume" @change="changeVolume" /> -->
      <el-slider v-model="volume" @change="changeVolume" :max="1" :min="0" :step="0.01" vertical height="20vh" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSwipe, useStorage } from '@vueuse/core'
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
import ModalDialog from './ModalDialog.vue'
import ApiList from './ApiList.vue'
import fetchData from './FetchData';
import showMsg from './ModalMsg';
const emit = defineEmits(['prev-track',
  'next-track',
  'random-track',
  'handle-play',
  'change-device',
  'update:currentTrack',
  'no-scroll',
])
const playState = ref(false); //true为播放 显示暂停按钮，false为暂停 显示为播放按钮
const volume = useStorage('volume', 0.5);
// const loopType = ref('sequence');
const currentTime = ref(0);
const duration = ref(0); // 歌曲总时长
const audio = ref()
const audioState = ref(null) // 封面播放组件

//循环播放
const loopType = useStorage('loopType', 0);
const loopList = ['单曲循环', '全部循环', '随机播放'];

const lyricOffsetY = ref("calc( var(--lyh) / 2 )");
// 滚动偏移量
const lyricOffset = ref(lyricOffsetY.value);

// 滚动歌词容器的引用
const lyricsContainer = ref(null);

//当前歌曲的信息
const props = defineProps({
  currentTrack: {
    type: Object
  }
})
const currentTrack = computed(() => props.currentTrack);
//是否收藏
const stared = ref(currentTrack.value.star);
//投放设备
const devices = useStorage('devices', []);
const devicesSwitch = ref(false)
const currentDevice = useStorage('currentDevice', { name: "本机", did: "", play_type: 0 });//当前设备

//定时播放开关，限remote设备
const timerSwitch = ref(false)

//全局计时器id
const synctimer = ref(null)

//音乐组件是否最小化,通过isMiniPlayer来控制,controls是监控的组件，通过上滑和下滑来控制isMiniPlayer
const isMiniPlayer = ref(true);
const controls = ref(null)
const { isSwiping, direction } = useSwipe(controls);
watchEffect(() => {
  const body = document.body.classList;
  if (direction.value === 'up') {
    isMiniPlayer.value = false
    body.add("no-scroll")
    return;
  }
  if (direction.value === 'down' || isMiniPlayer.value) {
    isMiniPlayer.value = true
    body.remove("no-scroll")
    return;
  }
})


/**
 * 切换循环模式
 * @returns {void}
 */
const toggleLoopType = () => {
  //切换循环模式
  loopType.value = (loopType.value + 1) % loopList.length;
  //如果currentDevice的did不为空，则需要发送cmd请求，更改循环模式
  if (currentDevice.value.did) {
    fetchData(ApiList.sendCmd, {
      did: currentDevice.value.did,
      cmd: loopList[loopType.value]
    }, (res) => {
      //如果返回结果ret为OK，则显示msg
      res.ret == "OK" && showMsg(currentDevice.value.name + ' 已切换为 ' + loopList[loopType.value])
    })
  }
}

/**
 * @description: 切换设备
 * @param {Object} item 选择的设备
 * @return {void}
 */
const changeDevice = (item) => {
  //更换设备应该立即暂停音乐
  console.log('%csrc\components\Player.vue:169 playState.value', 'color: #007acc;', playState.value);
  // if (playState.value !== true) {
  //   audio.value.pause()
  // }
  //如果设备的did不为空，说明是本地 应该暂停音乐
  if (!currentDevice.value.did) {
    audio.value?.pause()
    playState.value = false
  }
  devicesSwitch.value = false
  currentDevice.value = item
  if (!item.did) {
    //切换设备后如果是设备选择为本地，应该重新拉取音乐信息（remote的url为空）,注意清除定时器
    synctimer.value && clearInterval(synctimer.value)
    emit('update:currentTrack', currentTrack.value.name)
  }
  //同步歌曲信息
  //若更改的设备不是本地(did为空)，则要立即通过ApiList拉取音量
  if (item.did) {
    //切换设备后获取正在播放的歌曲信息
    fetchData(ApiList.getVolume + item.did, '', (res) => {
      volume.value = parseInt(res.volume) / 100;
    })
    //循环模式也要切换为当前设备的循环模式
    loopType.value = item.play_type
    //同时要开启同步歌曲信息的定时器，本地播放音乐不需要重复发起请求
    synctimer.value && clearInterval(synctimer.value)
    syncRemoteMusicInfo()
    synctimer.value = setInterval(syncRemoteMusicInfo, 1000)
  }
  localStorage.setItem('currentDevice', JSON.stringify(toRaw(item)))
  emit('change-device', item)
}

/**
 * 投放到小爱设备的音乐需要立即更新进度条
 * 同步歌词和进度条，首次立即执行，每隔1秒检测一次
 * @returns {void}
 */
const syncRemoteMusicInfo = () => {
  if (!currentDevice.value.did) {
    return;
  }
  fetchData(ApiList.playingMusic + currentDevice.value.did, '', (res) => {
    if (res.ret != "OK") {
      throw new Error("获取播放信息失败");
    }
    // 如果歌曲名和res.cur_music不同，则立即获取歌曲信息
    if (res.cur_music && (currentTrack.value.name != res.cur_music)) {
      emit('update:currentTrack', res.cur_music, true)
    }
    // 如果正在播放，则同步歌词和进度
    if (res.is_playing) {
      // 图标也要同步
      playState.value = true
      // 同步远程信息，开启定时器
      duration.value = res.duration
      currentTime.value = res.offset
      updateLyricOffset();
      return;
    }
    // 没有播放就清空定时器并暂停播放
    synctimer.value && clearInterval(synctimer.value)
    playState.value = false
  })
}


/**
 * 设置定时关机
 * @param {string} item - 定时关机的时间
 * @returns {void}
 */
const setTimer = (item) => {
  // 使用fetchData发送请求
  fetchData(ApiList.sendCmd, {
    did: currentDevice.value.did,
    cmd: item + "后关机"
  }, (res) => {
    // 如果返回结果ret为OK，则显示msg
    res.ret == "OK" && showMsg(currentDevice.value.name + ' 已设置 ' + item + '后关机')
  })
}
//监听currentTrack的变化，更新播放组件的封面
watch(() => currentTrack.value.cover, (value) => {
  console.log('%csrc\components\Player.vue:259 cover发生变化了', 'color: #007acc;', value);
  audioState.value.src = value
})
// 监听音频元数据加载完成
const onLoadedMetadata = (event) => {
  // const audio = event.target;
  // console.log('%csrc\components\Player.vue:80 event', 'color: #007acc;', event);
  duration.value = event.target.duration;
  try {
    audio.value.play().then(() => {
      audioState.value.src = currentTrack.value.cover;
    })

  } catch (err) {
    console.warn('%csrc\components\Player.vue:116 err,playState', 'color: #007acc;', err, playState);
    playState.value = true;
  }

};
/**
 * togglePlay
 * @description: 点击播放暂停按钮，切换播放状态
 * @return {void}
 */
const togglePlay = () => {
  console.log('%csrc\components\Player.vue:275 playState.value', 'color: #007acc;', playState.value);
  // 本地播放直接操作playState即可
  if (!currentDevice.value.did) {
    // play()和pause()已经通过watch绑定到playState.value上了直接切换即可
    playState.value = !playState.value;
    return;
  }

  // 如果currentDevice的did不为空，则应该在小爱设备上进行播放
  // 若当前为播放状态，点击按钮后切换为暂停状态
  if (playState.value === true) {
    showMsg("已发送 关机 指令给 " + currentDevice.value.name);
    fetchData(ApiList.sendCmd, {
      did: currentDevice.value.did,
      cmd: '关机'
    }, () => {
      //暂停后应该停止定时器
      synctimer.value && clearInterval(synctimer.value)
      playState.value = false;
    })

    return;
  }

  // remote设备的暂停其实是关机命令，所以playState.value为false时要重新播放
  emit('handle-play', currentTrack.value.name)

  playState.value = true;
};
// 上一首
const prevTrack = async () => {
  !currentDevice.value.did && (playState.value = false); // 切换前先暂停
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
  !currentDevice.value.did && (playState.value = false); // 切换前先暂停
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
  if (currentDevice.value.did) {
    //用fetchData改写
    fetchData(ApiList.setVolume, {
      did: currentDevice.value.did,
      volume: parseInt(volume.value * 100)// 小爱设备音量范围是0-100，本地音量范围是0-1
    })
  }
  //保存到本地
  localStorage.setItem('volume', volume.value);
};
/**
 * FavoriteSong
 * @description: Collect the current song
 * @returns {void}
 */
const FavoriteSong = () => {
  // sendcmd to inform the backend to collect the current song
  let cmd = stared.value ? '取消收藏' : '加入收藏' // collect song
  fetchData(ApiList.sendCmd, {
    did: currentDevice.value.did,
    cmd: cmd // collect song
  }, (res) => {
    // if the backend returns OK, show a message to the user
    if (res.ret == "OK") {
      showMsg("已" + cmd + currentTrack.value.name);
      stared.value = !stared.value;
    }
  })
}
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
const seek = () => {
  //remote的音乐无法选择播放进度
  if (currentDevice.value.did) {
    showMsg("远程设备无法选择播放进度");
    return;
  }
  audio.value.currentTime = parseFloat(currentTime.value); // 跳转到新的播放位置
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
      lyricOffset.value = `calc( ( ${currentLyricIndex - 1} * -1 ) * var(--lh) + ${lyricOffsetY.value} )`;
      // lyricOffset.value = (currentLyricIndex - 1) * 18 + 10; // 30px 代表每行歌词的高度
      // console.log('%csrc\components\Player.vue:236 (currentLyricIndex - 1)  * 18 + 10 ', 'color: #007acc;', (currentLyricIndex - 1) * 18 + 10);
    }
  } else {
    // 如果歌曲结束，保持在最后一行
    lyricOffset.value = `calc( ${currentLyric.value.length - 1} * -1 * var(--lh) * var(--lh) + ${lyricOffsetY.value} )`;
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
  // If the current device is a remote device, start the timer
  if (currentDevice.value.did) {
    syncRemoteMusicInfo()
    // Set the timer to sync the music info every second
    synctimer.value = setInterval(syncRemoteMusicInfo, 1000)
  }
  audio.value.addEventListener('playing', () => {
    playState.value = true;
    audioState?.value?.classList.add('rotate')
  })
  audio.value.addEventListener('pause', () => {
    playState.value = false;
    audioState?.value?.classList.remove('rotate')
  })
  audio.value.onerror = () => {
    // console.log('%csrc\components\Player.vue:12 remote的音乐不能加载正确的src，src会报错', 'color: #007acc;');
    //报错是因为remote的音乐不能也不需要加载src，因为这样会造成本地开始播放，忽略即可
  }
})
watch(() => playState.value, (value) => {
  if (value) {
    audioState?.value?.classList.add('rotate')
    // console.log('%csrc\components\Player.vue:465 audio.value', 'color: #007acc;', audio.value);
    !currentDevice.value.did && audio.value?.play();
    return;
  }
  audioState.value?.classList.remove('rotate')

  !currentDevice.value.did && audio.value?.pause();
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
  background-color: var(--background-color);
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
  color: var(--text-color);
  width: 100vw;
  --lh: 8.467vw;
  --fz: 5.333vw;

  .music_player_box {
    width: 100vw;
    --size: clamp(50px, 20vw, 100px);
  }

  .music_info {
    font-size: var(--fz);
    width: 90vw;
    height: 16vw;

    .music_name {
      display: flex;
      font-weight: bold;
      justify-content: space-between;

      svg {
        width: 6vw;
        height: 6vw;

      }

      .stared {
        fill: #D81159;
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
    margin-bottom: 1vh;
    gap: 4vw;

    .current_device_name {
      font-size: calc(var(--fz) * 0.8);
      font-weight: normal;
    }

    .shutdown {
      margin-left: auto;
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
    width: 80vw;
    margin: 0 auto;
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
    --lyh: 18vh;
    height: var(--lyh);
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
    //transform: translateX(40%) translateY(-50%) rotate(-90deg);
  }

  .cover_wrapper {
    height: 36vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1vw;

    .cover {
      --c-size: clamp(8rem, 80vw, 36vh);
      width: var(--c-size);
      height: var(--c-size);
      ;
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
    height: 26vh;
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

@media (prefers-color-scheme: dark) {
  .music_player_wrapper {
    .controls {

      .prev svg,
      .next svg {
        fill: var(--text-color);
      }
    }
  }

}
</style>