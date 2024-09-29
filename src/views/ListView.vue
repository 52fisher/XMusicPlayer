<template>
    <div class="container">
        <div class="wrapper">
            <RouterLink to="/">
                <IconHome />
            </RouterLink>
        </div>
        <div class="header">
            <div class="title">{{ title }}</div>
        </div>
        <div class="list">
            <div class="listhead">
                <div class="listheadleft">共{{ total }}首歌曲</div>
                <div class="listheadright">
                    <IconPlay /> 播放全部
                </div>
            </div>
            <div class="listcontent">
                <div class="singersMusicList" v-for="(item, index) in list" :key="index"
                    :ref="el => { listRefs[index] = el }">
                    <div class="order">{{ index + 1 }}</div>
                    <div class="cover"><img src="/defaultcover.jpg" :data-name="item"></div>
                    <div class="wordBody">
                        <div class="musictitle">{{ item }}</div>
                        <div class="wordBody_body">
                            <span></span>
                        </div>
                    </div>
                    <div class="wordBody_butt">
                        <IconPlay @click="handlePlay(item)" />
                    </div>

                </div>
            </div>

                <player :currentTrack="currentTrack" @next-track="nextTrack" @prev-track="prevTrack"
                    @random-track="randomTrack" :isMiniPlayer="miniToggle"
                    @toggle-mini-player="miniToggle = !miniToggle" ref="xplayer"
                    @handle-play="handlePlay"
                    @change-device="changeDevice"
                    >

                </player>
        </div>
    </div>
</template>
<script setup>
import localforage from 'localforage'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'
import { useStorage, useFetch, useSwipe } from '@vueuse/core'
import IconPlay from '../components/icons/IconPlay.vue'
import IconHome from '../components/icons/IconHome.vue';
import { useIntersectionObserver } from '@vueuse/core'
import ApiList from '../components/ApiList.vue'
// import AudioPlayer from 'vue3-audio-player'
// import 'vue3-audio-player/dist/style.css'
import player from '../components/player.vue'
const route = useRoute()
//分类标题
const title = route.params.title
//歌曲清单
const list = useStorage('list', [])
const listRefs = [];
//歌曲总数
const total = computed(() => {
    return list.value.length
})
//当前设备，默认本机
const currentDevice = ref({ name: "本机", did: "" });
localforage.getItem('currentDevice').then((value) => {
  if (value) {
    currentDevice.value = value
  }
})
//音乐组件是否最小化
const miniToggle = ref(true) //true最小化
const currentTrack = ref({})
const xplayer = ref(null)
const { isSwiping, direction } = useSwipe(xplayer);
watchEffect(() => {
    direction.value === 'down' && (miniToggle.value = true)
    direction.value === 'up' && (miniToggle.value = false)
})
const handleLazyImage = (target) => {
    const img = target.querySelector('img')
    const span = target.querySelector('.wordBody_body span')
    const name = img.dataset.name
    const { data } = useFetch(ApiList.musicInfoWithTag + encodeURIComponent(name)).get().json()
    watchEffect(() => {
        if (!data.value) return

        //检查data是否有tags，有就拿到tags，没有就拿到默认图片
        data.value.tags.picture && (img.src = data.value.tags.picture?.replace('/cache/picture_cache',""));
        //如果为空则不要填写
        span.innerText = [data.value.tags.artist, data.value.tags.album, data.value.tags.title].filter(Boolean).join('-');
        //把以上标签信息存到img对应名字的的dataset中
        // img.dataset.name = data.value.tags.title
        // img.dataset.artist = data.value.tags.artist
        // img.dataset.album = data.value.tags.album
        // img.dataset.lyric = data.value.tags.lyric
        // img.dataset.url = data.value.url
    })
}
const handlePlay = (name) => {
    //如果currentDevice的did不为空，则应该在小爱设备上进行播放
    console.log('%csrc\views\ListView.vue:104 currentDevice', 'color: #007acc;', currentDevice);
    if (currentDevice.value.did) {
       const { data:res } = useFetch(ApiList.sendCmd).post({
            did: currentDevice.value.did,
            cmd: '播放列表'+ title + "|" +name
       }).json()
        watch(() => res.value, (value) => {
            if (!value) return
            res.ret == "OK" //后面再执行逻辑
        })
        return;
    }
    let { data } = useFetch(ApiList.musicInfoWithTag + encodeURIComponent(name)).get().json()
    watch(() => data.value, (value) => {
        if (!data.value) return
        currentTrack.value = {
            name: data.value.name,
            url: data.value.url,
            album: data.value.tags.album,
            cover: data.value.tags.picture?.replace('/cache/picture_cache',""),
            lyric: data.value.tags.lyrics,
            singer: data.value.tags.artist,
        }
        //保存currentTrack
        localforage.setItem('currentTrack', toRaw(currentTrack.value))
    })
    // localforage.setItem('currentTrack', toRaw(currentTrack.value))
}
const nextTrack = () => {
    // console.log('%csrc\views\ListView.vue:111 list.value', 'color: #007acc;', list.value);
    let index = list.value.indexOf(currentTrack.value.name)
    if (index === list.value.length - 1) {
        index = 0
    } else {
        index += 1
    }
    handlePlay(list.value[index])
}
const prevTrack = () => {
    // console.log('%csrc\views\ListView.vue:111 list.value', 'color: #007acc;', list.value);
    let index = list.value.indexOf(currentTrack.value.name)
    if (index === 0) {
        index = list.value.length - 1
    } else {
        index -= 1
    }
    handlePlay(list.value[index])
}
const randomTrack = () => {
    const index = Math.floor(Math.random() * list.value.length)
    handlePlay(list.value[index])
}
const changeDevice = (item) => {
  currentDevice.value = item
}
onMounted(() => {
    listRefs.forEach((item, index) => {
        const { stop } = useIntersectionObserver(item, ([{ isIntersecting }]) => {
            if (!isIntersecting) {
                return;
            }
            stop()
            handleLazyImage(item)
        })
    })
    //加载currentTrack
    localforage.getItem('currentTrack').then((value) => {
        currentTrack.value = value
    })
})
// console.log('%csrc\views\ListView.vue:48 listRefs', 'color: #007acc;', listRefs);
</script>
<style scoped lang="scss">
/* 导入本地字体*/
@font-face {
    font-family: 'AlimamaDongFangDaKai-Regular';
    src: url('@/assets/AlimamaDongFangDaKai-Regular.woff2');
    font-weight: normal;
    font-style: normal
}

