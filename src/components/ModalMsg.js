import { h, createApp } from "vue";

const messageBox = {
  props: {
    message: {
      type: String,
      default: "",
      require: true,
    },
  },
  render(ctx) {
    const { $props } = ctx;
    return () =>
      h(
        "msg_wrapper",
        {
          style: {
            position: "absoulte",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.3)",
          },
        },
        h(
          "msg_content",
          {
            style: {
              color: "#fff",
            },
          },
          $props.message
        )
      );
  },
};

function showMsg(message, duration = 2000) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const app = createApp(messageBox, {
    message,
  });
  app.mount(div);
  setTimeout(() => {
    div.remove();
    app.unmount(div); // 卸载组件
  }, duration);
}

export default showMsg;
