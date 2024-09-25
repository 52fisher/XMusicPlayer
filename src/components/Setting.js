import { ref, watchEffect, toRaw,toValue  } from "vue";

// fastapi json 文件 {"openapi":"3.1.0","info":{"title":"FastAPI","version":"0.3.30"},"paths":{"/":{"get":{"summary":"Read Index","operationId":"read_index__get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"HTTPBasic":[]}]}},"/getversion":{"get":{"summary":"Getversion","operationId":"getversion_getversion_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"HTTPBasic":[]}]}},"/getvolume":{"get":{"summary":"Getvolume","operationId":"getvolume_getvolume_get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"did","in":"query","required":false,"schema":{"type":"string","default":"","title":"Did"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/setvolume":{"post":{"summary":"Setvolume","operationId":"setvolume_setvolume_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/DidVolume"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"HTTPBasic":[]}]}},"/searchmusic":{"get":{"summary":"Searchmusic","operationId":"searchmusic_searchmusic_get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"name","in":"query","required":false,"schema":{"type":"string","default":"","title":"Name"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/playingmusic":{"get":{"summary":"Playingmusic","operationId":"playingmusic_playingmusic_get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"did","in":"query","required":false,"schema":{"type":"string","default":"","title":"Did"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/cmd":{"post":{"summary":"Do Cmd","operationId":"do_cmd_cmd_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/DidCmd"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"HTTPBasic":[]}]}},"/getsetting":{"get":{"summary":"Getsetting","operationId":"getsetting_getsetting_get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"need_device_list","in":"query","required":false,"schema":{"type":"boolean","default":false,"title":"Need Device List"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/savesetting":{"post":{"summary":"Savesetting","operationId":"savesetting_savesetting_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"HTTPBasic":[]}]}},"/musiclist":{"get":{"summary":"Musiclist","operationId":"musiclist_musiclist_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"HTTPBasic":[]}]}},"/curplaylist":{"get":{"summary":"Curplaylist","operationId":"curplaylist_curplaylist_get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"did","in":"query","required":false,"schema":{"type":"string","default":"","title":"Did"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/delmusic":{"post":{"summary":"Delmusic","operationId":"delmusic_delmusic_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/MusicItem"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"HTTPBasic":[]}]}},"/downloadjson":{"post":{"summary":"Downloadjson","operationId":"downloadjson_downloadjson_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/UrlInfo"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}},"security":[{"HTTPBasic":[]}]}},"/downloadlog":{"get":{"summary":"Downloadlog","operationId":"downloadlog_downloadlog_get","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"HTTPBasic":[]}]}},"/playurl":{"get":{"summary":"Playurl","operationId":"playurl_playurl_get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"did","in":"query","required":true,"schema":{"type":"string","title":"Did"}},{"name":"url","in":"query","required":true,"schema":{"type":"string","title":"Url"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/debug_play_by_music_url":{"post":{"summary":"Debug Play By Music Url","operationId":"debug_play_by_music_url_debug_play_by_music_url_post","responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}},"security":[{"HTTPBasic":[]}]}},"/music/{file_path}":{"get":{"summary":"Music File","operationId":"music_file_music__file_path__get","security":[{"HTTPBasic":[]}],"parameters":[{"name":"file_path","in":"path","required":true,"schema":{"type":"string","title":"File Path"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"options":{"summary":"Music Options","operationId":"music_options_music__file_path__options","security":[{"HTTPBasic":[]}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{}}}}}}}},"components":{"schemas":{"DidCmd":{"properties":{"did":{"type":"string","title":"Did"},"cmd":{"type":"string","title":"Cmd"}},"type":"object","required":["did","cmd"],"title":"DidCmd"},"DidVolume":{"properties":{"did":{"type":"string","title":"Did"},"volume":{"type":"integer","title":"Volume","default":0}},"type":"object","required":["did"],"title":"DidVolume"},"HTTPValidationError":{"properties":{"detail":{"items":{"$ref":"#/components/schemas/ValidationError"},"type":"array","title":"Detail"}},"type":"object","title":"HTTPValidationError"},"MusicItem":{"properties":{"name":{"type":"string","title":"Name"}},"type":"object","required":["name"],"title":"MusicItem"},"UrlInfo":{"properties":{"url":{"type":"string","title":"Url"}},"type":"object","required":["url"],"title":"UrlInfo"},"ValidationError":{"properties":{"loc":{"items":{"anyOf":[{"type":"string"},{"type":"integer"}]},"type":"array","title":"Location"},"msg":{"type":"string","title":"Message"},"type":{"type":"string","title":"Error Type"}},"type":"object","required":["loc","msg","type"],"title":"ValidationError"}},"securitySchemes":{"HTTPBasic":{"type":"http","scheme":"basic"}}}}
// 根据fastapi生成对应接口参数信息
const apiUrl = "http://localhost:8090/";
// const apiUrl = "/";
const api = ref({
  getVolume: "getvolume?did=", // get {did}
  setVolume: "setvolume", // post {volume , did}
  saveSetting: "savesetting", // post {setting , did}
  musiclist: "musiclist", // get {}
  searchmusic: "searchmusic?name=", // get {name}
  playingmusic: "playingmusic", // get {did}
  cmd: "cmd", // post {cmd , did}
  getSetting: "getsetting?need_device_list=true", //
  getMusicList: "musiclist", // get {did}
  getCurPlaylist: "curplaylist", // get {did}
  delMusic: "delmusic", // post {mid , did}
  downloadJson: "downloadjson", // get {did}
  downloadLog: "downloadlog", // get {did}
  playUrl: "playurl", // get {mid , did}
  debugPlayByMusicUrl: "debug_play_by_music_url", // get {mid , did}
  music: "music/", // get {file_path }
  musicInfo: "musicinfo?name=", // get { name,musictags}
});
function getVolume(did, callback = "") {
  //{"did":"568532341"}
  const { data, error } = get(api.value.getVolume + did, (res) => {
    //{"ret":"OK","volume":42}
    callback && callback(res.volume);
    data.value = res.volume; //返回音量
  });
  return data;
}
function setVolume(config) {
  //{"did":"568532341","volume":"42"}
  post(api.value.setVolume, config, (res) => {
    //{"ret":"OK","volume":42}
    res.ret == "ok" &&
      ElMessage({
        message: "音量已设置为" + res.volume,
        type: "success",
      });
  });
}
function getMusicList() {
  const musicListTitle = ref([]);
  // const currentMusicListName = ref("");
  //预设置分类名单
  // const presets = ['下载', '全部', '所有歌曲', '收藏'];
  // const musicList = ref({});
  const { data:musicList, error } = get(api.value.musiclist, (res) => {
    let musicKeys = Object.keys(res);
    // 删除musicKeys中的 全部 和 所有歌曲 ，添加到第一项
    musicKeys = musicKeys.filter((item) => item !== "全部" && item !== "所有歌曲");
    musicListTitle.value = ["全部", "所有歌曲", ...musicKeys];
    // currentMusicListName.value = musicListTitle.value[0];
    //遍历res对象，获取音乐列表Object 只需要其中的下载、全部、所有歌曲、收藏（不一定存在，需要判断）
    // musicListTitle.value.forEach((item) => {
    //   if (presets.includes(item)) {
    //     musicList.value[item] = res[item];
    //   }
    // })
    //musicListTitle不一定全部在presets中，将存在的类别筛选出来
    
    // musicListTitle.value = musicListTitle.value.filter((item) => presets.includes(item));

  });

  return {
    musicList, //音乐列表
    musicListTitle, //音乐列表标题
    // currentMusicListName, //当前音乐列表
  };
}
function getMiDeviceList() {
  const XMSetting = useSetting();
  //从setting获取设备列表
  const miDeviceList = ref({});
  miDeviceList.value = XMSetting.value.devices;
  const miDidList = ref([]);
  miDidList.value = XMSetting.value.mi_did
    .split(",")
    .filter(Boolean)
    .map((item) => {
      // console.log("%csrccomponentsSetting.js:67 item", "color: #007acc;", item);
      return toRaw(miDeviceList.value)[item];
    });
  return {
    miDeviceList, //设备列表
    miDidList, //设备id列表
    // XMSetting
  };
}
function sendCmd(config) {
  //{"did":"568532341","cmd":"播放列表全部|嘉宾 - 张远"}
  post(api.value.cmd, config, (res) => {
    //{"ret":"OK"}
    ElMessage({
      message: res.ret,
      type: "success",
    });
  });
}
function searchMusic(name) {
  const list = ref([]);
  get(api.value.searchmusic + name, (res) => {
    //格式化成{value,label}
    list.value = res.map((item) => {
      return {
        value: item,
        label: item,
      };
    });
    list.value.push({
      value: name,
      label: name,
    });
  });
  return list;
}
function saveSetting(config) {
  //先保存本地
  localStorage.setItem("setting", JSON.stringify(config));
  // console.log('%csrc\components\Setting.js:108 config', 'color: #007acc;', config);
  //再保存
  post(api.value.saveSetting, toRaw(config), (res) => {
    ElMessage({
      message: res,
      type: "success",
      plain: true,
    });
  });
}
const clearSetting = () => {
  localStorage.removeItem("setting");
}
function useSetting() {
  //先从本地获取setting
  const results = ref({});
  let setting = localStorage.getItem("setting");
  if (setting) {
    // setting = JSON.parse(setting);
    //如果device_lsit为false,直接返回setting
      results.value = JSON.parse(setting);
      return results;
  }
  //如果本地没有，则从服务器获取
  //如果device_list为true，则添加参数'?need_device_list=true'
  const { data, error } = get(api.value.getSetting,(res) => {
      localStorage.setItem("setting", JSON.stringify(res));
      results.value = res;
    }
  );
  return results;
}