.container {
    width: 100vw;
    overflow: hidden;
    margin: 0 auto;

    .header {
        --h: 300px;
        height: var(--h);
        background-image: linear-gradient(30deg, #bbb2ff 0%, #587cff 100%);
        display: flex;
        height: 64vw;
        justify-content: center;
        position: relative;
        width: 100%;
        z-index: -1;

        .title {
            font-size: 40px;
            color: #FFFFFF;
            text-overflow: ellipsis;
            overflow: hidden;
            text-align: center;
            backdrop-filter: blur(5px);
            line-height: var(--h);
            font-family: 'AlimamaDongFangDaKai-Regular';
        }
    }

    .list {
        background: #fff;
        border-radius: 4vw 4vw 0 0;
        position: relative;
        top: -4.267vw;
        font-size: 5.333vw;
        font-weight: 700;
        line-height: 7.467vw;

        .listhead {
            align-items: center;
            background: #fff;
            border-radius: 4vw 4vw 0 0;
            box-sizing: border-box;
            display: -webkit-box;
            display: -webkit-flex;
            display: -ms-flexbox;
            display: flex;
            justify-content: space-between;
            padding: 5.6vw 4.8vw 4.8vw 6.533vw;
            top: 0;
            z-index: 99;
            position: -webkit-sticky;
            /*safair*/
            position: sticky;
            color: #262338;

            svg {
                width: 5.333vw;
                height: 5.333vw;
            }

            .listheadright {
                display: flex;
                align-items: center;
            }
        }

        .listcontent {
            margin-bottom: 21.333vw;

            .singersMusicList {
                align-items: center;
                box-sizing: border-box;
                display: -webkit-box;
                display: -webkit-flex;
                display: -ms-flexbox;
                display: flex;
                width: 100vw;
                height: 17.333vw;
                font-size: 4.8vw;
                font-weight: 700;

                .order {
                    color: #a1a4b3;
                    text-align: center;
                    width: 15.333vw;
                }

                .cover {
                    margin-right: 2.667vw;

                    img {
                        width: 14.333vw;
                        height: 14.333vw;
                        border-radius: 1.333vw;
                    }
                }


                .musictitle {
                    color: #262338;
                    width: 60.133vw;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    word-break: break-all;
                    color: #262338;
                    font-size: 4.267vw;
                    font-weight: 700;
                    height: 6vw;
                    line-height: 6vw;
                }

                .wordBody {
                    width: 60.133vw;
                }

                .wordBody_body {
                    align-items: center;
                    color: #a1a4b3;
                    display: -webkit-box;
                    display: -webkit-flex;
                    display: -ms-flexbox;
                    display: flex;
                    font-size: 3.2vw;
                    font-weight: 400;
                    height: 4.533vw;
                    line-height: 4.533vw;
                    margin-top: .933vw;
                    width: 50.667vw;

                    span {
                        color: #a1a4b3;
                        display: inline-block;
                        font-weight: 400;
                        height: 4.533vw;
                        width: 45.867vw;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        word-break: break-all;
                    }
                }

                .wordBody_butt {
                    align-items: center;
                    box-sizing: border-box;
                    display: -webkit-box;
                    display: -webkit-flex;
                    display: -ms-flexbox;
                    display: flex;
                    height: 17.333vw;
                    overflow: hidden;
                    padding-right: 2vw;
                    width: 24.933vw;
                }
            }
        }

        .listfooter {
            align-items: center;
            background: #fff;
            border-radius: 4vw 4vw 0 0;
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
        }
    }
}

.wrapper {
    display: flex;
    position: absolute;
    top: 20px;
    z-index: 999;
    left: 10px;

    svg {
        fill: #fff;
    }
}
</style>