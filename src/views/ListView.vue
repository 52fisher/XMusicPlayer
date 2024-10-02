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
                @random-track="randomTrack" @handle-play="handlePlay" @change-device="changeDevice"
                @update:currentTrack="updateCurrentTrack">

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
import cover from '/defaultcover.jpg'
import player from '../components/player.vue'
import { layer } from "vue3-layer";


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
const currentTrack = ref({
    name: '',
    url: '',
    album: '',
    lyric: "",
    cover: cover,
})
/**
 * @description: Lazy load images and fetch music info
 * @param {HTMLElement} target The element that contains the image
 */
const handleLazyImage = (target) => {
    const img = target.querySelector('img')
    const span = target.querySelector('.wordBody_body span')
    const name = img.dataset.name

    /**
     * Fetch music info from the API
     */
    const { data } = useFetch(ApiList.musicInfoWithTag + encodeURIComponent(name)).get().json()

    /**
     * Watch the data and update the image and span text when it changes
     */
    watchEffect(() => {
        if (!data.value) return

        //检查data是否有tags，有就拿到tags，没有就拿到默认图片
        data.value.tags.picture && (img.src = data.value.tags.picture);
        //如果为空则不要填写
        span.innerText = [data.value.tags.artist, data.value.tags.album, data.value.tags.title].filter(Boolean).join('-');
    })
}

/**
 * @description: Update the current track info
 * @param {string} name The name of the music
 * @param {boolean} remote Whether the music is remote or not
 */
const updateCurrentTrack = (name, remote = false) => {
    let { data } = useFetch(ApiList.musicInfoWithTag + encodeURIComponent(name)).get().json()
    /**
     * Watch the data and update the current track info when it changes
     */
    watch(() => data.value, (value) => {
        if (!data.value) return
        currentTrack.value = {
            /**
             * @description: The name of the music
             */
            name: data.value.name,
            /**
             * @description: The url of the music
             * @type {string}
             */
            url: remote ? "" : data.value.url,
            /**
             * @description: The album of the music
             * @type {string}
             */
            album: data.value.tags.album,
            /**
             * @description: The cover of the music
             * @type {string}
             */
            cover: data.value.tags.picture || cover,
            /**
             * @description: The lyrics of the music
             * @type {string}
             */
            lyric: data.value.tags.lyrics,
            /**
             * @description: The singer of the music
             * @type {string}
             */
            singer: data.value.tags.artist,
        }
        // Save the current track to local storage
        localforage.setItem('currentTrack', toRaw(currentTrack.value))
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
        layer.msg(' ', ' ')
        return;
    }
    // If the current device is a remote device, send the cmd to the backend
    if (currentDevice.value.did) {
        // Use fetchData to send the request
        fetchData(ApiList.sendCmd, {
            did: currentDevice.value.did,
            cmd: ` ${title}`
        }, (res) => {
            res.ret == "OK" && layer.msg(` ${currentDevice.value.name}  ${title} `, ' ')
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
        // Use fetchData to send the request
        const { data: res } = useFetch(ApiList.sendCmd).post({
            did: currentDevice.value.did,
            cmd: ' ' + title + "|" + name
        }).json()
        /**
         * Watch the response and update the current track info when it changes
         */
        watch(() => res.value, (value) => {
            if (!value) return
            res.ret == "OK" //后面再执行逻辑
        })
        updateCurrentTrack(name, true)
        return;
    }
    // If the current device is a local device, play the first song in the list
    updateCurrentTrack(name)
    // localforage.setItem('currentTrack', toRaw(currentTrack.value))
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
        if (value) {
            currentTrack.value = value
        }
    })
})
/**
 * @description: 通过Fetch API来获取或发送数据
 * @param {string} url  API的url
 * @param {object} [postData={}]  POST请求时要传递的数据
 * @param {function} [callback]  回调函数
 * @return {void}
 */
const fetchData = (url, postData = {}, callback) => {
    fetch(url, postData ? {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-Type': 'application/json',
        }
    } : {
        method: 'GET',
    }
    ).then(res => res.json()).then(res => {
        callback && callback(res)
    })
}
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