function getMusicUrl(title) {
  // let musicInfo = ref({})
  const { data: musicInfo, error } = get(api.value.musicInfo + title);
  // console.log('%csrc\components\Setting.js:123 musicInfo', 'color: #007acc;', musicInfo);
  return {
    musicInfo,
    error,
  };
}
function setCache(name,value) {
  localStorage.setItem(name,value)
}
function getCache(name, defaultValue, isNumber = false) {
  let tmp = localStorage.getItem(name)
  if (!tmp) return defaultValue
  if (isNumber) {
    return Number(tmp)
  }
  return tmp
}
function delMusic(name) {
  //删除音乐
  post(api.value.delMusic, { name: name }, (res) => {
    ElMessage({
      message: res,
      type: "success",
      plain: true,
    });
  });
}
function get(url, callback = "") {
  const data = ref(null);
  const error = ref(null);

  const fetchData = () => {
    // reset state before fetching..
    data.value = null;
    fetch(apiUrl + toValue(url))
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        ElMessage({
          message: "网络请求发生故障",
          type: "error",
        });
        // throw new Error("Network response was not ok.");
      })
      .then((json) => {
        data.value = json;
        if (callback) {
          callback(json);
        }
      })
      .catch((err) => (error.value = err));
  };

  watchEffect(() => {
    fetchData();
  });

  return { data, error };
}
function post(url, data, callback) {
  // 使用fetch进行POST请求
  fetch(apiUrl + url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Network response was not ok.");
    })
    .then((responseData) => {
      callback(responseData);
    })
    .catch((error) => {
      console.error("Request failed:", error);
    });
}
export default {
  get,
  post,
  getVolume,
  setVolume,
  useSetting,
  clearSetting,
  getMusicList,
  saveSetting,
  sendCmd,
  getMiDeviceList,
  getMusicUrl,
  searchMusic,
  delMusic,
  setCache,
  getCache,
};
