// export default class WallPaper extends BaseNode {
//   constructor(options: any) {
//     super(options);
//     this.init();
//   }
//   init() {
//     const rect = this.createRect({ w: 887, h: 1926 });
//     this.node.add(rect);
//     const video = document.createElement('video');
//     video.src = 'http://localhost:5100/live_wallpaper.mp4';
//     video.play();
//     video.loop = true;
//     video.muted = true;
//     video.autoplay = true;
//     const group = this.node;
//     video.addEventListener('loadedmetadata', () => {
//       rect.width(video.videoWidth);
//       rect.height(video.videoHeight);
//       const videoNode = new Konva.Image({
//         image: video,
//         x: 0,
//         y: 0,
//         width: video.videoWidth,
//         height: video.videoHeight,
//       });
//       group.add(videoNode);
//     });
//     this.initFullBox();
//   }
// }