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
                <div class="listheadright" @click="handlePlayAll">
                    <IconPlay /> 播放全部
                </div>
            </div>
            <div class="listcontent" v-infinite-scroll="loadRenderList" :infinite-scroll-disabled="disabled">
                <div class="singersMusicList" v-for="(item, index) in renderList" :key="index" ref="listRefs">
                    <div class="order">{{ index + 1 }}</div>
                    <div class="cover"><img :src="defaultcover" :data-name="item"></div>
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
                @random-track="randomTrack" @handle-play="handlePlay" @change-device="changeDevice"
                @update:currentTrack="updateCurrentTrack">

            </player>
        </div>
    </div>
</template>
<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import IconPlay from '@/components/icons/IconPlay.vue'
import IconHome from '@/components/icons/IconHome.vue';
import { useIntersectionObserver } from '@vueuse/core'
import ApiList from '@/components/ApiList.vue'
import player from '@/components/player.vue'
import fetchData from '@/components/FetchData.js'
import defaultcover from '/defaultcover.jpg'
import showMsg from '@/components/ModalMsg';
const route = useRoute()
//分类标题
const title = route.params.title
//歌曲清单
const list = useStorage('list', [])
const listRefs = ref([]);
//渲染列表,渲染30首
const renderList = ref(list.value.slice(0, 30))

//歌曲总数
const total = computed(() => {
    return list.value.length
})
//当前设备，默认本机
// const currentDevice = ref({ name: "本机", did: "" });
const currentDevice = useStorage('currentDevice', { name: "本机", did: "" })

const currentTrack = useStorage('currentTrack', { name: '', url: '', album: '', lyric: "", cover: defaultcover, })


const loadRenderList = () => {
    let index = renderList.value.length
    renderList.value = list.value.slice(0, index + 30)
}

watch(listRefs.value, () => {
    listRefs.value.slice(-30).forEach((item, index) => {
        const { stop } = useIntersectionObserver(item, ([{ isIntersecting }]) => {
            if (isIntersecting) {
                stop()
            }
            handleLazyImage(item)
        })
    })
})
const disabled = computed(() => {
    return renderList.value.length >= total.value
})
/**
 * @description: Lazy load images and fetch music info
 * @param {HTMLElement} target The element that contains the image
 */
const handleLazyImage = (target) => {
    const img = target.querySelector('img')
    //判断img的src是否为defaultcover,不是就说明已经拿到了图片资源，直接返回
    if (!img.src.includes(defaultcover)) {
        return;
    }
    const span = target.querySelector('.wordBody_body span')
    const name = img.dataset.name

    fetchData(ApiList.musicInfoWithTag + encodeURIComponent(name), '', (res) => {
        /**
         * If the API returns a picture, update the image src
         */
        res.tags.picture && (img.src = res.tags.picture)

        span.innerText = [res.tags.artist, res.tags.album, res.tags.title].filter(Boolean).join('-');
    })
}

/**
 * @description: Update the current track info
 * @param {string} name The name of the music
 * @param {boolean} remote Whether the music is remote or not
 */
const updateCurrentTrack = (name, remote = false) => {
    //使用fetchData改写
    fetchData(ApiList.musicInfoWithTag + encodeURIComponent(name), '', (res) => {
        currentTrack.value = {
            name: res.name,
            url: remote ? "" : res.url,
            album: res.tags.album,
            cover: res.tags.picture || defaultcover,
            lyric: res.tags.lyrics,
            singer: res.tags.artist
        }
        // Save the current track to local storage
        localStorage.setItem('currentTrack', JSON.stringify(currentTrack.value))
    })
}
/**
 * @description: Handle play all button click
 * If the list is empty, show a message to the user
 * If the current device is a remote device, send the cmd to the backend
 * If the current device is a local device, play the first song in the list
 */
