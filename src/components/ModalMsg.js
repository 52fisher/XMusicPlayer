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
    return  h(
        "div",
        {
          style: {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            height: 'fit-content',
            padding: "10px 20px",
            background: "rgba(0, 0, 0, 0.8)",
          },
        },
        h(
          "span",
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
