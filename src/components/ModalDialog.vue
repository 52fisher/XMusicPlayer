<template>
    <!-- 写一个弹窗组件，挂载到body -->
    <Teleport to="body">
        <div class="dialog_wrapper">
            <div class="dialog_title">
                <slot name="title"></slot>
            </div>
            <div class="dialog_content">
                <slot name="content"></slot>
            </div>
            <div class="dialog_footer">
                <div class="dialog_cancle" @click="$emit('close')">取消</div>
            </div>
        </div>
    </Teleport>
</template>
<script setup>
defineEmits(['close'])

</script>
<style lang="scss">
.dialog_wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 999;
    display: flex;
    justify-content: end;
    align-items: center;
    flex-direction: column;
    cursor: default;
    
    .dialog_title,
    .dialog_content,
    .dialog_footer {
        background-color: #fff;
        width: 100%;
    }

    .dialog_title {
        padding: 10px;
        display: flex;
        justify-content: center;
        color: #a2a9af;
    }

    .dialog_content {
        text-align: center;
        font-size: 5.333vw;

        div {
            padding: 10px;
            height: 6vw;
            line-height: 6vw;
            border-bottom: 1px solid #ccc;
        }
    }

    .dialog_footer {
        border-top: 1px solid #ccc;
        height: 5vw;
        height: 8vw;
        display: flex;
        justify-content: center;
        align-content: center;
        align-items: center;
        margin-top: 2vw;
        font-size: 5.333vw;
        padding: 10px;
    }
}
</style>