const handlePlayAll = () => {
    // If the list is empty, show a message to the user
    if (list.value.length == 0) {
        showMsg('没有发现音乐，尝试在主页刷新一下列表吧')
        return;
    }
    // If the current device is a remote device, send the cmd to the backend
    if (currentDevice.value.did) {
        // Use fetchData to send the request
        fetchData(ApiList.sendCmd, {
            did: currentDevice.value.did,
            cmd: ` ${title}`
        }, (res) => {
            res.ret == "OK" && showMsg(` ${currentDevice.value.name}  ${title} `, ' ')
        })
        return;
    }
    // If the current device is a local device, play the first song in the list
    handlePlay(list.value[0])
}
/**
 * @description: Handle play button click
 * @param {string} name The name of the music to play
 */
const handlePlay = (name) => {
    // If the current device is a remote device, send the cmd to the backend
    if (currentDevice.value.did) {
        //使用fetchData改写
        fetchData(ApiList.sendCmd, {
            did: currentDevice.value.did,
            cmd: '播放列表' + title + "|" + name
        }, (res) => {
            res.ret == "OK" && showMsg(`已发送 播放${name} 到 ${currentDevice.value.name}`)
            updateCurrentTrack(name, true)
        })
        return;
    }
    // If the current device is a local device, play the first song in the list
    updateCurrentTrack(name)
}
const nextTrack = () => {
    // console.log('%csrc\views\ListView.vue:111 list.value', 'color: #007acc;', list.value);
    //currentDevice的did不为空，则说明是小爱设备，应该发送cmd命令控制上一首或下一首
    if (currentDevice.value.did) {
        fetchData(ApiList.sendCmd, {
            did: currentDevice.value.did,
            cmd: '下一首'
        })
        return;
    }
    let index = list.value.indexOf(currentTrack.value.name)
    if (index === list.value.length - 1) {
        index = 0
    } else {
        index += 1
    }
    handlePlay(list.value[index])
}
const prevTrack = () => {
    if (currentDevice.value.did) {
        fetchData(ApiList.sendCmd, {
            did: currentDevice.value.did,
            cmd: '上一首'
        })
        return;
    }
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
    listRefs.value.forEach((item, index) => {
        const { stop } = useIntersectionObserver(item, ([{ isIntersecting }]) => {
            if (!isIntersecting) {
                return;
            }
            stop()
            handleLazyImage(item)
        })
    })
})

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
    width: 100%;
    margin: 0 auto;

    .header {
        background-image: linear-gradient(30deg, #bbb2ff 0%, #587cff 100%);
        display: flex;
        height: 64vw;
        justify-content: center;
        position: relative;
        width: 100%;
        z-index: -1;
        align-items: center;
        .title {
            font-size: 40px;
            color: #FFFFFF;
            text-overflow: ellipsis;
            overflow: hidden;
            text-align: center;
            backdrop-filter: blur(5px);
            font-family: 'AlimamaDongFangDaKai-Regular';
        }
    }

    .list {
        // background: #fff;
        border-radius: 4vw 4vw 0 0;
        position: relative;
        top: -4.267vw;
        font-size: 5.333vw;
        font-weight: 700;
        line-height: 7.467vw;

        .listhead {
            align-items: center;
            background-color: var(--background-color);
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
            color: var(--text-color);
            svg {
                width: 5.333vw;
                height: 5.333vw;
            }

            .listheadright {
                display: flex;
                align-items: center;
                cursor: default;
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
                    color: var(--text-color);
                    width: 60.133vw;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    word-break: break-all;
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
            background: var(--background-color);
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
    z-index: 99;
    left: 10px;

    svg {
        fill: #fff;
    }
}
@media (prefers-color-scheme: dark) {
    .container{
        .header {
            background-color: #FF3CAC;
            background-image: linear-gradient(225deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%);
    
        }
        svg{
            fill: #fff!important;
        }
        .list{
            .listhead{
                box-shadow: 0px 14px 15px 0px rgba(0,0,0,0.1);
            }
        }
    }

}
</style>