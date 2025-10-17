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
                @update:currentTrack="updateCurrentTrack" @favorite-song="handleFavorite">

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
const musicList = useStorage('musicList', [])
//分类列表
const titleList = useStorage('titleList', [])
// const musicList = Object.freeze(localStorage.getItem('musicList') ? JSON.parse(localStorage.getItem('musicList')) : {})
const list = musicList.value[title];

const favoriteList = musicList.value['收藏'];
const listRefs = ref([]);
//渲染列表,渲染30首
const renderList = ref(list.slice(0, 30))

//歌曲总数
const total = computed(() => {
    return list.length
})
//当前设备，默认本机
// const currentDevice = ref({ name: "本机", did: "" });
const currentDevice = useStorage('currentDevice', { name: "本机", did: "" })

const currentTrack = useStorage('currentTrack', { name: '', url: '', album: '', lyric: "", cover: defaultcover, star: false })


const loadRenderList = () => {
    let index = renderList.value.length
    renderList.value = list.slice(0, index + 30)
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
const handleFavorite = (name,stared) => {
    //stared为收藏状态,true为收藏，false为取消收藏
    //如果stared为true，则将歌曲加入到收藏中，否则将歌曲从收藏中移除
    if (stared) {
        favoriteList.splice(favoriteList.indexOf(name), 1)
        //将titleList对应的收藏数量减1
        titleList.value = titleList.value.map(item => {
            if (item.title === "收藏") {
                return {
                    title: item.title,
                    total: item.total - 1
                }
            } 
            return item
        })
        return;
    }
    //将歌曲加入到收藏中
    favoriteList.push(name)
    titleList.value = titleList.value.map(item => {
            if (item.title === "收藏") {
                return {
                    title: item.title,
                    total: item.total + 1
                }
            } 
            return item
        })
    // console.log('%csrc\views\ListView.vue:99 musicList.value 收藏', 'color: #007acc;', musicList.value['收藏']);
    
}
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
            singer: res.tags.artist,
            star: favoriteList.includes(name)
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
    if (total.value == 0) {
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
    let index = list.indexOf(currentTrack.value.name)
    if (index === total.value - 1) {
        index = 0
    } else {
        index += 1
    }
    handlePlay(list[index])
}
const prevTrack = () => {
    if (currentDevice.value.did) {
        fetchData(ApiList.sendCmd, {
            did: currentDevice.value.did,
            cmd: '上一首'
        })
        return;
    }
    let index = list.indexOf(currentTrack.value.name)
    if (index === 0) {
        index = list.length - 1
    } else {
        index -= 1
    }
    handlePlay(list[index])
}
const randomTrack = () => {
    const index = Math.floor(Math.random() * list.length)
    handlePlay(list[index])
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

// CSS变量系统 - 便于统一管理和响应式适配
:root {
    // 颜色变量
    --primary-color: #587cff;
    --primary-gradient-start: #bbb2ff;
    --primary-gradient-end: #587cff;
    --text-color: #262338;
    --text-secondary-color: #a1a4b3;
    --background-color: #fff;
    
    // 移动端尺寸变量
    --header-height-mobile: 64vw;
    --header-title-size-mobile: clamp(1.8rem, 8vw, 2.5rem);
    --border-radius-mobile: 4vw;
    --font-size-base-mobile: clamp(1rem, 5vw, 1.3rem);
    --list-item-height-mobile: 17.333vw;
    --cover-size-mobile: 14.333vw;
    
    // 平板横屏尺寸变量
    --header-height-tablet: 30vw;
    --header-title-size-tablet: clamp(2.2rem, 5vw, 3rem);
    --border-radius-tablet: 2vw;
    --font-size-base-tablet: clamp(1rem, 2.5vw, 1.1rem);
    --list-item-height-tablet: 12vw;
    --cover-size-tablet: 10vw;
}

// 基础样式
.container {
    width: 100%;
    margin: 0 auto;
    min-height: 100vh;
    background-color: var(--background-color);

    .header {
        background-image: linear-gradient(30deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
        display: flex;
        height: var(--header-height-mobile);
        justify-content: center;
        position: relative;
        width: 100%;
        z-index: 1;
        align-items: center;
        .title {
            font-size: var(--header-title-size-mobile);
            color: #FFFFFF;
            text-overflow: ellipsis;
            overflow: hidden;
            text-align: center;
            backdrop-filter: blur(5px);
            font-family: 'AlimamaDongFangDaKai-Regular';
            padding: 0 20px;
        }
    }

    .list {
        border-radius: var(--border-radius-mobile) var(--border-radius-mobile) 0 0;
        position: relative;
        top: -4.267vw;
        font-size: var(--font-size-base-mobile);
        font-weight: 700;
        line-height: 1.4;
        background-color: var(--background-color);

        .listhead {
            align-items: center;
            background-color: var(--background-color);
            border-radius: var(--border-radius-mobile) var(--border-radius-mobile) 0 0;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            padding: 5.6vw 4.8vw 4.8vw 6.533vw;
            top: 0;
            z-index: 99;
            position: sticky;
            color: var(--text-color);
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            
            svg {
                width: 5.333vw;
                height: 5.333vw;
            }

            .listheadright {
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: transform 0.2s ease;
                padding: 6px 12px;
                border-radius: 20px;
                background-color: rgba(88, 124, 255, 0.1);
                
                &:active {
                    transform: scale(0.95);
                    background-color: rgba(88, 124, 255, 0.2);
                }
            }
        }

        .listcontent {
            margin-bottom: 21.333vw;
            padding: 0 4vw;
            
            // 移动端单列布局
            .music-grid {
                display: flex;
                flex-direction: column;
                gap: 1.5vw;
            }

            .singersMusicList {
                align-items: center;
                box-sizing: border-box;
                display: flex;
                width: 100%;
                height: var(--list-item-height-mobile);
                font-size: clamp(0.9rem, 4vw, 1.1rem);
                font-weight: 700;
                padding: 2vw 0;
                border-radius: 8px;
                transition: background-color 0.2s ease;
                
                &:active {
                    background-color: rgba(0,0,0,0.05);
                }

                .order {
                    color: var(--text-secondary-color);
                    text-align: center;
                    width: 15.333vw;
                    font-size: clamp(0.8rem, 3.5vw, 1rem);
                }

                .cover {
                    margin-right: 2.667vw;
                    flex-shrink: 0;

                    img {
                        width: var(--cover-size-mobile);
                        height: var(--cover-size-mobile);
                        border-radius: 1.333vw;
                        object-fit: cover;
                        transition: transform 0.2s ease;
                    }
                }

                .musictitle {
                    color: var(--text-color);
                    width: 60.133vw;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    word-break: break-all;
                    font-size: clamp(0.9rem, 4vw, 1.1rem);
                    font-weight: 700;
                    height: 6vw;
                    line-height: 6vw;
                }

                .wordBody {
                    width: 60.133vw;
                    flex-shrink: 1;
                    overflow: hidden;
                }

                .wordBody_body {
                    align-items: center;
                    color: var(--text-secondary-color);
                    display: flex;
                    font-size: clamp(0.7rem, 3vw, 0.9rem);
                    font-weight: 400;
                    height: 4.533vw;
                    line-height: 4.533vw;
                    margin-top: .933vw;
                    width: 100%;

                    span {
                        color: var(--text-secondary-color);
                        display: inline-block;
                        font-weight: 400;
                        height: 4.533vw;
                        width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        word-break: break-all;
                    }
                }

                .wordBody_butt {
                    align-items: center;
                    box-sizing: border-box;
                    display: flex;
                    justify-content: flex-end;
                    height: var(--list-item-height-mobile);
                    overflow: hidden;
                    padding-right: 2vw;
                    width: 15vw;
                    flex-shrink: 0;
                    
                    svg {
                        width: clamp(1rem, 4.5vw, 1.2rem);
                        height: clamp(1rem, 4.5vw, 1.2rem);
                        cursor: pointer;
                        transition: transform 0.2s ease;
                        
                        &:active {
                            transform: scale(0.9);
                        }
                    }
                }
            }
        }

        .listfooter {
            align-items: center;
            background: var(--background-color);
            border-radius: var(--border-radius-mobile) var(--border-radius-mobile) 0 0;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            bottom: 0;
            z-index: 99;
            position: sticky;
            color: var(--text-color);
            width: 100%;
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
        width: 24px;
        height: 24px;
        cursor: pointer;
        transition: transform 0.2s ease;
        
        &:active {
            transform: scale(0.9);
        }
    }
}

// 平板设备横屏适配 - 768px及以上且横屏
@media (min-width: 768px) and (orientation: landscape) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        
        .header {
            height: var(--header-height-tablet);
            margin: 0 -20px;
            
            .title {
                font-size: var(--header-title-size-tablet);
            }
        }
        
        .list {
            top: -2vw;
            font-size: var(--font-size-base-tablet);
            border-radius: var(--border-radius-tablet) var(--border-radius-tablet) 0 0;
            
            .listhead {
                border-radius: var(--border-radius-tablet) var(--border-radius-tablet) 0 0;
                padding: 2vw 3vw;
                
                svg {
                    width: 2.5vw;
                    height: 2.5vw;
                }
            }
            
            .listcontent {
                margin-bottom: 10vw;
                
                // 平板横屏双列网格布局
                .music-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5vw;
                }
                
                .singersMusicList {
                    height: var(--list-item-height-tablet);
                    border-radius: 12px;
                    padding: 1vw;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    margin-bottom: 1vw;
                    
                    .order {
                        width: 8vw;
                        font-size: clamp(0.8rem, 1.8vw, 1rem);
                    }
                    
                    .cover {
                        img {
                            width: var(--cover-size-tablet);
                            height: var(--cover-size-tablet);
                            border-radius: 8px;
                        }
                    }
                    
                    .musictitle {
                        width: 100%;
                        font-size: clamp(0.9rem, 2vw, 1.1rem);
                        height: auto;
                        line-height: 1.4;
                    }
                    
                    .wordBody {
                        width: 100%;
                    }
                    
                    .wordBody_body {
                        font-size: clamp(0.7rem, 1.6vw, 0.9rem);
                        height: auto;
                        line-height: 1.4;
                        margin-top: 0.5vw;
                    }
                    
                    .wordBody_body span {
                        height: auto;
                    }
                    
                    .wordBody_butt {
                        width: 10vw;
                        padding-right: 0;
                        
                        svg {
                            width: clamp(1rem, 2.2vw, 1.2rem);
                            height: clamp(1rem, 2.2vw, 1.2rem);
                        }
                    }
                }
            }
        }
    }
}

// 桌面设备适配
@media (min-width: 1024px) {
    .container {
        .list {
            .listcontent {
                .music-grid {
                    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                }
                
                .singersMusicList {
                    :hover {
                        background-color: rgba(0,0,0,0.02);
                    }
                    
                    .cover img {
                        :hover {
                            transform: scale(1.03);
                        }
                    }
                }
            }
        }
    }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
    :root {
        --background-color: #121212;
        --text-color: #e0e0e0;
        --text-secondary-color: #a0a0a0;
        --primary-gradient-start: #6a11cb;
        --primary-gradient-end: #2575fc;
    }
    
    .container {
        .header {
            background-color: #1a1a1a;
            background-image: linear-gradient(225deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
        }
        
        svg {
            fill: #fff !important;
        }
        
        .list {
            .listhead {
                box-shadow: 0px 4px 15px rgba(0,0,0,0.3);
                background-color: var(--background-color);
            }
        }
        
        .singersMusicList {
            :active {
                background-color: rgba(255,255,255,0.08);
            }
        }
    }
}

// 小屏幕移动设备优化
@media (max-width: 360px) {
    .container {
        .listcontent {
            padding: 0 3vw;
        }
        
        .singersMusicList {
            .musictitle {
                width: 55vw;
            }
            
            .wordBody {
                width: 55vw;
            }
        }
    }
}
</style>