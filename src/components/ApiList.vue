<script>
const base = "/";
// const base = "http://localhost:8090/"
export default {
    musicList: base+'musiclist',
    musicInfoWithTag: base+'musicinfo?musictag=true&name=',
    musicInfo: base+'musicinfo?name=',
    getSetting: base+'getsetting',
    searchMusic: base+'searchmusic?name=',
}
</script>