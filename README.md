# XMusicPlayer

这是一个为xiaomusic写的一个移动端的播放器主题。


![图片](https://github.com/user-attachments/assets/2813023d-6821-4c89-b8f7-fcbe32341b2a) ![recording](https://github.com/user-attachments/assets/2dd27718-3070-42d5-b12c-8f4a42976f17) ![图片](https://github.com/user-attachments/assets/61b7bd24-2068-483f-96c9-eb1233aafa11) ![recording](https://github.com/user-attachments/assets/c394045f-ef05-4bbb-b74f-3e5985cd75f7)


## 项目结构

项目包含以下文件和目录：

- `index.html`: 项目的主HTML文件。
- `jsconfig.json`: TypeScript配置文件。
- `package.json`: 项目依赖和脚本配置文件。
- `public`: 公共资源目录。
- `README.md`: 项目说明文档。
- `src`: 源代码目录。
  - `App.vue`: 项目的根组件。
  - `assets`: 静态资源目录。
  - `auto-imports.d.ts`: 自动导入配置文件。
  - `components`: 组件目录。
    - `ApiList.vue`: API列表组件。
    - `icons`: 图标组件目录。
    - `ModalDialog.vue`: 模态对话框组件。
    - `player.vue`: 播放器组件。
    - `types.ts`: 类型定义文件。
  - `components.d.ts`: 组件类型定义文件。
  - `main.js`: 项目入口文件。
  - `router`: 路由配置目录。
    - `index.js`: 路由配置文件。
  - `views`: 视图组件目录。
    - `HomeView.vue`: 首页视图组件。
    - `ListView.vue`: 列表视图组件。
- `vite.config.js`: Vite配置文件。

## 项目依赖

项目依赖以下库：

- `@vueuse/components`: Vue 3的常用组件。
- `@vueuse/core`: Vue 3的常用工具函数。
- `element-plus`: Vue 3的UI组件库。
- `localforage`: 本地存储库。
- `vue`: Vue 3框架。
- `vue-router`: Vue 3的路由库。
- `vue3-layer`: Vue 3的弹窗库。

## 项目脚本

项目包含以下脚本：

- `dev`: 开发环境下的热重载脚本。
- `build`: 生产环境下的构建脚本。
- `preview`: 预览构建后的项目。

## 项目说明

这是一个为xiaomusic写的一个移动端的播放器主题。项目使用Vue 3框架，Element Plus UI组件库，Vite构建工具，以及一些常用的工具库。项目结构清晰，代码组织良好，易于维护和扩展。

## 开始使用

1. 克隆项目到本地：

```bash
git clone <repository-url>
```

2. 进入项目目录：

```bash
cd xiaoMusicPlayer
```

3. 安装依赖：

```bash
npm install
```

4. 启动开发服务器：

```bash
npm run dev
```

5. 访问项目：

在浏览器中访问`http://localhost:3000`，即可查看项目。

## 贡献

如果您想为项目贡献代码，请遵循以下步骤：

1. Fork项目到您的GitHub账户。
2. 创建一个新的分支进行开发。
3. 提交您的更改并创建一个Pull Request。

## 许可证

本项目采用GPL V3许可证。有关详细信息，请查看LICENSE文件。
