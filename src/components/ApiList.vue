<script>
const base = "/";
// const base = "http://192.168.6.131:5678/"

export default {
    musicList: base + 'musiclist',
    musicInfoWithTag: base + 'musicinfo?musictag=true&name=',
    musicInfo: base + 'musicinfo?name=',
    getSetting: base + 'getsetting',
    searchMusic: base + 'searchmusic?name=',//get {name} [musictag=true]
    getSetting: base + 'getsetting',
    setVolume: base + 'setvolume',//post {did,volume}
    getVolume: base + 'getvolume?did=',
    sendCmd: base + 'cmd',//post {did,cmd}
    playingMusic: base + 'playingmusic?did=',//get {did}
}
</script>